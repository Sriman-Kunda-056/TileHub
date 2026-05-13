import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';
import { customersAPI } from '../../lib/api';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersAPI.getAll().then(r => setCustomers(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Customers</h1>
      <p className="page-sub">{customers.length} registered customers</p>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr><th className="th">Name</th><th className="th">Phone</th><th className="th">Company</th><th className="th">GST</th><th className="th">City</th><th className="th">Purchases</th><th className="th">Joined</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="td text-center py-8 text-gray-400">Loading...</td></tr>
            : customers.length === 0 ? <tr><td colSpan={7} className="td text-center py-8 text-gray-400">No customers yet</td></tr>
            : customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="td font-medium">{c.name}</td>
                <td className="td font-mono text-xs">{c.phone}</td>
                <td className="td text-gray-500">{c.company_name || '—'}</td>
                <td className="td text-gray-400 text-xs font-mono">{c.gst_number || '—'}</td>
                <td className="td text-gray-500">{c.city || '—'}</td>
                <td className="td font-medium text-green-600">₹{parseInt(c.total_purchases || 0).toLocaleString('en-IN')}</td>
                <td className="td text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default withAuth(AdminCustomers, ['admin', 'sales', 'accountant']);
