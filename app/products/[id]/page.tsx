// Product detail page.
// Humans see this normally.
// Crawlers are intercepted by middleware.ts → /api/verify-and-serve returns JSON content.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import products from '../../../data/products.json'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return products.map((p) => ({ id: p.id }))
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = products.find((p) => p.id === id)
  if (!product) notFound()

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-1">
        <Link href="/products" className="text-blue-500 text-sm hover:underline">← Products</Link>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
        <h1 className="text-3xl font-bold">{product.name}</h1>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{product.colorway}</span>
          <span className="text-2xl font-bold text-blue-400">${product.price}</span>
        </div>

        <p className="text-gray-300">{product.description}</p>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Available sizes</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <span key={size} className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded">
                {size}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-800 text-sm">
          <div>
            <p className="text-gray-500">Stock</p>
            <p className="font-medium">{product.stock} units</p>
          </div>
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium capitalize">{product.category}</p>
          </div>
          <div>
            <p className="text-gray-500">Release</p>
            <p className="font-medium">{product.releaseDate}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap pt-1">
          {product.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Crawler access note — visible to humans for transparency */}
      <p className="text-xs text-gray-600">
        AI crawler access to this page is priced at $0.001 via{' '}
        <a href="/" className="text-blue-600 hover:underline">NanoCrawl</a>.
      </p>
    </main>
  )
}
