import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsAPI, categoriesAPI } from '../lib/api';
import { useAuth } from '../lib/auth';

const FINISHES = ['All', 'Matte', 'Glossy', 'Anti-slip', 'Polished', 'Satin'];
const SIZES = ['All', '20x20', '30x30', '30x60', '40x40', '45x45', '60x60'];

export default function Catalog() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [filters, setFilters] = useState({
    search: '', category: '', finish: '', min_price: '', max_price: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 12;

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data));
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { ...filters, page, limit: LIMIT };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    productsAPI.getAll(params)
      .then(r => { setProducts(r.data.products); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [filters, page]);

  const toggleWishlist = (id) => {
    const updated = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const stockLabel = (boxes) => {
    if (!boxes || boxes <= 0) return { text: 'Out of stock', cls: 'badge-red' };
    if (boxes <= 20) return { text: 'Low stock', cls: 'badge-amber' };
    return { text: 'In stock', cls: 'badge-green' };
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Tile Catalog</h1>
      <p className="text-gray-500 text-sm mb-6">{total} designs available · browse by room, size, and finish</p>

      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          className="input max-w-xs"
          placeholder="Search tiles..."
          value={filters.search}
          onChange={e => { setFilters({...filters, search: e.target.value}); setPage(1); }}
        />
        <select className="input w-auto" value={filters.category} onChange={e => { setFilters({...filters, category: e.target.value}); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="input w-auto" value={filters.finish} onChange={e => { setFilters({...filters, finish: e.target.value}); setPage(1); }}>
          {FINISHES.map(f => <option key={f} value={f === 'All' ? '' : f}>{f}</option>)}
        </select>
        <input className="input w-28" type="number" placeholder="Min ₹" value={filters.min_price} onChange={e => { setFilters({...filters, min_price: e.target.value}); setPage(1); }} />
        <input className="input w-28" type="number" placeholder="Max ₹" value={filters.max_price} onChange={e => { setFilters({...filters, max_price: e.target.value}); setPage(1); }} />
        {(filters.search || filters.category || filters.finish || filters.min_price || filters.max_price) && (
          <button className="btn btn-secondary text-xs" onClick={() => { setFilters({ search:'',category:'',finish:'',min_price:'',max_price:'' }); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-5">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="card animate-pulse"><div className="h-40 bg-gray-100 rounded-lg mb-3" /><div className="h-4 bg-gray-100 rounded mb-2" /><div className="h-3 bg-gray-50 rounded" /></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-base">No tiles found for these filters</p>
          <button className="btn btn-secondary mt-4 text-sm" onClick={() => setFilters({search:'',category:'',finish:'',min_price:'',max_price:''})}>Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {products.map(p => {
            const stock = stockLabel(p.available_boxes);
            const inWishlist = wishlist.includes(p.id);
            return (
              <div key={p.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-100 relative">
                  {p.primary_image ? (
                    <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🪟</div>
                  )}
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-sm hover:scale-110 transition-transform"
                    title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {inWishlist ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{p.name}</h3>
                    <span className={`badge ${stock.cls} shrink-0`}>{stock.text}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{p.width_cm}×{p.height_cm}cm · {p.finish} · {p.material}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-semibold">₹{p.price_per_sqft}/sqft</span>
                    <Link href={`/product/${p.id}`} className="text-xs text-blue-600 hover:underline">View details →</Link>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">SKU: {p.sku}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button className="btn btn-secondary" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
