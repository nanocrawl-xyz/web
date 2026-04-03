'use client'

// Merchant dashboard — live revenue counter, transaction feed, balance, withdraw button.
// Uses SSE (/api/events) for real-time updates. No polling interval management needed.
// This is the "second screen" during the demo — must look polished and update live.

import { useEffect, useState } from 'react'
import type { PaymentEvent } from '../../../shared/types'
import { ARC_TESTNET } from '../../../shared/config'

interface DashboardData {
  payments: PaymentEvent[]
  totalRevenue: number
  revenueByRoute: Record<string, number>
  balanceUsdc: number
  ts: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawResult, setWithdrawResult] = useState<{ txHash: string; explorerUrl: string } | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  // Subscribe to SSE stream
  useEffect(() => {
    const es = new EventSource('/api/events')
    es.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data) as DashboardData)
      } catch {}
    }
    es.onerror = () => {
      // Browser auto-reconnects on error
    }
    return () => es.close()
  }, [])

  async function handleWithdraw() {
    setWithdrawing(true)
    setWithdrawError(null)
    setWithdrawResult(null)
    try {
      const res = await fetch('/api/withdraw', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setWithdrawError(json.error ?? 'Withdrawal failed')
      } else {
        setWithdrawResult({ txHash: json.txHash, explorerUrl: json.explorerUrl })
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={data ? `$${data.totalRevenue.toFixed(4)} USDC` : '—'}
          accent
        />
        <StatCard
          label="Gateway Balance"
          value={data ? `$${data.balanceUsdc.toFixed(4)} USDC` : '—'}
        />
        <StatCard
          label="Payments Received"
          value={data ? String(data.payments.length) : '—'}
        />
      </div>

      {/* Withdraw */}
      <div className="bg-gray-900 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Withdraw to Wallet</h2>
        <p className="text-sm text-gray-400">
          Transfer accumulated USDC from Circle Gateway to your on-chain wallet.
          This is an on-chain transaction — visible on Blockscout.
        </p>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || !data || data.balanceUsdc === 0}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-colors"
        >
          {withdrawing ? 'Withdrawing…' : 'Withdraw'}
        </button>
        {withdrawResult && (
          <div className="text-sm text-green-400">
            Withdrawn.{' '}
            <a
              href={withdrawResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Blockscout
            </a>
          </div>
        )}
        {withdrawError && (
          <p className="text-sm text-red-400">{withdrawError}</p>
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
