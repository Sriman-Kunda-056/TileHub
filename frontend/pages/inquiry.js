import { useState, useEffect } from 'react';
import { quotationsAPI, productsAPI, customersAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function Inquiry() {
  const [products, setProducts] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quote');
  const [form, setForm] = useState({ customer_name:'', customer_phone:'', customer_email:'', product_id:'', room_dimensions:'', message:'' });
  const [bookingForm, setBookingForm] = useState({ name:'', phone:'', visit_date:'', visit_time:'10:00', notes:'' });

  useEffect(() => { productsAPI.getAll({ limit: 100 }).then(r => setProducts(r.data.products)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await quotationsAPI.submit(form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await customersAPI.bookShowroom(bookingForm);
      toast.success('Showroom visit booked! We will confirm shortly.');
      setBookingForm({ name:'', phone:'', visit_date:'', visit_time:'10:00', notes:'' });
    } catch (err) {
      toast.error('Booking failed');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-semibold mb-2">Inquiry Received!</h1>
        <p className="text-gray-500 mb-6">Our team will call you within 24 hours with a detailed quotation.</p>
        <button onClick={() => setSubmitted(false)} className="btn btn-secondary">Submit another inquiry</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Get in Touch</h1>
      <p className="text-gray-500 text-sm mb-6">Request a quotation or book a showroom visit</p>

      <div className="flex gap-2 mb-5">
        {[['quote','📋 Request Quotation'],['visit','🏪 Book Showroom Visit']].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`btn ${activeTab===t ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {activeTab === 'quote' && (
        <div className="card">
          <h2 className="font-medium mb-4">Quotation Request</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="label">Your name *</label><input className="input" required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} /></div>
              <div><label className="label">Phone *</label><input className="input" type="tel" required value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} /></div>
            </div>
            <div className="mb-4"><label className="label">Email</label><input className="input" type="email" value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} /></div>
            <div className="mb-4">
              <label className="label">Tile you're interested in</label>
              <select className="input" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                <option value="">Select a tile (optional)</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.price_per_sqft}/sqft ({p.sku})</option>)}
              </select>
            </div>
            <div className="mb-4"><label className="label">Room dimensions</label><input className="input" placeholder="e.g. 12×10 ft living room" value={form.room_dimensions} onChange={e => setForm({...form, room_dimensions: e.target.value})} /></div>
            <div className="mb-5">
              <label className="label">Message</label>
              <textarea className="input min-h-20" rows={3} placeholder="Tell us about your project, budget, or any specific requirements..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
              {loading ? 'Sending...' : 'Send Inquiry'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'visit' && (
        <div className="card">
          <h2 className="font-medium mb-2">Book a Showroom Visit</h2>
          <p className="text-sm text-gray-400 mb-4">Visit our showroom to see 500+ tile designs in person</p>
          <form onSubmit={handleBooking}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="label">Name *</label><input className="input" required value={bookingForm.name} onChange={e => setBookingForm({...bookingForm, name: e.target.value})} /></div>
              <div><label className="label">Phone *</label><input className="input" type="tel" required value={bookingForm.phone} onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="label">Visit date *</label><input className="input" type="date" required min={new Date().toISOString().split('T')[0]} value={bookingForm.visit_date} onChange={e => setBookingForm({...bookingForm, visit_date: e.target.value})} /></div>
              <div>
                <label className="label">Preferred time</label>
                <select className="input" value={bookingForm.visit_time} onChange={e => setBookingForm({...bookingForm, visit_time: e.target.value})}>
                  {['10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-5"><label className="label">Notes</label><input className="input" placeholder="Any specific tiles you'd like to see?" value={bookingForm.notes} onChange={e => setBookingForm({...bookingForm, notes: e.target.value})} /></div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
              {loading ? 'Booking...' : 'Book Visit'}
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">📍 123 Tile Street, Bangalore · Mon–Sat 10am–6pm · +91 98765 43210</div>
          </div>
        </div>
      )}
    </div>
  );
}
