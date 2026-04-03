import {
  ARC_TESTNET,
  MAX_TIMEOUT_SECONDS,
  USDC_DECIMALS,
} from './shared/config'

// Price in USDC (human-readable). Converted to base units in lib/x402.ts.
// Routes are matched as prefix strings. More specific routes take priority.
const pricing: Record<string, number> = {
  '/products': 0.001,   // $0.001 per product page
}

const nanocrawlConfig = {
  // Merchant wallet address (receives payments)
  sellerWallet: process.env.NANOCRAWL_SELLER_WALLET ?? '',

  // Merchant private key — used only in /api/withdraw (Node.js runtime, never Edge)
  sellerPrivateKey: process.env.NANOCRAWL_SELLER_PRIVATE_KEY ?? '',

  // Default per-page price in USDC if no pricing rule matches
  defaultPriceUsdc: parseFloat(process.env.NANOCRAWL_DEFAULT_PRICE_USDC ?? '0.001'),

  // Route-specific pricing (prefix match, most specific wins)
  pricing,

  // Arc Testnet — all Circle Gateway calls use this network
  network: ARC_TESTNET.caip2,
  asset: ARC_TESTNET.usdc,
  verifyingContract: ARC_TESTNET.gatewayWallet,
  maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
  usdcDecimals: USDC_DECIMALS,

  // Routes that are always free (humans + crawlers pass through)
  // Middleware matcher already excludes /api/* and /_next/*
  freeRoutes: ['/', '/nanocrawl', '/nanocrawl/dashboard'],
}

export default nanocrawlConfig
export type NanocrawlConfig = typeof nanocrawlConfig

// Helper: convert human-readable USDC to base units (string)
export function usdcToUnits(usdc: number): string {
  return Math.round(usdc * 10 ** USDC_DECIMALS).toString()
}

// Helper: convert base units (string) to human-readable USDC
export function unitsToUsdc(units: string): number {
  return parseInt(units, 10) / 10 ** USDC_DECIMALS
}

// Helper: resolve price for a given path
export function priceForPath(path: string): number {
  const matches = Object.entries(nanocrawlConfig.pricing)
    .filter(([route]) => path.startsWith(route))
    .sort((a, b) => b[0].length - a[0].length) // longest prefix wins

  return matches[0]?.[1] ?? nanocrawlConfig.defaultPriceUsdc
}
