// Node.js runtime — triggers on-chain USDC withdrawal from Gateway to merchant wallet.
// This is On-Chain Moment 3 in the demo arc.
//
// POST /api/withdraw  → { txHash, explorerUrl, amount, network }
//
// Uses viem to call Gateway Minter's gatewayMint() function.
// TODO: This requires Circle's withdrawal flow (burn intent + attestation + gatewayMint).
// Placeholder structure — fill in the actual withdrawal flow with Circle SDK or viem.

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import nanocrawlConfig from '../../../nanocrawl.config'
import { ARC_TESTNET } from '../../../shared/config'
import { fetchGatewayBalance } from '../../../lib/settle'
import { unitsToUsdc } from '../../../nanocrawl.config'

export async function POST() {
  if (!nanocrawlConfig.sellerPrivateKey) {
    return NextResponse.json({ error: 'Seller private key not configured' }, { status: 500 })
  }

  try {
    const balanceUnits = await fetchGatewayBalance(
      nanocrawlConfig.sellerWallet,
      ARC_TESTNET.domainId,
    )

    if (balanceUnits === '0') {
      return NextResponse.json({ error: 'No balance to withdraw' }, { status: 400 })
    }

    // TODO: Implement withdrawal using Circle SDK or viem
    // The withdrawal flow for same-chain (Arc Testnet → Arc Testnet):
    //   1. Call Circle Gateway /v1/transfer to initiate burn intent
    //   2. Poll for attestation
    //   3. Call gatewayMint() on Gateway Minter contract with attestation payload
    //
    // Reference:
    //   - Gateway Minter: ARC_TESTNET.gatewayMinter
    //   - Circle CCTP docs: https://developers.circle.com/gateway
    //
    // For now, return a placeholder so the dashboard Withdraw button is wired up.
    // Replace this block with the actual implementation.

    const txHash = '0xTODO_IMPLEMENT_WITHDRAWAL'
    const explorerUrl = `${ARC_TESTNET.explorer}/tx/${txHash}`

    return NextResponse.json({
      txHash,
      explorerUrl,
      amount: unitsToUsdc(balanceUnits).toString(),
      network: nanocrawlConfig.network,
    })
  } catch (err) {
    console.error('Withdrawal error:', err)
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 })
  }
}
