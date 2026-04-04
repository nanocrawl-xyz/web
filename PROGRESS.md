# NanoCrawl — Person B Implementation Progress

ETHGlobal Cannes 2026 · Person B scope: publisher/seller web app

---

## Status: Integration-tested and working locally

The full x402 payment flow is confirmed end-to-end against Circle Gateway testnet.
`npm run crawl` pays 3 product pages at $0.001 USDC each with real Circle UUIDs.

---

## What is working

| Component | Status | Notes |
|-----------|--------|-------|
| x402 402 response (body + header) | ✅ | Dual format: JSON body + PAYMENT-REQUIRED header (Base64) |
| Bot/crawler detection | ✅ | UA patterns, `x-nanocrawl-capable`, missing browser headers |
| Human pass-through | ✅ | No payment required for human browsers |
| Circle Gateway settle | ✅ | Uses `BatchFacilitatorClient` from `@circle-fin/x402-batching/server` |
| SQLite payment recording | ✅ | `nanocrawl-payments.db`, idempotency via `payment-identifier` |
| robots.txt with payment metadata | ✅ | Serves at `/robots.txt` with full Circle metadata |
| Merchant dashboard (SSE) | ✅ | Live payment stream, shows balances |
| Mock crawler (`npm run crawl`) | ✅ | Uses same GatewayClient as Person A's MCP server |
| Unit tests (93 passing) | ✅ | classify, x402, config, payments-store, verify-and-serve |
| Smoke tests (10/10) | ✅ | Pre-demo checklist |
| Vercel deployment | ✅ | https://nanocrawl.vercel.app — 10/10 smoke tests pass |
| Redis persistence (Vercel KV) | ✅ | KV_REDIS_URL — dashboard persists across Lambda invocations |
| Withdrawal flow | ✅ | Arc (instant, USDC=gas), Base Sepolia + Unichain Sepolia (CCTP verified) |
| Cloudflare Worker template | ✅ | `templates/cloudflare-worker.ts` — standalone, no deps |
| Dashboard accounting | ✅ | Lifetime Earned = Gateway Balance + Total Withdrawn (Circle ground truth) |
| Chain gas detection | ✅ | Dropdown only shows chains where merchant has native gas |
| /docs/merchant + /docs/buyer | ✅ | Quickstart pages with hero CTA buttons on landing |

---

## Interface contract with Person A

**Person A (buyer/MCP server) must:**
- Use `@circle-fin/x402-batching/client` → `GatewayClient` (NOT the root export)
- Call `client.pay(url)` — handles the full round-trip automatically
- Chain: `arcTestnet` (chainId 5042002)
- Have USDC deposited in Circle Gateway before calling `client.pay()` (use `client.deposit()`)

**We emit (402 response):**
```json
{
  "x402Version": 2,
  "resource": { "url": "...", "mimeType": "application/json", "description": "NanoCrawl paid content" },
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:5042002",
    "asset": "0x3600000000000000000000000000000000000000",
    "amount": "1000",
    "payTo": "0x<seller-wallet>",
    "maxTimeoutSeconds": 345600,
    "extra": {
      "name": "GatewayWalletBatched",
      "version": "1",
      "verifyingContract": "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"
    }
  }]
}
```
Same object is also in the `PAYMENT-REQUIRED` header (Base64-encoded JSON).

**We accept (PAYMENT-SIGNATURE header):**
Base64-encoded JSON with `x402Version`, `payload.authorization`, `payload.signature`, `resource`, `accepted`.

**We return on 200:**
- `PAYMENT-RESPONSE` header: Base64-encoded JSON with `{ success, transaction, network, payer }`
- `X-NanoCrawl-Cached: true/false`

**Both flows supported:**
- Standard round-trip: GET → 402 → retry with PAYMENT-SIGNATURE ✅
- Proactive (single request): send PAYMENT-SIGNATURE immediately from robots.txt metadata ✅
  (no server changes needed — the proxy handles either)

---

## Critical gotchas (save Person A from these)

1. **`resource.description` is required** — Circle Gateway settle API returns
   `"Invalid request: paymentPayload.resource.description: Required"` if missing.
   Even though the x402 spec marks it optional, Circle enforces it.

2. **GatewayClient is in a subpath** — `@circle-fin/x402-batching` root only exports
   utility functions. GatewayClient is at `@circle-fin/x402-batching/client`.

3. **Gateway balance ≠ on-chain balance** — `client.getBalances()` returns both.
   `gateway.available` must be > 0 before `client.pay()` works. Call `client.deposit()`
   first if only on-chain balance is funded.

4. **Circle settle endpoint** — correct URL is
   `https://gateway-api-testnet.circle.com/v1/x402/settle` (no `/gateway/` prefix).

5. **Next.js rewrite + query params** — in a route handler that is the *target* of a
   `NextResponse.rewrite()`, use `request.nextUrl.searchParams` not `new URL(request.url)`.
   The latter gives the original client URL.

6. **Arc Testnet chain registration** — `@x402/evm` peer dep is required at runtime.
   Install it: `npm install @x402/evm --save-dev`.

---

## Key addresses (Arc Testnet)

| Item | Address |
|------|---------|
| USDC | `0x3600000000000000000000000000000000000000` |
| GatewayWallet | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |
| GatewayMinter | `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B` |
| Chain ID | 5042002 |
| CAIP-2 | `eip155:5042002` |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com |

---

## Pending

- [x] Vercel deploy — https://nanocrawl.vercel.app
- [x] Redis persistence — payments survive cold starts, dashboard shows live revenue
- [x] Cloudflare Worker template (`templates/cloudflare-worker.ts`) — merchant artefact
- [x] Withdrawal via Circle CCTP (`app/api/withdraw/route.ts`)
- [x] Robustness tests (`lib/__tests__/verify-and-serve.test.ts`) — 93 tests total
- [x] Dashboard: Lifetime Earned, withdrawal tracking, chain dropdown with gas filter
- [x] /docs/merchant and /docs/buyer sub-pages with hero CTA buttons
- [ ] Connect GitHub repo to Vercel for auto-deploy on push (currently deploying manually with `vercel --prod`)
- [ ] `.well-known/ai-pay` JSON endpoint
- [ ] Landing page copy rework — current positioning section is too CF-centric without context; needs full rewrite once demo audience is clearer. Keep structure, rework prose.
- [ ] Architecture diagram fine-tuning — SVG is live, review with fresh eyes
- [ ] Person A integration — MCP server + live AI agent demo (critical for judging)
- [ ] Add cross-chain buyer note to /docs/buyer (future roadmap item)
