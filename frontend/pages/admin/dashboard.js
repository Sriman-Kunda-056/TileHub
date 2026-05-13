import { useEffect, useState } from 'react';
import { withAuth } from '../../lib/auth';
import { analyticsAPI, inventoryAPI } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.getDashboard(), inventoryAPI.getAlerts()])
      .then(([dash, inv]) => {
        setData(dash.data);
        setAlerts(inv.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Loading dashboard...</div>;

  const { summary, top_products, recent_orders, monthly_revenue } = data || {};

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Welcome back — here's your business at a glance</p>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Monthly Revenue', value: `₹${(summary?.monthly_revenue || 0).toLocaleString('en-IN')}`, color: 'text-green-600' },
          { label: 'Orders this month', value: summary?.monthly_orders || 0, color: 'text-blue-600' },
          { label: 'Pending Shipments', value: summary?.pending_shipments || 0, color: 'text-amber-600' },
          { label: 'Low Stock Alerts', value: summary?.low_stock_alerts || 0, color: summary?.low_stock_alerts > 0 ? 'text-red-600' : 'text-gray-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="card">
          <h2 className="text-sm font-medium mb-4">Revenue — last 6 months</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly_revenue || []}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${parseInt(v).toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock alerts */}
        <div className="card">
          <h2 className="text-sm font-medium mb-3">Stock alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400 mt-8 text-center">✅ All stock levels are healthy</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-gray-400">{a.sku} · {a.category}</div>
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${a.alert_level === 'out_of_stock' ? 'red' : a.alert_level === 'critical' ? 'red' : 'amber'}`}>
                      {a.available_boxes} boxes
                    </span>
                  </div>
                </div>
              ))}
              {alerts.length > 6 && (
                <Link href="/admin/inventory" className="text-xs text-green-600 hover:underline">View all {alerts.length} alerts →</Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-green-600 hover:underline">View all</Link>
          </div>
          <table className="w-full">
            <thead><tr>
              <th className="th">Order</th><th className="th">Customer</th><th className="th">Amount</th><th className="th">Status</th>
            </tr></thead>
            <tbody>
              {(recent_orders || []).map(o => (
                <tr key={o.id}>
                  <td className="td font-mono text-xs">{o.order_number}</td>
                  <td className="td">{o.customer_name || '—'}</td>
                  <td className="td font-medium">₹{parseInt(o.total_amount).toLocaleString('en-IN')}</td>
                  <td className="td"><span className={`badge badge-${o.status === 'delivered' ? 'green' : o.status === 'cancelled' ? 'red' : 'amber'}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top products */}
        <div className="card">
          <h2 className="text-sm font-medium mb-3">Top products (last 30 days)</h2>
          <div className="space-y-3">
            {(top_products || []).map((p, i) => (
              <div key={p.sku} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.sku}</div>
                </div>
                <div className="text-sm font-medium text-green-600">{p.total_sold} boxes</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, ['admin', 'accountant']);
