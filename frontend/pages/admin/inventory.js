import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';
import { inventoryAPI } from '../../lib/api';
import toast from 'react-hot-toast';

function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustModal, setAdjustModal] = useState(null);
  const [form, setForm] = useState({ quantity_change: '', reason: 'purchase', note: '' });
  const [search, setSearch] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll();
      setInventory(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.adjust({
        product_id: adjustModal.product_id,
        quantity_change: parseInt(form.quantity_change),
        reason: form.reason,
        note: form.note,
      });
      toast.success('Stock adjusted');
      setAdjustModal(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const handleRestock = async (productId, name) => {
    try {
      await inventoryAPI.restock({ product_id: productId, quantity: 50, note: 'Quick restock +50' });
      toast.success(`${name} restocked +50 boxes`);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Restock failed');
    }
  };

  const filtered = inventory.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { ok: 'badge-green', low: 'badge-amber', critical: 'badge-red', out_of_stock: 'badge-red' };

  return (
    <div>
      <h1 className="page-title">Inventory</h1>
      <p className="page-sub">Live stock levels across all products</p>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total products', value: inventory.length },
          { label: 'Total boxes in stock', value: inventory.reduce((a, i) => a + i.available_boxes, 0).toLocaleString() },
          { label: 'Low / critical', value: inventory.filter(i => ['low','critical'].includes(i.stock_status)).length, warn: true },
          { label: 'Out of stock', value: inventory.filter(i => i.stock_status === 'out_of_stock').length, danger: true },
        ].map(({ label, value, warn, danger }) => (
          <div key={label} className="card">
            <div className={`text-2xl font-semibold ${danger && value > 0 ? 'text-red-600' : warn && value > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <input className="input max-w-xs" placeholder="Search product or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="th">Product</th><th className="th">Category</th>
              <th className="th">Available</th><th className="th">Reserved</th>
              <th className="th">Delivered</th><th className="th">Location</th>
              <th className="th">Status</th><th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="td text-center py-8 text-gray-400">Loading...</td></tr>
            ) : filtered.map(item => (
              <tr key={item.product_id} className="hover:bg-gray-50">
                <td className="td">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                </td>
                <td className="td"><span className="badge badge-blue">{item.category}</span></td>
                <td className="td font-semibold">{item.available_boxes}</td>
                <td className="td text-amber-600">{item.reserved_boxes}</td>
                <td className="td text-gray-400">{item.delivered_boxes}</td>
                <td className="td text-gray-400 text-xs">{item.warehouse_location || '—'}</td>
                <td className="td">
                  <span className={`badge ${statusColor[item.stock_status] || 'badge-gray'}`}>
                    {item.stock_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="td">
                  <div className="flex gap-2">
                    <button onClick={() => handleRestock(item.product_id, item.name)} className="text-xs btn btn-secondary py-1 px-2">+50</button>
                    <button onClick={() => { setAdjustModal(item); setForm({ quantity_change:'', reason:'purchase', note:'' }); }}
                      className="text-xs btn btn-secondary py-1 px-2">Adjust</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjust modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h2 className="font-semibold mb-1">Adjust Stock</h2>
            <p className="text-sm text-gray-500 mb-4">{adjustModal.name} · {adjustModal.available_boxes} boxes currently</p>
            <form onSubmit={handleAdjust}>
              <div className="mb-3">
                <label className="label">Quantity change (use negative to deduct)</label>
                <input className="input" type="number" required placeholder="e.g. 50 or -10"
                  value={form.quantity_change} onChange={e => setForm({...form, quantity_change: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="label">Reason</label>
                <select className="input" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}>
                  {['purchase','sale','return','adjustment','damage','transfer'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="label">Note (optional)</label>
                <input className="input" value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Reason for adjustment..." />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">Apply</button>
                <button type="button" onClick={() => setAdjustModal(null)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminInventory, ['admin', 'warehouse', 'sales']);
