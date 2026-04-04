// Tests for lib/x402.ts — 402 response construction and header encoding.
//
// Person A's GatewayClient.pay() depends on the exact format of what we return.
// These tests are the specification of our side of the interface contract.

import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import {
  buildPaymentRequirements,
  build402Response,
  encodePaymentResponse,
  decodePaymentSignature,
} from '../x402'
import nanocrawlConfig from '../../nanocrawl.config'
import { X402_VERSION, ARC_TESTNET, BASE_SEPOLIA, SUPPORTED_NETWORKS, getNetworkByCaip2, MAX_TIMEOUT_SECONDS } from '../../shared/config'
import type { PaymentRequired, SettlementResponse } from '../../shared/types'

function makeRequest(path = '/products/1'): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { 'x-nanocrawl-capable': 'true' },
  })
}

// ── getNetworkByCaip2 (shared/config) ────────────────────────────────────

describe('getNetworkByCaip2', () => {
  it('finds Arc Testnet by CAIP-2', () => {
    const net = getNetworkByCaip2('eip155:5042002')
    expect(net).toBeDefined()
    expect(net?.name).toBe('arcTestnet')
  })

  it('finds Base Sepolia by CAIP-2', () => {
    const net = getNetworkByCaip2('eip155:84532')
    expect(net).toBeDefined()
    expect(net?.name).toBe('baseSepolia')
  })

  it('returns undefined for unknown CAIP-2', () => {
    expect(getNetworkByCaip2('eip155:1')).toBeUndefined()
  })

  it('SUPPORTED_NETWORKS has exactly 2 entries', () => {
    expect(SUPPORTED_NETWORKS.length).toBe(2)
  })

  it('Arc Testnet and Base Sepolia have different USDC addresses', () => {
    expect(ARC_TESTNET.usdc).not.toBe(BASE_SEPOLIA.usdc)
  })

  it('Arc Testnet and Base Sepolia share the same Gateway Wallet address', () => {
    expect(ARC_TESTNET.gatewayWallet).toBe(BASE_SEPOLIA.gatewayWallet)
  })
})

// ── buildPaymentRequirements ──────────────────────────────────────────────

describe('buildPaymentRequirements', () => {
  describe('Arc Testnet (default)', () => {
    const req = buildPaymentRequirements('/products/1', nanocrawlConfig)

    it('uses exact scheme', () => {
      expect(req.scheme).toBe('exact')
    })

    it('uses Arc Testnet CAIP-2 network', () => {
      expect(req.network).toBe('eip155:5042002')
    })

    it('uses correct Arc USDC asset address', () => {
      expect(req.asset).toBe(ARC_TESTNET.usdc)
    })

    it('amount is a string (not a number)', () => {
      expect(typeof req.amount).toBe('string')
    })

    it('amount is 1000 base units for $0.001 USDC', () => {
      expect(req.amount).toBe('1000')
    })

    it('maxTimeoutSeconds matches config', () => {
      expect(req.maxTimeoutSeconds).toBe(MAX_TIMEOUT_SECONDS)
    })

    it('extra.name is GatewayWalletBatched', () => {
      expect(req.extra?.name).toBe('GatewayWalletBatched')
    })

    it('extra.version is "1"', () => {
      expect(req.extra?.version).toBe('1')
    })

    it('extra.verifyingContract is the Gateway Wallet address', () => {
      expect(req.extra?.verifyingContract).toBe(ARC_TESTNET.gatewayWallet)
    })
  })

  describe('Base Sepolia (Unlink privacy network)', () => {
    const req = buildPaymentRequirements('/products/1', nanocrawlConfig, BASE_SEPOLIA)

    it('uses Base Sepolia CAIP-2 network', () => {
      expect(req.network).toBe('eip155:84532')
    })

    it('uses Base Sepolia USDC address (not Arc)', () => {
      expect(req.asset).toBe(BASE_SEPOLIA.usdc)
      expect(req.asset).not.toBe(ARC_TESTNET.usdc)
    })

    it('same amount as Arc (price is network-agnostic)', () => {
      expect(req.amount).toBe('1000')
    })

    it('same payTo address as Arc', () => {
      const arcReq = buildPaymentRequirements('/products/1', nanocrawlConfig, ARC_TESTNET)
      expect(req.payTo).toBe(arcReq.payTo)
    })

    it('verifyingContract is the same Gateway Wallet (shared across chains)', () => {
      expect(req.extra?.verifyingContract).toBe(BASE_SEPOLIA.gatewayWallet)
      expect(req.extra?.verifyingContract).toBe(ARC_TESTNET.gatewayWallet)
    })
  })
})

