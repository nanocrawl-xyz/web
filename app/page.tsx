// Landing page — project description, value proposition, architecture, links.
// Visible to humans. Crawlers are gated at /products/* only.

import Link from 'next/link'
import LiveStats from './components/LiveStats'

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
          An HTTP-native micropayment protocol for AI data access.
          Publishers set a price. AI agents pay per page.
          Humans browse for free.
        </p>
        <LiveStats />
        <div className="flex gap-4">
          <Link
            href="/nanocrawl/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Live Dashboard
          </Link>
          <Link
            href="/products"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </section>

      {/* The pitch */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">The 30-Second Pitch</h2>
        <blockquote className="border-l-4 border-blue-600 pl-6 text-gray-300 text-lg leading-relaxed">
          The web is broken for AI. Publishers block crawlers and earn nothing.
          Crawlers scrape anyway and risk lawsuits. NanoCrawl is the payment layer in between.
          An MCP server gives any AI agent a wallet to pay for web content.
          A one-line Next.js middleware lets any publisher set a price.
          Circle Nanopayments handle sub-cent, gas-free transactions on Arc.
        </blockquote>
      </section>

      {/* Architecture */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Architecture</h2>
        <pre className="bg-gray-900 rounded-xl p-6 text-sm text-gray-300 overflow-x-auto font-mono">
{`AI Agent (Claude Code, Codex, custom)
    ↓  MCP protocol
MCP Server  (manages wallet, budget, receipts)
    ↓  HTTP with x402 headers  (PAYMENT-SIGNATURE)
Circle Nanopayments  (gas-free USDC via EIP-3009 + batch settlement)
    ↓
Next.js Middleware  (classify traffic → 402 or pass-through)
    ↓  verify-and-serve
Next.js App  (merchant site + dashboard + landing page)`}
        </pre>
        {/* TODO: replace with exported PNG once diagram is finalised */}
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Crawler hits a protected page',
              body: 'Middleware classifies the request as a crawler. Returns HTTP 402 with a PAYMENT-REQUIRED header encoding price, network, and seller address.',
            },
            {
              step: '2',
              title: 'Agent signs and pays',
              body: 'MCP server receives the 402, signs an off-chain EIP-3009 authorization (zero gas), and retries with a PAYMENT-SIGNATURE header.',
            },
            {
              step: '3',
              title: 'Content delivered, revenue recorded',
              body: 'Circle Gateway verifies the signature and locks funds. Merchant sees revenue on the dashboard in real time. Periodic batch settlement on Arc.',
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="bg-gray-900 rounded-xl p-6 space-y-2">
              <div className="text-3xl font-bold text-blue-500">{step}</div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-gray-400 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsor callout */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Built On</h2>
        <div className="flex flex-wrap gap-3">
          {['Circle Nanopayments', 'x402 Protocol', 'Arc Testnet', 'Model Context Protocol'].map((tech) => (
            <span key={tech} className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 pt-8 text-gray-500 text-sm">
        NanoCrawl — ETHGlobal Cannes 2026
      </footer>
    </main>
  )
}
