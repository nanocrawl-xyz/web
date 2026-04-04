// /.well-known/ai-pay — machine-readable payment manifest for AI agents.
// Analogous to /.well-known/openid-configuration but for x402 nanopayments.
// Enables agents to discover payment parameters without first hitting a 402.

import { NextResponse } from 'next/server'
import nanocrawlConfig, { priceForPath } from '../../../nanocrawl.config'
import { ARC_TESTNET, X402_VERSION, X402_SCHEME, EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION } from '../../../shared/config'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const defaultPrice = priceForPath('/products')
  const defaultPriceUnits = Math.round(defaultPrice * 10 ** 6).toString()

  const manifest = {
    // Protocol identification
    protocol: 'x402',
    version: X402_VERSION,

    // Human-readable info
    name: 'NanoCrawl',
    description: 'HTTP-native micropayments for AI data access. Publishers set a price; AI agents pay per page.',
    url: appUrl,

    // Payment parameters (mirrors what the 402 PAYMENT-REQUIRED header contains)
    // Agents can use these to pre-sign EIP-3009 and skip the 402 round-trip entirely.
    accepts: [
      {
        scheme: X402_SCHEME,
        network: ARC_TESTNET.caip2,
        asset: ARC_TESTNET.usdc,
        defaultAmount: defaultPriceUnits,
        payTo: nanocrawlConfig.sellerWallet,
        maxTimeoutSeconds: nanocrawlConfig.maxTimeoutSeconds,
        extra: {
          name: EIP712_DOMAIN_NAME,
          version: EIP712_DOMAIN_VERSION,
          verifyingContract: ARC_TESTNET.gatewayWallet,
        },
      },
    ],

    // Paid routes with per-route pricing
    routes: [
      {
        pathPattern: '/products/*',
        amountUsdc: defaultPrice,
        amountUnits: defaultPriceUnits,
        description: 'Product data pages',
      },
    ],

    // Discovery links
    links: {
      robotsTxt: `${appUrl}/robots.txt`,
      dashboard: `${appUrl}/nanocrawl/dashboard`,
      docsAgent: `${appUrl}/docs/buyer`,
      docsMerchant: `${appUrl}/docs/merchant`,
    },

    // Network details for agent setup
    network: {
      name: 'Arc Testnet',
      chainId: ARC_TESTNET.chainId,
      caip2: ARC_TESTNET.caip2,
      usdcAddress: ARC_TESTNET.usdc,
      gatewayWallet: ARC_TESTNET.gatewayWallet,
      explorer: ARC_TESTNET.explorer,
      faucet: ARC_TESTNET.faucet,
    },
  }

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
