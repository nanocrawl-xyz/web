#!/usr/bin/env bash
# NanoCrawl smoke tests — pre-demo checklist
#
# Assumes `npm run dev` is already running in another terminal.
# Run with: npm run smoke
#
# PASS = green, FAIL = red. Exit code 1 if any test fails.

set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

pass() { echo -e "${GREEN}PASS${RESET} $1"; ((PASS++)); }
fail() { echo -e "${RED}FAIL${RESET} $1"; ((FAIL++)); }

echo ""
echo "NanoCrawl smoke tests → $BASE_URL"
echo "────────────────────────────────────────"

# ── Test 1: Human browser gets 200 on landing page ───────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -H "accept-language: en-US,en;q=0.9" \
  -H "sec-fetch-dest: document" \
  "$BASE_URL/")
[ "$STATUS" = "200" ] && pass "GET /  (human) → 200" || fail "GET /  (human) → expected 200, got $STATUS"

# ── Test 2: Human browser gets 200 on product page ───────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -H "accept-language: en-US,en;q=0.9" \
  -H "sec-fetch-dest: document" \
  "$BASE_URL/products/1")
[ "$STATUS" = "200" ] && pass "GET /products/1  (human) → 200" || fail "GET /products/1  (human) → expected 200, got $STATUS"

# ── Test 3: Crawler with x-nanocrawl-capable gets 402 ────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-nanocrawl-capable: true" \
  "$BASE_URL/products/1")
[ "$STATUS" = "402" ] && pass "GET /products/1  (x-nanocrawl-capable) → 402" || fail "GET /products/1  (x-nanocrawl-capable) → expected 402, got $STATUS"

# ── Test 4: Known bot UA gets 402 ────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "user-agent: GPTBot/1.0" \
  "$BASE_URL/products/1")
[ "$STATUS" = "402" ] && pass "GET /products/1  (GPTBot UA) → 402" || fail "GET /products/1  (GPTBot UA) → expected 402, got $STATUS"

# ── Test 5: curl default UA gets 402 (missing browser headers) ───────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/products/1")
[ "$STATUS" = "402" ] && pass "GET /products/1  (bare curl) → 402" || fail "GET /products/1  (bare curl) → expected 402, got $STATUS"

# ── Test 6: 402 body is valid JSON with x402Version: 2 ───────────────────
BODY=$(curl -s -H "x-nanocrawl-capable: true" "$BASE_URL/products/1")
VERSION=$(echo "$BODY" | grep -o '"x402Version":2' || true)
[ -n "$VERSION" ] && pass "402 body contains x402Version: 2" || fail "402 body missing x402Version: 2 — got: $BODY"

# ── Test 7: 402 response has PAYMENT-REQUIRED header ─────────────────────
HEADER=$(curl -s -I -H "x-nanocrawl-capable: true" "$BASE_URL/products/1" \
  | grep -i "^payment-required:" || true)
[ -n "$HEADER" ] && pass "402 response has PAYMENT-REQUIRED header" || fail "402 response missing PAYMENT-REQUIRED header"

# ── Test 8: robots.txt includes NanoCrawl payment fields ─────────────────
ROBOTS=$(curl -s "$BASE_URL/api/robots.txt")
HAS_FEE=$(echo "$ROBOTS" | grep -o "Crawl-fee:" || true)
HAS_NETWORK=$(echo "$ROBOTS" | grep -o "Payment-Network:" || true)
[ -n "$HAS_FEE" ] && [ -n "$HAS_NETWORK" ] \
  && pass "robots.txt has Crawl-fee and Payment-Network fields" \
  || fail "robots.txt missing payment fields — got: $ROBOTS"

# ── Test 9: Dashboard page returns 200 ───────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "user-agent: Mozilla/5.0 (Windows NT 10.0)" \
  -H "accept-language: en-US" \
  "$BASE_URL/nanocrawl/dashboard")
[ "$STATUS" = "200" ] && pass "GET /nanocrawl/dashboard → 200" || fail "GET /nanocrawl/dashboard → expected 200, got $STATUS"

# ── Test 10: /api/payments returns JSON array ─────────────────────────────
PAYMENTS=$(curl -s "$BASE_URL/api/payments")
HAS_PAYMENTS=$(echo "$PAYMENTS" | grep -o '"payments":\[' || true)
[ -n "$HAS_PAYMENTS" ] && pass "GET /api/payments → JSON with payments array" || fail "GET /api/payments → unexpected response: $PAYMENTS"

# ── Summary ───────────────────────────────────────────────────────────────
echo "────────────────────────────────────────"
echo -e "Results: ${GREEN}${PASS} passed${RESET}  ${RED}${FAIL} failed${RESET}"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
