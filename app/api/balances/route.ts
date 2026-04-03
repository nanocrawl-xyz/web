// Node.js runtime — merchant Gateway balance.
// GET /api/balances  → { usdc, usdcHuman, network }

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { fetchGatewayBalance } from '../../../lib/settle'
import nanocrawlConfig, { unitsToUsdc } from '../../../nanocrawl.config'
import { ARC_TESTNET } from '../../../shared/config'

export async function GET() {
  try {
    const balanceUnits = await fetchGatewayBalance(
      nanocrawlConfig.sellerWallet,
      ARC_TESTNET.domainId,
    )

    return NextResponse.json({
      usdc: balanceUnits,
      usdcHuman: unitsToUsdc(balanceUnits),
      network: nanocrawlConfig.network,
    })
  } catch (err) {
    console.error('Balance fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 502 })
  }
}
