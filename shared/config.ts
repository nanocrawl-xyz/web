// Shared constants — canonical source of truth for Arc Testnet + Circle Gateway
// Person A owns the monorepo /shared/; this is Person B's local copy.
// Sync with Person A at Hour 8 integration point.

export const ARC_TESTNET = {
  chainId: 5042002,
  caip2: 'eip155:5042002',
  domainId: 26,
  name: 'arcTestnet',
  usdc: '0x3600000000000000000000000000000000000000',
  gatewayWallet: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
  gatewayMinter: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B',
  rpc: 'https://rpc.testnet.arc.network',
  explorer: 'https://testnet.arcscan.app',
  faucet: 'https://faucet.circle.com',
} as const

export const CIRCLE_GATEWAY = {
  settleEndpoint: 'https://gateway-api-testnet.circle.com/gateway/v1/x402/settle',
  balancesEndpoint: 'https://gateway-api-testnet.circle.com/v1/balances',
} as const

// x402 protocol
export const X402_VERSION = 2
export const X402_SCHEME = 'exact'
export const EIP712_DOMAIN_NAME = 'GatewayWalletBatched'
export const EIP712_DOMAIN_VERSION = '1'

// USDC has 6 decimals: 1 USDC = 1_000_000 base units
export const USDC_DECIMALS = 6

// validBefore = now + VALID_BEFORE_OFFSET (Circle minimum is 3 days; we use 5 for safety)
export const VALID_BEFORE_OFFSET_SECONDS = 5 * 24 * 60 * 60

// maxTimeoutSeconds in PAYMENT-REQUIRED accepts entry (4 days)
export const MAX_TIMEOUT_SECONDS = 345600