// ── build402Response ──────────────────────────────────────────────────────

describe('build402Response', () => {
  it('returns HTTP 402 status', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    expect(res.status).toBe(402)
  })

  it('sets Content-Type application/json', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  it('sets PAYMENT-REQUIRED header (uppercase)', () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    expect(res.headers.get('PAYMENT-REQUIRED')).not.toBeNull()
  })

  it('PAYMENT-REQUIRED header is valid Base64', () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const header = res.headers.get('PAYMENT-REQUIRED')!
    expect(() => Buffer.from(header, 'base64').toString('utf-8')).not.toThrow()
  })

  it('PAYMENT-REQUIRED header decodes to valid JSON', () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const header = res.headers.get('PAYMENT-REQUIRED')!
    const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'))
    expect(decoded).toBeDefined()
  })

  it('PAYMENT-REQUIRED header and response body contain the same PaymentRequired object', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const header = res.headers.get('PAYMENT-REQUIRED')!
    const fromHeader: PaymentRequired = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'))
    const fromBody: PaymentRequired = await res.clone().json()
    expect(fromHeader).toEqual(fromBody)
  })

  it('decoded PaymentRequired has x402Version 2', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const body: PaymentRequired = await res.clone().json()
    expect(body.x402Version).toBe(X402_VERSION)
  })

  it('accepts[] has one entry per supported network', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const body: PaymentRequired = await res.clone().json()
    expect(body.accepts.length).toBe(SUPPORTED_NETWORKS.length)
  })

  it('accepts[0] is Arc Testnet with all required x402 fields', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const body: PaymentRequired = await res.clone().json()
    expect(body.accepts[0]).toMatchObject({
      scheme: 'exact',
      network: 'eip155:5042002',
      asset: ARC_TESTNET.usdc,
      amount: expect.any(String),
      payTo: expect.any(String),
      maxTimeoutSeconds: expect.any(Number),
    })
  })

  it('accepts[1] is Base Sepolia with correct USDC address', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const body: PaymentRequired = await res.clone().json()
    expect(body.accepts[1]).toMatchObject({
      scheme: 'exact',
      network: 'eip155:84532',
      asset: BASE_SEPOLIA.usdc,
      amount: expect.any(String),
      payTo: expect.any(String),
      maxTimeoutSeconds: expect.any(Number),
    })
  })

  it('all accepts[] entries have the same amount (price is network-agnostic)', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const body: PaymentRequired = await res.clone().json()
    const amounts = body.accepts.map(a => a.amount)
    expect(new Set(amounts).size).toBe(1)
  })

  it('all accepts[] entries have the same payTo address', async () => {
    const res = build402Response(makeRequest(), nanocrawlConfig)
    const body: PaymentRequired = await res.clone().json()
    const payTos = body.accepts.map(a => a.payTo)
    expect(new Set(payTos).size).toBe(1)
  })

  it('resource.url reflects the original request URL', async () => {
    const res = build402Response(makeRequest('/products/42'), nanocrawlConfig)
    const body: PaymentRequired = await res.clone().json()
    expect(body.resource?.url).toContain('/products/42')
  })
})

// ── encodePaymentResponse ─────────────────────────────────────────────────

describe('encodePaymentResponse', () => {
  const settlement: SettlementResponse = {
    success: true,
    transaction: 'abc-123-uuid',
    network: 'eip155:5042002',
    payer: '0xdeadbeef',
  }

  it('returns a non-empty Base64 string', () => {
    const encoded = encodePaymentResponse(settlement)
    expect(encoded.length).toBeGreaterThan(0)
  })

  it('decodes back to the original object', () => {
    const encoded = encodePaymentResponse(settlement)
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))
    expect(decoded).toEqual(settlement)
  })
})

// ── decodePaymentSignature ────────────────────────────────────────────────

describe('decodePaymentSignature', () => {
  it('decodes a valid Base64-encoded JSON string', () => {
    const payload = { x402Version: 2, accepted: { scheme: 'exact' } }
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
    const decoded = decodePaymentSignature(encoded)
    expect(decoded).toEqual(payload)
  })

  it('returns null for invalid Base64', () => {
    expect(decodePaymentSignature('not-valid-base64!!!')).toBeNull()
  })

  it('returns null for valid Base64 that is not JSON', () => {
    const encoded = Buffer.from('hello world').toString('base64')
    expect(decodePaymentSignature(encoded)).toBeNull()
  })
})
