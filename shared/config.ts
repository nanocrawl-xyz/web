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

// Base Sepolia — required for Unlink privacy layer (Unlink is only deployed here)
export const BASE_SEPOLIA = {
  chainId: 84532,
  caip2: 'eip155:84532',
  domainId: 6,
  name: 'baseSepolia',
  usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  gatewayWallet: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
  gatewayMinter: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B',
  rpc: 'https://sepolia.base.org',
  explorer: 'https://sepolia.basescan.org',
  faucet: 'https://faucet.circle.com',
} as const

// All supported payment networks — Arc first (default for agents that don't specify)
export const SUPPORTED_NETWORKS = [ARC_TESTNET, BASE_SEPOLIA] as const
export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number]

// Lookup by CAIP-2 string (e.g. "eip155:5042002")
export function getNetworkByCaip2(caip2: string): SupportedNetwork | undefined {
  return SUPPORTED_NETWORKS.find(n => n.caip2 === caip2)
}

export const CIRCLE_GATEWAY = {
  settleEndpoint: 'https://gateway-api-testnet.circle.com/v1/x402/settle',
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
