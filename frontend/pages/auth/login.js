import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ROLES = [
  { key:'admin',      label:'Admin / Owner',    icon:'🏢', gradient:'from-violet-500 to-purple-600', badge:'bg-violet-50 border-violet-200 text-violet-700',    desc:'Full access to all modules',      phone:'+919876543210', redirect:'/admin/dashboard'    },
  { key:'sales',      label:'Sales Staff',       icon:'🛒', gradient:'from-blue-500 to-blue-600',     badge:'bg-blue-50 border-blue-200 text-blue-700',           desc:'Orders, quotations & billing',    phone:'+919876543211', redirect:'/admin/orders'        },
  { key:'warehouse',  label:'Warehouse Worker',  icon:'📦', gradient:'from-amber-500 to-orange-500',  badge:'bg-amber-50 border-amber-200 text-amber-700',        desc:'QR scanner & dispatch',           phone:'+919876543212', redirect:'/warehouse/shipments' },
  { key:'accountant', label:'Accountant',        icon:'🧾', gradient:'from-emerald-500 to-green-600', badge:'bg-emerald-50 border-emerald-200 text-emerald-700',  desc:'Invoices & financial reports',    phone:'+919876543213', redirect:'/admin/billing'       },
  { key:'customer',   label:'Customer',          icon:'🪟', gradient:'from-pink-500 to-rose-500',     badge:'bg-pink-50 border-pink-200 text-pink-700',           desc:'Browse tiles & request quotes',   phone:'+919876500001', redirect:'/catalog'             },
];

export default function Login() {
  const [step, setStep]               = useState('role');
  const [selectedRole, setSelectedRole] = useState(null);
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const role = ROLES.find(r => r.key === selectedRole);

  const selectRole = (r) => {
    setSelectedRole(r.key);
    setPhone(''); setPassword(''); setError('');
    setStep('form');
  };

  const quickFill = () => {
    if (!role) return;
    setPhone(role.phone);
    setPassword('Admin@1234');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { phone, password });
      const { token, user } = res.data;
      Cookies.set('token', token, { expires: 7 });
      const map = { admin:'/admin/dashboard', sales:'/admin/orders', warehouse:'/warehouse/shipments', accountant:'/admin/billing', customer:'/catalog' };
      window.location.href = map[user.role] || '/catalog';
    } catch (err) {
      if (!err.response)              setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      else if (err.response.status === 401) setError('Incorrect phone or password. Use the "Fill demo credentials" button to auto-fill.');
      else if (err.response.status === 403) setError('Account deactivated. Contact admin.');
      else                            setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-600 opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 opacity-10 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-lg">🏠</div>
          <span className="text-xl font-bold text-white">Tile<span className="text-green-400">Hub</span> Pro</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">Your complete tile<br />business platform</h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10">Inventory · Orders · QR Dispatch<br />GST Billing · Analytics — all in one.</p>
          <div className="space-y-3.5">
            {[
              ['📦','QR-based auto stock deduction on dispatch'],
              ['🧾','GST invoices with one-click PDF export'],
              ['📊','Real-time analytics and low-stock alerts'],
              ['📱','Mobile app for warehouse QR scanning'],
            ].map(([icon,text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-gray-600">© 2025 TileHub Pro · All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">🏠</div>
            <span className="text-lg font-bold">Tile<span className="text-green-600">Hub</span> Pro</span>
          </div>

          {/* STEP 1 — Role selection */}
          {step === 'role' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm mb-7">Select your role to continue</p>
              <div className="space-y-2.5">
                {ROLES.map(r => (
                  <button key={r.key} onClick={() => selectRole(r)}
                    className="flex items-center gap-4 w-full text-left p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all group">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{r.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700 font-semibold mb-1">🔐 Demo credentials</p>
                <p className="text-xs text-blue-600">All accounts · Password: <span className="font-mono font-bold">Admin@1234</span></p>
              </div>
            </div>
          )}

          {/* STEP 2 — Login form */}
          {step === 'form' && role && (
            <div>
              <button onClick={() => { setStep('role'); setError(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-7 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to roles
              </button>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-5 ${role.badge}`}>
                {role.icon} {role.label}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
              <p className="text-gray-500 text-sm mb-7">
                Access the <span className="font-medium text-gray-700">{role.label}</span> panel
              </p>

              {/* Demo fill */}
              <button type="button" onClick={quickFill}
                className="w-full mb-5 py-2.5 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all flex items-center justify-center gap-2 font-medium">
                ⚡ Fill demo credentials
              </button>

              <form onSubmit={handleLogin} noValidate>
                {/* Phone */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">📱</span>
                    <input type="tel" required autoComplete="tel" value={phone}
                      onChange={e => { setPhone(e.target.value); setError(''); }}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">🔑</span>
                    <input type={showPass ? 'text' : 'password'} required autoComplete="current-password" value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-16 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-red-500 shrink-0">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Login failed</p>
                      <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading || !phone || !password}
                  className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all bg-gradient-to-r ${role.gradient} hover:opacity-90 active:scale-[0.99] disabled:opacity-50 shadow-sm`}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : `Sign in as ${role.label}`}
                </button>
              </form>

              {/* Credentials hint box */}
              <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 mb-2">📋 {role.label} credentials</p>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Phone</span>
                  <span className="font-mono font-bold text-gray-700">{role.phone}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Password</span>
                  <span className="font-mono font-bold text-gray-700">Admin@1234</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

Login.getLayout = (page) => page; 