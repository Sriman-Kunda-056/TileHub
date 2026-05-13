import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { withAuth } from '../../lib/auth';
import { shipmentsAPI, productsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

function AdminShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity_boxes: 1 }]);
  const [form, setForm] = useState({ customer_name: '', delivery_address: '', driver_name: '', vehicle_number: '', notes: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await shipmentsAPI.getAll({ status: statusFilter || undefined });
      setShipments(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [statusFilter]);
  useEffect(() => {
    if (showCreate) productsAPI.getAll({ limit: 100 }).then(r => setProducts(r.data.products));
  }, [showCreate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.product_id && i.quantity_boxes > 0);
    if (!validItems.length) return toast.error('Add at least one item');
    try {
      await shipmentsAPI.create({ ...form, items: validItems });
      toast.success('Shipment created with QR code');
      setShowCreate(false);
      setItems([{ product_id: '', quantity_boxes: 1 }]);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create shipment');
    }
  };

  const handleDispatch = async (id) => {
    if (!confirm('Mark this shipment as dispatched?')) return;
    try {
      await shipmentsAPI.dispatch(id);
      toast.success('Shipment dispatched — stock updated');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const STATUS_COLORS = { pending: 'badge-amber', ready: 'badge-blue', dispatched: 'badge-green', delivered: 'badge-green', returned: 'badge-red' };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="page-title">Shipments</h1><p className="page-sub">Manage dispatch with QR-based inventory deduction</p></div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Create Shipment</button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'dispatched', 'delivered'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn text-xs py-1.5 ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card mb-6">
          <h2 className="font-medium mb-4">New Shipment</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="label">Customer name *</label><input className="input" required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} /></div>
              <div><label className="label">Delivery address *</label><input className="input" required value={form.delivery_address} onChange={e => setForm({...form, delivery_address: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="label">Driver name</label><input className="input" value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} /></div>
              <div><label className="label">Vehicle number</label><input className="input" value={form.vehicle_number} onChange={e => setForm({...form, vehicle_number: e.target.value})} placeholder="e.g. KA-01-AB-1234" /></div>
            </div>
            <div className="mb-3">
              <label className="label">Items</label>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select className="input" value={item.product_id} onChange={e => { const n=[...items]; n[idx].product_id=e.target.value; setItems(n); }} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.available_boxes} boxes available</option>)}
                  </select>
                  <input type="number" min="1" className="input w-28" placeholder="Boxes" value={item.quantity_boxes}
                    onChange={e => { const n=[...items]; n[idx].quantity_boxes=parseInt(e.target.value); setItems(n); }} />
                  {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_,i)=>i!==idx))} className="btn btn-danger px-2">✕</button>}
                </div>
              ))}
              <button type="button" onClick={() => setItems([...items, {product_id:'',quantity_boxes:1}])} className="text-xs text-green-600 hover:underline">+ Add item</button>
            </div>
            <div className="mb-4"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">Create & Generate QR</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* QR modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-xl">
            <h2 className="font-semibold mb-1">{qrModal.shipment_number}</h2>
            <p className="text-xs text-gray-400 mb-4">{qrModal.customer_name}</p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={qrModal.qr_code_data || qrModal.shipment_number} size={180} />
            </div>
            <p className="text-xs text-gray-400 mb-4">Scan this QR to dispatch and auto-deduct stock</p>
            <button onClick={() => setQrModal(null)} className="btn btn-secondary w-full">Close</button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr><th className="th">Shipment #</th><th className="th">Customer</th><th className="th">Items</th><th className="th">Status</th><th className="th">Created</th><th className="th">Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="td text-center py-8 text-gray-400">Loading...</td></tr>
            : shipments.length === 0 ? <tr><td colSpan={6} className="td text-center py-8 text-gray-400">No shipments</td></tr>
            : shipments.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="td font-mono text-xs">{s.shipment_number}</td>
                <td className="td">
                  <div className="font-medium">{s.customer_name}</div>
                  <div className="text-xs text-gray-400">{s.delivery_address}</div>
                </td>
                <td className="td text-xs text-gray-500">
                  {(s.items||[]).map(i => `${i.product_name} ×${i.quantity_boxes}`).join(', ')}
                </td>
                <td className="td"><span className={`badge ${STATUS_COLORS[s.status]||'badge-gray'}`}>{s.status}</span></td>
                <td className="td text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                <td className="td">
                  <div className="flex gap-2">
                    <button onClick={() => setQrModal(s)} className="text-xs btn btn-secondary py-1 px-2">📷 QR</button>
                    {s.status === 'pending' && (
                      <button onClick={() => handleDispatch(s.id)} className="text-xs btn btn-primary py-1 px-2">Dispatch</button>
                    )}
                    {s.status === 'dispatched' && (
                      <button onClick={async () => { await shipmentsAPI.markDelivered(s.id); toast.success('Marked delivered'); fetch(); }}
                        className="text-xs btn btn-secondary py-1 px-2">✓ Delivered</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withAuth(AdminShipments, ['admin', 'sales', 'warehouse']);
