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

      {/* Positioning */}
      <section className="space-y-6">
        <blockquote className="border-l-4 border-gray-600 pl-6 text-gray-300 text-lg italic leading-relaxed">
          Cloudflare controls access.<br />
          NanoCrawl defines how machines pay for it.
        </blockquote>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-5 space-y-2 border border-gray-800">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Cryptographic, not accounting</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Every payment is a signed EIP-3009 authorization — verifiable on-chain,
              non-repudiable, settled in batches. Cloudflare-style billing aggregates usage
              centrally. Circle Nanopayments signs per request.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 space-y-2 border border-gray-800">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Agent-native by design</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              No accounts. No billing cycles. No API keys. An AI agent reads{' '}
              <code className="text-gray-300 bg-gray-800 px-1 rounded">robots.txt</code>,
              discovers the price, signs off-chain, and pays — all autonomously via MCP.
              Sub-cent granularity makes per-page economics viable.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 space-y-2 border border-gray-800">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Cross-chain out of the box</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Payments settle on Arc — where USDC is the native gas token, so merchants
              pay nothing to receive. Circle CCTP lets them sweep to Base, Unichain,
              or any supported chain in one call. No bridging UX, no manual steps.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex gap-4 items-start">
          <span className="text-gray-500 text-xl shrink-0">⚡</span>
          <div>
            <p className="font-medium text-sm text-gray-200">Complements Cloudflare — doesn't compete</p>
            <p className="text-gray-500 text-sm mt-1">
              Cloudflare excels at detection and enforcement. NanoCrawl is the payment layer that
              plugs in behind it. Our Cloudflare Worker template deploys NanoCrawl as a Worker in
              front of any origin — Cloudflare guards the gate, NanoCrawl handles the economics.
            </p>
          </div>
        </div>
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

      {/* Try it — curl demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">See It Live</h2>
        <p className="text-sm text-gray-500">
          Two curl commands. The protocol is plain HTTP — no SDK, no wallet, no account.
        </p>
        <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden text-sm font-mono">
          <div className="px-4 py-2 border-b border-gray-800 text-gray-500 text-xs">
            Step 1 — hit a paid page, get a 402
          </div>
          <pre className="px-4 py-3 text-gray-300 overflow-x-auto whitespace-pre">{`curl -si https://nanocrawl.vercel.app/products/1 \\
  -H "User-Agent: AI-Crawler/1.0" \\
  | head -6

# HTTP/2 402
# payment-required: eyJ4NDAyVmVyc2lvbiI6MiwiYWNjZXB0cy...
# content-type: application/json
#
# {"x402Version":2,"accepts":[{"scheme":"exact","network":"eip155:5042002",
#  "asset":"0x3600...","amount":"1000","payTo":"0xSeller..."}]}`}</pre>
          <div className="px-4 py-2 border-t border-b border-gray-800 text-gray-500 text-xs">
            Step 2 — sign EIP-3009 off-chain, retry with signature
          </div>
          <pre className="px-4 py-3 text-gray-300 overflow-x-auto whitespace-pre">{`curl -si https://nanocrawl.vercel.app/products/1 \\
  -H "User-Agent: AI-Crawler/1.0" \\
  -H "PAYMENT-SIGNATURE: <base64-eip3009>" \\
  | head -4

# HTTP/2 200
# payment-response: eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6...
# {"id":1,"name":"Widget Alpha","price":29.99,...}`}</pre>
          <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
            <span className="text-gray-600 text-xs">
              Or fetch the machine-readable manifest:
            </span>
            <code className="text-blue-400 text-xs">
              curl https://nanocrawl.vercel.app/.well-known/ai-pay
            </code>
          </div>
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
