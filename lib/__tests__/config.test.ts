// Tests for nanocrawl.config.ts — price math and route resolution.
//
// usdcToUnits / unitsToUsdc: wrong decimals = wrong payment amount.
// USDC has 6 decimals. Getting this wrong by a factor of 10 or 1000 is silent
// and will cause either zero payments or enormous payments in the demo.

import { describe, it, expect } from 'vitest'
import { usdcToUnits, unitsToUsdc, priceForPath } from '../../nanocrawl.config'

// ── usdcToUnits ───────────────────────────────────────────────────────────

describe('usdcToUnits', () => {
  it('converts $0.001 to 1000 base units', () => {
    expect(usdcToUnits(0.001)).toBe('1000')
  })

  it('converts $1.00 to 1_000_000 base units', () => {
    expect(usdcToUnits(1)).toBe('1000000')
  })

  it('converts $0.000001 (min nanopayment) to 1 base unit', () => {
    expect(usdcToUnits(0.000001)).toBe('1')
  })

  it('converts $0.0001 to 100 base units', () => {
    expect(usdcToUnits(0.0001)).toBe('100')
  })

  it('returns a string, not a number', () => {
    expect(typeof usdcToUnits(0.001)).toBe('string')
  })
})

// ── unitsToUsdc ───────────────────────────────────────────────────────────

describe('unitsToUsdc', () => {
  it('converts 1000 base units to $0.001', () => {
    expect(unitsToUsdc('1000')).toBe(0.001)
  })

  it('converts 1_000_000 base units to $1.00', () => {
    expect(unitsToUsdc('1000000')).toBe(1)
  })

  it('converts "0" to 0', () => {
    expect(unitsToUsdc('0')).toBe(0)
  })
})

// ── round-trip ────────────────────────────────────────────────────────────

describe('usdcToUnits / unitsToUsdc round-trip', () => {
  const amounts = [0.001, 0.0001, 0.01, 1, 0.000001]
  amounts.forEach((amount) => {
    it(`round-trips $${amount}`, () => {
      expect(unitsToUsdc(usdcToUnits(amount))).toBeCloseTo(amount, 8)
    })
  })
})

// ── priceForPath ──────────────────────────────────────────────────────────

describe('priceForPath', () => {
  it('returns the configured price for /products', () => {
    expect(priceForPath('/products')).toBe(0.001)
  })

  it('returns the configured price for /products/1 (prefix match)', () => {
    expect(priceForPath('/products/1')).toBe(0.001)
  })

  it('returns the configured price for a deep product path', () => {
    expect(priceForPath('/products/some/deep/path')).toBe(0.001)
  })

  it('returns the default price for an unmatched route', () => {
    expect(priceForPath('/unknown-route')).toBe(0.001) // defaultPriceUsdc
  })

  it('returns the default price for the root path', () => {
    expect(priceForPath('/')).toBe(0.001)
  })
})
