// Node.js runtime — Server-Sent Events stream for the live dashboard.
//
// GET /api/events
// Dashboard subscribes once; server pushes a snapshot every 2 seconds.
// Includes: recent payments, total revenue, gateway balance.
//
// SSE is preferred over polling: single persistent connection, no missed updates,
// browser handles reconnect automatically.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getRecentPayments, getTotalRevenue, getRevenueByRoute } from '../../../lib/payments-store'
import { fetchGatewayBalance } from '../../../lib/settle'
import nanocrawlConfig, { unitsToUsdc } from '../../../nanocrawl.config'
import { ARC_TESTNET } from '../../../shared/config'

const PUSH_INTERVAL_MS = 2000

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const push = async () => {
        try {
          const payments = getRecentPayments(50)
          const totalRevenue = getTotalRevenue()
          const revenueByRoute = getRevenueByRoute()

          let balanceUsdc = 0
          try {
            const units = await fetchGatewayBalance(
              nanocrawlConfig.sellerWallet,
              ARC_TESTNET.domainId,
            )
            balanceUsdc = unitsToUsdc(units)
          } catch {
            // Balance fetch failing should not kill the SSE stream
          }

          const data = JSON.stringify({
            payments,
            totalRevenue,
            revenueByRoute,
            balanceUsdc,
            ts: Date.now(),
          })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (err) {
          console.error('SSE push error:', err)
        }
      }

      // Push immediately, then on interval
      await push()
      const interval = setInterval(push, PUSH_INTERVAL_MS)

      // Clean up when client disconnects
      // (ReadableStream cancel is called on client disconnect in Node.js)
      return () => clearInterval(interval)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
