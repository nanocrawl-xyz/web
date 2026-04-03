// Node.js runtime — handles payment verification for crawler requests.
//
// Called by middleware.ts via NextResponse.rewrite() when a crawler sends
// a PAYMENT-SIGNATURE header. All original headers are preserved by the rewrite.
//
// Steps:
//   1. Decode PAYMENT-SIGNATURE header → PaymentPayload
//   2. Check idempotency cache (payment-identifier extension)
//   3. Call Circle Gateway settle()
//   4. Write to payments store
//   5. Return the requested content with PAYMENT-RESPONSE header

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { decodePaymentSignature, buildPaymentRequirements, encodePaymentResponse } from '../../../lib/x402'
import { settlePayment } from '../../../lib/settle'
import { recordPayment, findPaymentById } from '../../../lib/payments-store'
import nanocrawlConfig, { priceForPath, unitsToUsdc } from '../../../nanocrawl.config'
import { v4 as uuidv4 } from 'uuid'
import products from '../../../data/products.json'
import type { PaymentPayload } from '../../../shared/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource') ?? '/'

  // 1. Decode PAYMENT-SIGNATURE
  const sigHeader = request.headers.get('payment-signature')
  if (!sigHeader) {
    return NextResponse.json({ error: 'Missing payment-signature header' }, { status: 402 })
  }

  const paymentPayload = decodePaymentSignature(sigHeader) as PaymentPayload | null
  if (!paymentPayload || paymentPayload.x402Version !== 2) {
    return NextResponse.json({ error: 'Invalid or malformed payment-signature' }, { status: 402 })
  }

  // 2. Idempotency — check payment-identifier extension
  const paymentId = (paymentPayload.extensions?.['payment-identifier'] as { id?: string } | undefined)?.id ?? uuidv4()
  const existing = findPaymentById(paymentId)
  if (existing) {
    // Idempotency cache hit — serve content without re-settling
    const content = resolveContent(resource)
    const settlementResponse = {
      success: true,
      errorReason: undefined,
      transaction: existing.transaction,
      network: existing.network,
      payer: existing.payer,
    }
    return NextResponse.json(content, {
      status: 200,
      headers: {
        'PAYMENT-RESPONSE': encodePaymentResponse(settlementResponse),
        'X-NanoCrawl-Cached': 'true',
      },
    })
  }

  // 3. Build requirements (what we advertised for this route)
  const requirements = buildPaymentRequirements(resource, nanocrawlConfig)

  // 4. Call Circle Gateway settle()
  let settleResult
  try {
    settleResult = await settlePayment(paymentPayload, requirements)
  } catch (err) {
    console.error('Gateway settle() error:', err)
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
  }

  if (!settleResult.settled) {
    return NextResponse.json(
      { error: 'Payment rejected', reason: settleResult.response.errorReason },
      { status: 402 },
    )
  }

  // 5. Record payment
  const amountUnits = paymentPayload.accepted.amount
  recordPayment({
    id: paymentId,
    payer: settleResult.response.payer ?? paymentPayload.payload.authorization.from,
    page: resource,
    amountUnits,
    amountUsdc: unitsToUsdc(amountUnits),
    timestamp: Date.now(),
    transaction: settleResult.response.transaction,
    network: settleResult.response.network,
    cached: false,
  })

  // 6. Serve content with PAYMENT-RESPONSE header
  const content = resolveContent(resource)
  return NextResponse.json(content, {
    status: 200,
    headers: {
      'PAYMENT-RESPONSE': encodePaymentResponse(settleResult.response),
      'X-NanoCrawl-Cached': 'false',
    },
  })
}

// Resolve the content to serve for a given resource path.
// For product pages, return the product JSON. Extend this as routes grow.
function resolveContent(resource: string): unknown {
  const productMatch = resource.match(/^\/products\/(.+)$/)
  if (productMatch) {
    const id = productMatch[1]
    const product = (products as Array<{ id: string }>).find((p) => p.id === id)
    if (product) return product
    return { error: 'Product not found', id }
  }

  if (resource === '/products') {
    return products
  }

  return { error: 'Resource not found', resource }
}
