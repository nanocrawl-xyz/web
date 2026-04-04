// Architecture diagram — SVG, dark theme, matches site palette.
// Shows: standards (x402, robots.txt), SDK/toolkit layer, MCP as a skill,
// Circle Gateway on Arc, dual withdrawal paths. For Circle DevRel audience.

export default function ArchDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 900 500"
        className="w-full"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
        aria-label="NanoCrawl architecture diagram"
      >
        <defs>
          <marker id="a-blue"   markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#60a5fa" /></marker>
          <marker id="a-amber"  markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" /></marker>
          <marker id="a-green"  markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#34d399" /></marker>
          <marker id="a-purple" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" /></marker>
          <marker id="a-gray"   markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#6b7280" /></marker>
        </defs>

        {/* ── STANDARDS ROW (top banner) ───────────────────────── */}
        <text x="450" y="18" textAnchor="middle" fill="#4b5563" fontSize="9" letterSpacing="2">OPEN STANDARDS</text>

        {/* robots.txt pill */}
        <rect x="90" y="22" width="110" height="20" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <text x="145" y="35" textAnchor="middle" fill="#9ca3af" fontSize="9">robots.txt  (discovery)</text>

        {/* x402 pill */}
        <rect x="310" y="22" width="90" height="20" rx="4" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
        <text x="355" y="35" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">HTTP 402 / x402</text>

        {/* EIP-3009 pill */}
        <rect x="465" y="22" width="90" height="20" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <text x="510" y="35" textAnchor="middle" fill="#9ca3af" fontSize="9">EIP-3009  (auth)</text>

        {/* CCTP pill */}
        <rect x="660" y="22" width="90" height="20" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <text x="705" y="35" textAnchor="middle" fill="#9ca3af" fontSize="9">CCTP  (cross-chain)</text>

        {/* ── BUYER box ─────────────────────────────────────────── */}
        <rect x="10" y="55" width="255" height="190" rx="10"
          fill="#0c1829" stroke="#3b82f6" strokeWidth="1.5" />

        {/* AI Agent sub-section */}
        <text x="137" y="75" textAnchor="middle" fill="#93c5fd" fontWeight="bold" fontSize="11" letterSpacing="1">AI AGENT</text>
        <text x="137" y="90" textAnchor="middle" fill="#6b7280" fontSize="10">Claude · GPT · any MCP client</text>

        <line x1="10" y1="97" x2="265" y2="97" stroke="#1e40af" strokeWidth="0.5" strokeDasharray="3,3" />

        {/* MCP Skill sub-section */}
        <text x="137" y="113" textAnchor="middle" fill="#93c5fd" fontWeight="bold" fontSize="11" letterSpacing="1">MCP SKILL</text>

        {/* Skill box */}
        <rect x="25" y="119" width="225" height="30" rx="5" fill="#0f2040" stroke="#3b82f6" strokeWidth="1" />
        <text x="50" y="138" fill="#60a5fa" fontSize="11" fontWeight="bold">fetch_paid_page</text>
        <text x="207" y="138" fill="#6b7280" fontSize="10">(url)</text>

        <text x="25" y="163" fill="#6b7280" fontSize="10">① read robots.txt → discover price</text>
        <text x="25" y="177" fill="#6b7280" fontSize="10">② sign EIP-3009 off-chain — 0 gas</text>
        <text x="25" y="191" fill="#6b7280" fontSize="10">③ attach Payment-Signature header</text>
        <text x="25" y="205" fill="#6b7280" fontSize="10">④ return content to agent</text>

        {/* SDK label */}
        <text x="137" y="232" textAnchor="middle" fill="#374151" fontSize="9">SDK: @circle-fin/x402-batching/client</text>

        {/* ── PUBLISHER box ─────────────────────────────────────── */}
        <rect x="635" y="55" width="255" height="190" rx="10"
          fill="#0c1f17" stroke="#10b981" strokeWidth="1.5" />

        <text x="762" y="75" textAnchor="middle" fill="#6ee7b7" fontWeight="bold" fontSize="11" letterSpacing="1">PUBLISHER</text>
        <text x="762" y="90" textAnchor="middle" fill="#6b7280" fontSize="10">any website · API · content store</text>

        <line x1="635" y1="97" x2="890" y2="97" stroke="#065f46" strokeWidth="0.5" strokeDasharray="3,3" />

        <text x="762" y="113" textAnchor="middle" fill="#6ee7b7" fontWeight="bold" fontSize="11" letterSpacing="1">TOOLKITS</text>

        {/* Next.js toolkit box */}
        <rect x="650" y="119" width="105" height="42" rx="5" fill="#0a2010" stroke="#10b981" strokeWidth="1" />
        <text x="702" y="135" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">Next.js</text>
        <text x="702" y="149" textAnchor="middle" fill="#6b7280" fontSize="9">1 middleware import</text>
        <text x="702" y="160" textAnchor="middle" fill="#6b7280" fontSize="9">any route, any price</text>

        {/* CF Worker toolkit box */}
        <rect x="770" y="119" width="105" height="42" rx="5" fill="#0a2010" stroke="#10b981" strokeWidth="1" />
        <text x="822" y="135" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">CF Worker</text>
        <text x="822" y="149" textAnchor="middle" fill="#6b7280" fontSize="9">1-file template</text>
        <text x="822" y="160" textAnchor="middle" fill="#6b7280" fontSize="9">any origin / R2 / API</text>

        <text x="762" y="180" textAnchor="middle" fill="#6b7280" fontSize="10">verify-and-serve · record · dashboard</text>
        <text x="762" y="193" textAnchor="middle" fill="#6b7280" fontSize="10">idempotency · human pass-through</text>

        <text x="762" y="232" textAnchor="middle" fill="#374151" fontSize="9">SDK: @circle-fin/x402-batching/server</text>

        {/* ── PROTOCOL ARROWS (centre column) ───────────────────── */}
        {/* x402 label above arrows */}
        <text x="450" y="72" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">x402 Protocol</text>

        {/* GET → */}
        <line x1="265" y1="100" x2="635" y2="100" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#a-blue)" />
        <text x="450" y="95" textAnchor="middle" fill="#93c5fd" fontSize="10">GET /products/1</text>

        {/* 402 ← */}
        <line x1="635" y1="122" x2="265" y2="122" stroke="#fbbf24" strokeWidth="1.2" markerEnd="url(#a-amber)" />
        <text x="450" y="117" textAnchor="middle" fill="#fbbf24" fontSize="10">402  PAYMENT-REQUIRED</text>

        {/* robots.txt arrow — discovery */}
        <path d="M145 55 C145 42 355 42 355 22" stroke="#4b5563" strokeWidth="0.8" fill="none" strokeDasharray="3,2" markerEnd="url(#a-gray)" />

        {/* Shortcut bypass: bracket on left of GET/402 pair + label */}
        {/* vertical bracket covering the GET→402 round-trip */}
        <line x1="272" y1="93" x2="272" y2="130" stroke="#374151" strokeWidth="0.8" />
        <line x1="272" y1="93"  x2="276" y2="93"  stroke="#374151" strokeWidth="0.8" />
        <line x1="272" y1="130" x2="276" y2="130" stroke="#374151" strokeWidth="0.8" />
        {/* dashed skip arrow from bottom of bracket to GET+sig row */}
        <line x1="272" y1="130" x2="272" y2="157" stroke="#374151" strokeWidth="0.8" strokeDasharray="3,2" markerEnd="url(#a-gray)" />
        {/* label */}
        <text x="268" y="113" textAnchor="end" fill="#6b7280" fontSize="8.5" fontStyle="italic">skip if</text>
        <text x="268" y="124" textAnchor="end" fill="#6b7280" fontSize="8.5" fontStyle="italic">robots.txt</text>
        <text x="268" y="135" textAnchor="end" fill="#6b7280" fontSize="8.5" fontStyle="italic">pre-read</text>
        <text x="268" y="153" textAnchor="end" fill="#fbbf24" fontSize="8" fontStyle="italic">⚡ 1 RTT saved</text>

        {/* sign annotation */}
        <text x="450" y="145" textAnchor="middle" fill="#9ca3af" fontSize="10" fontStyle="italic">sign EIP-3009 off-chain — zero gas</text>

        {/* GET + sig → */}
        <line x1="265" y1="163" x2="635" y2="163" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#a-blue)" />
        <text x="450" y="157" textAnchor="middle" fill="#93c5fd" fontSize="10">GET + Payment-Signature: &lt;base64&gt;</text>

        {/* 200 ← */}
        <line x1="635" y1="185" x2="265" y2="185" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#a-green)" />
        <text x="450" y="179" textAnchor="middle" fill="#34d399" fontSize="10">200  content  +  Payment-Response</text>

        {/* ── CIRCLE GATEWAY box ────────────────────────────────── */}
        <rect x="195" y="280" width="510" height="110" rx="10"
          fill="#120c1f" stroke="#7c3aed" strokeWidth="1.5" />
        <text x="450" y="300" textAnchor="middle" fill="#c4b5fd" fontWeight="bold" fontSize="11" letterSpacing="1">CIRCLE GATEWAY — ARC TESTNET</text>
        <line x1="195" y1="307" x2="705" y2="307" stroke="#7c3aed" strokeWidth="0.5" />

        <text x="310" y="326" textAnchor="middle" fill="#e5e7eb" fontSize="11">Batch settlement</text>
        <text x="310" y="340" textAnchor="middle" fill="#6b7280" fontSize="10">Per-request EIP-3009 sigs</text>
        <text x="310" y="354" textAnchor="middle" fill="#6b7280" fontSize="10">aggregated on-chain → low cost</text>

        <text x="450" y="326" textAnchor="middle" fill="#fbbf24" fontSize="11">USDC = gas ★</text>
        <text x="450" y="340" textAnchor="middle" fill="#6b7280" fontSize="10">Arc native currency</text>
        <text x="450" y="354" textAnchor="middle" fill="#6b7280" fontSize="10">merchants pay 0 to receive</text>

        <text x="592" y="326" textAnchor="middle" fill="#e5e7eb" fontSize="11">Trust-minimised</text>
        <text x="592" y="340" textAnchor="middle" fill="#6b7280" fontSize="10">Cryptographic, not accounting</text>
        <text x="592" y="354" textAnchor="middle" fill="#6b7280" fontSize="10">verifiable per request</text>

        <line x1="380" y1="314" x2="380" y2="368" stroke="#7c3aed" strokeWidth="0.4" strokeDasharray="3,3" />
        <line x1="520" y1="314" x2="520" y2="368" stroke="#7c3aed" strokeWidth="0.4" strokeDasharray="3,3" />

        {/* Arrow: publisher → settle */}
        <line x1="762" y1="245" x2="700" y2="280"
          stroke="#6b7280" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#a-gray)" />
        <text x="760" y="268" textAnchor="middle" fill="#6b7280" fontSize="9">POST /settle</text>

        {/* ── WITHDRAWAL ────────────────────────────────────────── */}
        <text x="450" y="412" textAnchor="middle" fill="#6b7280" fontSize="9" fontStyle="italic">withdraw()</text>

        <line x1="345" y1="390" x2="230" y2="422" stroke="#6d4fb5" strokeWidth="0.8" strokeDasharray="3,2" markerEnd="url(#a-purple)" />
        <line x1="555" y1="390" x2="650" y2="422" stroke="#6d4fb5" strokeWidth="0.8" strokeDasharray="3,2" markerEnd="url(#a-purple)" />

        {/* Arc wallet — single muted box */}
        <rect x="100" y="422" width="180" height="44" rx="6" fill="#0e0a1a" stroke="#4c1d95" strokeWidth="0.8" />
        <text x="190" y="439" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="bold">Arc Wallet</text>
        <text x="190" y="452" textAnchor="middle" fill="#4b5563" fontSize="9">same-chain · USDC=gas ★</text>
        <text x="190" y="463" textAnchor="middle" fill="#4b5563" fontSize="9">instant</text>

        {/* CCTP — stacked boxes suggesting multiple destination chains */}
        <rect x="618" y="430" width="172" height="36" rx="5" fill="#0c0a14" stroke="#3b1f6a" strokeWidth="0.7" />
        <rect x="613" y="426" width="172" height="36" rx="5" fill="#0e0b18" stroke="#4c1d95" strokeWidth="0.7" />
        <rect x="608" y="422" width="172" height="36" rx="5" fill="#0f0c1c" stroke="#5b21b6" strokeWidth="0.8" />
        <text x="694" y="437" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="bold">Base · Unichain · …</text>
        <text x="694" y="450" textAnchor="middle" fill="#4b5563" fontSize="9">CCTP: burn Arc → mint dest</text>
      </svg>
    </div>
  )
}
