// /.well-known/ai-pay — machine-readable payment manifest for AI agents.
// Analogous to /.well-known/openid-configuration but for x402 nanopayments.
// Enables agents to discover payment parameters without first hitting a 402.

import { NextResponse } from 'next/server'
import nanocrawlConfig, { priceForPath } from '../../../nanocrawl.config'
import { SUPPORTED_NETWORKS, X402_VERSION, X402_SCHEME, EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION } from '../../../shared/config'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const defaultPrice = priceForPath('/products')
  const defaultPriceUnits = Math.round(defaultPrice * 10 ** 6).toString()

  const manifest = {
    protocol: 'x402',
    version: X402_VERSION,
    name: 'NanoCrawl',
    description: 'HTTP-native micropayments for AI data access. Publishers set a price; AI agents pay per page.',
    url: appUrl,

    // All supported networks — agent picks one. Arc Testnet is recommended (USDC = gas).
    // Base Sepolia included for Unlink privacy layer support.
    accepts: SUPPORTED_NETWORKS.map(network => ({
      scheme: X402_SCHEME,
      network: network.caip2,
      asset: network.usdc,
      defaultAmount: defaultPriceUnits,
      payTo: nanocrawlConfig.sellerWallet,
      maxTimeoutSeconds: nanocrawlConfig.maxTimeoutSeconds,
      extra: {
        name: EIP712_DOMAIN_NAME,
        version: EIP712_DOMAIN_VERSION,
        verifyingContract: network.gatewayWallet,
      },
    })),

    routes: [
      {
        pathPattern: '/products/*',
        amountUsdc: defaultPrice,
        amountUnits: defaultPriceUnits,
        description: 'Product data pages',
      },
    ],

    links: {
      robotsTxt: `${appUrl}/robots.txt`,
      dashboard: `${appUrl}/nanocrawl/dashboard`,
      docsAgent: `${appUrl}/docs/buyer`,
      docsMerchant: `${appUrl}/docs/merchant`,
    },

    networks: SUPPORTED_NETWORKS.map(n => ({
      name: n.name,
      chainId: n.chainId,
      caip2: n.caip2,
      usdcAddress: n.usdc,
      gatewayWallet: n.gatewayWallet,
      explorer: n.explorer,
    })),
  }

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
