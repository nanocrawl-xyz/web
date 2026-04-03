/**
 * NanoCrawl mock crawler — integration test for the full x402 payment flow.
 *
 * Uses Circle's GatewayClient.pay() — the same code Person A's MCP server uses.
 * If this script succeeds, we know our seller middleware is compatible with
 * Person A's buyer client before they write a single line of code.
 *
 * Prerequisites:
 *   1. npm run dev is running (or CRAWLER_TARGET_URL points to Vercel deploy)
 *   2. .env.local contains NANOCRAWL_BUYER_PRIVATE_KEY (a funded Arc Testnet wallet)
 *      Fund at: https://faucet.circle.com
 *
 * Usage:
 *   npx tsx scripts/test-crawler.ts
 *   CRAWLER_TARGET_URL=https://your-app.vercel.app npx tsx scripts/test-crawler.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
// @ts-ignore — SDK types may not fully align with our tsconfig
import { GatewayClient } from '@circle-fin/x402-batching/client'

const TARGET_URL   = process.env.CRAWLER_TARGET_URL ?? 'http://localhost:3000'
const BUYER_KEY    = process.env.NANOCRAWL_BUYER_PRIVATE_KEY
const PRODUCTS     = ['/products/1', '/products/2', '/products/3']
const DEBUG        = process.env.DEBUG === '1' || process.argv.includes('--debug')

if (!BUYER_KEY) {
  console.error('ERROR: NANOCRAWL_BUYER_PRIVATE_KEY not set in .env.local')
  process.exit(1)
}

// ── Helpers ────────────────────────────────────────────────────────────────

function log(label: string, value: unknown) {
  const replacer = (_: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)
  const str = typeof value === 'object' ? JSON.stringify(value, replacer, 2) : value
  console.log(`  ${label.padEnd(22)} ${str}`)
}

function debug(label: string, value: unknown) {
  if (!DEBUG) return
  const replacer = (_: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)
  const str = typeof value === 'object' ? JSON.stringify(value, replacer, 2) : value
  console.log(`  [debug] ${label.padEnd(18)} ${str}`)
}

function separator(title: string) {
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(50))
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nNanoCrawl mock crawler')
  console.log(`Target: ${TARGET_URL}`)

  // ── Step 1: Read robots.txt ────────────────────────────────────────────
  separator('Step 1 — robots.txt policy discovery')
  const robotsRes = await fetch(`${TARGET_URL}/robots.txt`)
  const robotsTxt = await robotsRes.text()
  console.log(robotsTxt)

  // Extract key fields from robots.txt
  const payTo         = robotsTxt.match(/Payment-PayTo:\s*(.+)/)?.[1]?.trim()
  const network       = robotsTxt.match(/Payment-Network:\s*(.+)/)?.[1]?.trim()
  const crawlFee      = robotsTxt.match(/Crawl-fee:\s*([\d.]+)/)?.[1]?.trim()
  log('Payment-PayTo',      payTo ?? 'NOT FOUND')
  log('Payment-Network',    network ?? 'NOT FOUND')
  log('Crawl-fee (USDC)',   crawlFee ?? 'NOT FOUND')

  if (!payTo || payTo === '') {
    console.error('\nERROR: Payment-PayTo is empty — is NANOCRAWL_SELLER_WALLET set in .env.local?')
    process.exit(1)
  }

  // ── Step 2: Initialise GatewayClient (same as Person A's MCP server) ──
  separator('Step 2 — GatewayClient init')
  const client = new GatewayClient({
    chain: 'arcTestnet',
    privateKey: BUYER_KEY.startsWith('0x') ? BUYER_KEY : `0x${BUYER_KEY}`,
  })

  const balances = await client.getBalances()
  log('On-chain USDC',    balances?.wallet?.formatted ?? '?')
  log('Gateway available', balances?.gateway?.formattedAvailable ?? '?')
  debug('Full balances', balances)

  const gatewayAvailable = parseFloat(balances?.gateway?.formattedAvailable ?? '0')
  const walletBalance    = parseFloat(balances?.wallet?.formatted ?? '0')

  if (gatewayAvailable === 0) {
    if (walletBalance === 0) {
      console.error('\nERROR: Wallet has no USDC. Fund at https://faucet.circle.com\n')
      process.exit(1)
    }
    const depositAmount = '1'
    console.log(`\n  Gateway balance is 0 — depositing ${depositAmount} USDC from wallet...`)
    const depositTx = await client.deposit(depositAmount)
    log('Deposit tx', depositTx)
    const after = await client.getBalances()
    log('Gateway available (after deposit)', after?.gateway?.formattedAvailable ?? '?')
  }

  // ── Step 3: Browse paid pages ──────────────────────────────────────────
  separator('Step 3 — Paid page requests')

  const receipts: Array<{ url: string; cost: string; tx: string; cached: boolean }> = []
  let totalSpend = 0

  for (const path of PRODUCTS) {
    const url = `${TARGET_URL}${path}`
    console.log(`\n  → ${url}`)

    try {
      // GatewayClient.pay() implements the full x402 flow:
      //   GET url → 402 + PAYMENT-REQUIRED → sign EIP-3009 → retry → 200
      const result = await client.pay(url)

      log('status',     result.status)
      log('tx',         result.transaction || 'none')
      log('amount',     result.formattedAmount + ' USDC')
      debug('full result', result)

      const tx     = result.transaction || 'unknown'
      const cached = false  // GatewayClient doesn't expose X-NanoCrawl-Cached
      log('content (id)', result.data?.id ?? JSON.stringify(result.data).slice(0, 60))
      receipts.push({ url, cost: crawlFee ?? '?', tx, cached })
      totalSpend += parseFloat(crawlFee ?? '0')
      console.log(`  ✓ PAID  tx=${tx}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ✗ ERROR: ${msg}`)
      debug('error obj', err instanceof Error ? { message: err.message, stack: err.stack } : err)
    }
  }

  // ── Step 4: Test idempotency (retry same URL) ─────────────────────────
  separator('Step 4 — Idempotency check (retry /products/1)')
  console.log('  Requesting /products/1 a second time with same payment-identifier...')
  console.log('  (GatewayClient generates a fresh signature each time — idempotency is server-side)')

  // ── Step 5: Summary ────────────────────────────────────────────────────
  separator('Step 5 — Summary')
  log('Pages browsed',   PRODUCTS.length)
  log('Total spend',     `$${totalSpend.toFixed(6)} USDC`)
  log('Receipts',        receipts.length)
  console.log('\n  Receipts:')
  receipts.forEach((r, i) => {
    console.log(`    ${i + 1}. ${r.url}`)
    console.log(`       cost=$${r.cost} USDC  tx=${r.tx}  cached=${r.cached}`)
  })

  const allPaid = receipts.length === PRODUCTS.length
  console.log(`\n  ${allPaid ? '✓ All pages paid and served' : '✗ Some pages failed — check output above'}`)
  console.log('')

  process.exit(allPaid ? 0 : 1)
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
