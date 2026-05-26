import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme';
import { orderService } from '../../services/api';

const STATUS_COLOR = { draft:Colors.gray500, confirmed:Colors.primary, processing:Colors.warning, dispatched:Colors.warning, delivered:Colors.success, cancelled:Colors.danger };
const STATUS_BG    = { draft:Colors.gray100, confirmed:Colors.primaryBg, processing:Colors.warningBg, dispatched:Colors.warningBg, delivered:Colors.successBg, cancelled:Colors.dangerBg };

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    try { const r = await orderService.getAll({ status: statusFilter || undefined }); setOrders(r.data); }
    catch(e) {} finally { setLoading(false); setRefreshing(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (order) => {
    Alert.alert('Confirm Order', `Confirm ${order.order_number}?\n\nThis will automatically:\n• Create a shipment\n• Reserve stock\n• Generate QR code`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          const r = await orderService.updateStatus(order.id, 'confirmed');
          Alert.alert('Done! ✅', r.data.message || 'Shipment created automatically.');
          load();
        } catch(e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
      }},
    ]);
  };

  const fmt = (n) => `₹${parseInt(n).toLocaleString('en-IN')}`;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <LinearGradient colors={[Colors.primary,'#1D4ED8']} style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSub}>{orders.length} orders</Text>
        <Text style={{ fontSize: 11, color: '#BFDBFE', marginTop: 6 }}>
          💡 Confirm an order to auto-create shipment &amp; reserve stock
        </Text>
      </LinearGradient>

      <View style={{ backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {['', 'draft', 'confirmed', 'delivered', 'cancelled'].map(s => (
            <TouchableOpacity key={s} onPress={() => setStatusFilter(s)} style={[styles.chip, statusFilter===s && { backgroundColor: Colors.primary }]}>
              <Text style={[styles.chipText, statusFilter===s && { color: Colors.white }]}>{s || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('CreateOrder')}>
            <Text style={styles.newBtnText}>+ New Order</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={<View style={{ padding: 40, alignItems: 'center' }}><Text style={{ color: Colors.gray400 }}>{loading ? 'Loading...' : 'No orders'}</Text></View>}
        renderItem={({ item: o }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderNum}>{o.order_number}</Text>
                <Text style={styles.customer}>{o.customer_name || '—'}</Text>
                {o.shipment_number && <Text style={styles.shipRef}>🚚 {o.shipment_number} · {o.shipment_status}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.badge, { backgroundColor: STATUS_BG[o.status] }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[o.status] }]}>{o.status}</Text>
                </View>
                <Text style={styles.amt}>{fmt(o.total_amount)}</Text>
              </View>
            </View>
            {o.status === 'draft' && (
              <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(o)}>
                <Text style={styles.confirmText}>✓ Confirm Order → Auto-create Shipment</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.date}>{new Date(o.created_at).toLocaleDateString('en-IN')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: '#BFDBFE', marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: Colors.gray100 },
  chipText: { fontSize: 11, fontWeight: '600', color: Colors.gray600, textTransform: 'capitalize' },
  newBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 12 },
  newBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  orderNum: { fontSize: 12, fontFamily: 'monospace', color: Colors.gray400, fontWeight: '600' },
  customer: { fontSize: 15, fontWeight: '700', color: Colors.gray900, marginTop: 2 },
  shipRef: { fontSize: 11, color: Colors.primary, marginTop: 2, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  amt: { fontSize: 15, fontWeight: '800', color: Colors.gray900 },
  confirmBtn: { backgroundColor: Colors.primaryBg, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: Colors.primaryBorder },
  confirmText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  date: { fontSize: 10, color: Colors.gray400, marginTop: 8 },
});
