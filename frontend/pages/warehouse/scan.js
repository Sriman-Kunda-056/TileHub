import { useState, useEffect, useRef } from 'react';
import { withAuth } from '../../lib/auth';
import { shipmentsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

function WarehouseScan() {
  const [mode, setMode] = useState('select'); // select | scanning | confirm | done
  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const html5QrRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    shipmentsAPI.getAll({ status: 'pending' }).then(r => setShipments(r.data));
  }, []);

  const startCameraScanner = async () => {
    setMode('scanning');
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner.stop();
            handleQRResult(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error(err);
        toast.error('Camera not available. Use manual selection below.');
        setMode('select');
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (_) {}
    }
    setMode('select');
  };

  const handleQRResult = async (qrData) => {
    setLoading(true);
    try {
      const res = await shipmentsAPI.scan(qrData);
      setScanResult(res.data);
      setMode('done');
      toast.success('Shipment dispatched! Stock updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid QR code');
      setMode('select');
    } finally { setLoading(false); }
  };

  const handleManualDispatch = async (shipment) => {
    setSelected(shipment);
    setMode('confirm');
  };

  const confirmDispatch = async () => {
    setLoading(true);
    try {
      const res = await shipmentsAPI.dispatch(selected.id);
      setScanResult({ shipment: res.data });
      setMode('done');
      toast.success('Dispatched! Inventory updated automatically.');
      setShipments(prev => prev.filter(s => s.id !== selected.id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Dispatch failed');
      setMode('select');
    } finally { setLoading(false); }
  };

  const reset = () => { setMode('select'); setScanResult(null); setSelected(null); };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="page-title">QR Scanner</h1>
      <p className="page-sub">Scan shipment QR to dispatch and auto-deduct stock</p>

      {/* SELECT MODE */}
      {mode === 'select' && (
        <div>
          <button onClick={startCameraScanner} className="btn btn-primary w-full mb-4 text-base py-3">
            📷 Open Camera Scanner
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="flex-1 border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-gray-50 text-xs text-gray-400">or manually select shipment</span></div>
          </div>

          {shipments.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p>No pending shipments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shipments.map(s => (
                <div key={s.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-sm font-medium">{s.shipment_number}</div>
                      <div className="font-medium text-gray-800">{s.customer_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.delivery_address}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(s.items || []).map(i => `${i.product_name} ×${i.quantity_boxes}`).join(', ')}
                      </div>
                    </div>
                    <button onClick={() => handleManualDispatch(s)} className="btn btn-primary btn-sm shrink-0">
                      Dispatch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCANNING MODE */}
      {mode === 'scanning' && (
        <div>
          <div className="card mb-4 text-center">
            <p className="text-sm text-gray-500 mb-3">Point camera at the shipment QR code</p>
            <div id="qr-reader" className="rounded-lg overflow-hidden" style={{ width: '100%' }} />
          </div>
          <button onClick={stopScanner} className="btn btn-secondary w-full">Cancel</button>
        </div>
      )}

      {/* CONFIRM MODE */}
      {mode === 'confirm' && selected && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Confirm Dispatch</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="font-mono text-sm text-amber-700 mb-1">{selected.shipment_number}</div>
            <div className="font-medium">{selected.customer_name}</div>
            <div className="text-sm text-gray-500 mt-1">{selected.delivery_address}</div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Items to be dispatched:</div>
            {(selected.items || []).map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                <span>{item.product_name}</span>
                <span className="font-medium text-red-500">−{item.quantity_boxes} boxes</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            ⚠️ Stock will be automatically deducted from inventory once dispatched.
          </p>

          <div className="flex gap-3">
            <button onClick={confirmDispatch} disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Dispatching...' : '✓ Confirm Dispatch'}
            </button>
            <button onClick={() => setMode('select')} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* DONE MODE */}
      {mode === 'done' && (
        <div className="card text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-semibold text-xl text-green-700 mb-1">Dispatched!</h2>
          <p className="text-gray-500 text-sm mb-4">Inventory has been updated automatically</p>

          {scanResult?.shipment && (
            <div className="bg-green-50 rounded-lg p-4 text-left mb-4">
              <div className="font-mono text-sm text-green-700">{scanResult.shipment.shipment_number}</div>
              <div className="text-sm font-medium">{scanResult.shipment.customer_name}</div>
              {scanResult.already_dispatched && (
                <div className="text-xs text-amber-600 mt-1">⚠️ This shipment was already dispatched earlier</div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="btn btn-primary flex-1">Scan Next</button>
            <button onClick={() => window.location.href = '/warehouse/shipments'} className="btn btn-secondary">View All</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(WarehouseScan, ['admin', 'warehouse']);
