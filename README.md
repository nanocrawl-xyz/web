# NanoCrawl — Content Provider Web App

**The origin codebase for NanoCrawl.**

This repo is where the project started: a Next.js app that proves out the full content provider side of the NanoCrawl protocol — traffic classification, x402 payment gating, Circle Gateway settlement, real-time revenue dashboard, and multi-chain USDC withdrawal.

> Built at ETHGlobal Cannes 2026 with Circle Nanopayments, x402 Protocol v2, Arc Testnet, and Base Sepolia.

**Live demo:** [nanocrawl.xyz](https://nanocrawl.xyz)  
**Dashboard:** [nanocrawl.vercel.app/nanocrawl/dashboard](https://nanocrawl.vercel.app/nanocrawl/dashboard)

---

## What this repo is

NanoCrawl has two sides. This repo is the **content provider side**:

- A demo product catalogue (`/products`) — paid content gated behind x402
- Middleware that classifies every request as human or AI agent and returns the appropriate response
- Circle Gateway settlement in the hot path — every payment verified and locked instantly
- A live SSE dashboard showing real-time revenue, balances, and payment history
- One-click USDC withdrawal via native transfer (Arc) or CCTP (6 chains)
- A `robots.txt` that advertises pricing metadata for proactive agent flow

The **agent side** (MCP server that gives AI agents a wallet and pays automatically) lives in [`nanocrawl-xyz/mcp`](https://github.com/nanocrawl-xyz/mcp).

---

## Origin

The project began with a detailed design document written before a single line of code:

**[`NanoCrawl_Design_Document.md`](./NanoCrawl_Design_Document.md)**

It covers the full problem statement (why the web is broken for AI and why robots.txt + paywalls fail), the economic case for nanopayments at crawl scale, the architectural decisions (x402 + Circle Gateway + bot detection), the proactive robots.txt extension, security and replay protection, and the scope plan for the hackathon. It is the authoritative design reference — if something in the code feels non-obvious, the rationale is almost certainly in that document.

---

## How it evolved

The project started here. Early commits established the x402 protocol integration, Circle Gateway settlement, and bot detection. From there it grew into:

- **Phase 0:** Core x402 flow — 402 responses, Gateway settle, SQLite receipts
- **Phase 1:** Proactive flow support via robots.txt payment metadata; SSE dashboard
- **Phase 1.5:** Multi-network — Arc Testnet + Base Sepolia in parallel; CCTP withdrawal across 6 chains
- **Unlink:** Privacy layer added in the MCP repo — agent identity shielded via ZK burner wallet pattern

---

## Architecture

```
Incoming request
    │
    ├─ Human browser  → pass-through (no payment required)
    │
    └─ AI agent       → HTTP 402 + PAYMENT-REQUIRED header
                            │
                        Agent retries with PAYMENT-SIGNATURE
                            │
                        Circle Gateway settle()  ← verification in hot path
                            │
                        200 + content served
```

Content providers add a single config file and middleware. Everything else is handled by NanoCrawl.

---

## Key Files

| Path | What |
|------|------|
| `proxy.ts` | Traffic classification + 402 responses |
| `nanocrawl.config.ts` | Per-route pricing config |
| `lib/x402.ts` | x402 v2 payment header construction |
| `lib/settlement.ts` | Circle Gateway `settle()` wrapper |
| `lib/bot-detection.ts` | User-agent + header classification |
| `app/nanocrawl/` | Dashboard UI (SSE real-time feed) |
| `app/api/` | Payment recording, balance, withdrawal endpoints |
| `shared/` | Types + chain config (Arc + Base Sepolia) |
| `templates/` | Cloudflare Worker standalone template |

---

## Quick Start

```bash
npm install
cp .env.example .env.local  # fill in seller wallet + private key
npm run dev
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NANOCRAWL_SELLER_WALLET` | Yes | EVM address to receive payments |
| `NANOCRAWL_SELLER_PRIVATE_KEY` | Yes | For withdrawals (never sent to client) |
| `NANOCRAWL_DEFAULT_PRICE_USDC` | No | Price per page (default: 0.001) |

Fund your seller wallet with native gas at [faucet.circle.com](https://faucet.circle.com) → Arc Testnet.

---

## Tech Stack

Circle Nanopayments · x402 Protocol v2 · EIP-3009 · EIP-712 · USDC · Arc Testnet · Base Sepolia · CCTP · Next.js 16 · Vercel · Vercel KV (Redis) · viem · TypeScript

## License

MIT
