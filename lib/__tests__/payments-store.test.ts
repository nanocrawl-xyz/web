// Tests for lib/payments-store.ts — payment log and idempotency.
//
// Uses in-memory SQLite via NANOCRAWL_DB_PATH=':memory:'.
// KV_REST_API_URL is deliberately NOT set so the SQLite path is exercised.
// The idempotency test is critical: duplicate payment-identifier must never insert twice.

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(() => {
  process.env.NANOCRAWL_DB_PATH = ':memory:'
  delete process.env.KV_REST_API_URL
})

import {
  recordPayment,
  findPaymentById,
  getRecentPayments,
  getTotalRevenue,
  getRevenueByRoute,
  _resetDbForTesting,
} from '../payments-store'
import type { PaymentEvent } from '../../shared/types'

function makeEvent(overrides: Partial<PaymentEvent> = {}): Omit<PaymentEvent, 'cached'> {
  return {
    id: 'test-payment-id-001',
    payer: '0xabc123',
    page: '/products/1',
    amountUnits: '1000',
    amountUsdc: 0.001,
    timestamp: 1700000000000,
    transaction: 'circle-tx-uuid-001',
    network: 'eip155:5042002',
    ...overrides,
  }
}

beforeEach(async () => {
  await _resetDbForTesting()
})

// ── recordPayment ─────────────────────────────────────────────────────────

describe('recordPayment', () => {
  it('returns true on first insert', async () => {
    const inserted = await recordPayment(makeEvent())
    expect(inserted).toBe(true)
  })

  it('returns false on duplicate id (idempotency cache hit)', async () => {
    await recordPayment(makeEvent())
    const secondInsert = await recordPayment(makeEvent())
    expect(secondInsert).toBe(false)
  })

  it('allows different ids for the same payer and page', async () => {
    const first = await recordPayment(makeEvent({ id: 'id-001' }))
    const second = await recordPayment(makeEvent({ id: 'id-002' }))
    expect(first).toBe(true)
    expect(second).toBe(true)
  })

  it('stores cached: false correctly', async () => {
    await recordPayment({ ...makeEvent(), cached: false })
    const event = await findPaymentById('test-payment-id-001')
    expect(event?.cached).toBe(false)
  })

  it('stores cached: true correctly', async () => {
    await recordPayment({ ...makeEvent(), cached: true })
    const event = await findPaymentById('test-payment-id-001')
    expect(event?.cached).toBe(true)
  })
})

// ── findPaymentById ───────────────────────────────────────────────────────

describe('findPaymentById', () => {
  it('returns the event for a known id', async () => {
    await recordPayment(makeEvent())
    const event = await findPaymentById('test-payment-id-001')
    expect(event).not.toBeNull()
    expect(event?.id).toBe('test-payment-id-001')
    expect(event?.payer).toBe('0xabc123')
    expect(event?.amountUsdc).toBe(0.001)
  })

  it('returns null for an unknown id', async () => {
    expect(await findPaymentById('does-not-exist')).toBeNull()
  })

  it('returns the correct event when multiple exist', async () => {
    await recordPayment(makeEvent({ id: 'id-A', payer: '0xAAAA' }))
    await recordPayment(makeEvent({ id: 'id-B', payer: '0xBBBB' }))
    const event = await findPaymentById('id-B')
    expect(event?.payer).toBe('0xBBBB')
  })
})

// ── getRecentPayments ─────────────────────────────────────────────────────

describe('getRecentPayments', () => {
  it('returns empty array when no payments recorded', async () => {
    expect(await getRecentPayments()).toEqual([])
  })

  it('returns all recorded payments', async () => {
    await recordPayment(makeEvent({ id: 'id-1', timestamp: 1000 }))
    await recordPayment(makeEvent({ id: 'id-2', timestamp: 2000 }))
    expect((await getRecentPayments()).length).toBe(2)
  })

  it('returns payments in descending timestamp order', async () => {
    await recordPayment(makeEvent({ id: 'id-1', timestamp: 1000 }))
    await recordPayment(makeEvent({ id: 'id-2', timestamp: 3000 }))
    await recordPayment(makeEvent({ id: 'id-3', timestamp: 2000 }))
    const events = await getRecentPayments()
    expect(events[0].timestamp).toBe(3000)
    expect(events[1].timestamp).toBe(2000)
    expect(events[2].timestamp).toBe(1000)
  })

  it('respects the limit parameter', async () => {
    for (let i = 0; i < 5; i++) {
      await recordPayment(makeEvent({ id: `id-${i}` }))
    }
    expect((await getRecentPayments(3)).length).toBe(3)
  })
})

// ── getTotalRevenue ───────────────────────────────────────────────────────

describe('getTotalRevenue', () => {
  it('returns 0 with no payments', async () => {
    expect(await getTotalRevenue()).toBe(0)
  })

  it('sums all payment amounts correctly', async () => {
    await recordPayment(makeEvent({ id: 'id-1', amountUsdc: 0.001 }))
    await recordPayment(makeEvent({ id: 'id-2', amountUsdc: 0.002 }))
    await recordPayment(makeEvent({ id: 'id-3', amountUsdc: 0.001 }))
    expect(await getTotalRevenue()).toBeCloseTo(0.004, 6)
  })
})

// ── getRevenueByRoute ─────────────────────────────────────────────────────

describe('getRevenueByRoute', () => {
  it('returns empty object with no payments', async () => {
    expect(await getRevenueByRoute()).toEqual({})
  })

  it('groups product pages under /products/*', async () => {
    await recordPayment(makeEvent({ id: 'id-1', page: '/products/1', amountUsdc: 0.001 }))
    await recordPayment(makeEvent({ id: 'id-2', page: '/products/2', amountUsdc: 0.001 }))
    const routes = await getRevenueByRoute()
    expect(routes['/products/*']).toBeCloseTo(0.002, 6)
  })
})
