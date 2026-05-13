import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';
import { productsAPI, categoriesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    sku: '', name: '', description: '', category_id: '',
    width_cm: '', height_cm: '', finish: 'Matte', material: 'Ceramic',
    color_family: '', room_type: '', price_per_sqft: '',
    tiles_per_box: 10, sqft_per_box: '', brand: '',
    initial_stock: 0, is_featured: false,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ search, limit: 50 });
      setProducts(res.data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    categoriesAPI.getAll().then(r => setCategories(r.data));
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await productsAPI.update(editProduct.id, form);
        toast.success('Product updated');
      } else {
        await productsAPI.create(form);
        toast.success('Product created');
      }
      setShowForm(false);
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    try {
      await productsAPI.remove(id);
      toast.success('Product deactivated');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (p) => {
    setForm({ ...p, initial_stock: 0 });
    setEditProduct(p);
    setShowForm(true);
  };

  const openAdd = () => {
    setForm({ sku:'',name:'',description:'',category_id:'',width_cm:'',height_cm:'',finish:'Matte',material:'Ceramic',color_family:'',room_type:'',price_per_sqft:'',tiles_per_box:10,sqft_per_box:'',brand:'',initial_stock:0,is_featured:false });
    setEditProduct(null);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">{products.length} items in catalog</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ Add Product</button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input className="input max-w-sm" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-base font-medium mb-4">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="label">SKU *</label><input className="input" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} required /></div>
              <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
              <div><label className="label">Category</label>
                <select className="input" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>
                  <option value="">Select category</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="label">Width (cm)</label><input className="input" type="number" value={form.width_cm} onChange={e=>setForm({...form,width_cm:e.target.value})} /></div>
              <div><label className="label">Height (cm)</label><input className="input" type="number" value={form.height_cm} onChange={e=>setForm({...form,height_cm:e.target.value})} /></div>
              <div><label className="label">Price per sqft (₹) *</label><input className="input" type="number" value={form.price_per_sqft} onChange={e=>setForm({...form,price_per_sqft:e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className="label">Finish</label>
                <select className="input" value={form.finish} onChange={e=>setForm({...form,finish:e.target.value})}>
                  {['Matte','Glossy','Anti-slip','Polished','Satin'].map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <div><label className="label">Material</label>
                <select className="input" value={form.material} onChange={e=>setForm({...form,material:e.target.value})}>
                  {['Ceramic','Porcelain','Marble','Terracotta','Granite','Vitrified'].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label className="label">Color family</label><input className="input" value={form.color_family} onChange={e=>setForm({...form,color_family:e.target.value})} placeholder="e.g. White, Grey" /></div>
              <div><label className="label">Room type</label><input className="input" value={form.room_type} onChange={e=>setForm({...form,room_type:e.target.value})} placeholder="e.g. Bathroom" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="label">Tiles per box</label><input className="input" type="number" value={form.tiles_per_box} onChange={e=>setForm({...form,tiles_per_box:e.target.value})} /></div>
              <div><label className="label">Sqft per box</label><input className="input" type="number" value={form.sqft_per_box} onChange={e=>setForm({...form,sqft_per_box:e.target.value})} /></div>
              {!editProduct && <div><label className="label">Initial stock (boxes)</label><input className="input" type="number" value={form.initial_stock} onChange={e=>setForm({...form,initial_stock:e.target.value})} /></div>}
            </div>
            <div className="mb-4"><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div className="mb-4 flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})} />
              <label htmlFor="featured" className="text-sm text-gray-600">Featured product</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">{editProduct ? 'Update Product' : 'Create Product'}</button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="th">SKU</th><th className="th">Name</th><th className="th">Category</th>
              <th className="th">Size</th><th className="th">Finish</th><th className="th">Price</th>
              <th className="th">Stock</th><th className="th">Featured</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="td text-center text-gray-400 py-8">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={9} className="td text-center text-gray-400 py-8">No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="td font-mono text-xs text-gray-500">{p.sku}</td>
                <td className="td font-medium">{p.name}</td>
                <td className="td"><span className="badge badge-blue">{p.category_name}</span></td>
                <td className="td text-gray-500">{p.width_cm}×{p.height_cm}cm</td>
                <td className="td text-gray-500">{p.finish}</td>
                <td className="td font-medium">₹{p.price_per_sqft}/sqft</td>
                <td className="td">
                  <span className={`badge badge-${p.available_boxes < 20 ? 'red' : p.available_boxes < 100 ? 'amber' : 'green'}`}>
                    {p.available_boxes || 0} boxes
                  </span>
                </td>
                <td className="td text-center">{p.is_featured ? '⭐' : '—'}</td>
                <td className="td">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withAuth(AdminProducts, ['admin', 'sales']);
