import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { Toaster } from 'react-hot-toast';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '🪟' },
  { href: '/admin/inventory', label: 'Inventory', icon: '📦' },
  { href: '/admin/orders', label: 'Orders', icon: '🛒' },
  { href: '/admin/shipments', label: 'Shipments', icon: '🚚' },
  { href: '/admin/billing', label: 'Billing', icon: '🧾' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/quotations', label: 'Quotations', icon: '💬' },
];

const warehouseNav = [
  { href: '/warehouse/shipments', label: 'Shipments', icon: '🚚' },
  { href: '/warehouse/scan', label: 'Scan QR', icon: '📷' },
  { href: '/warehouse/inventory', label: 'Inventory', icon: '📦' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isCustomer = !user || user.role === 'customer';
  const isWarehouse = user?.role === 'warehouse';
  const nav = isWarehouse ? warehouseNav : adminNav;

  // Customer layout — no sidebar
  if (isCustomer) {
    return (
      <>
        <Toaster position="top-right" />
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
            <Link href="/" className="text-lg font-semibold">
              Tile<span className="text-green-600">Hub</span> Pro
            </Link>
            <Link href="/catalog" className="text-sm text-gray-600 hover:text-gray-900">Catalog</Link>
            <Link href="/calculator" className="text-sm text-gray-600 hover:text-gray-900">Calculator</Link>
            <Link href="/inquiry" className="text-sm text-gray-600 hover:text-gray-900">Get Quote</Link>
            <div className="ml-auto flex gap-3 items-center">
              {user ? (
                <>
                  <span className="text-sm text-gray-500">Hi, {user.name}</span>
                  <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
                </>
              ) : (
                <Link href="/auth/login" className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700">Login</Link>
              )}
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-base font-semibold">Tile<span className="text-green-600">Hub</span> Pro</div>
            <div className="text-xs text-gray-400 mt-0.5 capitalize">{user.role} Panel</div>
          </div>
          <nav className="flex-1 py-3">
            {nav.map(item => {
              const active = router.pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    active ? 'bg-green-50 text-green-700 font-medium border-r-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-700 mb-0.5">{user.name}</div>
            <div className="text-xs text-gray-400">{user.phone}</div>
            <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 mt-2">Sign out</button>
          </div>
        </aside>
        {/* Main */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-5xl">{children}</div>
        </main>
      </div>
    </>
  );
}
