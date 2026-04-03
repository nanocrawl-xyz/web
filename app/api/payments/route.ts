// Node.js runtime — payment log for the merchant dashboard.
// GET /api/payments?limit=50  → recent PaymentEvent[]

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getRecentPayments, getTotalRevenue, getRevenueByRoute } from '../../../lib/payments-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500)

  const payments = await getRecentPayments(limit)
  const totalRevenue = await getTotalRevenue()
  const revenueByRoute = await getRevenueByRoute()

  return NextResponse.json({
    payments,
    totalRevenue,
    revenueByRoute,
    count: payments.length,
  })
}
