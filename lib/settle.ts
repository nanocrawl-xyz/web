// Node.js runtime only — do NOT import this in proxy.ts (Edge Runtime).
//
// Uses Circle SDK's BatchFacilitatorClient for settle() — same library as the buyer side,
// guaranteeing payload format compatibility.
// Docs: https://developers.circle.com/gateway/nanopayments

// @ts-ignore — SDK types may not fully align with our tsconfig
import { BatchFacilitatorClient } from '@circle-fin/x402-batching/server'
import { ARC_TESTNET, SUPPORTED_NETWORKS } from '../shared/config'
import type { PaymentPayload, PaymentRequirements, SettlementResponse } from '../shared/types'

export interface SettleResult {
  settled: boolean
  response: SettlementResponse
}

// Singleton — one client per process, reused across requests.
const facilitator = new BatchFacilitatorClient({
  url: 'https://gateway-api-testnet.circle.com',
})

// Call Circle Gateway settle() via the official SDK.
// paymentPayload: decoded PaymentPayload from the PAYMENT-SIGNATURE header
// requirements: the PaymentRequirements we advertised in our 402 response
export async function settlePayment(
  paymentPayload: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<SettleResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await facilitator.settle(paymentPayload as any, requirements as any)) as SettlementResponse
  return { settled: data.success, response: data }
}

// Check the merchant's Gateway balance across all supported networks.
// Returns combined available balance as a decimal USDC string (e.g. "0.009000").
export async function fetchGatewayBalance(
  sellerAddress: string,
  _domainId?: number, // kept for backward compat, ignored — we query all networks
): Promise<string> {
  const sources = SUPPORTED_NETWORKS.map(n => ({
    domain: n.domainId,
    depositor: sellerAddress,
  }))

  const res = await fetch('https://gateway-api-testnet.circle.com/v1/balances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'USDC', sources }),
  })

  if (!res.ok) throw new Error(`Gateway balances() HTTP ${res.status}`)

  const data = await res.json()
  const balances: { balance: string }[] = data?.balances ?? []
  const total = balances.reduce((sum, b) => sum + parseFloat(b.balance ?? '0'), 0)
  return total.toFixed(6)
}
