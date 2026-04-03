// /docs/buyer — AI agent / buyer quickstart
// How to give your AI agent a wallet and let it pay for web content via x402.

import Link from 'next/link'

export default function BuyerPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-14">

      {/* Back */}
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
        ← Back to NanoCrawl
      </Link>

      {/* Hero */}
      <section className="space-y-4">
        <div className="inline-block bg-purple-600 text-white text-xs font-mono px-3 py-1 rounded-full">
          AI Agent / Buyer
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Build a Paying Agent</h1>
        <p className="text-lg text-gray-400">
          Give your AI agent a wallet. Let it fetch paid web content automatically
          using the x402 protocol — no gas, no on-chain transactions per request.
        </p>
      </section>

      {/* Quickstart */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Quickstart</h2>
        <ol className="space-y-6 text-sm">
          <li className="space-y-2">
            <p className="font-medium text-white">1. Install the SDK</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">
              npm install @circle-fin/x402-batching @x402/evm
            </pre>
            <p className="text-gray-500 text-xs">
              Import <code className="bg-gray-800 px-1 rounded">GatewayClient</code> from{' '}
              <code className="bg-gray-800 px-1 rounded">@circle-fin/x402-batching/client</code> — not the root package.
            </p>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">2. Set environment variables</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">{`# .env.local
NANOCRAWL_BUYER_PRIVATE_KEY=0x<your-wallet-private-key>
NANOCRAWL_BUYER_WALLET=0x<your-wallet-address>`}</pre>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">3. Fund the Gateway balance (once)</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">{`import { GatewayClient } from '@circle-fin/x402-batching/client'

const client = new GatewayClient({
  chain: 'arcTestnet',
  privateKey: process.env.NANOCRAWL_BUYER_PRIVATE_KEY,
})

// One-time: move on-chain USDC into the Gateway
await client.deposit('1')  // deposit 1 USDC`}</pre>
            <p className="text-gray-500 text-xs">
              The Gateway balance is what gets debited on each{' '}
              <code className="bg-gray-800 px-1 rounded">client.pay()</code> call.
              On-chain USDC is not spent per request.
            </p>
          </li>
          <li className="space-y-2">
            <p className="font-medium text-white">4. Fetch paid content</p>
            <pre className="bg-gray-900 rounded-lg p-4 font-mono text-gray-300 overflow-x-auto">{`// Handles the full x402 round-trip automatically:
//   GET → 402 → sign EIP-3009 off-chain → retry with PAYMENT-SIGNATURE
const result = await client.pay('https://nanocrawl.vercel.app/products/1')

console.log(result.response)  // the paid content (JSON)
console.log(result.transaction)  // Circle settlement UUID`}</pre>
          </li>
        </ol>
      </section>

      {/* MCP integration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">MCP Server Integration</h2>
        <p className="text-gray-400 text-sm">
          To give Claude or any MCP-compatible agent a paying wallet, wrap{' '}
          <code className="bg-gray-800 px-1 rounded">client.pay()</code> as an MCP tool:
        </p>
        <pre className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">{`server.tool('fetch_paid_page', {
  url: z.string().url(),
  budget: z.number().optional(),
}, async ({ url }) => {
  const result = await client.pay(url)
  return { content: [{ type: 'text', text: JSON.stringify(result.response) }] }
})`}</pre>
        <p className="text-gray-400 text-sm">
          The agent sees a normal tool call. Payment happens transparently.
        </p>
      </section>

      {/* How payment works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How Payment Works</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            x402 payments use <strong className="text-white">EIP-3009 off-chain authorization</strong>.
            No gas. No on-chain transaction per page. Your agent signs a USDC transfer intent;
            Circle Gateway settles it in batches on Arc.
          </p>
          <p>
            The seller verifies the signature via Circle Gateway and delivers the content.
            A <code className="bg-gray-800 px-1 rounded">PAYMENT-RESPONSE</code> header confirms settlement
            with a UUID you can audit.
          </p>
          <p>
            Each request includes a unique nonce so payments cannot be replayed.
            Include a <code className="bg-gray-800 px-1 rounded">payment-identifier</code> UUID
            for idempotency — safe to retry on network failure.
          </p>
        </div>
      </section>

      {/* Test against nanocrawl */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Test Against NanoCrawl</h2>
        <div className="bg-gray-900 rounded-xl p-5 text-sm space-y-3">
          <div>
            <p className="text-gray-500 text-xs mb-1">Endpoint</p>
            <code className="text-gray-300 font-mono">https://nanocrawl.vercel.app/products/1</code>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Price</p>
            <code className="text-gray-300 font-mono">$0.001 USDC per page</code>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Payment metadata (robots.txt)</p>
            <code className="text-gray-300 font-mono">https://nanocrawl.vercel.app/robots.txt</code>
          </div>
        </div>
        <p className="text-gray-500 text-xs">
          Need test USDC? Get it from{' '}
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            faucet.circle.com
          </a>, then call{' '}
          <code className="bg-gray-800 px-1 rounded">client.deposit()</code>.
        </p>
      </section>

      {/* Interface contract link */}
      <section className="bg-gray-900 rounded-xl p-6 space-y-2">
        <p className="font-semibold">Full Interface Contract</p>
        <p className="text-sm text-gray-400">
          Detailed HTTP spec: 402 format, PAYMENT-SIGNATURE structure, idempotency, shared test wallet.
        </p>
        <a
          href="/INTERFACE_CONTRACT.md"
          className="text-blue-400 underline text-sm"
        >
          View INTERFACE_CONTRACT.md
        </a>
      </section>

    </main>
  )
}
