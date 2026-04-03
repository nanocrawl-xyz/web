// Integration tests for app/api/verify-and-serve/route.ts
//
// Mocks: settlePayment (Circle Gateway), payments-store (SQLite/KV).
// Tests the full request handler in isolation — no network, no DB.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../lib/settle', () => ({
  settlePayment: vi.fn(),
}))

vi.mock('../../lib/payments-store', () => ({
  findPaymentById: vi.fn(),
  recordPayment: vi.fn(),
}))

import { GET } from '../../app/api/verify-and-serve/route'
import { settlePayment } from '../../lib/settle'
import { findPaymentById, recordPayment } from '../../lib/payments-store'

const mockSettle = vi.mocked(settlePayment)
const mockFind   = vi.mocked(findPaymentById)
const mockRecord = vi.mocked(recordPayment)

// ── Helpers ────────────────────────────────────────────────────────────────

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    x402Version: 2,
    payload: {
      authorization: {
        from: '0xBuyer',
        to: '0xSeller',
        value: '1000',
        validAfter: '0',
        validBefore: '9999999999',
        nonce: '0xabc',
      },
      signature: '0xsig',
    },
    resource: {
      url: 'http://localhost:3000/products/1',
      mimeType: 'application/json',
      description: 'NanoCrawl paid content',
    },
    accepted: {
      scheme: 'exact',
      network: 'eip155:5042002',
      asset: '0x3600000000000000000000000000000000000000',
      amount: '1000',
      payTo: '0xSeller',
      maxTimeoutSeconds: 345600,
      extra: { name: 'GatewayWalletBatched', version: '1', verifyingContract: '0xGW' },
    },
    ...overrides,
  }
}

function makeSignatureHeader(payload = makePayload()) {
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

function makeRequest(opts: { signature?: string; resource?: string } = {}) {
  const url = `http://localhost:3000/api/verify-and-serve?resource=${opts.resource ?? '/products/1'}`
  return new NextRequest(url, {
    headers: opts.signature !== undefined
      ? { 'payment-signature': opts.signature }
      : {},
  })
}

const goodSettle = {
  settled: true,
  response: {
    success: true,
    transaction: 'tx-uuid-001',
    network: 'eip155:5042002',
    payer: '0xBuyer',
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFind.mockResolvedValue(null)
  mockRecord.mockResolvedValue(true)
  mockSettle.mockResolvedValue(goodSettle)
})

// ── Missing / malformed signature ─────────────────────────────────────────

describe('missing or malformed payment-signature', () => {
  it('returns 402 when payment-signature header is absent', async () => {
    const res = await GET(makeRequest({ signature: undefined }))
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.error).toMatch(/missing/i)
  })

  it('returns 402 when signature is not valid base64 JSON', async () => {
    const res = await GET(makeRequest({ signature: 'not-valid-base64!!!' }))
    expect(res.status).toBe(402)
  })

  it('returns 402 when x402Version is not 2', async () => {
    const sig = makeSignatureHeader(makePayload({ x402Version: 1 }))
    const res = await GET(makeRequest({ signature: sig }))
    expect(res.status).toBe(402)
  })
})

// ── Idempotency ───────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('serves cached content without re-settling on duplicate payment-identifier', async () => {
    const payload = makePayload({
      extensions: { 'payment-identifier': { id: 'existing-id' } },
    })
    mockFind.mockResolvedValue({
      id: 'existing-id',
      payer: '0xBuyer',
      page: '/products/1',
      amountUnits: '1000',
      amountUsdc: 0.001,
      timestamp: Date.now(),
      transaction: 'cached-tx',
      network: 'eip155:5042002',
      cached: false,
    })

    const res = await GET(makeRequest({ signature: makeSignatureHeader(payload) }))
    expect(res.status).toBe(200)
    expect(res.headers.get('X-NanoCrawl-Cached')).toBe('true')
    expect(mockSettle).not.toHaveBeenCalled()
    expect(mockRecord).not.toHaveBeenCalled()
  })
})

// ── Settlement failures ───────────────────────────────────────────────────

describe('settlement failures', () => {
  it('returns 502 when Circle Gateway throws', async () => {
    mockSettle.mockRejectedValue(new Error('Gateway settle() HTTP 500: Internal Server Error'))
    const res = await GET(makeRequest({ signature: makeSignatureHeader() }))
    expect(res.status).toBe(502)
  })

  it('returns 402 when Circle Gateway rejects the payment', async () => {
    mockSettle.mockResolvedValue({
      settled: false,
      response: { success: false, errorReason: 'insufficient_balance', transaction: '', network: '' },
    })
    const res = await GET(makeRequest({ signature: makeSignatureHeader() }))
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.error).toContain('insufficient_balance')
  })
})

// ── Successful payment ────────────────────────────────────────────────────

describe('successful payment', () => {
  it('returns 200 with product content', async () => {
    const res = await GET(makeRequest({ signature: makeSignatureHeader() }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('1')
  })

  it('sets PAYMENT-RESPONSE header on 200', async () => {
    const res = await GET(makeRequest({ signature: makeSignatureHeader() }))
    expect(res.status).toBe(200)
    const header = res.headers.get('PAYMENT-RESPONSE')
    expect(header).toBeTruthy()
    const decoded = JSON.parse(Buffer.from(header!, 'base64').toString())
    expect(decoded.transaction).toBe('tx-uuid-001')
    expect(decoded.success).toBe(true)
  })

  it('sets X-NanoCrawl-Cached: false on fresh payment', async () => {
    const res = await GET(makeRequest({ signature: makeSignatureHeader() }))
    expect(res.headers.get('X-NanoCrawl-Cached')).toBe('false')
  })

  it('calls recordPayment with correct data', async () => {
    await GET(makeRequest({ signature: makeSignatureHeader() }))
    expect(mockRecord).toHaveBeenCalledOnce()
    const call = mockRecord.mock.calls[0][0]
    expect(call.page).toBe('/products/1')
    expect(call.amountUnits).toBe('1000')
    expect(call.transaction).toBe('tx-uuid-001')
    expect(call.payer).toBe('0xBuyer')
  })

  it('returns product not found for unknown product id', async () => {
    const res = await GET(makeRequest({ signature: makeSignatureHeader(), resource: '/products/999' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.error).toBe('Product not found')
  })
})
