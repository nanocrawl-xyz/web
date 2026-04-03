// Payment store — async interface backed by either Vercel KV or SQLite.
//
// KV  (Vercel production): used when KV_REST_API_URL env var is present.
// SQLite (local dev/test):  used otherwise. NANOCRAWL_DB_PATH overrides the path.
//
// All exported functions are async so callers work with either backend.

import { v4 as uuidv4 } from 'uuid'
import type { PaymentEvent } from '../shared/types'

// ── Backend selection ─────────────────────────────────────────────────────

function useKv(): boolean {
  return !!process.env.KV_REDIS_URL
}

// ── Redis helpers ─────────────────────────────────────────────────────────

import { createClient } from 'redis'

let _redis: ReturnType<typeof createClient> | null = null

async function getRedis() {
  if (!_redis) {
    _redis = createClient({ url: process.env.KV_REDIS_URL })
    _redis.on('error', (err) => console.error('Redis error:', err))
  }
  if (!_redis.isOpen) await _redis.connect()
  return _redis
}

async function kvRecordPayment(event: PaymentEvent): Promise<boolean> {
  const r = await getRedis()
  // SET NX = only set if key does not exist (idempotency)
  const result = await r.set(`payment:${event.id}`, JSON.stringify(event), { NX: true })
  if (result === null) return false   // duplicate
  await r.lPush('payments:list', JSON.stringify(event))
  return true
}

async function kvFindPaymentById(id: string): Promise<PaymentEvent | null> {
  const r = await getRedis()
  const val = await r.get(`payment:${id}`)
  return val ? JSON.parse(val) as PaymentEvent : null
}

async function kvGetRecentPayments(limit: number): Promise<PaymentEvent[]> {
  const r = await getRedis()
  const items = await r.lRange('payments:list', 0, limit - 1)
  return items.map((item) => JSON.parse(item) as PaymentEvent)
}

async function kvGetAllPayments(): Promise<PaymentEvent[]> {
  const r = await getRedis()
  const items = await r.lRange('payments:list', 0, -1)
  return items.map((item) => JSON.parse(item) as PaymentEvent)
}

// ── SQLite helpers ────────────────────────────────────────────────────────

function resolveDbPath(): string {
  return (
    process.env.NANOCRAWL_DB_PATH ??
    (process.env.NODE_ENV === 'production'
      ? '/tmp/nanocrawl-payments.db'
      : require('path').join(process.cwd(), 'nanocrawl-payments.db'))
  )
}

let _db: import('better-sqlite3').Database | null = null

function getDb(): import('better-sqlite3').Database {
  if (_db) return _db
  const Database = require('better-sqlite3')
  _db = new Database(resolveDbPath()) as import('better-sqlite3').Database
  _db!.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id           TEXT PRIMARY KEY,
      payer        TEXT NOT NULL,
      page         TEXT NOT NULL,
      amount_units TEXT NOT NULL,
      amount_usdc  REAL NOT NULL,
      timestamp    INTEGER NOT NULL,
      tx_id        TEXT NOT NULL,
      network      TEXT NOT NULL,
      cached       INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_payments_timestamp ON payments(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer);
  `)
  return _db!
}

function rowToEvent(row: Record<string, unknown>): PaymentEvent {
  return {
    id:          row.id as string,
    payer:       row.payer as string,
    page:        row.page as string,
    amountUnits: row.amount_units as string,
    amountUsdc:  row.amount_usdc as number,
    timestamp:   row.timestamp as number,
    transaction: row.tx_id as string,
    network:     row.network as string,
    cached:      row.cached === 1,
  }
}

function sqliteRecordPayment(event: PaymentEvent): boolean {
  const db = getDb()
  const result = db.prepare(`
    INSERT OR IGNORE INTO payments
      (id, payer, page, amount_units, amount_usdc, timestamp, tx_id, network, cached)
    VALUES
      (@id, @payer, @page, @amountUnits, @amountUsdc, @timestamp, @tx_id, @network, @cached)
  `).run({
    id:          event.id,
    payer:       event.payer,
    page:        event.page,
    amountUnits: event.amountUnits,
    amountUsdc:  event.amountUsdc,
    timestamp:   event.timestamp,
    tx_id:       event.transaction,
    network:     event.network,
    cached:      event.cached ? 1 : 0,
  })
  return result.changes > 0
}

// ── Public API (async) ────────────────────────────────────────────────────

export async function recordPayment(
  event: Omit<PaymentEvent, 'cached'> & { cached?: boolean },
): Promise<boolean> {
  const full: PaymentEvent = {
    id:          event.id ?? uuidv4(),
    payer:       event.payer,
    page:        event.page,
    amountUnits: event.amountUnits,
    amountUsdc:  event.amountUsdc,
    timestamp:   event.timestamp,
    transaction: event.transaction,
    network:     event.network,
    cached:      event.cached ?? false,
  }
  if (useKv()) return kvRecordPayment(full)
  return sqliteRecordPayment(full)
}

export async function findPaymentById(id: string): Promise<PaymentEvent | null> {
  if (useKv()) return kvFindPaymentById(id)
  const db = getDb()
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToEvent(row) : null
}

export async function getRecentPayments(limit = 100): Promise<PaymentEvent[]> {
  if (useKv()) return kvGetRecentPayments(limit)
  const db = getDb()
  const rows = db.prepare('SELECT * FROM payments ORDER BY timestamp DESC LIMIT ?')
    .all(limit) as Record<string, unknown>[]
  return rows.map(rowToEvent)
}

export async function getTotalRevenue(): Promise<number> {
  if (useKv()) {
    const all = await kvGetAllPayments()
    return all.reduce((sum, e) => sum + e.amountUsdc, 0)
  }
  const db = getDb()
  const result = db.prepare('SELECT COALESCE(SUM(amount_usdc), 0) AS total FROM payments')
    .get() as { total: number }
  return result.total
}

export async function getRevenueByRoute(): Promise<Record<string, number>> {
  if (useKv()) {
    const all = await kvGetAllPayments()
    const acc: Record<string, number> = {}
    for (const e of all) {
      const route = e.page.startsWith('/products/') ? '/products/*' : e.page
      acc[route] = (acc[route] ?? 0) + e.amountUsdc
    }
    return acc
  }
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      CASE WHEN page LIKE '/products/%' THEN '/products/*' ELSE page END AS route,
      SUM(amount_usdc) AS total
    FROM payments GROUP BY route ORDER BY total DESC
  `).all() as { route: string; total: number }[]
  return Object.fromEntries(rows.map((r) => [r.route, r.total]))
}

// For testing only — resets the SQLite singleton so NANOCRAWL_DB_PATH is re-read.
export async function _resetDbForTesting(): Promise<void> {
  if (_db) {
    _db.close()
    _db = null
  }
}
