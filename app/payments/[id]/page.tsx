// Payment receipt page — /payments/:id
// Server component: fetches directly from the store (Redis or SQLite).
// Shows one payment event in full. Honest framing: Circle Gateway UUID is the
// cryptographic proof (TEE-verified EIP-3009). On-chain batch settlement is
// asynchronous at Gateway discretion — no per-payment tx hash.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { findPaymentById } from '../../../lib/payments-store'
import { ARC_TESTNET } from '../../../shared/config'

export default async function PaymentReceiptPage({
  params,
}: {
  params: { id: string }
}) {
  const payment = await findPaymentById(params.id)
  if (!payment) notFound()

  const date = new Date(payment.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'long',
  })

  const rows: { label: string; value: React.ReactNode; mono?: boolean }[] = [
    {
      label: 'Payment ID',
      value: payment.id,
      mono: true,
    },
    {
      label: 'Status',
      value: (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-green-400">Settled with Circle Gateway</span>
        </span>
      ),
    },
    {
      label: 'Circle Transaction',
      value: payment.transaction,
      mono: true,
    },
    {
      label: 'Resource',
      value: payment.page,
      mono: true,
    },
    {
      label: 'Amount',
      value: `$${payment.amountUsdc.toFixed(6)} USDC (${payment.amountUnits} units)`,
    },
    {
      label: 'Timestamp',
      value: date,
    },
    {
      label: 'Network',
      value: payment.network,
      mono: true,
    },
    {
      label: 'Buyer Address',
      value: (
        <span>
          <a
            href={`${ARC_TESTNET.explorer}/address/${payment.payer}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-400 hover:underline break-all"
          >
            {payment.payer}
          </a>
          <span className="ml-2 text-xs text-gray-500">
            (signing EOA — may be an Unlink burner for buyer privacy)
          </span>
        </span>
      ),
    },
    ...(payment.cached
      ? [{ label: 'Cache', value: <span className="text-yellow-400 text-sm">Served from idempotency cache (duplicate payment-identifier)</span> }]
      : []),
  ]

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
      <div className="space-y-2">
        <Link href="/nanocrawl/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Payment Receipt</h1>
      </div>

      {/* Main receipt card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">NanoCrawl · Arc Testnet</span>
          <span className="text-xs text-gray-500 font-mono">{date}</span>
        </div>
        <div className="divide-y divide-gray-800">
          {rows.map(({ label, value, mono }) => (
            <div key={label} className="px-6 py-3 flex gap-4 items-start">
              <span className="text-xs text-gray-500 uppercase tracking-wide w-36 shrink-0 pt-0.5">
                {label}
              </span>
              <span className={`text-sm break-all ${mono ? 'font-mono text-gray-300' : 'text-gray-200'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement explanation */}
      <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">About this receipt</p>
        <p className="text-sm text-gray-400 leading-relaxed">
          The Circle Transaction ID above is proof that Circle Gateway&apos;s TEE (Trusted Execution
          Environment) verified the buyer&apos;s EIP-3009 signature and locked the funds. This is a
          cryptographic proof-of-payment — not an off-chain accounting entry.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          On-chain batch settlement happens asynchronously at Circle Gateway&apos;s discretion.
          Individual payments are aggregated across all participants before being committed to Arc
          Testnet. There is no per-payment on-chain transaction.
        </p>
        <p className="text-sm text-gray-500 text-xs mt-2">
          Buyer address shown is the EIP-3009 signing EOA. With the Unlink privacy layer,
          this is an ephemeral burner — the buyer&apos;s real identity remains shielded.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/nanocrawl/dashboard"
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          ← All payments
        </Link>
        <a
          href={`${ARC_TESTNET.explorer}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Arc Explorer ↗
        </a>
      </div>
    </main>
  )
}
