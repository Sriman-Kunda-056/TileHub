import { useState } from 'react';
import Link from 'next/link';

const TILE_SIZES = [
  { label: '20×20 cm', area: 0.04 },
  { label: '30×30 cm', area: 0.09 },
  { label: '30×60 cm', area: 0.18 },
  { label: '40×40 cm', area: 0.16 },
  { label: '45×45 cm', area: 0.2025 },
  { label: '60×60 cm', area: 0.36 },
  { label: '80×80 cm', area: 0.64 },
  { label: '100×100 cm', area: 1.0 },
];

const PRICE_TIERS = [
  { label: 'Economy', price: 30, color: 'text-gray-600' },
  { label: 'Standard', price: 55, color: 'text-blue-600' },
  { label: 'Premium', price: 100, color: 'text-amber-600' },
  { label: 'Luxury', price: 180, color: 'text-purple-600' },
];

export default function Calculator() {
  const [form, setForm] = useState({ length: '', width: '', tileSize: 0.36, wastage: 10, sqftPerBox: 10 });
  const [rooms, setRooms] = useState([{ name: 'Room 1', length: '', width: '' }]);
  const [mode, setMode] = useState('single');

  const calcRoom = (l, w) => {
    if (!l || !w) return null;
    const areaSqm = parseFloat(l) * parseFloat(w);
    const areaSqft = areaSqm * 10.764;
    const withWastage = areaSqft * (1 + parseFloat(form.wastage) / 100);
    const tilesNeeded = Math.ceil((areaSqm * (1 + form.wastage / 100)) / form.tileSize);
    const boxesNeeded = Math.ceil(withWastage / parseFloat(form.sqftPerBox));
    return { areaSqm: areaSqm.toFixed(2), areaSqft: areaSqft.toFixed(1), withWastage: withWastage.toFixed(1), tilesNeeded, boxesNeeded };
  };

  const singleResult = calcRoom(form.length, form.width);
  const multiResults = rooms.map(r => ({ ...r, result: calcRoom(r.length, r.width) }));
  const totalBoxes = multiResults.reduce((a, r) => a + (r.result?.boxesNeeded || 0), 0);
  const totalSqft = multiResults.reduce((a, r) => a + (r.result ? parseFloat(r.result.withWastage) : 0), 0);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Tile Quantity Calculator</h1>
      <p className="text-gray-500 text-sm mb-6">Calculate exactly how many tiles and boxes you need</p>

      <div className="flex gap-2 mb-5">
        {[['single','Single Room'],['multi','Multiple Rooms']].map(([m,l]) => (
          <button key={m} onClick={() => setMode(m)} className={`btn ${mode===m?'btn-primary':'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="col-span-3 grid grid-cols-3 gap-4">
          <div>
            <label className="label">Tile size</label>
            <select className="input" onChange={e => setForm({...form, tileSize: parseFloat(e.target.value)})}>
              {TILE_SIZES.map(s => <option key={s.label} value={s.area}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Wastage %</label>
            <input className="input" type="number" min="5" max="30" value={form.wastage} onChange={e => setForm({...form, wastage: e.target.value})} />
          </div>
          <div>
            <label className="label">Sqft per box</label>
            <input className="input" type="number" min="1" value={form.sqftPerBox} onChange={e => setForm({...form, sqftPerBox: e.target.value})} />
          </div>
        </div>
      </div>

      {/* Single room */}
      {mode === 'single' && (
        <div className="card mb-5">
          <h2 className="font-medium mb-4">Room Dimensions</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="label">Length (meters)</label><input className="input text-lg" type="number" step="0.1" placeholder="e.g. 5.5" value={form.length} onChange={e => setForm({...form, length: e.target.value})} /></div>
            <div><label className="label">Width (meters)</label><input className="input text-lg" type="number" step="0.1" placeholder="e.g. 4.2" value={form.width} onChange={e => setForm({...form, width: e.target.value})} /></div>
          </div>

          {singleResult && (
            <div className="bg-green-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-lg p-3 text-center"><div className="text-2xl font-bold text-green-600">{singleResult.boxesNeeded}</div><div className="text-xs text-gray-500">Boxes required</div></div>
                <div className="bg-white rounded-lg p-3 text-center"><div className="text-2xl font-bold text-blue-600">{singleResult.tilesNeeded}</div><div className="text-xs text-gray-500">Tiles required</div></div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between"><span>Room area:</span><span className="font-medium">{singleResult.areaSqm} m² ({singleResult.areaSqft} sqft)</span></div>
                <div className="flex justify-between"><span>With {form.wastage}% wastage:</span><span className="font-medium">{singleResult.withWastage} sqft</span></div>
              </div>
              <div className="mt-3 border-t border-green-200 pt-3">
                <div className="text-xs font-medium text-gray-500 mb-2">Estimated cost range:</div>
                <div className="grid grid-cols-2 gap-2">
                  {PRICE_TIERS.map(t => (
                    <div key={t.label} className="flex justify-between text-xs bg-white rounded px-2 py-1.5">
                      <span className={`font-medium ${t.color}`}>{t.label}</span>
                      <span>₹{(singleResult.boxesNeeded * parseFloat(form.sqftPerBox) * t.price).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/inquiry" className="btn btn-primary w-full mt-3 text-center block">
                Get Exact Quote →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Multi room */}
      {mode === 'multi' && (
        <div className="card mb-5">
          <h2 className="font-medium mb-4">All Rooms</h2>
          {rooms.map((room, idx) => (
            <div key={idx} className="flex gap-3 mb-3 items-center">
              <input className="input w-32" placeholder="Room name" value={room.name} onChange={e => { const n=[...rooms]; n[idx].name=e.target.value; setRooms(n); }} />
              <input className="input w-24" type="number" step="0.1" placeholder="Length m" value={room.length} onChange={e => { const n=[...rooms]; n[idx].length=e.target.value; setRooms(n); }} />
              <input className="input w-24" type="number" step="0.1" placeholder="Width m" value={room.width} onChange={e => { const n=[...rooms]; n[idx].width=e.target.value; setRooms(n); }} />
              {room.result && <div className="text-sm font-medium text-green-600 whitespace-nowrap">{room.result.boxesNeeded} boxes</div>}
              {rooms.length > 1 && <button onClick={() => setRooms(rooms.filter((_,i)=>i!==idx))} className="text-red-400 hover:text-red-600 text-lg">✕</button>}
            </div>
          ))}
          <button onClick={() => setRooms([...rooms, { name:`Room ${rooms.length+1}`, length:'', width:'' }])} className="text-sm text-green-600 hover:underline mb-4">+ Add room</button>

          {totalBoxes > 0 && (
            <div className="bg-green-50 rounded-xl p-4 mt-2">
              <div className="flex gap-4 mb-3">
                <div className="flex-1 bg-white rounded-lg p-3 text-center"><div className="text-2xl font-bold text-green-600">{totalBoxes}</div><div className="text-xs text-gray-500">Total boxes</div></div>
                <div className="flex-1 bg-white rounded-lg p-3 text-center"><div className="text-2xl font-bold text-blue-600">{totalSqft.toFixed(0)}</div><div className="text-xs text-gray-500">Total sqft</div></div>
              </div>
              {multiResults.filter(r=>r.result).map(r => (
                <div key={r.name} className="flex justify-between text-sm py-1 border-b border-green-100 last:border-0">
                  <span className="text-gray-600">{r.name}</span>
                  <span className="font-medium">{r.result.boxesNeeded} boxes · {r.result.areaSqm} m²</span>
                </div>
              ))}
              <Link href="/inquiry" className="btn btn-primary w-full mt-3 text-center block">Get Exact Quote →</Link>
            </div>
          )}
        </div>
      )}

      <div className="card bg-blue-50 border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-1">💡 Pro tip</h3>
        <p className="text-xs text-blue-600">Always buy 10–15% extra tiles for future repairs and replacements. Tiles from the same batch have identical color tones.</p>
      </div>
    </div>
  );
}
