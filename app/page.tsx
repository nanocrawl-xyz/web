// Landing page — project pitch, live stats, architecture diagram, links.
// Visible to humans and judges. Crawlers are gated at /products/* only.

import Link from 'next/link'
import LiveStats from './components/LiveStats'
import ArchDiagram from './components/ArchDiagram'

export default function LandingPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-20">

      {/* Hero */}
      <section className="space-y-6">
        <div className="inline-block bg-blue-600 text-white text-xs font-mono px-3 py-1 rounded-full">
          ETHGlobal Cannes 2026
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          NanoCrawl
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          HTTP-native micropayments for AI data access.
          Publishers set a price. AI agents pay per page — off-chain, zero gas.
          Humans browse for free.
        </p>
        <LiveStats />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/nanocrawl/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Live Dashboard
          </Link>
          <Link
            href="/docs/merchant"
            className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Get Started as Merchant
          </Link>
          <Link
            href="/docs/buyer"
            className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Build a Paying Agent
          </Link>
        </div>
      </section>

      {/* The pitch */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">The Problem</h2>
        <blockquote className="border-l-4 border-blue-600 pl-6 text-gray-300 text-lg leading-relaxed">
          The web is broken for AI. Publishers block crawlers and earn nothing.
          Crawlers scrape anyway and risk lawsuits. NanoCrawl is the payment layer in between —
          an MCP server gives any AI agent a wallet, and a one-line middleware lets any
          publisher monetise their content at sub-cent granularity.
        </blockquote>
      </section>

      {/* Architecture diagram */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Architecture</h2>
        <p className="text-sm text-gray-500">
          The full round-trip: x402 over HTTP, off-chain EIP-3009 signing, Circle Gateway
          batch settlement on Arc, and dual withdrawal paths.
        </p>
        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
          <ArchDiagram />
        </div>
      </section>

      {/* Why Arc callout */}
      <section className="bg-yellow-950/30 border border-yellow-800/40 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">★</span>
          <h2 className="text-lg font-semibold text-yellow-200">Why Arc is Different</h2>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          On every other chain, CCTP cross-chain withdrawals require a separate native gas token
          (ETH on Base, etc.). Arc is unique: <strong className="text-yellow-300">USDC is the native currency</strong>.
          Merchants accumulate payments in the Circle Gateway and withdraw instantly to their Arc wallet —
          no ETH, no friction. Cross-chain to Base or Unichain is also available via CCTP when needed.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '①',
              title: 'Crawler hits a protected page',
              body: 'Middleware classifies the request as a crawler. Returns HTTP 402 with a PAYMENT-REQUIRED header encoding price, network, and seller address.',
            },
            {
              step: '②',
              title: 'Agent signs off-chain',
              body: 'MCP server reads the 402, signs an EIP-3009 authorization off-chain — zero gas, no on-chain transaction. Retries with a PAYMENT-SIGNATURE header.',
            },
            {
              step: '③',
              title: 'Content delivered, revenue recorded',
              body: 'Circle Gateway verifies the signature and locks funds. Merchant sees revenue on the dashboard in real time. Merchant sweeps to any chain via CCTP.',
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="bg-gray-900 rounded-xl p-6 space-y-2">
              <div className="text-3xl font-bold text-blue-400">{step}</div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-gray-400 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key properties */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Key Properties</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Zero gas per payment', desc: 'EIP-3009 off-chain authorization — no on-chain tx until batch settlement' },
            { label: 'HTTP-native', desc: 'Standard 402 status code. No SDK required on the publisher side' },
            { label: 'Human pass-through', desc: 'Browser signals detected. Humans never see a paywall' },
            { label: 'Cross-chain withdrawal', desc: 'CCTP: burn USDC on Arc, mint on Base, Unichain, or any supported chain' },
            { label: 'Idempotent payments', desc: 'UUID-based deduplication. Safe to retry on network failure' },
            { label: 'Drop-in for any site', desc: 'Cloudflare Worker template gates any origin — static sites, APIs, R2 buckets' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-4 flex gap-3">
              <span className="text-green-400 mt-0.5 shrink-0">✓</span>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Built on */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Built On</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'Circle Nanopayments', sub: 'EIP-3009 · CCTP · Gateway' },
            { name: 'x402 Protocol', sub: 'HTTP payment standard' },
            { name: 'Arc Testnet', sub: 'USDC as native gas' },
            { name: 'Model Context Protocol', sub: 'AI agent wallet layer' },
          ].map(({ name, sub }) => (
            <div key={name} className="bg-gray-900 rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium text-gray-200">{name}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 pt-8 flex items-center justify-between text-gray-500 text-sm">
        <span>NanoCrawl — ETHGlobal Cannes 2026</span>
        <Link href="/nanocrawl/dashboard" className="hover:text-gray-300 transition-colors">
          Live Dashboard →
        </Link>
      </footer>

    </main>
  )
}
