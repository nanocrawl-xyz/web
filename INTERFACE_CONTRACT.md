# NanoCrawl — Person A / Person B Interface Contract

This document is the source of truth for the HTTP interface between
**Person A (MCP server / buyer)** and **Person B (publisher / seller web app)**.

Live seller endpoint: **https://nanocrawl.vercel.app**

---

## Flow overview

### Standard round-trip (what GatewayClient.pay() does automatically)
```
GET /products/1
  → 402  PAYMENT-REQUIRED: <base64>
  → [buyer signs EIP-3009 off-chain]
GET /products/1  Payment-Signature: <base64>
  → 200  PAYMENT-RESPONSE: <base64>
```

### Proactive (single request — buyer pre-reads robots.txt)
```
GET /products/1  Payment-Signature: <base64>
  → 200  PAYMENT-RESPONSE: <base64>
```

Both flows are supported. No code change needed on Person B's side.

---

## 402 Response

**HTTP status:** 402  
**Headers:**
- `Content-Type: application/json`
- `PAYMENT-REQUIRED: <base64-encoded JSON>` — same object as body

**Body (PaymentRequired):**
```json
{
  "x402Version": 2,
  "resource": {
    "url": "https://nanocrawl.vercel.app/products/1",
    "mimeType": "application/json",
    "description": "NanoCrawl paid content"
  },
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:5042002",
    "asset": "0x3600000000000000000000000000000000000000",
    "amount": "1000",
    "payTo": "0x858872E7Ac20CF2398F9697FaA2B1BDc4A9e142e",
    "maxTimeoutSeconds": 345600,
    "extra": {
      "name": "GatewayWalletBatched",
      "version": "1",
      "verifyingContract": "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"
    }
  }]
}
```

**Amount:** `1000` base units = $0.001 USDC per page.

---

## PAYMENT-SIGNATURE header (buyer → seller)

Base64-encoded JSON with:
```json
{
  "x402Version": 2,
  "payload": {
    "authorization": {
      "from": "0x<buyer-address>",
      "to": "0x<payTo>",
      "value": "1000",
      "validAfter": "<unix-seconds>",
      "validBefore": "<unix-seconds>",
      "nonce": "0x<32-byte-hex>"
    },
    "signature": "0x<eip712-signature>"
  },
  "resource": { "url": "...", "mimeType": "...", "description": "..." },
  "accepted": { <same as accepts[0] above> }
}
```

---

## 200 Response

**Headers:**
- `PAYMENT-RESPONSE: <base64-encoded JSON>`
- `X-NanoCrawl-Cached: true | false`

**PAYMENT-RESPONSE decoded:**
```json
{
  "success": true,
  "transaction": "8a81a131-be8a-4248-90e8-11458e15dd0d",
  "network": "eip155:5042002",
  "payer": "0x<buyer-address>"
}
```

**Body:** The requested content as JSON (e.g. product object).

---

## Idempotency

Include in PAYMENT-SIGNATURE payload (inside `extensions`):
```json
"extensions": {
  "payment-identifier": { "id": "<uuid>" }
}
```
If the same `id` is seen twice, the server serves the content without re-settling.
Person A generates a fresh UUID per page request.

---

## robots.txt

`GET https://nanocrawl.vercel.app/robots.txt` — machine-readable payment policy:

```
Payment-Network:         eip155:5042002
Payment-Asset:           0x3600000000000000000000000000000000000000
Payment-PayTo:           0x858872E7Ac20CF2398F9697FaA2B1BDc4A9e142e
Payment-Scheme:          GatewayWalletBatched
Payment-VerifyingContract: 0x0077777d7EBA4688BDeF3E311b846F25870A19B9
Payment-MaxTimeoutSeconds: 345600
Crawl-fee:               0.001 USDC
```

---

## Person A quickstart checklist

- [ ] `npm install @circle-fin/x402-batching @x402/evm`
- [ ] Import from **`@circle-fin/x402-batching/client`** (not the root — GatewayClient is in the subpath)
- [ ] Chain name: `arcTestnet`
- [ ] Call `client.deposit("1")` before first `client.pay()` — Gateway balance must be > 0
- [ ] `resource.description` must be present in any payload you forward — Circle enforces it
- [ ] Test against `http://localhost:3000` (Person B's local) before going to Vercel

---

## Known working

Verified with `npm run crawl` against both localhost and https://nanocrawl.vercel.app:
- 3 × $0.001 USDC payments settled
- Circle Gateway UUIDs returned
- Dashboard shows revenue in real time
