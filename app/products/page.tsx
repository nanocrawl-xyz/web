// Product listing page.
// Humans see this normally.
// Crawlers are intercepted by middleware.ts before reaching here.

import Link from 'next/link'
import products from '../../data/products.json'

export default function ProductsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-2">
        <Link href="/" className="text-blue-500 text-sm hover:underline">← NanoCrawl</Link>
        <h1 className="text-3xl font-bold">Sneaker Catalog</h1>
        <p className="text-gray-400">
          Demo merchant site. Crawler access is priced at $0.001 per page via Circle Nanopayments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 space-y-2 block"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
                <h2 className="font-semibold text-lg">{product.name}</h2>
              </div>
              <span className="text-blue-400 font-bold">${product.price}</span>
            </div>
            <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
            <div className="flex gap-2 flex-wrap">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
