// Edge Runtime compatible — no Node.js APIs, no imports with side effects.
// Multi-signal bot detection per Section 8.4 of the design doc.

import { NextRequest } from 'next/server'

export type TrafficType = 'human' | 'crawler'

// User-agent patterns that identify known AI/bot crawlers
const KNOWN_BOT_PATTERN =
  /bot|crawler|spider|claude|gpt|anthropic|openai|perplexity|cohere|bytespider|ccbot|curl|python-requests|python-httpx|wget|fetch|scrapy|mechanize|libwww|go-http-client/i

export function classifyRequest(request: NextRequest): TrafficType {
  // 1. Explicit paid-agent signals (cooperative crawlers identify themselves)
  if (request.headers.get('payment-signature')) return 'crawler'
  if (request.headers.get('x-nanocrawl-capable')) return 'crawler'

  const ua = request.headers.get('user-agent') ?? ''

  // 2. Known bot user-agent string
  if (KNOWN_BOT_PATTERN.test(ua)) return 'crawler'

  // 3. Missing browser-standard headers — real browsers always send these
  const hasAcceptLanguage = request.headers.get('accept-language')
  const hasSecFetchDest = request.headers.get('sec-fetch-dest')
  if (!hasAcceptLanguage && !hasSecFetchDest) return 'crawler'

  // 4. Suspiciously short user-agent — real browsers have 80+ char UAs
  if (ua.length > 0 && ua.length < 20) return 'crawler'

  // 5. Empty user-agent
  if (ua.length === 0) return 'crawler'

  return 'human'
}
