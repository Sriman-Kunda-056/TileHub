import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';
import { analyticsAPI } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [stock, setStock] = useState([]);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: new Date(new Date().setDate(1)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    Promise.all([analyticsAPI.getDashboard(), analyticsAPI.getStock()])
      .then(([d, s]) => { setData(d.data); setStock(s.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    analyticsAPI.getSales(dateRange).then(r => setSales(r.data));
  }, [dateRange]);

  if (loading) return <div className="text-gray-400 text-sm">Loading analytics...</div>;

  return (
    <div>
      <h1 className="page-title">Analytics</h1>
      <p className="page-sub">Revenue, sales, and inventory insights</p>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Monthly Revenue', value: `₹${parseInt(data?.summary?.monthly_revenue || 0).toLocaleString('en-IN')}`, color: 'text-green-600' },
          { label: 'Monthly Orders', value: data?.summary?.monthly_orders || 0, color: 'text-blue-600' },
          { label: 'Pending Shipments', value: data?.summary?.pending_shipments || 0, color: 'text-amber-600' },
          { label: 'Low Stock Alerts', value: data?.summary?.low_stock_alerts || 0, color: data?.summary?.low_stock_alerts > 0 ? 'text-red-600' : 'text-gray-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Monthly revenue chart */}
        <div className="card">
          <h2 className="text-sm font-medium mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.monthly_revenue || []}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${parseInt(v).toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock by category pie */}
        <div className="card">
          <h2 className="text-sm font-medium mb-4">Stock by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stock} dataKey="total_available" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {stock.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, name, props) => [v + ' boxes', props.payload.category]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales report */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Sales Report</h2>
          <div className="flex gap-2 items-center">
            <input type="date" className="input w-36 text-xs" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" className="input w-36 text-xs" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} />
          </div>
        </div>
        {sales && (
          <div className="grid grid-cols-2 gap-5">
            <div>
              <h3 className="text-xs font-medium text-gray-500 mb-3">Daily revenue</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sales.daily_sales}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`₹${parseInt(v).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 mb-3">Top products</h3>
              <table className="w-full">
                <thead><tr><th className="th">Product</th><th className="th">Boxes</th><th className="th">Revenue</th></tr></thead>
                <tbody>
                  {(sales.top_products || []).map(p => (
                    <tr key={p.sku}><td className="td text-xs">{p.name}</td><td className="td text-xs">{p.boxes_sold}</td><td className="td text-xs font-medium">₹{parseInt(p.revenue).toLocaleString('en-IN')}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stock value table */}
      <div className="card">
        <h2 className="text-sm font-medium mb-3">Inventory Value by Category</h2>
        <table className="w-full">
          <thead><tr><th className="th">Category</th><th className="th">Products</th><th className="th">Available</th><th className="th">Reserved</th><th className="th">Delivered</th><th className="th">Stock Value</th></tr></thead>
          <tbody>
            {stock.map(s => (
              <tr key={s.category} className="hover:bg-gray-50">
                <td className="td font-medium">{s.category}</td>
                <td className="td">{s.product_count}</td>
                <td className="td">{s.total_available} boxes</td>
                <td className="td text-amber-600">{s.total_reserved} boxes</td>
                <td className="td text-gray-400">{s.total_delivered} boxes</td>
                <td className="td font-semibold text-green-600">₹{parseInt(s.stock_value).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withAuth(AdminAnalytics, ['admin', 'accountant']);
