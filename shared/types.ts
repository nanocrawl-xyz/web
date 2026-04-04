// Shared TypeScript types — used by both Person A (MCP server) and Person B (web app)
// These map directly to the x402 v2 protocol spec.

// ── x402 Protocol Types ────────────────────────────────────────────────────

export interface ResourceInfo {
  url: string
  description: string             // required by Circle Gateway settle API
  mimeType: string                // required by Circle Gateway settle API
}

export interface PaymentRequirements {
  scheme: string                  // always "exact" for Circle Nanopayments
  network: string                 // CAIP-2, e.g. "eip155:5042002"
  asset: string                   // USDC contract address
  amount: string                  // atomic units (string, not number)
  payTo: string                   // seller EVM address
  maxTimeoutSeconds: number       // validity window, e.g. 345600 (4 days)
  extra?: {
    name: string                  // "GatewayWalletBatched"
    version: string               // "1"
    verifyingContract: string     // Gateway Wallet contract address
  }
}

// Sent by server in PAYMENT-REQUIRED header (Base64-encoded JSON) + response body
export interface PaymentRequired {
  x402Version: number             // 2
  resource?: ResourceInfo
  accepts: PaymentRequirements[]
  error?: string                  // optional human-readable reason
  extensions?: Record<string, unknown>
}

// EIP-3009 authorization details (inside PaymentPayload.payload)
export interface Eip3009Authorization {
  from: string
  to: string
  value: string                   // atomic units
  validAfter: string              // unix timestamp (seconds)
  validBefore: string             // unix timestamp (seconds)
  nonce: string                   // 32-byte hex, unique per payment
}

// Sent by buyer in PAYMENT-SIGNATURE header (Base64-encoded JSON)
export interface PaymentPayload {
  x402Version: number             // 2
  resource?: ResourceInfo
  accepted: PaymentRequirements   // the entry the buyer selected from accepts[]
  payload: {
    signature: string             // EIP-712 signature over the GatewayWalletBatched domain
    authorization: Eip3009Authorization
  }
  extensions?: {
    'payment-identifier'?: {      // x402 idempotency extension (NOT X-Payment-ID header)
      id: string
    }
    [key: string]: unknown
  }
}

// Sent by server in PAYMENT-RESPONSE header (Base64-encoded JSON) on 200
export interface SettlementResponse {
  success: boolean
  errorReason?: string
  transaction: string             // Circle settlement UUID
  network: string                 // CAIP-2
  payer?: string                  // buyer EVM address
}

// ── Application Types ──────────────────────────────────────────────────────

// One entry in the payments log (dashboard + /api/payments)
export interface PaymentEvent {
  id: string                      // payment-identifier (idempotency key; UUID if not provided)
  payer: string                   // crawler EVM address
  page: string                    // URL path (e.g. "/products/1")
  amountUnits: string             // atomic units (string)
  amountUsdc: number              // human-readable USDC (e.g. 0.001)
  timestamp: number               // unix ms
  transaction: string             // Circle settlement UUID
  network: string                 // CAIP-2
  cached: boolean                 // true if served from idempotency cache
}

// Merchant Gateway balance (from /api/balances)
export interface GatewayBalance {
  usdc: string                    // atomic units
  usdcHuman: number               // human-readable
  network: string
}

// Withdrawal result (from /api/withdraw)
export interface WithdrawResult {
  txHash: string
  explorerUrl: string
  amount: string
  network: string
}

// One entry in the withdrawal log
export interface WithdrawalEvent {
  id: string          // UUID
  amountUsdc: number  // human-readable
  chain: string       // e.g. "arcTestnet", "baseSepolia"
  txHash: string      // mint tx hash on destination chain
  timestamp: number   // unix ms
}
