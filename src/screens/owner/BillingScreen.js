import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme';
import { billingService } from '../../services/api';

const PAY_COLOR = { pending: Colors.warning, partial: Colors.primary, paid: Colors.success, overdue: Colors.danger };
const PAY_BG    = { pending: Colors.warningBg, partial: Colors.primaryBg, paid: Colors.successBg, overdue: Colors.dangerBg };

export default function BillingScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try { const r = await billingService.getInvoices({ payment_status: filter || undefined }); setInvoices(r.data); }
    catch(e) {} finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const totalPending = invoices.filter(i => i.payment_status !== 'paid').reduce((a, i) => a + parseFloat(i.total_amount - (i.amount_paid || 0)), 0);
  const totalCollected = invoices.filter(i => i.payment_status === 'paid').reduce((a, i) => a + parseFloat(i.total_amount), 0);

  const filtered = invoices.filter(i =>
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${Math.round(n).toLocaleString('en-IN')}`;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <LinearGradient colors={['#059669','#047857']} style={styles.header}>
        <Text style={styles.headerTitle}>Billing</Text>
        <Text style={styles.headerSub}>Invoices &amp; Payment Tracking</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{fmt(totalCollected)}</Text>
            <Text style={styles.statLabel}>Collected</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.dangerBg }]}>
            <Text style={[styles.statVal, { color: Colors.danger }]}>{fmt(totalPending)}</Text>
            <Text style={[styles.statLabel, { color: Colors.danger }]}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ backgroundColor: Colors.white, padding: 12 }}>
        <TextInput style={styles.searchInput} placeholder="Search invoice or customer..." placeholderTextColor={Colors.gray400} value={search} onChangeText={setSearch} />
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {['', 'pending', 'partial', 'paid', 'overdue'].map(s => (
            <TouchableOpacity key={s} onPress={() => setFilter(s)} style={[styles.filterChip, filter === s && { backgroundColor: Colors.primary }]}>
              <Text style={[styles.filterText, filter === s && { color: Colors.white }]}>{s || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <TouchableOpacity style={styles.newBillBtn} onPress={() => navigation.navigate('CreateBill')}>
            <Text style={styles.newBillText}>+ Create New Bill</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={<View style={{ padding: 40, alignItems: 'center' }}><Text style={{ color: Colors.gray400 }}>{loading ? 'Loading...' : 'No invoices'}</Text></View>}
        renderItem={({ item: inv }) => {
          const balance = parseFloat(inv.total_amount) - parseFloat(inv.amount_paid || 0);
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: inv.id })} activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invoiceNum}>{inv.invoice_number}</Text>
                  <Text style={styles.customerName}>{inv.customer_name}</Text>
                  {inv.company_name && <Text style={styles.company}>{inv.company_name}</Text>}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: PAY_BG[inv.payment_status] || Colors.gray100 }]}>
                  <Text style={[styles.statusText, { color: PAY_COLOR[inv.payment_status] || Colors.gray500 }]}>{inv.payment_status}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <View>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={styles.totalAmt}>₹{parseInt(inv.total_amount).toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.metaLabel}>Paid</Text>
                  <Text style={[styles.totalAmt, { color: Colors.success }]}>₹{parseInt(inv.amount_paid || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>Balance</Text>
                  <Text style={[styles.totalAmt, { color: balance > 0 ? Colors.danger : Colors.success }]}>₹{parseInt(balance).toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{new Date(inv.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: '#A7F3D0', marginTop: 2, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  searchInput: { backgroundColor: Colors.gray50, borderRadius: 10, borderWidth: 1, borderColor: Colors.gray200, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Colors.gray900 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: Colors.gray100 },
  filterText: { fontSize: 11, fontWeight: '600', color: Colors.gray600, textTransform: 'capitalize' },
  newBillBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  newBillText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  invoiceNum: { fontSize: 12, fontFamily: 'monospace', color: Colors.gray400, fontWeight: '600' },
  customerName: { fontSize: 15, fontWeight: '700', color: Colors.gray900, marginTop: 2 },
  company: { fontSize: 11, color: Colors.primary, marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaLabel: { fontSize: 10, color: Colors.gray400, fontWeight: '600', textTransform: 'uppercase' },
  totalAmt: { fontSize: 15, fontWeight: '800', color: Colors.gray900, marginTop: 2 },
  dateText: { fontSize: 11, color: Colors.gray400, marginTop: 10 },
});
