// Tests for lib/payments-store.ts — SQLite payment log and idempotency.
//
// Uses an in-memory SQLite DB (:memory:) via NANOCRAWL_DB_PATH env var.
// The idempotency test is the critical one: a duplicate payment-identifier
// must NEVER insert twice or the dashboard shows double charges.

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

// Must be set before any call to getDb() — env var is read lazily at call time
beforeAll(() => {
  process.env.NANOCRAWL_DB_PATH = ':memory:'
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

beforeEach(() => {
  _resetDbForTesting()
})

// ── recordPayment ─────────────────────────────────────────────────────────

describe('recordPayment', () => {
  it('returns true on first insert', () => {
    const inserted = recordPayment(makeEvent())
    expect(inserted).toBe(true)
  })

  it('returns false on duplicate id (idempotency cache hit)', () => {
    recordPayment(makeEvent())
    const secondInsert = recordPayment(makeEvent()) // same id
    expect(secondInsert).toBe(false)
  })

  it('allows different ids for the same payer and page', () => {
    const first = recordPayment(makeEvent({ id: 'id-001' }))
    const second = recordPayment(makeEvent({ id: 'id-002' }))
    expect(first).toBe(true)
    expect(second).toBe(true)
  })

  it('stores cached: false correctly', () => {
    recordPayment({ ...makeEvent(), cached: false })
    const event = findPaymentById('test-payment-id-001')
    expect(event?.cached).toBe(false)
  })

  it('stores cached: true correctly', () => {
    recordPayment({ ...makeEvent(), cached: true })
    const event = findPaymentById('test-payment-id-001')
    expect(event?.cached).toBe(true)
  })
})

// ── findPaymentById ───────────────────────────────────────────────────────

describe('findPaymentById', () => {
  it('returns the event for a known id', () => {
    recordPayment(makeEvent())
    const event = findPaymentById('test-payment-id-001')
    expect(event).not.toBeNull()
    expect(event?.id).toBe('test-payment-id-001')
    expect(event?.payer).toBe('0xabc123')
    expect(event?.amountUsdc).toBe(0.001)
  })

  it('returns null for an unknown id', () => {
    expect(findPaymentById('does-not-exist')).toBeNull()
  })

  it('returns the correct event when multiple exist', () => {
    recordPayment(makeEvent({ id: 'id-A', payer: '0xAAAA' }))
    recordPayment(makeEvent({ id: 'id-B', payer: '0xBBBB' }))
    const event = findPaymentById('id-B')
    expect(event?.payer).toBe('0xBBBB')
  })
})

// ── getRecentPayments ─────────────────────────────────────────────────────

describe('getRecentPayments', () => {
  it('returns empty array when no payments recorded', () => {
    expect(getRecentPayments()).toEqual([])
  })

  it('returns all recorded payments', () => {
    recordPayment(makeEvent({ id: 'id-1', timestamp: 1000 }))
    recordPayment(makeEvent({ id: 'id-2', timestamp: 2000 }))
    expect(getRecentPayments().length).toBe(2)
  })

  it('returns payments in descending timestamp order', () => {
    recordPayment(makeEvent({ id: 'id-1', timestamp: 1000 }))
    recordPayment(makeEvent({ id: 'id-2', timestamp: 3000 }))
    recordPayment(makeEvent({ id: 'id-3', timestamp: 2000 }))
    const events = getRecentPayments()
    expect(events[0].timestamp).toBe(3000)
    expect(events[1].timestamp).toBe(2000)
    expect(events[2].timestamp).toBe(1000)
  })

  it('respects the limit parameter', () => {
    for (let i = 0; i < 5; i++) {
      recordPayment(makeEvent({ id: `id-${i}` }))
    }
    expect(getRecentPayments(3).length).toBe(3)
  })
})

// ── getTotalRevenue ───────────────────────────────────────────────────────

describe('getTotalRevenue', () => {
  it('returns 0 with no payments', () => {
    expect(getTotalRevenue()).toBe(0)
  })

  it('sums all payment amounts correctly', () => {
    recordPayment(makeEvent({ id: 'id-1', amountUsdc: 0.001 }))
    recordPayment(makeEvent({ id: 'id-2', amountUsdc: 0.002 }))
    recordPayment(makeEvent({ id: 'id-3', amountUsdc: 0.001 }))
    expect(getTotalRevenue()).toBeCloseTo(0.004, 6)
  })
})

// ── getRevenueByRoute ─────────────────────────────────────────────────────

describe('getRevenueByRoute', () => {
  it('returns empty object with no payments', () => {
    expect(getRevenueByRoute()).toEqual({})
  })

  it('groups product pages under /products/*', () => {
    recordPayment(makeEvent({ id: 'id-1', page: '/products/1', amountUsdc: 0.001 }))
    recordPayment(makeEvent({ id: 'id-2', page: '/products/2', amountUsdc: 0.001 }))
    const routes = getRevenueByRoute()
    expect(routes['/products/*']).toBeCloseTo(0.002, 6)
  })
})
