// Node.js runtime only — do NOT import in middleware.ts (Edge Runtime).
//
// SQLite-backed payment log. Provides an abstraction layer so the backing
// store can be swapped without touching API routes or the dashboard.
//
// For local dev: SQLite file at ./nanocrawl-payments.db
// For Vercel: SQLite file at /tmp/nanocrawl-payments.db (ephemeral per function instance)
// Future: swap to Vercel Postgres or PlanetScale by replacing this file only.

import Database from 'better-sqlite3'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { PaymentEvent } from '../shared/types'

// DB_PATH is resolved lazily inside getDb() so that NANOCRAWL_DB_PATH env var
// set in tests (after module import) is respected on every new connection.
function resolveDbPath(): string {
  return (
    process.env.NANOCRAWL_DB_PATH ??
    (process.env.NODE_ENV === 'production'
      ? '/tmp/nanocrawl-payments.db'
      : path.join(process.cwd(), 'nanocrawl-payments.db'))
  )
}

// Singleton DB connection (module-level, shared across requests in the same process)
let _db: ReturnType<typeof Database> | null = null

function getDb(): ReturnType<typeof Database> {
  if (_db) return _db
  _db = new Database(resolveDbPath())
  _db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id           TEXT PRIMARY KEY,
      payer        TEXT NOT NULL,
      page         TEXT NOT NULL,
      amount_units TEXT NOT NULL,
      amount_usdc  REAL NOT NULL,
      timestamp    INTEGER NOT NULL,
      tx_id  TEXT NOT NULL,
      network      TEXT NOT NULL,
      cached       INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_payments_timestamp ON payments(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer);
  `)
  return _db
}

// Write a new payment event.
// Returns true if inserted, false if id already existed (idempotency cache hit).
export function recordPayment(event: Omit<PaymentEvent, 'cached'> & { cached?: boolean }): boolean {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO payments
      (id, payer, page, amount_units, amount_usdc, timestamp, tx_id, network, cached)
    VALUES
      (@id, @payer, @page, @amountUnits, @amountUsdc, @timestamp, @tx_id, @network, @cached)
  `)
  const result = stmt.run({
    id: event.id ?? uuidv4(),
    payer: event.payer,
    page: event.page,
    amountUnits: event.amountUnits,
    amountUsdc: event.amountUsdc,
    timestamp: event.timestamp,
    tx_id: event.transaction,
    network: event.network,
    cached: event.cached ? 1 : 0,
  })
  return result.changes > 0
}

// Check if a payment-identifier has already been processed (idempotency)
export function findPaymentById(id: string): PaymentEvent | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return rowToEvent(row)
}

// Fetch recent payments (most recent first), with optional limit
export function getRecentPayments(limit = 100): PaymentEvent[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM payments ORDER BY timestamp DESC LIMIT ?')
    .all(limit) as Record<string, unknown>[]
  return rows.map(rowToEvent)
}

// Total USDC earned (sum of all payments, human-readable)
export function getTotalRevenue(): number {
  const db = getDb()
  const result = db.prepare('SELECT COALESCE(SUM(amount_usdc), 0) AS total FROM payments').get() as { total: number }
  return result.total
}

// Revenue breakdown by page prefix (for per-route stats on dashboard)
export function getRevenueByRoute(): Record<string, number> {
  const db = getDb()
  const rows = db
    .prepare(`
      SELECT
        CASE
          WHEN page LIKE '/products/%' THEN '/products/*'
          ELSE page
        END AS route,
        SUM(amount_usdc) AS total
      FROM payments
      GROUP BY route
      ORDER BY total DESC
    `)
    .all() as { route: string; total: number }[]
  return Object.fromEntries(rows.map((r) => [r.route, r.total]))
}

// For testing only — closes and nullifies the singleton so the next getDb()
// call re-initialises with whatever NANOCRAWL_DB_PATH is set to.
export function _resetDbForTesting(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}

function rowToEvent(row: Record<string, unknown>): PaymentEvent {
  return {
    id: row.id as string,
    payer: row.payer as string,
    page: row.page as string,
    amountUnits: row.amount_units as string,
    amountUsdc: row.amount_usdc as number,
    timestamp: row.timestamp as number,
    transaction: row.tx_id as string,
    network: row.network as string,
    cached: row.cached === 1,
  }
}
