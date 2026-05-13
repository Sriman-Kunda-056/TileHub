import Link from 'next/link';
import { useEffect, useState } from 'react';
import { productsAPI } from '../lib/api';

const CATEGORIES = [
  { name: 'Floor Tiles', emoji: '⬜', slug: 'floor-tiles' },
  { name: 'Wall Tiles', emoji: '🟦', slug: 'wall-tiles' },
  { name: 'Bathroom', emoji: '🚿', slug: 'bathroom-tiles' },
  { name: 'Kitchen', emoji: '🍳', slug: 'kitchen-tiles' },
  { name: 'Outdoor', emoji: '🌿', slug: 'outdoor-tiles' },
  { name: 'Prayer Room', emoji: '🕯️', slug: 'prayer-room-tiles' },
  { name: 'Decorative', emoji: '✨', slug: 'decorative-tiles' },
  { name: 'Accessories', emoji: '🔧', slug: 'tile-accessories' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    productsAPI.getAll({ featured: 'true', limit: 4 }).then(r => setFeatured(r.data.products)).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-100 p-12 mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Premium Tiles for<br />Every Space
        </h1>
        <p className="text-gray-500 text-lg mb-6 max-w-xl mx-auto">
          Browse 500+ tile designs — floor, wall, bathroom, kitchen, outdoor and more. Get instant quotes and doorstep delivery.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/catalog" className="btn btn-primary text-base px-6 py-2.5">Browse Catalog →</Link>
          <Link href="/calculator" className="btn btn-secondary text-base px-6 py-2.5">Tile Calculator</Link>
          <Link href="/inquiry" className="btn btn-secondary text-base px-6 py-2.5">Get Quote</Link>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map(c => (
            <Link key={c.slug} href={`/catalog?category=${c.slug}`}
              className="card hover:shadow-md transition-shadow text-center py-5 hover:border-green-200">
              <div className="text-3xl mb-2">{c.emoji}</div>
              <div className="text-sm font-medium text-gray-700">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured products */}
      {featured.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Featured Products</h2>
            <Link href="/catalog" className="text-sm text-green-600 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {featured.map(p => (
              <Link key={p.id} href={`/product/${p.id}`} className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-gray-100 flex items-center justify-center text-4xl">🪟</div>
                <div className="p-3">
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.finish} · {p.material}</div>
                  <div className="text-green-600 font-semibold text-sm mt-1">₹{p.price_per_sqft}/sqft</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Why us */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: '🚚', title: 'Fast Delivery', desc: 'Doorstep delivery within 3–5 days across Karnataka' },
          { icon: '🧾', title: 'GST Invoices', desc: 'Proper tax invoices for all B2B and B2C purchases' },
          { icon: '📐', title: 'Free BOQ', desc: 'Get a detailed Bill of Quantity for your project' },
          { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy on unopened boxes' },
          { icon: '💬', title: '24hr Quotes', desc: 'Get custom quotation within 24 hours' },
          { icon: '🏪', title: 'Showroom', desc: 'Visit us to see 500+ designs in person' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card flex gap-3">
            <div className="text-2xl shrink-0">{icon}</div>
            <div>
              <div className="font-medium text-sm">{title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card text-center py-10 bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Ready to start your project?</h2>
        <p className="text-gray-500 text-sm mb-4">Our team will help you choose the perfect tiles and calculate your requirement.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/inquiry" className="btn btn-primary px-6 py-2.5">Request Free Quote</Link>
          <Link href="/calculator" className="btn btn-secondary px-6 py-2.5">Use Calculator</Link>
        </div>
      </div>
    </div>
  );
}
