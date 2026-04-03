/**
 * NanoCrawl — Cloudflare Worker merchant template
 *
 * Drop-in x402 payment middleware for any Cloudflare Worker site.
 * Works in front of any origin: static sites, APIs, R2 buckets, etc.
 *
 * Deploy:
 *   1. `npm create cloudflare@latest -- --template <this file>`
 *   2. Set secrets:  wrangler secret put SELLER_WALLET
 *                    wrangler secret put SELLER_PRICE_USDC   (default: 0.001)
 *   3. Set ORIGIN_URL in wrangler.toml or as a variable
 *
 * Environment (wrangler.toml):
 *   [vars]
 *   ORIGIN_URL = "https://your-real-site.com"
 *   SELLER_WALLET = "0xYourWallet"
 *   PRICE_USDC = "0.001"
 */

// ── Constants (Arc Testnet) ────────────────────────────────────────────────

const ARC_CHAIN_ID         = 5042002
const ARC_CAIP2            = 'eip155:5042002'
const ARC_USDC             = '0x3600000000000000000000000000000000000000'
const GATEWAY_WALLET       = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9'
const CIRCLE_SETTLE_URL    = 'https://gateway-api-testnet.circle.com/v1/x402/settle'
const MAX_TIMEOUT_SECONDS  = 345600
const USDC_DECIMALS        = 6

// ── Bot detection ─────────────────────────────────────────────────────────

const BOT_UA_PATTERNS = [
  /GPTBot/i, /ClaudeBot/i, /Googlebot/i, /bingbot/i, /anthropic/i,
  /openai/i, /cohere/i, /perplexity/i, /crawl/i, /spider/i,
]

function isCrawler(request: Request): boolean {
  if (request.headers.get('payment-signature')) return true
  if (request.headers.get('x-nanocrawl-capable')) return true

  const ua = request.headers.get('user-agent') ?? ''
  if (!ua || ua.length < 10) return true
  if (BOT_UA_PATTERNS.some((p) => p.test(ua))) return true

  // Missing browser signals
  const hasAcceptLang = !!request.headers.get('accept-language')
  const hasFetchDest  = !!request.headers.get('sec-fetch-dest')
  if (!hasAcceptLang && !hasFetchDest) return true

  return false
}

// ── x402 helpers ──────────────────────────────────────────────────────────

function usdcToUnits(usdc: number): string {
  return Math.round(usdc * 10 ** USDC_DECIMALS).toString()
}

function build402(url: string, sellerWallet: string, priceUsdc: number): Response {
  const paymentRequired = {
    x402Version: 2,
    resource: {
      url,
      mimeType: 'application/json',
      description: 'NanoCrawl paid content',
    },
    accepts: [{
      scheme: 'exact',
      network: ARC_CAIP2,
      asset: ARC_USDC,
      amount: usdcToUnits(priceUsdc),
      payTo: sellerWallet,
      maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
      extra: {
        name: 'GatewayWalletBatched',
        version: '1',
        verifyingContract: GATEWAY_WALLET,
      },
    }],
  }

  const encoded = btoa(JSON.stringify(paymentRequired))
  return new Response(JSON.stringify(paymentRequired), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'PAYMENT-REQUIRED': encoded,
    },
  })
}

function decodeSignature(header: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(header))
  } catch {
    return null
  }
}

function encodePaymentResponse(settlement: Record<string, unknown>): string {
  return btoa(JSON.stringify(settlement))
}

// ── Circle Gateway settle ─────────────────────────────────────────────────

async function settle(
  paymentPayload: Record<string, unknown>,
  paymentRequirements: Record<string, unknown>,
): Promise<{ success: boolean; transaction?: string; network?: string; payer?: string; errorReason?: string }> {
  const res = await fetch(CIRCLE_SETTLE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  })
  const text = await res.text()
  if (!text) throw new Error('Circle Gateway returned empty response')
  return JSON.parse(text)
}

// ── Env ───────────────────────────────────────────────────────────────────

interface Env {
  ORIGIN_URL: string
  SELLER_WALLET: string
  PRICE_USDC?: string
}

// ── Worker entry point ────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url      = new URL(request.url)
    const priceUsdc = parseFloat(env.PRICE_USDC ?? '0.001')

    // Pass-through: non-GET or non-content routes
    if (request.method !== 'GET') {
      return fetch(new Request(env.ORIGIN_URL + url.pathname + url.search, request))
    }

    // Human traffic — proxy directly
    if (!isCrawler(request)) {
      return fetch(new Request(env.ORIGIN_URL + url.pathname + url.search, request))
    }

    // Crawler without payment → 402
    const sigHeader = request.headers.get('payment-signature')
    if (!sigHeader) {
      return build402(request.url, env.SELLER_WALLET, priceUsdc)
    }

    // Crawler with payment → verify + proxy
    const payload = decodeSignature(sigHeader)
    if (!payload || (payload.x402Version as number) !== 2) {
      return new Response(JSON.stringify({ error: 'Invalid payment-signature' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const requirements = {
      scheme: 'exact',
      network: ARC_CAIP2,
      asset: ARC_USDC,
      amount: usdcToUnits(priceUsdc),
      payTo: env.SELLER_WALLET,
      maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
      extra: { name: 'GatewayWalletBatched', version: '1', verifyingContract: GATEWAY_WALLET },
    }

    let settlement
    try {
      settlement = await settle(payload, requirements)
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!settlement.success) {
      return new Response(
        JSON.stringify({ error: `Payment rejected: ${settlement.errorReason ?? 'unknown'}` }),
        { status: 402, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Payment verified — proxy to origin
    const originResponse = await fetch(
      new Request(env.ORIGIN_URL + url.pathname + url.search, request),
    )

    // Attach PAYMENT-RESPONSE header
    const response = new Response(originResponse.body, originResponse)
    response.headers.set('PAYMENT-RESPONSE', encodePaymentResponse(settlement))
    response.headers.set('X-NanoCrawl-Cached', 'false')
    return response
  },
}
