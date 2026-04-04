'use client'

// Merchant dashboard — live revenue counter, transaction feed, balance, withdraw button.
// Uses SSE (/api/events) for real-time updates. No polling interval management needed.
// This is the "second screen" during the demo — must look polished and update live.

import { useEffect, useRef, useState } from 'react'
import type { PaymentEvent } from '../../../shared/types'
import { ARC_TESTNET } from '../../../shared/config'

const CHAIN_EXPLORER: Record<string, string> = {
  arcTestnet:       'https://testnet.arcscan.app/tx/',
  baseSepolia:      'https://sepolia.basescan.org/tx/',
  arbitrumSepolia:  'https://sepolia.arbiscan.io/tx/',
  optimismSepolia:  'https://sepolia-optimism.etherscan.io/tx/',
  avalancheFuji:    'https://testnet.snowtrace.io/tx/',
}

interface DashboardData {
  payments: PaymentEvent[]
  totalRevenue: number
  totalWithdrawn: number
  lifetimeEarned: number
  revenueByRoute: Record<string, number>
  balanceUsdc: number
  ts: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawChain, setWithdrawChain] = useState('arcTestnet')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawResult, setWithdrawResult] = useState<{ mintTxHash: string; amount: string; destinationChain: string } | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  // Subscribe to SSE stream; seed withdrawAmount from first load only
  const withdrawAmountSeeded = useRef(false)
  useEffect(() => {
    const es = new EventSource('/api/events')
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data) as DashboardData
        setData(d)
        if (!withdrawAmountSeeded.current && d.balanceUsdc > 0) {
          setWithdrawAmount(d.balanceUsdc.toFixed(6))
          withdrawAmountSeeded.current = true
        }
      } catch {}
    }
    es.onerror = () => {}
    return () => es.close()
  }, [])

  async function handleWithdraw() {
    setWithdrawing(true)
    setWithdrawError(null)
    setWithdrawResult(null)
    try {
      const amount = withdrawAmount || data?.balanceUsdc.toFixed(6) || '0'
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, destinationChain: withdrawChain }),
      })
      const json = await res.json()
      if (!res.ok) {
        setWithdrawError(json.error ?? 'Withdrawal failed')
      } else {
        setWithdrawResult({ mintTxHash: json.mintTxHash, amount: json.amount, destinationChain: json.destinationChain })
      }
    } catch {
      setWithdrawError('Network error')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NanoCrawl Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time crawler revenue — Arc Testnet</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Lifetime Earned"
          value={data ? `$${data.lifetimeEarned.toFixed(4)}` : '—'}
          accent
        />
        <StatCard
          label="Gateway Balance"
          value={data ? `$${data.balanceUsdc.toFixed(4)}` : '—'}
        />
        <StatCard
          label="Total Withdrawn"
          value={data ? `$${data.totalWithdrawn.toFixed(4)}` : '—'}
        />
        <StatCard
          label="Payments"
          value={data ? String(data.payments.length) : '—'}
        />
      </div>

      {/* Withdraw */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Withdraw to Wallet</h2>
          <p className="text-sm text-gray-400 mt-1">
            Move USDC from Circle Gateway to your on-chain wallet — same chain or via CCTP cross-chain.
            Pre-filled with your full balance for a one-click sweep.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Amount input */}
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <span className="text-gray-500 text-sm pl-3">$</span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={withdrawing}
              className="bg-transparent text-gray-200 text-sm px-2 py-2 w-28 focus:outline-none"
              placeholder="0.000000"
            />
            <button
              onClick={() => setWithdrawAmount(data?.balanceUsdc.toFixed(6) ?? '')}
              disabled={withdrawing}
              className="text-xs text-blue-400 hover:text-blue-300 px-3 py-2 border-l border-gray-700 transition-colors"
            >
              Max
            </button>
          </div>
          {/* Chain selector */}
          <select
            value={withdrawChain}
            onChange={(e) => setWithdrawChain(e.target.value)}
            disabled={withdrawing}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="arcTestnet">Arc Testnet (same chain)</option>
            <option value="baseSepolia">Base Sepolia (CCTP)</option>
            <option value="arbitrumSepolia">Arbitrum Sepolia (CCTP)</option>
            <option value="optimismSepolia">Optimism Sepolia (CCTP)</option>
            <option value="avalancheFuji">Avalanche Fuji (CCTP)</option>
          </select>
          {/* Submit */}
          <button
            onClick={handleWithdraw}
            disabled={withdrawing || !data || data.balanceUsdc === 0 || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            {withdrawing
              ? 'Withdrawing…'
              : parseFloat(withdrawAmount) >= (data?.balanceUsdc ?? 0) - 0.000001
                ? 'Sweep All'
                : 'Withdraw'}
          </button>
        </div>
        {withdrawResult && (() => {
          const explorerBase = CHAIN_EXPLORER[withdrawResult.destinationChain]
          const txUrl = explorerBase && withdrawResult.mintTxHash && !withdrawResult.mintTxHash.startsWith('[')
            ? `${explorerBase}${withdrawResult.mintTxHash}`
            : null
          return (
            <div className="text-sm text-green-400 space-y-1">
              <p>Withdrawn ${withdrawResult.amount} USDC → {withdrawResult.destinationChain}</p>
              <p className="font-mono text-xs text-gray-400 break-all">
                tx:{' '}
                {txUrl
                  ? <a href={txUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-200">{withdrawResult.mintTxHash}</a>
                  : withdrawResult.mintTxHash
                }
              </p>
            </div>
          )
        })()}
        {withdrawError && (
          <div className="text-sm text-red-400 space-y-1">
            <p>{withdrawError}</p>
            {withdrawError.includes('gas required exceeds allowance') && (
              <p className="text-xs text-gray-500">
                Arc is unique: USDC <em>is</em> the native gas token, so Arc withdrawals are seamless.
                CCTP cross-chain mints on the destination chain and needs that chain's native gas (e.g. Sepolia ETH on Base Sepolia) — the seller wallet has none there yet.
                Get testnet ETH from the{' '}
                <a href="https://faucets.chain.link" target="_blank" rel="noopener noreferrer" className="underline">Chainlink faucet</a>, then retry.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Revenue by route */}
      {data && Object.keys(data.revenueByRoute).length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Revenue by Route</h2>
          <div className="space-y-2">
            {Object.entries(data.revenueByRoute).map(([route, total]) => (
              <div key={route} className="flex justify-between text-sm">
                <span className="font-mono text-gray-300">{route}</span>
                <span className="text-blue-400">${total.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction feed */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Transaction Feed</h2>
        {!data || data.payments.length === 0 ? (
          <p className="text-gray-500 text-sm">Waiting for first payment…</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.payments.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        )}
      </div>

    </main>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 space-y-1">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ? 'text-blue-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function PaymentRow({ payment }: { payment: PaymentEvent }) {
  const explorerUrl = `${ARC_TESTNET.explorer}/tx/${payment.transaction}`
  const date = new Date(payment.timestamp).toLocaleTimeString()

  return (
    <div className="flex items-center justify-between text-sm border-b border-gray-800 pb-2">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-300 truncate">{payment.page}</span>
          {payment.cached && (
            <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded shrink-0">
              cached
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs truncate" title={payment.payer}>
          {payment.payer.slice(0, 10)}…{payment.payer.slice(-6)}
        </p>
      </div>
      <div className="text-right shrink-0 space-y-0.5 pl-4">
        <p className="text-blue-400 font-medium">${payment.amountUsdc.toFixed(4)}</p>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-gray-500 text-xs">{date}</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-400 text-xs underline"
          >
            tx
          </a>
        </div>
      </div>
    </div>
  )
}
