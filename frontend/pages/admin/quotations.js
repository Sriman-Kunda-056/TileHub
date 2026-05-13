import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';
import { quotationsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

function AdminQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => { setLoading(true); quotationsAPI.getAll().then(r => setQuotations(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id, status) => {
    await quotationsAPI.updateStatus(id, status);
    toast.success('Status updated');
    fetch();
  };

  return (
    <div>
      <h1 className="page-title">Quotation Requests</h1>
      <p className="page-sub">Customer inquiries from the website</p>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr><th className="th">Quote #</th><th className="th">Customer</th><th className="th">Phone</th><th className="th">Product</th><th className="th">Dimensions</th><th className="th">Status</th><th className="th">Date</th><th className="th">Update</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="td text-center py-8 text-gray-400">Loading...</td></tr>
            : quotations.map(q => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="td font-mono text-xs">{q.quote_number}</td>
                <td className="td font-medium">{q.customer_name}</td>
                <td className="td font-mono text-xs">{q.customer_phone}</td>
                <td className="td text-sm">{q.product_name || '—'}</td>
                <td className="td text-xs text-gray-400">{q.room_dimensions || '—'}</td>
                <td className="td"><span className={`badge ${q.status==='pending'?'badge-amber':q.status==='converted'?'badge-green':'badge-gray'}`}>{q.status}</span></td>
                <td className="td text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString('en-IN')}</td>
                <td className="td">
                  <select className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white" value={q.status} onChange={e => updateStatus(q.id, e.target.value)}>
                    {['pending','contacted','quoted','converted','closed'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default withAuth(AdminQuotations, ['admin', 'sales']);
