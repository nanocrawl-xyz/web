/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is the default in Next.js 16.
  // better-sqlite3 (native Node.js module) is automatically external in API routes
  // under Turbopack — no manual webpack externals needed.
  turbopack: {},
}

module.exports = nextConfig
