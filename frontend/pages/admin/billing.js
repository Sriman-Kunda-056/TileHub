import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';
import { billingAPI, productsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

function AdminBilling() {
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_mode: 'upi', transaction_ref: '', notes: '' });

  // BOQ state
  const [products, setProducts] = useState([]);
  const [boqCustomer, setBoqCustomer] = useState({ name: '', phone: '' });
  const [boqRooms, setBoqRooms] = useState([{ name: 'Living Room', length_m: '', width_m: '', product_id: '', wastage_pct: 10 }]);
  const [boqResult, setBoqResult] = useState(null);
  const [boqLoading, setBoqLoading] = useState(false);

  useEffect(() => {
    billingAPI.getInvoices().then(r => setInvoices(r.data)).finally(() => setLoading(false));
    productsAPI.getAll({ limit: 100 }).then(r => setProducts(r.data.products));
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await billingAPI.recordPayment(payModal.id, payForm);
      toast.success('Payment recorded');
      setPayModal(null);
      billingAPI.getInvoices().then(r => setInvoices(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleBOQ = async (e) => {
    e.preventDefault();
    setBoqLoading(true);
    try {
      const res = await billingAPI.generateBOQ({ ...boqCustomer, rooms: boqRooms });
      setBoqResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'BOQ generation failed');
    } finally { setBoqLoading(false); }
  };

  const STATUS_COLOR = { pending: 'badge-amber', partial: 'badge-blue', paid: 'badge-green', overdue: 'badge-red' };

  return (
    <div>
      <h1 className="page-title">Billing</h1>
      <p className="page-sub">GST invoices, payment tracking and BOQ generation</p>

      <div className="flex gap-2 mb-5">
        {[['invoices','🧾 Invoices'],['boq','📐 BOQ Generator']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`btn text-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {/* Invoices */}
      {tab === 'invoices' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="th">Invoice #</th><th className="th">Customer</th><th className="th">Total</th><th className="th">Paid</th><th className="th">Balance</th><th className="th">Status</th><th className="th">Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="td text-center py-8 text-gray-400">Loading...</td></tr>
              : invoices.length === 0 ? <tr><td colSpan={7} className="td text-center py-8 text-gray-400">No invoices yet</td></tr>
              : invoices.map(inv => {
                const balance = parseFloat(inv.total_amount) - parseFloat(inv.amount_paid || 0);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="td font-mono text-xs">{inv.invoice_number}</td>
                    <td className="td">
                      <div className="font-medium">{inv.customer_name}</div>
                      {inv.company_name && <div className="text-xs text-gray-400">{inv.company_name}</div>}
                    </td>
                    <td className="td font-medium">₹{parseInt(inv.total_amount).toLocaleString('en-IN')}</td>
                    <td className="td text-green-600">₹{parseInt(inv.amount_paid || 0).toLocaleString('en-IN')}</td>
                    <td className={`td font-medium ${balance > 0 ? 'text-red-500' : 'text-gray-400'}`}>₹{parseInt(balance).toLocaleString('en-IN')}</td>
                    <td className="td"><span className={`badge ${STATUS_COLOR[inv.payment_status] || 'badge-gray'}`}>{inv.payment_status}</span></td>
                    <td className="td">
                      <div className="flex gap-2">
                        <a href={billingAPI.getPDF(inv.id)} target="_blank" rel="noreferrer" className="text-xs btn btn-secondary py-1 px-2">PDF</a>
                        {inv.payment_status !== 'paid' && (
                          <button onClick={() => { setPayModal(inv); setPayForm({ amount: Math.max(0, balance).toString(), payment_mode: 'upi', transaction_ref: '', notes: '' }); }}
                            className="text-xs btn btn-primary py-1 px-2">Record Payment</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BOQ Generator */}
      {tab === 'boq' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h2 className="font-medium mb-4">Bill of Quantity Generator</h2>
            <form onSubmit={handleBOQ}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><label className="label">Customer name</label><input className="input" value={boqCustomer.name} onChange={e => setBoqCustomer({...boqCustomer, name: e.target.value})} required /></div>
                <div><label className="label">Phone</label><input className="input" value={boqCustomer.phone} onChange={e => setBoqCustomer({...boqCustomer, phone: e.target.value})} /></div>
              </div>
              <label className="label mb-2">Rooms</label>
              {boqRooms.map((room, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div><label className="label">Room name</label><input className="input" value={room.name} onChange={e => { const n=[...boqRooms]; n[idx].name=e.target.value; setBoqRooms(n); }} /></div>
                    <div><label className="label">Length (m)</label><input className="input" type="number" step="0.1" value={room.length_m} onChange={e => { const n=[...boqRooms]; n[idx].length_m=e.target.value; setBoqRooms(n); }} required /></div>
                    <div><label className="label">Width (m)</label><input className="input" type="number" step="0.1" value={room.width_m} onChange={e => { const n=[...boqRooms]; n[idx].width_m=e.target.value; setBoqRooms(n); }} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Tile product</label>
                      <select className="input" value={room.product_id} onChange={e => { const n=[...boqRooms]; n[idx].product_id=e.target.value; setBoqRooms(n); }} required>
                        <option value="">Select tile</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.price_per_sqft}/sqft</option>)}
                      </select>
                    </div>
                    <div><label className="label">Wastage %</label><input className="input" type="number" value={room.wastage_pct} onChange={e => { const n=[...boqRooms]; n[idx].wastage_pct=parseInt(e.target.value); setBoqRooms(n); }} /></div>
                  </div>
                  {boqRooms.length > 1 && (
                    <button type="button" onClick={() => setBoqRooms(boqRooms.filter((_,i)=>i!==idx))} className="text-xs text-red-500 hover:underline mt-2">Remove room</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setBoqRooms([...boqRooms, {name:'',length_m:'',width_m:'',product_id:'',wastage_pct:10}])} className="text-xs text-green-600 hover:underline mb-4">+ Add room</button>
              <button type="submit" disabled={boqLoading} className="btn btn-primary w-full">{boqLoading ? 'Generating...' : 'Generate BOQ'}</button>
            </form>
          </div>

          {/* BOQ Result */}
          {boqResult && (
            <div className="card">
              <h2 className="font-medium mb-1">BOQ — {boqResult.customer_name}</h2>
              <p className="text-xs text-gray-400 mb-4">{boqResult.phone}</p>
              {boqResult.rooms.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-3 mb-3 last:border-0">
                  <div className="font-medium text-sm">{r.room}</div>
                  <div className="text-xs text-gray-400">{r.product} · {r.area_sqm} m² ({r.area_sqft} sqft with {r.wastage_pct}% wastage)</div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>{r.boxes_required} boxes required</span>
                    <span className="font-medium text-green-600">₹{r.estimated_cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
              <div className="bg-green-50 rounded-lg p-3 mt-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{boqResult.summary.subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span>GST (18%)</span><span>₹{boqResult.summary.gst.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-semibold mt-1 pt-1 border-t border-green-200"><span>Grand Total</span><span className="text-green-700">₹{boqResult.summary.grand_total.toLocaleString('en-IN')}</span></div>
                <div className="text-xs text-gray-500 mt-1">Total boxes: {boqResult.summary.total_boxes} · Total area: {boqResult.summary.total_area_sqm} m²</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h2 className="font-semibold mb-1">Record Payment</h2>
            <p className="text-sm text-gray-400 mb-4">{payModal.invoice_number}</p>
            <form onSubmit={handlePayment}>
              <div className="mb-3"><label className="label">Amount (₹)</label><input className="input" type="number" required value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} /></div>
              <div className="mb-3"><label className="label">Payment mode</label>
                <select className="input" value={payForm.payment_mode} onChange={e => setPayForm({...payForm, payment_mode: e.target.value})}>
                  {['upi','cash','bank_transfer','cheque','card'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="mb-3"><label className="label">Transaction ref</label><input className="input" value={payForm.transaction_ref} onChange={e => setPayForm({...payForm, transaction_ref: e.target.value})} placeholder="UPI ID / cheque no." /></div>
              <div className="mb-4"><label className="label">Notes</label><input className="input" value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">Record Payment</button>
                <button type="button" onClick={() => setPayModal(null)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminBilling, ['admin', 'accountant', 'sales']);
