import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme';
import { inventoryService } from '../../services/api';

export default function InventoryScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | critical | low | ok

  const load = useCallback(async () => {
    try { const r = await inventoryService.getAll(); setInventory(r.data); }
    catch(e) {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestock = (item) => {
    Alert.prompt('Restock', `Current: ${item.available_boxes} boxes\nHow many boxes to add?`, async (qty) => {
      if (!qty || isNaN(qty)) return;
      try {
        await inventoryService.restock(item.product_id, parseInt(qty));
        Alert.alert('Done', `+${qty} boxes added to ${item.name}`);
        load();
      } catch(e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    }, 'plain-text', '', 'number-pad');
  };

  const statusColor = { ok: Colors.success, low: Colors.warning, critical: Colors.danger, out_of_stock: Colors.danger };
  const statusBg    = { ok: Colors.successBg, low: Colors.warningBg, critical: Colors.dangerBg, out_of_stock: Colors.dangerBg };

  const filtered = inventory.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || i.stock_status === filter || (filter === 'critical' && i.stock_status === 'out_of_stock');
    return matchSearch && matchFilter;
  });

  const alerts = inventory.filter(i => ['critical','out_of_stock','low'].includes(i.stock_status)).length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Text style={styles.headerSub}>{inventory.length} products · {alerts} need attention</Text>
        <View style={styles.statsRow}>
          {[
            { label: 'OK',       val: inventory.filter(i=>i.stock_status==='ok').length,           color: Colors.successBg, text: Colors.success },
            { label: 'Low',      val: inventory.filter(i=>i.stock_status==='low').length,          color: Colors.warningBg, text: Colors.warning },
            { label: 'Critical', val: inventory.filter(i=>['critical','out_of_stock'].includes(i.stock_status)).length, color: Colors.dangerBg, text: Colors.danger },
          ].map(({ label, val, color, text }) => (
            <TouchableOpacity key={label} style={[styles.statBox, { backgroundColor: color }]} onPress={() => setFilter(label.toLowerCase())}>
              <Text style={[styles.statVal, { color: text }]}>{val}</Text>
              <Text style={[styles.statLabel, { color: text }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <View style={{ padding: 12, backgroundColor: Colors.white }}>
        <TextInput style={styles.searchInput} placeholder="Search product or SKU..." placeholderTextColor={Colors.gray400}
          value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.product_id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<View style={{ padding: 40, alignItems: 'center' }}><Text style={{ color: Colors.gray400 }}>{loading ? 'Loading...' : 'No products found'}</Text></View>}
        renderItem={({ item: i }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{i.name}</Text>
                <Text style={styles.sku}>{i.sku} · {i.category}</Text>
                {i.warehouse_location && <Text style={styles.location}>📍 {i.warehouse_location}</Text>}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusBg[i.stock_status] || Colors.gray100 }]}>
                <Text style={[styles.statusText, { color: statusColor[i.stock_status] || Colors.gray500 }]}>
                  {i.stock_status?.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.stockRow}>
              {[
                { label: 'Available', val: i.available_boxes, color: Colors.success },
                { label: 'Reserved',  val: i.reserved_boxes,  color: Colors.warning },
                { label: 'Delivered', val: i.delivered_boxes, color: Colors.primary },
              ].map(({ label, val, color }) => (
                <View key={label} style={styles.stockBox}>
                  <Text style={[styles.stockVal, { color }]}>{val}</Text>
                  <Text style={styles.stockLabel}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cardBtns}>
              <TouchableOpacity style={[styles.restockBtn, { backgroundColor: Colors.primaryBg, borderColor: Colors.primaryBorder }]} onPress={() => handleRestock(i)}>
                <Text style={[styles.restockText, { color: Colors.primary }]}>+ Restock</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: '#BFDBFE', marginTop: 2, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  searchInput: { backgroundColor: Colors.gray50, borderRadius: 10, borderWidth: 1, borderColor: Colors.gray200, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Colors.gray900 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  productName: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  sku: { fontSize: 11, color: Colors.gray400, marginTop: 1 },
  location: { fontSize: 11, color: Colors.primary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  stockRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  stockBox: { flex: 1, backgroundColor: Colors.gray50, borderRadius: 8, padding: 8, alignItems: 'center' },
  stockVal: { fontSize: 18, fontWeight: '800' },
  stockLabel: { fontSize: 10, color: Colors.gray500, marginTop: 1 },
  cardBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  restockBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
  restockText: { fontSize: 12, fontWeight: '700' },
});
