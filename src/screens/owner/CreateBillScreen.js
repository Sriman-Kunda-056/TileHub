import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadow } from '../../theme';
import { productService, customerService, billingService, orderService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function CreateBillScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: customer, 2: items, 3: review
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState([{ product_id: '', product: null, quantity_boxes: 1 }]);
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productService.getAll({ limit: 100 }),
      customerService.getAll(),
    ]).then(([p, c]) => {
      setProducts(p.data.products || []);
      setCustomers(c.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  const addItem = () => setItems(prev => [...prev, { product_id: '', product: null, quantity_boxes: 1 }]);

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const setItemProduct = (idx, productId) => {
    const product = products.find(p => p.id === productId);
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, product_id: productId, product } : item));
  };

  const setItemQty = (idx, qty) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity_boxes: parseInt(qty) || 1 } : item));
  };

  // Calculations
  const calcItem = (item) => {
    if (!item.product) return { sqft: 0, subtotal: 0 };
    const sqftPerBox = item.product.sqft_per_box || 10;
    const sqft = item.quantity_boxes * sqftPerBox;
    const subtotal = sqft * item.product.price_per_sqft;
    return { sqft, subtotal };
  };

  const subtotal = items.reduce((a, item) => a + calcItem(item).subtotal, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.product_id && i.quantity_boxes > 0);
    if (!customer) { Alert.alert('Missing', 'Please select a customer'); return; }
    if (!validItems.length) { Alert.alert('Missing', 'Please add at least one product'); return; }

    setSubmitting(true);
    try {
      // 1. Create order
      const orderRes = await orderService.create({
        customer_id: customer.id,
        items: validItems.map(i => ({ product_id: i.product_id, quantity_boxes: i.quantity_boxes })),
        notes,
        delivery_address: deliveryAddress || customer.billing_address,
      });

      // 2. Confirm order → auto-creates shipment + reserves stock
      const confirmRes = await orderService.updateStatus(orderRes.data.id, 'confirmed');

      // 3. Create invoice
      const invoiceRes = await billingService.createInvoice({
        order_id: orderRes.data.id,
        customer_id: customer.id,
        due_days: 30,
      });

      setResult({
        order: orderRes.data,
        shipment: confirmRes.data.shipment,
        invoice: invoiceRes.data,
      });
      setStep(4); // success
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── SUCCESS SCREEN ──
  if (step === 4 && result) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
        <LinearGradient colors={[Colors.success, '#15803d']} style={styles.successHeader}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>✅</Text>
          <Text style={styles.successTitle}>Bill Created!</Text>
          <Text style={styles.successSub}>Invoice and shipment generated</Text>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.card}>
            {[
              ['Invoice #', result.invoice?.invoice_number],
              ['Order #', result.order?.order_number],
              ['Shipment #', result.shipment?.shipment_number || 'Creating...'],
              ['Customer', customer?.name],
              ['Subtotal', `₹${Math.round(subtotal).toLocaleString('en-IN')}`],
              ['GST (18%)', `₹${Math.round(gst).toLocaleString('en-IN')}`],
              ['Total', `₹${Math.round(total).toLocaleString('en-IN')}`],
            ].map(([label, val]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={[styles.summaryVal, label === 'Total' && { fontSize: 16, fontWeight: '800', color: Colors.success }]}>{val || '—'}</Text>
              </View>
            ))}
          </View>

          {result.shipment && (
            <View style={[styles.card, { marginTop: 12, backgroundColor: Colors.warningBg, borderColor: Colors.warningBorder, borderWidth: 1 }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.warning, marginBottom: 4 }}>🚚 Shipment auto-created</Text>
              <Text style={{ fontSize: 12, color: Colors.gray600 }}>
                {result.shipment.shipment_number} is pending dispatch. Stock has been reserved. Warehouse can scan the QR to dispatch.
              </Text>
            </View>
          )}

          <View style={{ gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: result.invoice?.id })}>
              <Text style={styles.primaryBtnText}>View Invoice & QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setStep(1); setCustomer(null); setItems([{ product_id: '', product: null, quantity_boxes: 1 }]); setResult(null); }}>
              <Text style={styles.secondaryBtnText}>Create Another Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.gray50 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()}>
          <Text style={styles.backText}>← {step > 1 ? 'Back' : 'Cancel'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Bill</Text>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1,2,3].map(s => (
            <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= s && { color: Colors.primary }]}>{s}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.stepLabel}>{['Select Customer', 'Add Items', 'Review & Confirm'][step - 1]}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        {/* STEP 1: Customer selection */}
        {step === 1 && (
          <View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search customer by name or phone..."
              placeholderTextColor={Colors.gray400}
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
            {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}
            {filteredCustomers.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.customerRow, customer?.id === c.id && styles.customerRowSelected]}
                onPress={() => setCustomer(c)}
              >
                <View style={styles.customerAvatar}>
                  <Text style={{ fontSize: 18 }}>{c.company_name ? '🏢' : '👤'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <Text style={styles.customerPhone}>{c.phone}</Text>
                  {c.company_name && <Text style={styles.customerCompany}>{c.company_name}</Text>}
                </View>
                {customer?.id === c.id && <Text style={{ color: Colors.primary, fontSize: 20 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 2: Items */}
        {step === 2 && (
          <View>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemNum}>Item {idx + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(idx)}>
                      <Text style={{ color: Colors.danger, fontSize: 18 }}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Product picker */}
                <Text style={styles.fieldLabel}>Product</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {products.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setItemProduct(idx, p.id)}
                      style={[styles.productChip, item.product_id === p.id && styles.productChipSelected]}
                    >
                      <Text style={[styles.productChipText, item.product_id === p.id && { color: Colors.white }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={[styles.productChipPrice, item.product_id === p.id && { color: '#93C5FD' }]}>
                        ₹{p.price_per_sqft}/sqft
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {item.product && (
                  <>
                    <View style={styles.productInfo}>
                      <Text style={styles.productInfoText}>📦 {item.product.sqft_per_box || 10} sqft/box · {item.product.available_boxes || 0} boxes available</Text>
                    </View>
                    <Text style={styles.fieldLabel}>Quantity (boxes)</Text>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => setItemQty(idx, Math.max(1, item.quantity_boxes - 1))}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.qtyInput}
                        value={String(item.quantity_boxes)}
                        onChangeText={v => setItemQty(idx, v)}
                        keyboardType="number-pad"
                        textAlign="center"
                      />
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => setItemQty(idx, item.quantity_boxes + 1)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={styles.itemTotal}>₹{Math.round(calcItem(item).subtotal).toLocaleString('en-IN')}</Text>
                        <Text style={styles.itemSqft}>{calcItem(item).sqft.toFixed(1)} sqft</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Text style={styles.addItemText}>+ Add Another Product</Text>
            </TouchableOpacity>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Delivery address</Text>
              <TextInput style={styles.textArea} value={deliveryAddress} onChangeText={setDeliveryAddress}
                placeholder="Enter delivery address" placeholderTextColor={Colors.gray400} multiline numberOfLines={2} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput style={styles.textArea} value={notes} onChangeText={setNotes}
                placeholder="Any special instructions..." placeholderTextColor={Colors.gray400} multiline numberOfLines={2} />
            </View>
          </View>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <View>
            <View style={styles.card}>
              <Text style={styles.reviewSectionTitle}>Customer</Text>
              <Text style={styles.reviewName}>{customer?.name}</Text>
              <Text style={styles.reviewSub}>{customer?.phone} {customer?.gst_number ? `· GST: ${customer.gst_number}` : ''}</Text>
            </View>

            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.reviewSectionTitle}>Items</Text>
              {items.filter(i => i.product).map((item, idx) => {
                const { sqft, subtotal: itemSub } = calcItem(item);
                return (
                  <View key={idx} style={[styles.reviewItemRow, idx < items.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewItemName}>{item.product.name}</Text>
                      <Text style={styles.reviewItemMeta}>{item.quantity_boxes} boxes · {sqft.toFixed(0)} sqft · ₹{item.product.price_per_sqft}/sqft</Text>
                    </View>
                    <Text style={styles.reviewItemAmt}>₹{Math.round(itemSub).toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}
            </View>

            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.reviewSectionTitle}>Bill Summary</Text>
              {[
                ['Subtotal', `₹${Math.round(subtotal).toLocaleString('en-IN')}`],
                ['CGST (9%)', `₹${Math.round(gst / 2).toLocaleString('en-IN')}`],
                ['SGST (9%)', `₹${Math.round(gst / 2).toLocaleString('en-IN')}`],
              ].map(([l, v]) => (
                <View key={l} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{l}</Text>
                  <Text style={styles.summaryVal}>{v}</Text>
                </View>
              ))}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalAmt}>₹{Math.round(total).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={[styles.card, { marginTop: 12, backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primaryBorder }]}>
              <Text style={{ fontSize: 12, color: Colors.primaryDark, lineHeight: 18 }}>
                ✅ Confirming will automatically:{'\n'}
                • Create a GST invoice{'\n'}
                • Generate a shipment with QR code{'\n'}
                • Reserve stock for the items
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { opacity: (step === 1 && !customer) || (step === 2 && !items.some(i => i.product_id)) ? 0.5 : 1 }]}
            disabled={(step === 1 && !customer) || (step === 2 && !items.some(i => i.product_id))}
            onPress={() => setStep(s => s + 1)}
          >
            <Text style={styles.primaryBtnText}>{step === 1 ? 'Continue to Items →' : 'Review Bill →'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.primaryBtnText}>✓ Confirm &amp; Generate Bill</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  backText: { color: '#93C5FD', fontSize: 14, fontWeight: '500', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 14 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: Colors.white },
  stepDotText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  stepLabel: { fontSize: 13, color: '#BFDBFE', fontWeight: '500' },

  searchInput: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.gray200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.gray900, marginBottom: 12 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: Colors.gray100, ...Shadow.sm },
  customerRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  customerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 14, fontWeight: '600', color: Colors.gray900 },
  customerPhone: { fontSize: 12, color: Colors.gray500, marginTop: 1 },
  customerCompany: { fontSize: 11, color: Colors.primary, marginTop: 1, fontWeight: '500' },

  itemCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, ...Shadow.sm },
  itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemNum: { fontSize: 13, fontWeight: '700', color: Colors.gray700 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldGroup: { marginTop: 12 },
  textArea: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.gray200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.gray900, minHeight: 60, textAlignVertical: 'top' },

  productChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.gray200, backgroundColor: Colors.white, marginRight: 8, alignItems: 'center', minWidth: 100 },
  productChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  productChipText: { fontSize: 12, fontWeight: '600', color: Colors.gray800 },
  productChipPrice: { fontSize: 10, color: Colors.gray500, marginTop: 1 },

  productInfo: { backgroundColor: Colors.primaryBg, borderRadius: 8, padding: 8, marginBottom: 12 },
  productInfoText: { fontSize: 11, color: Colors.primaryDark, fontWeight: '500' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.gray100, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 20, color: Colors.gray700, fontWeight: '600' },
  qtyInput: { width: 60, height: 40, borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 10, fontSize: 16, fontWeight: '700', color: Colors.gray900 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  itemSqft: { fontSize: 11, color: Colors.gray400, marginTop: 1 },

  addItemBtn: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16, backgroundColor: Colors.primaryBg },
  addItemText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, ...Shadow.sm },
  reviewSectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  reviewName: { fontSize: 16, fontWeight: '700', color: Colors.gray900 },
  reviewSub: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  reviewItemRow: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  reviewItemName: { fontSize: 13, fontWeight: '600', color: Colors.gray900 },
  reviewItemMeta: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  reviewItemAmt: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { fontSize: 13, color: Colors.gray500 },
  summaryVal: { fontSize: 13, color: Colors.gray800, fontWeight: '500' },
  totalRow: { borderTopWidth: 1.5, borderTopColor: Colors.gray200, marginTop: 8, paddingTop: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  totalAmt: { fontSize: 18, fontWeight: '800', color: Colors.success },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', ...Shadow.sm },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { color: Colors.gray700, fontSize: 14, fontWeight: '600' },
  successHeader: { paddingTop: 80, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 24 },
  successTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, marginTop: 12 },
  successSub: { fontSize: 14, color: '#BBF7D0', marginTop: 4 },
});
