'use client'

import { useEffect, useState } from 'react'

interface Stats {
  count: number
  totalRevenue: number
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/payments?limit=500')
      .then((r) => r.json())
      .then((data) => setStats({ count: data.count ?? 0, totalRevenue: data.totalRevenue ?? 0 }))
      .catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <div className="flex gap-6 text-sm text-gray-400">
      <span>
        <span className="text-white font-semibold tabular-nums">{stats.count}</span> pages sold
      </span>
      <span>
        <span className="text-green-400 font-semibold tabular-nums">
          ${stats.totalRevenue.toFixed(4)}
        </span>{' '}
        USDC earned
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        live
      </span>
    </div>
  )
}
