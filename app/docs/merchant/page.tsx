// /docs/merchant — publisher/seller quickstart
// How to gate your site with x402 and collect micropayments from AI crawlers.

import Link from 'next/link'

export default function MerchantPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-14">

      {/* Back */}
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
        ← Back to NanoCrawl
      </Link>

      {/* Hero */}
      <section className="space-y-4">
        <div className="inline-block bg-blue-600 text-white text-xs font-mono px-3 py-1 rounded-full">
          Merchant / Publisher
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Get Started as a Merchant</h1>
        <p className="text-lg text-gray-400">
          Add x402 payment gating to your site. AI agents pay per page.
          Humans browse for free. No blockchain plumbing required.
        </p>
      </section>

      {/* What you get */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What NanoCrawl adds to your site</h2>
        <p className="text-gray-400 text-sm">
          One integration gives you four things. The first two are automatic — no extra config needed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              num: '①',
              title: 'Discovery — robots.txt',
              desc: 'Auto-served at /robots.txt with payment metadata: price, network, seller address, verifying contract. Any crawler that follows web standards finds it immediately.',
              note: 'RFC 9309 · auto',
              color: 'border-gray-700',
            },
            {
              num: '②',
              title: 'Discovery — .well-known/ai-pay',
              desc: 'Auto-served JSON manifest at /.well-known/ai-pay. Agents and SDKs parse it to bootstrap a GatewayClient without hitting a 402 first. Typed structured data.',
              note: 'Emerging standard · auto',
              color: 'border-gray-700',
            },
            {
              num: '③',
              title: 'Payment gating',
              desc: 'Middleware classifies requests as crawler vs human. Crawlers get a 402 with PAYMENT-REQUIRED header. Humans pass through. One import.',
              note: 'Next.js or CF Worker · configure',
              color: 'border-blue-900',
            },
            {
              num: '④',
              title: 'Settlement + dashboard',
              desc: 'Circle Gateway verifies EIP-3009 sigs, locks funds. Revenue streams to the dashboard in real time. Withdraw to any chain via CCTP.',
              note: 'Circle Gateway · configure',
              color: 'border-blue-900',
            },
          ].map(({ num, title, desc, note, color }) => (
            <div key={num} className={`bg-gray-900 rounded-xl p-5 border ${color} space-y-2`}>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">{num}</span>
                <span className="font-medium text-sm">{title}</span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              <p className="text-gray-600 text-xs font-mono">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Discovery endpoints — already provided */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Discovery endpoints (auto)</h2>
        <p className="text-gray-400 text-sm">
          NanoCrawl serves these automatically once the seller wallet is configured.
          No extra steps needed — they're included in every integration.
        </p>
        <div className="space-y-3">
          <div className="bg-gray-900 rounded-xl p-5 space-y-3 border border-gray-800">
            <div className="flex items-center justify-between">
              <code className="text-blue-400 font-mono text-sm">GET /robots.txt</code>
              <span className="text-xs text-gray-500">RFC 9309 extension</span>
            </div>
            <pre className="text-xs text-gray-400 font-mono leading-relaxed overflow-x-auto">{`User-agent: AI-Crawler
Allow: /products
Crawl-fee: 0.001 USDC

Payment-Network: eip155:5042002
Payment-Asset: 0x3600...
Payment-PayTo: 0xSeller...
Payment-VerifyingContract: 0x0077...`}</pre>
            <p className="text-gray-500 text-xs">
              Enables the proactive flow: agent pre-signs EIP-3009 from this metadata, sends
              PAYMENT-SIGNATURE on the first request — saves one full HTTP round-trip per page.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 space-y-3 border border-gray-800">
            <div className="flex items-center justify-between">
              <code className="text-blue-400 font-mono text-sm">GET /.well-known/ai-pay</code>
              <span className="text-xs text-gray-500">Structured JSON manifest</span>
            </div>
            <pre className="text-xs text-gray-400 font-mono leading-relaxed overflow-x-auto">{`{
  "protocol": "x402",
  "accepts": [{ "network": "eip155:5042002",
                "asset": "0x3600...", "amount": "1000",
                "payTo": "0xSeller...", ... }],
  "routes": [{ "pathPattern": "/products/*",
               "amountUsdc": 0.001 }]
}`}</pre>
            <p className="text-gray-500 text-xs">
              Machine-readable bootstrap for agent SDKs. Parse once, cache, use for all requests.
              Analogous to <code className="bg-gray-800 px-1 rounded">/.well-known/openid-configuration</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Option A: Next.js */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Option A — Next.js middleware</h2>
        <p className="text-gray-400 text-sm">
          One environment variable and a single import. Works with any Next.js 13+ App Router project.
        </p>
        <ol className="space-y-6 text-sm">
          <li className="space-y-2">
            <p className="font-medium text-white">1. Install the SDK</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">
              npm install @circle-fin/x402-batching @x402/evm
            </pre>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">2. Set environment variables</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">{`# .env.local
NANOCRAWL_SELLER_PRIVATE_KEY=0x<your-wallet-private-key>
NEXT_PUBLIC_SELLER_WALLET=0x<your-wallet-address>
PRICE_USDC=0.001`}</pre>
            <p className="text-gray-500 text-xs">
              Use the same wallet for both. The private key stays server-side only.
            </p>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">3. Add the middleware</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">{`// middleware.ts (project root)
export { nanocrawlMiddleware as middleware } from '@nanocrawl/middleware'
export const config = { matcher: ['/products/:path*'] }`}</pre>
            <p className="text-gray-500 text-xs">
              Gate any route pattern. Humans pass through. Crawlers get a 402.
            </p>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">4. Check the dashboard</p>
            <p className="text-gray-400">
              Revenue appears at{' '}
              <Link href="/nanocrawl/dashboard" className="text-blue-400 underline">
                /nanocrawl/dashboard
              </Link>{' '}
              in real time as crawlers pay.
            </p>
          </li>
        </ol>
      </section>

      {/* Option B: Cloudflare Worker */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Option B — Cloudflare Worker</h2>
        <p className="text-gray-400 text-sm">
          A standalone Worker that proxies any origin. Works in front of static sites,
          APIs, R2 buckets — anything behind a Cloudflare zone.
          No Node.js required, no external dependencies.
        </p>
        <ol className="space-y-6 text-sm">
          <li className="space-y-2">
            <p className="font-medium text-white">1. Create the Worker</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">
              npm create cloudflare@latest nanocrawl-worker
            </pre>
            <p className="text-gray-400">
              Replace the generated <code className="bg-gray-800 px-1 rounded">src/index.ts</code> with the{' '}
              <a
                href="https://github.com/nanocrawl/nanocrawl/blob/main/templates/cloudflare-worker.ts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                NanoCrawl CF Worker template
              </a>.
            </p>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">2. Set secrets and variables</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">{`wrangler secret put SELLER_WALLET
wrangler secret put PRICE_USDC   # optional, default 0.001

# wrangler.toml
[vars]
ORIGIN_URL = "https://your-real-site.com"`}</pre>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">3. Deploy</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">
              wrangler deploy
            </pre>
          </li>
        </ol>
      </section>

      {/* Key addresses */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Arc Testnet Reference</h2>
        <div className="bg-gray-900 rounded-xl p-5 font-mono text-sm space-y-2 text-gray-300">
          <div className="flex gap-4"><span className="text-gray-500 w-40 shrink-0">Chain ID</span><span>5042002</span></div>
          <div className="flex gap-4"><span className="text-gray-500 w-40 shrink-0">USDC</span><span className="break-all">0x3600000000000000000000000000000000000000</span></div>
          <div className="flex gap-4"><span className="text-gray-500 w-40 shrink-0">Gateway Wallet</span><span className="break-all">0x0077777d7EBA4688BDeF3E311b846F25870A19B9</span></div>
          <div className="flex gap-4"><span className="text-gray-500 w-40 shrink-0">Faucet</span><span>faucet.circle.com</span></div>
        </div>
        <p className="text-gray-500 text-xs">
          Need test USDC? Hit the Circle faucet and then call{' '}
          <code className="bg-gray-800 px-1 rounded">client.deposit()</code> to fund the Gateway balance.
        </p>
      </section>

    </main>
  )
}
