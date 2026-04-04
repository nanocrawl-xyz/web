// Node.js runtime — check seller wallet ETH balance on CCTP destination chains.
// GET /api/chain-gas?address=0x...
// Returns { balances: { [chainName]: string } } where value is formatted ETH/native balance.
// Arc is excluded — it uses USDC as gas so always works.

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

const CHAINS = [
  { name: 'baseSepolia',      rpc: 'https://sepolia.base.org' },
  { name: 'arbitrumSepolia',  rpc: 'https://sepolia-rollup.arbitrum.io/rpc' },
  { name: 'optimismSepolia',  rpc: 'https://sepolia.optimism.io' },
  { name: 'avalancheFuji',    rpc: 'https://api.avax-test.network/ext/bc/C/rpc' },
  { name: 'unichainSepolia',  rpc: 'https://sepolia.unichain.org' },
  { name: 'sepolia',          rpc: 'https://11155111.rpc.thirdweb.com' },
]

async function getEthBalance(rpc: string, address: string): Promise<bigint> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
    signal: AbortSignal.timeout(4000),
  })
  const data = await res.json()
  return BigInt(data.result ?? '0x0')
}

export async function GET(_request: NextRequest) {
  const address = process.env.NANOCRAWL_SELLER_WALLET
  if (!address) return NextResponse.json({ error: 'NANOCRAWL_SELLER_WALLET not configured' }, { status: 500 })

  const results = await Promise.allSettled(
    CHAINS.map(async ({ name, rpc }) => {
      const wei = await getEthBalance(rpc, address)
      return { name, wei }
    })
  )

  const balances: Record<string, { wei: string; funded: boolean }> = {}
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { name, wei } = r.value
      // Funded if > 0.001 ETH (enough for a few txs)
      const threshold = BigInt('1000000000000000') // 0.001 ETH
      balances[name] = { wei: wei.toString(), funded: wei > threshold }
    }
  }

  return NextResponse.json({ balances })
}
