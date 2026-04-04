// Architecture diagram — SVG, dark theme, matches site palette.
// Shows the full NanoCrawl flow: x402 round-trip, Circle Gateway on Arc,
// dual withdrawal paths. Designed for Circle DevRel audience.

export default function ArchDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 860 430"
        className="w-full"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11 }}
        aria-label="NanoCrawl architecture diagram"
      >
        <defs>
          {/* Arrowhead markers */}
          <marker id="a-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#60a5fa" />
          </marker>
          <marker id="a-amber" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
          </marker>
          <marker id="a-green" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
          </marker>
          <marker id="a-purple" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
          </marker>
          <marker id="a-gray" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6b7280" />
          </marker>
        </defs>

        {/* ── BUYER box ─────────────────────────────────────────── */}
        <rect x="10" y="15" width="235" height="155" rx="10"
          fill="#0c1829" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="117" y="36" textAnchor="middle" fill="#93c5fd" fontWeight="bold" letterSpacing="1">BUYER / AGENT</text>
        <line x1="10" y1="44" x2="245" y2="44" stroke="#3b82f6" strokeWidth="0.5" />
        <text x="25" y="62" fill="#e5e7eb">AI Agent</text>
        <text x="38" y="76" fill="#6b7280">Claude · GPT · custom script</text>
        <text x="25" y="97" fill="#e5e7eb">MCP Server</text>
        <text x="38" y="111" fill="#6b7280">GatewayClient (Circle SDK)</text>
        <text x="38" y="125" fill="#6b7280">wallet · budget · receipts</text>
        <text x="25" y="146" fill="#6b7280" fontStyle="italic">reads robots.txt payment policy</text>
        <text x="25" y="160" fill="#6b7280" fontStyle="italic">caches per-domain payment terms</text>

        {/* ── PUBLISHER box ─────────────────────────────────────── */}
        <rect x="615" y="15" width="235" height="155" rx="10"
          fill="#0c1f17" stroke="#10b981" strokeWidth="1.5" />
        <text x="732" y="36" textAnchor="middle" fill="#6ee7b7" fontWeight="bold" letterSpacing="1">NANOCRAWL PUBLISHER</text>
        <line x1="615" y1="44" x2="850" y2="44" stroke="#10b981" strokeWidth="0.5" />
        <text x="630" y="62" fill="#e5e7eb">Next.js Middleware</text>
        <text x="643" y="76" fill="#6b7280">bot detect · 402 or pass-through</text>
        <text x="630" y="97" fill="#e5e7eb">verify-and-serve</text>
        <text x="643" y="111" fill="#6b7280">settle · record · respond</text>
        <text x="630" y="132" fill="#e5e7eb">Merchant Dashboard</text>
        <text x="643" y="146" fill="#6b7280">live revenue · withdraw</text>
        <text x="643" y="160" fill="#6b7280">Lifetime Earned = balance + withdrawn</text>

        {/* ── PROTOCOL ARROWS (centre column) ───────────────────── */}
        {/* 1. GET request → */}
        <line x1="245" y1="60" x2="615" y2="60"
          stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#a-blue)" />
        <text x="430" y="53" textAnchor="middle" fill="#93c5fd" fontSize="10">① GET /products/1</text>

        {/* 2. 402 ← */}
        <line x1="615" y1="82" x2="245" y2="82"
          stroke="#fbbf24" strokeWidth="1.2" markerEnd="url(#a-amber)" />
        <text x="430" y="75" textAnchor="middle" fill="#fbbf24" fontSize="10">② 402  PAYMENT-REQUIRED  (price · network · payTo)</text>

        {/* 3. sign annotation */}
        <text x="430" y="101" textAnchor="middle" fill="#9ca3af" fontSize="10" fontStyle="italic">
          ③ sign EIP-3009 off-chain — zero gas, no on-chain tx
        </text>

        {/* 4. retry → */}
        <line x1="245" y1="120" x2="615" y2="120"
          stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#a-blue)" />
        <text x="430" y="113" textAnchor="middle" fill="#93c5fd" fontSize="10">④ GET + Payment-Signature: &lt;base64&gt;</text>

        {/* 5. 200 ← */}
        <line x1="615" y1="142" x2="245" y2="142"
          stroke="#34d399" strokeWidth="1.2" markerEnd="url(#a-green)" />
        <text x="430" y="135" textAnchor="middle" fill="#34d399" fontSize="10">⑤ 200  content + Payment-Response  X-NanoCrawl-Cached</text>

        {/* ── CIRCLE GATEWAY box ────────────────────────────────── */}
        <rect x="185" y="218" width="490" height="115" rx="10"
          fill="#120c1f" stroke="#7c3aed" strokeWidth="1.5" />
        <text x="430" y="239" textAnchor="middle" fill="#c4b5fd" fontWeight="bold" letterSpacing="1">CIRCLE GATEWAY — ARC TESTNET</text>
        <line x1="185" y1="246" x2="675" y2="246" stroke="#7c3aed" strokeWidth="0.5" />

        {/* Three columns inside gateway */}
        <text x="295" y="267" textAnchor="middle" fill="#e5e7eb">EIP-3009</text>
        <text x="295" y="281" textAnchor="middle" fill="#6b7280">Off-chain authorization</text>
        <text x="295" y="295" textAnchor="middle" fill="#6b7280">No gas per payment</text>

        <text x="430" y="267" textAnchor="middle" fill="#e5e7eb">Batch settlement</text>
        <text x="430" y="281" textAnchor="middle" fill="#6b7280">Payments aggregated</text>
        <text x="430" y="295" textAnchor="middle" fill="#6b7280">Settled on Arc periodically</text>

        <text x="568" y="267" textAnchor="middle" fill="#fbbf24">USDC = gas ★</text>
        <text x="568" y="281" textAnchor="middle" fill="#6b7280">Arc native currency</text>
        <text x="568" y="295" textAnchor="middle" fill="#6b7280">No separate gas token</text>

        {/* Separator between columns */}
        <line x1="358" y1="254" x2="358" y2="308" stroke="#7c3aed" strokeWidth="0.4" strokeDasharray="3,3" />
        <line x1="502" y1="254" x2="502" y2="308" stroke="#7c3aed" strokeWidth="0.4" strokeDasharray="3,3" />

        {/* Vertical arrow: publisher settle → gateway */}
        <line x1="732" y1="170" x2="672" y2="218"
          stroke="#6b7280" strokeWidth="1" markerEnd="url(#a-gray)" strokeDasharray="4,3" />
        <text x="730" y="200" textAnchor="middle" fill="#6b7280" fontSize="9">POST /settle</text>

        {/* ── WITHDRAWAL boxes ──────────────────────────────────── */}
        {/* Arrow: gateway → arc withdrawal */}
        <line x1="340" y1="333" x2="260" y2="368"
          stroke="#a78bfa" strokeWidth="1.2" markerEnd="url(#a-purple)" />

        {/* Arrow: gateway → cctp withdrawal */}
        <line x1="520" y1="333" x2="580" y2="368"
          stroke="#a78bfa" strokeWidth="1.2" markerEnd="url(#a-purple)" />

        {/* withdraw() label */}
        <text x="430" y="350" textAnchor="middle" fill="#9ca3af" fontSize="10" fontStyle="italic">withdraw()</text>

        {/* Arc wallet box */}
        <rect x="90" y="368" width="225" height="52" rx="8"
          fill="#120c1f" stroke="#7c3aed" strokeWidth="1.2" />
        <text x="202" y="386" textAnchor="middle" fill="#c4b5fd" fontWeight="bold">Arc Wallet</text>
        <text x="202" y="400" textAnchor="middle" fill="#6b7280">Same-chain · instant</text>
        <text x="202" y="413" textAnchor="middle" fill="#fbbf24" fontSize="10">USDC pays gas ★</text>

        {/* CCTP box */}
        <rect x="545" y="368" width="225" height="52" rx="8"
          fill="#120c1f" stroke="#7c3aed" strokeWidth="1.2" />
        <text x="657" y="386" textAnchor="middle" fill="#c4b5fd" fontWeight="bold">Base · Unichain · …</text>
        <text x="657" y="400" textAnchor="middle" fill="#6b7280">CCTP: burn on Arc</text>
        <text x="657" y="413" textAnchor="middle" fill="#6b7280">→ mint on destination</text>
      </svg>
    </div>
  )
}
