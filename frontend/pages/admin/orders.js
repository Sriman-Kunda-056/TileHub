import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';
import { ordersAPI, productsAPI, customersAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'badge-gray',
  confirmed: 'badge-blue',
  processing: 'badge-amber',
  dispatched: 'badge-amber',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

const SHIP_COLORS = {
  pending: 'badge-amber',
  dispatched: 'badge-blue',
  delivered: 'badge-green',
  returned: 'badge-red',
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity_boxes: 1 }]);
  const [form, setForm] = useState({ customer_id: '', notes: '', delivery_address: '', delivery_date: '' });
  const [updatingId, setUpdatingId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({ status: statusFilter || undefined });
      setOrders(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  useEffect(() => {
    if (showCreate) {
      productsAPI.getAll({ limit: 100 }).then(r => setProducts(r.data.products));
      customersAPI.getAll().then(r => setCustomers(r.data));
    }
  }, [showCreate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const validItems = orderItems.filter(i => i.product_id && i.quantity_boxes > 0);
    if (!validItems.length) return toast.error('Add at least one product');
    try {
      await ordersAPI.create({ ...form, items: validItems });
      toast.success('Order created as draft. Confirm it to auto-generate a shipment.');
      setShowCreate(false);
      setOrderItems([{ product_id: '', quantity_boxes: 1 }]);
      setForm({ customer_id: '', notes: '', delivery_address: '', delivery_date: '' });
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await ordersAPI.updateStatus(id, status);
      const { message, shipment } = res.data;

      if (shipment && status === 'confirmed') {
        toast.success(
          `✅ ${message}`,
          { duration: 5000, style: { maxWidth: '420px' } }
        );
      } else {
        toast.success(message || 'Status updated');
      }
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally { setUpdatingId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">
            Confirming an order <span className="text-green-600 font-medium">automatically creates a shipment</span> and reserves stock
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ New Order</button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'draft', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn text-xs py-1.5 ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
        <span className="text-blue-500 text-base">💡</span>
        <p className="text-xs text-blue-700">
          <strong>Workflow:</strong> Create order (draft) → Change to <strong>Confirmed</strong> → Shipment auto-created → Warehouse scans QR to dispatch → Stock deducted automatically.
        </p>
      </div>

      {/* Create order form */}
      {showCreate && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">New Order</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Customer *</label>
                <select className="input" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required>
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Delivery date</label>
                <input type="date" className="input" value={form.delivery_date} onChange={e => setForm({...form, delivery_date: e.target.value})} />
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Delivery address</label>
              <input className="input" value={form.delivery_address} onChange={e => setForm({...form, delivery_address: e.target.value})} placeholder="Full delivery address" />
            </div>

            <div className="mb-3">
              <label className="label">Order items</label>
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select className="input" value={item.product_id}
                    onChange={e => { const n=[...orderItems]; n[idx].product_id=e.target.value; setOrderItems(n); }}>
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} · ₹{p.price_per_sqft}/sqft · {p.available_boxes || 0} boxes available
                      </option>
                    ))}
                  </select>
                  <input type="number" min="1" className="input w-28" placeholder="Boxes"
                    value={item.quantity_boxes}
                    onChange={e => { const n=[...orderItems]; n[idx].quantity_boxes=parseInt(e.target.value)||1; setOrderItems(n); }} />
                  {orderItems.length > 1 && (
                    <button type="button" onClick={() => setOrderItems(orderItems.filter((_,i)=>i!==idx))}
                      className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setOrderItems([...orderItems, {product_id:'',quantity_boxes:1}])}
                className="text-xs text-green-600 hover:underline mt-1">+ Add another item</button>
            </div>

            <div className="mb-4">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any special instructions..." />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg mb-4 text-xs text-amber-700">
              ⚡ Order will be created as <strong>Draft</strong>. Change status to <strong>Confirmed</strong> to automatically generate a shipment and QR code.
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">Create Order</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Orders table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="th">Order #</th>
              <th className="th">Customer</th>
              <th className="th">Amount</th>
              <th className="th">Payment</th>
              <th className="th">Status</th>
              <th className="th">Shipment</th>
              <th className="th">Date</th>
              <th className="th">Change Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="td text-center py-10 text-gray-400">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="td text-center py-10 text-gray-400">No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="td font-mono text-xs text-gray-600">{o.order_number}</td>
                <td className="td">
                  <div className="font-medium text-sm">{o.customer_name || '—'}</div>
                  <div className="text-xs text-gray-400">{o.customer_phone}</div>
                </td>
                <td className="td font-semibold">₹{parseInt(o.total_amount).toLocaleString('en-IN')}</td>
                <td className="td">
                  <span className={`badge ${
                    o.payment_status === 'paid' ? 'badge-green' :
                    o.payment_status === 'partial' ? 'badge-blue' : 'badge-gray'
                  }`}>{o.payment_status}</span>
                </td>
                <td className="td">
                  <span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span>
                </td>
                <td className="td">
                  {o.shipment_number ? (
                    <div>
                      <div className="font-mono text-xs text-gray-600">{o.shipment_number}</div>
                      <span className={`badge ${SHIP_COLORS[o.shipment_status] || 'badge-gray'} mt-0.5`}>{o.shipment_status}</span>
                    </div>
                  ) : o.status === 'draft' ? (
                    <span className="text-xs text-gray-400 italic">Confirm to generate</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="td text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                <td className="td">
                  {updatingId === o.id ? (
                    <span className="text-xs text-gray-400">Updating...</span>
                  ) : (
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer hover:border-gray-300"
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      disabled={o.status === 'cancelled'}
                    >
                      {['draft','confirmed','processing','dispatched','delivered','cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withAuth(AdminOrders, ['admin', 'sales']);