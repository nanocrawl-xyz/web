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

## What is working (continued)

| Component | Status | Notes |
|-----------|--------|-------|
| `.well-known/ai-pay` JSON manifest | ✅ | `app/.well-known/ai-pay/route.ts` — typed bootstrap for agent SDKs |
| Payment history table on dashboard | ✅ | Columns: time, buyer, page, amount, receipt link |
| `/payments/:id` receipt page | ✅ | Full payment detail; honest settlement framing (TEE-verified, batch on-chain async) |
| Withdrawal history table on dashboard | ✅ | Per-withdrawal records with chain, txHash, explorer link |
| Withdrawal storage (full events) | ✅ | `WithdrawalEvent` in Redis list + SQLite; chain + txHash stored |
| Architecture diagram: shortcut flow | ✅ | Left-side bracket shows skip-402 optimization when robots.txt pre-read |
| Architecture diagram: withdrawal deemphasis | ✅ | Stacked boxes for CCTP destinations, muted arrows |
| `/docs/merchant`: discovery layer | ✅ | 4-box integration overview; robots.txt + .well-known/ai-pay auto-served |
| "See It Live" curl demo on landing | ✅ | Two curl commands showing 402 → paid 200 exchange |

---

## Key findings / design decisions

### On-chain settlement transparency (from Arc team discussion)
Circle Gateway batch settlement is **random** — no correlation between buyers/sellers in a batch.
Intent is 100k individual settles brought on-chain together. Arc team has indexing tooling planned
but nothing available yet. **Implications:**
- No per-payment on-chain tx hash exists. Receipt page shows Circle Gateway UUID (TEE-verified) — honest framing.
- "Cryptographic not accounting" claim is still valid: EIP-3009 sig verified by TEE per request.
- On-chain settlement is asynchronous at Gateway discretion. Diagram updated accordingly.
- Arc block explorer cannot be used to show individual payments.

### Multiple buyers / seller-centric dashboard
Dashboard is seller-centric (all buyers aggregated). Per-buyer view (filter by payer address)
is possible from existing data but deferred. Buyer address is stored on every PaymentEvent.

### Unlink privacy layer (from Unlink team discussion)
Unlink is deployed on **Base Sepolia only** (not Arc Testnet). To demo private agentic payments:
- Seller must accept x402 payments on Base Sepolia (Phase 1.5 — multi-network support)
- Buyer (Person A) uses Unlink BurnerWallet: ephemeral EOA funded from ZK pool
- On-chain: burner address visible, not real agent — buyer identity shielded
- Receipt page already notes: "may be an Unlink burner for buyer privacy"
- Narrative: "first private agentic nanopayments" — strong hackathon differentiator

### robots.txt vs .well-known/ai-pay (complementary, not redundant)
Both are seller-side endpoints auto-served by NanoCrawl. robots.txt = RFC 9309 extension,
crawlers find it by convention. .well-known/ai-pay = typed JSON bootstrap for agent SDKs
(analogous to /.well-known/openid-configuration). Documented in /docs/merchant.

---

## Pending

- [x] Vercel deploy — https://nanocrawl.vercel.app
- [x] Redis persistence — payments survive cold starts, dashboard shows live revenue
- [x] Cloudflare Worker template (`templates/cloudflare-worker.ts`) — merchant artefact
- [x] Withdrawal via Circle CCTP (`app/api/withdraw/route.ts`)
- [x] Robustness tests (`lib/__tests__/verify-and-serve.test.ts`) — 93 tests total
- [x] Dashboard: Lifetime Earned, withdrawal tracking, chain dropdown with gas filter
- [x] /docs/merchant and /docs/buyer sub-pages with hero CTA buttons
- [x] `.well-known/ai-pay` JSON endpoint
- [x] Payment history table + `/payments/:id` receipt page
- [x] Withdrawal history table on dashboard
- [x] Architecture diagram: shortcut flow annotation, withdrawal deemphasis
- [x] /docs/merchant: discovery layer (robots.txt + .well-known/ai-pay) positioning
- [x] **Phase 1.5 — Multi-network seller (Arc Testnet + Base Sepolia)**
  - `accepts[]` in 402 response now has both networks — agent picks one
  - `fetchGatewayBalance()` queries both chains, returns combined total
  - robots.txt and `.well-known/ai-pay` advertise both networks
  - BatchFacilitatorClient.settle() is network-agnostic — no code change needed
  - **Seller needs nothing extra:** settle() is a pure API call — no gas, no pre-deposit. Seller balance accumulates as payments come in.
  - **Person A needs:** Base Sepolia USDC (Circle faucet) + small ETH for gas → `gateway.deposit()` on Base Sepolia before paying
- [ ] **Person A integration** — MCP server + live AI agent demo (critical for judging)
- [ ] **Unlink privacy demo** — depends on Phase 1.5 + Person A
- [ ] Connect GitHub repo to Vercel for auto-deploy (blocked on private org repo)
- [ ] Landing page copy rework — defer until demo audience clearer
- [ ] Add cross-chain buyer note to /docs/buyer (future roadmap item)
