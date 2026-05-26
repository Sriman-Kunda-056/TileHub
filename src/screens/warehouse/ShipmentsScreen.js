import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadow } from '../../theme';
import { shipmentService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const TABS = [
  { key: 'pending',    label: 'Pending',    color: Colors.warning, icon: '🕐' },
  { key: 'dispatched', label: 'Dispatched', color: Colors.primary, icon: '🚚' },
  { key: 'delivered',  label: 'Delivered',  color: Colors.success, icon: '✅' },
];

export default function ShipmentsScreen({ navigation }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await shipmentService.getAll({ status: tab });
      setShipments(res.data);
    } catch(e) {} finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleDeliver = async (id) => {
    try { await shipmentService.markDelivered(id); load(); } catch(e) {}
  };

  const filtered = shipments.filter(s =>
    s.shipment_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#D97706','#B45309']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Shipments</Text>
            <Text style={styles.headerSub}>{user?.name} · Warehouse</Text>
          </View>
          <TouchableOpacity style={styles.scanFAB} onPress={() => navigation.navigate('QRScanner')}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={styles.scanFABText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          {[
            { label: 'Pending',    val: shipments.filter(s=>s.status==='pending').length,    bg: '#FEF3C7' },
            { label: 'Dispatched', val: shipments.filter(s=>s.status==='dispatched').length, bg: '#DBEAFE' },
            { label: 'Delivered',  val: shipments.filter(s=>s.status==='delivered').length,  bg: '#D1FAE5' },
          ].map(({ label, val, bg }) => (
            <View key={label} style={[styles.statBox, { backgroundColor: bg }]}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab===t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]} onPress={() => { setTab(t.key); setLoading(true); }}>
            <Text style={[styles.tabText, tab===t.key && { color: t.color, fontWeight: '700' }]}>{t.icon} {t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search shipment or customer..." placeholderTextColor={Colors.gray400} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, textAlign: 'center' }}>{tab==='pending'?'🕐':tab==='dispatched'?'🚚':'✅'}</Text>
            <Text style={styles.emptyText}>{loading ? 'Loading...' : `No ${tab} shipments`}</Text>
          </View>
        }
        renderItem={({ item: s }) => {
          const isPending    = s.status === 'pending';
          const isDispatched = s.status === 'dispatched';
          const isDelivered  = s.status === 'delivered';
          const statusColor  = isDelivered ? Colors.success : isDispatched ? Colors.primary : Colors.warning;
          const statusBg     = isDelivered ? Colors.successBg : isDispatched ? Colors.primaryBg : Colors.warningBg;
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ShipmentDetail', { shipmentId: s.id })} activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shipNum}>{s.shipment_number}</Text>
                  <Text style={styles.customerName}>{s.customer_name}</Text>
                  <Text style={styles.address} numberOfLines={1}>{s.delivery_address}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{isDelivered ? '✅ Delivered' : isDispatched ? '🚚 Dispatched' : '🕐 Pending'}</Text>
                </View>
              </View>
              <View style={styles.itemsRow}>
                <Text style={styles.itemsText}>{(s.items||[]).map(i=>`${i.product_name} ×${i.quantity_boxes}`).join(' · ')}</Text>
              </View>
              {s.driver_name && <Text style={styles.driverText}>🚗 {s.driver_name} · {s.vehicle_number}</Text>}
              <View style={{ marginTop: 8 }}>
                {isPending && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => navigation.navigate('QRScanner')}>
                    <Text style={styles.actionBtnText}>📷 Scan & Dispatch</Text>
                  </TouchableOpacity>
                )}
                {isDispatched && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleDeliver(s.id)}>
                    <Text style={styles.actionBtnText}>✓ Mark Delivered</Text>
                  </TouchableOpacity>
                )}
                {isDelivered && (
                  <View style={[styles.actionBtn, { backgroundColor: Colors.gray100 }]}>
                    <Text style={[styles.actionBtnText, { color: Colors.gray500 }]}>Delivered {s.delivered_at ? new Date(s.delivered_at).toLocaleDateString('en-IN') : ''}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: '#FDE68A', marginTop: 2, fontWeight: '500' },
  scanFAB: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 12, alignItems: 'center', minWidth: 72 },
  scanFABText: { color: Colors.white, fontSize: 11, fontWeight: '700', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.gray900 },
  statLabel: { fontSize: 10, color: Colors.gray600, fontWeight: '600', marginTop: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, color: Colors.gray500, fontWeight: '500' },
  searchRow: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.white },
  searchInput: { backgroundColor: Colors.gray50, borderRadius: 10, borderWidth: 1, borderColor: Colors.gray200, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Colors.gray900 },
  card: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  shipNum: { fontSize: 12, fontFamily: 'monospace', color: Colors.gray500, fontWeight: '700' },
  customerName: { fontSize: 15, fontWeight: '700', color: Colors.gray900, marginTop: 2 },
  address: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemsRow: { backgroundColor: Colors.gray50, borderRadius: 8, padding: 8, marginBottom: 8 },
  itemsText: { fontSize: 11, color: Colors.gray600, lineHeight: 16 },
  driverText: { fontSize: 11, color: Colors.gray400, marginBottom: 8 },
  actionBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.gray400, marginTop: 12 },
});
