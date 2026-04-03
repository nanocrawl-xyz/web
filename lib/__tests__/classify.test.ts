// Tests for lib/classify.ts — multi-signal bot detection.
//
// This is the most critical correctness test in the project.
// A false positive (human classified as crawler) means a judge's browser
// gets a 402. That is a demo-ending failure with no recovery.

import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { classifyRequest } from '../classify'

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/products/1', { headers })
}

// ── Crawler signals ───────────────────────────────────────────────────────

describe('explicit crawler signals', () => {
  it('classifies as crawler when payment-signature header present', () => {
    const req = makeRequest({ 'payment-signature': 'somebase64value' })
    expect(classifyRequest(req)).toBe('crawler')
  })

  it('classifies as crawler when x-nanocrawl-capable header present', () => {
    const req = makeRequest({ 'x-nanocrawl-capable': 'true' })
    expect(classifyRequest(req)).toBe('crawler')
  })
})

describe('known bot user-agents', () => {
  const botUAs = [
    'GPTBot/1.0',
    'ClaudeBot/1.0',
    'anthropic-ai/1.0',
    'openai-scraper',
    'PerplexityBot/1.0',
    'CCBot/2.0',
    'python-requests/2.31.0',
    'python-httpx/0.27.0',
    'curl/8.1.0',
    'Go-http-client/2.0',
    'Scrapy/2.11.0',
    'Mozilla/5.0 (compatible; Googlebot/2.1)',
  ]

  botUAs.forEach((ua) => {
    it(`classifies as crawler: "${ua}"`, () => {
      const req = makeRequest({
        'user-agent': ua,
        'accept-language': 'en-US', // even with browser headers, UA wins
        'sec-fetch-dest': 'document',
      })
      expect(classifyRequest(req)).toBe('crawler')
    })
  })
})

describe('missing browser-standard headers', () => {
  it('classifies as crawler when both accept-language and sec-fetch-dest are absent', () => {
    const req = makeRequest({
      'user-agent': 'SomeUnknownAgent/1.0 (totally not a bot)',
    })
    expect(classifyRequest(req)).toBe('crawler')
  })

  it('classifies as human when accept-language present even without sec-fetch-dest', () => {
    const req = makeRequest({
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'accept-language': 'en-US,en;q=0.9',
    })
    expect(classifyRequest(req)).toBe('human')
  })

  it('classifies as human when sec-fetch-dest present even without accept-language', () => {
    const req = makeRequest({
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'sec-fetch-dest': 'document',
    })
    expect(classifyRequest(req)).toBe('human')
  })
})

describe('short user-agent heuristic', () => {
  it('classifies as crawler when UA is suspiciously short (< 20 chars)', () => {
    const req = makeRequest({
      'user-agent': 'mybot',
      'accept-language': 'en-US',
      'sec-fetch-dest': 'document',
    })
    expect(classifyRequest(req)).toBe('crawler')
  })

  it('classifies as human when UA is 20+ chars', () => {
    const req = makeRequest({
      'user-agent': 'a'.repeat(20),
      'accept-language': 'en-US',
      'sec-fetch-dest': 'document',
    })
    expect(classifyRequest(req)).toBe('human')
  })
})

describe('empty user-agent', () => {
  it('classifies as crawler when user-agent is empty', () => {
    const req = makeRequest({
      'user-agent': '',
      'accept-language': 'en-US',
    })
    expect(classifyRequest(req)).toBe('crawler')
  })

  it('classifies as crawler when user-agent header is absent', () => {
    const req = makeRequest({ 'accept-language': 'en-US' })
    expect(classifyRequest(req)).toBe('crawler')
  })
})

// ── Human signals ─────────────────────────────────────────────────────────

describe('real browser fingerprints', () => {
  it('classifies Chrome on Windows as human', () => {
    const req = makeRequest({
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      'sec-fetch-dest': 'document',
    })
    expect(classifyRequest(req)).toBe('human')
  })

  it('classifies Safari on macOS as human', () => {
    const req = makeRequest({
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'accept-language': 'en-GB,en;q=0.9',
      'sec-fetch-dest': 'document',
    })
    expect(classifyRequest(req)).toBe('human')
  })

  it('classifies Firefox on Linux as human', () => {
    const req = makeRequest({
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'accept-language': 'en-US,en;q=0.5',
      'sec-fetch-dest': 'document',
    })
    expect(classifyRequest(req)).toBe('human')
  })
})
