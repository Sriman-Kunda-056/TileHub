import { useEffect, useState } from 'react';
import { withAuth } from '../../lib/auth';
import { inventoryAPI } from '../../lib/api';

function WarehouseInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { inventoryAPI.getAll().then(r => setInventory(r.data)).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <h1 className="page-title">Inventory View</h1>
      <p className="page-sub">Current stock levels — read only</p>
      {loading ? <div className="text-gray-400 text-sm">Loading...</div>
      : (
        <div className="space-y-2">
          {inventory.map(i => (
            <div key={i.product_id} className="card flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-gray-400 font-mono">{i.sku} · {i.warehouse_location || 'No location set'}</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${i.available_boxes < 20 ? 'text-red-600' : i.available_boxes < 100 ? 'text-amber-600' : 'text-green-600'}`}>{i.available_boxes}</div>
                <div className="text-xs text-gray-400">boxes available</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default withAuth(WarehouseInventory, ['admin', 'warehouse']);
