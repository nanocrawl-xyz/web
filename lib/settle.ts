// Node.js runtime only — do NOT import this in middleware.ts (Edge Runtime).
//
// Calls Circle Gateway settle() via raw fetch().
// Endpoint: POST https://gateway-api-testnet.circle.com/gateway/v1/x402/settle
// Docs: https://developers.circle.com/gateway/nanopayments

import { CIRCLE_GATEWAY } from '../shared/config'
import type { PaymentPayload, PaymentRequirements, SettlementResponse } from '../shared/types'

export interface SettleResult {
  settled: boolean
  response: SettlementResponse
}

// Call Circle Gateway settle() endpoint.
// paymentPayload: decoded PaymentPayload from the PAYMENT-SIGNATURE header
// requirements: the PaymentRequirements we advertised in our 402 response
export async function settlePayment(
  paymentPayload: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<SettleResult> {
  const body = {
    paymentPayload: {
      x402Version: paymentPayload.x402Version,
      resource: paymentPayload.resource,
      accepted: paymentPayload.accepted,
      payload: paymentPayload.payload,
      extensions: paymentPayload.extensions,
    },
    paymentRequirements: requirements,
  }

  const res = await fetch(CIRCLE_GATEWAY.settleEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    // 400/500 from Gateway — not a payment failure, an infrastructure error
    const text = await res.text()
    throw new Error(`Gateway settle() HTTP ${res.status}: ${text}`)
  }

  const data = (await res.json()) as SettlementResponse
  return { settled: data.success, response: data }
}

// Check the merchant's Gateway balance.
// Returns balance in USDC atomic units (string).
export async function fetchGatewayBalance(
  sellerAddress: string,
  domainId: number,
): Promise<string> {
  const body = {
    token: 'USDC',
    sources: [{ domain: domainId, depositor: sellerAddress }],
  }

  const res = await fetch(CIRCLE_GATEWAY.balancesEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Gateway balances() HTTP ${res.status}`)
  }

  const data = await res.json()
  // data.balances[0].balance is in atomic units
  return (data?.balances?.[0]?.balance as string) ?? '0'
}
