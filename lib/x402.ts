// Edge Runtime compatible — builds x402 v2 compliant 402 responses.
//
// Interface contract with Person A:
//   - PaymentRequired JSON is placed in BOTH the response body (for GatewayClient.pay()
//     compatibility) AND the PAYMENT-REQUIRED header (Base64, for x402 spec compliance).
//   - x402Version: 2 everywhere.
//   - Header names are uppercase: PAYMENT-REQUIRED, PAYMENT-SIGNATURE, PAYMENT-RESPONSE.

import { NextRequest, NextResponse } from 'next/server'
import { NanocrawlConfig, priceForPath, usdcToUnits } from '../nanocrawl.config'
import {
  X402_VERSION,
  X402_SCHEME,
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_VERSION,
} from '../shared/config'
import type { PaymentRequired, PaymentRequirements, SettlementResponse } from '../shared/types'

// Build the PaymentRequirements entry for the accepts[] array
export function buildPaymentRequirements(
  path: string,
  config: NanocrawlConfig,
): PaymentRequirements {
  return {
    scheme: X402_SCHEME,
    network: config.network,
    asset: config.asset,
    amount: usdcToUnits(priceForPath(path)),
    payTo: config.sellerWallet,
    maxTimeoutSeconds: config.maxTimeoutSeconds,
    extra: {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      verifyingContract: config.verifyingContract,
    },
  }
}

// Build the full PaymentRequired object (goes in response body + PAYMENT-REQUIRED header)
export function buildPaymentRequired(
  request: NextRequest,
  config: NanocrawlConfig,
): PaymentRequired {
  const path = new URL(request.url).pathname
  return {
    x402Version: X402_VERSION,
    resource: {
      url: request.url,
      mimeType: 'application/json',
      description: 'NanoCrawl paid content',
    },
    accepts: [buildPaymentRequirements(path, config)],
  }
}

// Construct the full 402 NextResponse
// Body: PaymentRequired as JSON (for GatewayClient.pay() compatibility)
// Header PAYMENT-REQUIRED: same object Base64-encoded (for x402 spec compliance)
export function build402Response(
  request: NextRequest,
  config: NanocrawlConfig,
): NextResponse {
  const paymentRequired = buildPaymentRequired(request, config)
  const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString('base64')

  return new NextResponse(JSON.stringify(paymentRequired), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'PAYMENT-REQUIRED': encoded,
    },
  })
}

// Encode a SettlementResponse for the PAYMENT-RESPONSE header on 200 responses
export function encodePaymentResponse(settlement: SettlementResponse): string {
  return Buffer.from(JSON.stringify(settlement)).toString('base64')
}

// Decode a PAYMENT-SIGNATURE header value into a PaymentPayload object
// Returns null if decoding fails (malformed base64 or JSON)
export function decodePaymentSignature(header: string): unknown | null {
  try {
    const json = Buffer.from(header, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}
