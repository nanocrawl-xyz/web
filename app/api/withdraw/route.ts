// Node.js runtime — merchant withdrawal via Circle Gateway CCTP.
//
// POST /api/withdraw
// Body: { amount: string, destinationChain?: string, recipientAddress?: string }
//
// Uses GatewayClient.withdraw() which handles the full CCTP flow:
//   1. Signs a BurnIntent with the merchant's key
//   2. POSTs to Circle Gateway /transfer
//   3. Circle burns on Arc, mints on destination chain
//
// Default destination: baseSepolia (easiest testnet to verify)

export const runtime = 'nodejs'
export const maxDuration = 60 // CCTP attestation can take up to ~30s on slower chains

import { NextRequest, NextResponse } from 'next/server'
import { recordWithdrawal } from '../../../lib/payments-store'

const SUPPORTED_CHAINS = ['arcTestnet', 'baseSepolia', 'arbitrumSepolia', 'optimismSepolia', 'avalancheFuji', 'unichainSepolia', 'sepolia'] as const
type SupportedChain = typeof SUPPORTED_CHAINS[number]

export async function POST(request: NextRequest) {
  const sellerKey = process.env.NANOCRAWL_SELLER_PRIVATE_KEY
  if (!sellerKey) {
    return NextResponse.json({ error: 'NANOCRAWL_SELLER_PRIVATE_KEY not configured' }, { status: 500 })
  }

  let body: { amount?: string; destinationChain?: string; recipientAddress?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { amount, destinationChain = 'arcTestnet', recipientAddress } = body
  const typedChain = destinationChain as SupportedChain

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return NextResponse.json(
      { error: 'amount must be a positive number string (e.g. "0.5")' },
      { status: 400 },
    )
  }

  if (!SUPPORTED_CHAINS.includes(destinationChain as SupportedChain)) {
    return NextResponse.json({
      error: `Unsupported destinationChain. Supported: ${SUPPORTED_CHAINS.join(', ')}`,
    }, { status: 400 })
  }

  // @ts-ignore — SDK types may not fully align with our tsconfig
  const { GatewayClient } = await import('@circle-fin/x402-batching/client')

  const client = new GatewayClient({
    chain: 'arcTestnet',
    privateKey: (sellerKey.startsWith('0x') ? sellerKey : `0x${sellerKey}`) as `0x${string}`,
  })

  // Check available gateway balance before attempting
  const balances = await client.getBalances()
  const available = parseFloat(balances?.gateway?.formattedAvailable ?? '0')
  if (available < parseFloat(amount)) {
    return NextResponse.json({
      error: `Insufficient gateway balance. Available: $${available.toFixed(6)} USDC, Requested: $${amount} USDC`,
    }, { status: 400 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (client as any).withdraw(amount, {
      chain: typedChain,
      ...(recipientAddress ? { recipient: recipientAddress as `0x${string}` } : {}),
    })

    const mintTxHash = result?.mintTxHash ?? result?.hash ?? String(result)

    // Record withdrawal so Lifetime Earned stays accurate after balance is cleared
    await recordWithdrawal(parseFloat(amount))

    return NextResponse.json({
      success: true,
      amount,
      destinationChain,
      mintTxHash,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Withdrawal error:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
