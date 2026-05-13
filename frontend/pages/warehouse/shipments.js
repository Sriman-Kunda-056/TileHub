import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withAuth } from '../../lib/auth';
import { shipmentsAPI } from '../../lib/api';

function WarehouseShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    setLoading(true);
    shipmentsAPI.getAll({ status: tab === 'all' ? undefined : tab }).then(r => setShipments(r.data)).finally(() => setLoading(false));
  }, [tab]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="page-title">Shipment Queue</h1><p className="page-sub">Scan QR to dispatch</p></div>
        <Link href="/warehouse/scan" className="btn btn-primary">📷 Scan QR</Link>
      </div>
      <div className="flex gap-2 mb-4">
        {['pending','dispatched','delivered','all'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`btn text-xs py-1.5 ${tab===t?'btn-primary':'btn-secondary'}`}>{t}</button>
        ))}
      </div>
      {loading ? <div className="text-gray-400 text-sm">Loading...</div>
      : shipments.length === 0 ? <div className="card text-center py-12 text-gray-400">No shipments found</div>
      : (
        <div className="space-y-3">
          {shipments.map(s=>(
            <div key={s.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-sm font-medium text-gray-500">{s.shipment_number}</div>
                  <div className="font-medium text-gray-900">{s.customer_name}</div>
                  <div className="text-xs text-gray-400">{s.delivery_address}</div>
                  <div className="text-xs text-gray-500 mt-1">{(s.items||[]).map(i=>`${i.product_name} ×${i.quantity_boxes}`).join(', ')}</div>
                  {s.driver_name && <div className="text-xs text-gray-400 mt-0.5">Driver: {s.driver_name} · {s.vehicle_number}</div>}
                </div>
                <div className="text-right">
                  <span className={`badge mb-2 ${s.status==='pending'?'badge-amber':s.status==='dispatched'?'badge-green':'badge-gray'}`}>{s.status}</span>
                  {s.status==='pending' && (
                    <div><Link href="/warehouse/scan" className="text-xs text-green-600 hover:underline block mt-1">Scan to dispatch →</Link></div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-300 mt-2">{new Date(s.created_at).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default withAuth(WarehouseShipments, ['admin', 'warehouse']);
