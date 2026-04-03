import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NanoCrawl — Pay-per-Crawl for the AI Web',
  description:
    'An MCP server that lets AI agents autonomously pay for web content via Circle Nanopayments. Publishers earn from crawler traffic. AI gets legal, fresh data.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
