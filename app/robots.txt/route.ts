// Returns extended robots.txt with full Circle Nanopayments metadata.
//
// Two formats served (Section 7.2 of design doc):
//   - Minimal: informs crawlers that crawling is paid
//   - Full: includes complete payment requirements for the proactive single-request flow
//
// The full format enables Person A's MCP server to skip the 402 round-trip
// by constructing EIP-3009 authorizations directly from this metadata.

import { NextResponse } from 'next/server'
import nanocrawlConfig, { priceForPath } from '../../nanocrawl.config'
import { ARC_TESTNET, X402_SCHEME, EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION } from '../../shared/config'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const defaultPrice = priceForPath('/products')

  const content = `# robots.txt — NanoCrawl extended format
# Standard directives
User-agent: *
Allow: /
Disallow: /nanocrawl/

# NanoCrawl: AI crawlers pay per page
# Standard flow: request page → receive 402 → pay → retry
# Proactive flow: read full metadata below → pre-sign → attach PAYMENT-SIGNATURE on first request

User-agent: AI-Crawler
Allow: /products
Crawl-fee: ${defaultPrice} USDC

# Minimal fields (standard flow)
Payment-Endpoint: ${appUrl}/products

# Full fields (enables proactive single-request flow — no 402 round-trip)
Payment-Network: ${ARC_TESTNET.caip2}
Payment-Asset: ${ARC_TESTNET.usdc}
Payment-PayTo: ${nanocrawlConfig.sellerWallet}
Payment-Scheme: ${EIP712_DOMAIN_NAME}
Payment-VerifyingContract: ${ARC_TESTNET.gatewayWallet}
Payment-MaxTimeoutSeconds: ${nanocrawlConfig.maxTimeoutSeconds}

# Tiered pricing
Crawl-fee-path: /products/* ${defaultPrice} USDC

# Free routes (no payment required)
Crawl-fee-path: / 0 USDC
`.trim()

  return new NextResponse(content, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
