export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { findPaymentById } from '../../../../lib/payments-store'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const payment = await findPaymentById(id)
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  return NextResponse.json(payment)
}
