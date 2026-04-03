// Next.js 16: renamed from middleware.ts → proxy.ts, export function middleware → proxy.
// Edge Runtime — runs on Vercel Edge before every matched request.
// Only import Edge-compatible modules (no Node.js APIs, no better-sqlite3).
//
// Flow:
//   human traffic         → NextResponse.next() (zero overhead)
//   crawler + payment     → rewrite to /api/verify-and-serve (passes all headers through)
//   crawler + no payment  → 402 with PAYMENT-REQUIRED header + JSON body

import { NextRequest, NextResponse } from 'next/server'
import { classifyRequest } from './lib/classify'
import { build402Response } from './lib/x402'
import nanocrawlConfig from './nanocrawl.config'

export function proxy(request: NextRequest): NextResponse {
  // Always pass through free routes (dashboard, landing)
  const path = request.nextUrl.pathname
  if (nanocrawlConfig.freeRoutes.some((r) => path === r || path.startsWith(r + '/'))) {
    return NextResponse.next()
  }

  const trafficType = classifyRequest(request)

  if (trafficType === 'human') {
    return NextResponse.next()
  }

  // Crawler detected — check for payment
  const paymentSig = request.headers.get('payment-signature')

  if (paymentSig) {
    // Payment header present — route to verify-and-serve
    // Pass the original resource path as a query param so the API route knows
    // which content to serve after successful payment verification.
    const verifyUrl = new URL('/api/verify-and-serve', request.url)
    verifyUrl.searchParams.set('resource', path)
    // NextResponse.rewrite preserves all incoming headers (incl. payment-signature)
    return NextResponse.rewrite(verifyUrl)
  }

  // No payment — return 402
  return build402Response(request, nanocrawlConfig)
}

// Only run on content routes (not Next.js internals, not API routes themselves)
export const config = {
  matcher: [
    '/products/:path*',
    // Add more content routes here as the merchant site grows
  ],
}
