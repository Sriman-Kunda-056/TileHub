import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Shadow, Radius } from '../../theme';
import { analyticsService, inventoryService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

function KPICard({ label, value, icon, color, bg }) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: bg }]}>
      <Text style={styles.kpiIcon}>{icon}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && <TouchableOpacity onPress={onSeeAll}><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>}
    </View>
  );
}

export default function OwnerDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, inv] = await Promise.all([
        analyticsService.getDashboard(),
        inventoryService.getAlerts(),
      ]);
      setData(dash.data);
      setAlerts(inv.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = data?.summary || {};
  const fmt = (n) => n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K`
    : `₹${Math.round(n)}`;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.topBar}>
        <View style={styles.topBarContent}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sign out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateBill')}
              style={styles.quickBillBtn}
            >
              <Text style={styles.quickBillText}>+ New Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* KPIs */}
        <View style={styles.section}>
          <SectionHeader title="This Month" />
          <View style={styles.kpiGrid}>
            <KPICard label="Revenue"   value={loading ? '...' : fmt(s.monthly_revenue || 0)} icon="💰" color={Colors.success}  bg={Colors.successBg} />
            <KPICard label="Orders"    value={loading ? '...' : (s.monthly_orders || 0)}     icon="🛒" color={Colors.primary}  bg={Colors.primaryBg} />
            <KPICard label="Shipments" value={loading ? '...' : (s.pending_shipments || 0)}  icon="🚚" color={Colors.warning}  bg={Colors.warningBg} />
            <KPICard label="Low Stock" value={loading ? '...' : (s.low_stock_alerts || 0)}   icon="⚠️" color={s.low_stock_alerts > 0 ? Colors.danger : Colors.success} bg={s.low_stock_alerts > 0 ? Colors.dangerBg : Colors.successBg} />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            {[
              { icon: '🧾', label: 'New Bill',    color: Colors.primary,  onPress: () => navigation.navigate('CreateBill') },
              { icon: '🛒', label: 'New Order',   color: Colors.success,  onPress: () => navigation.navigate('CreateOrder') },
              { icon: '📊', label: 'Analytics',   color: Colors.warning,  onPress: () => navigation.navigate('Analytics') },
              { icon: '👥', label: 'Customers',   color: '#7C3AED',       onPress: () => navigation.navigate('Customers') },
            ].map(({ icon, label, color, onPress }) => (
              <TouchableOpacity key={label} style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
                <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
                  <Text style={{ fontSize: 24 }}>{icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Low stock alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`⚠️ Low Stock (${alerts.length})`} onSeeAll={() => navigation.navigate('Inventory')} />
            <View style={styles.card}>
              {alerts.slice(0, 5).map((a, i) => (
                <View key={a.product_id} style={[styles.alertRow, i < Math.min(alerts.length, 5) - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertName}>{a.name}</Text>
                    <Text style={styles.alertSku}>{a.sku}</Text>
                  </View>
                  <View style={[styles.stockBadge, { backgroundColor: a.available_boxes === 0 ? Colors.dangerBg : Colors.warningBg }]}>
                    <Text style={[styles.stockBadgeText, { color: a.available_boxes === 0 ? Colors.danger : Colors.warning }]}>
                      {a.available_boxes === 0 ? 'Out of stock' : `${a.available_boxes} left`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent orders */}
        <View style={styles.section}>
          <SectionHeader title="Recent Orders" onSeeAll={() => navigation.navigate('Orders')} />
          <View style={styles.card}>
            {(data?.recent_orders || []).slice(0, 5).map((o, i) => (
              <View key={o.id} style={[styles.orderRow, i < Math.min((data?.recent_orders || []).length, 5) - 1 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNum}>{o.order_number}</Text>
                  <Text style={styles.orderCustomer}>{o.customer_name || 'Unknown'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.orderAmt}>{fmt(o.total_amount)}</Text>
                  <View style={[styles.statusDot, {
                    backgroundColor:
                      o.status === 'delivered' ? Colors.successBg :
                      o.status === 'cancelled' ? Colors.dangerBg : Colors.warningBg
                  }]}>
                    <Text style={[styles.statusDotText, {
                      color: o.status === 'delivered' ? Colors.success :
                             o.status === 'cancelled' ? Colors.danger : Colors.warning
                    }]}>{o.status}</Text>
                  </View>
                </View>
              </View>
            ))}
            {(!data?.recent_orders || data.recent_orders.length === 0) && (
              <Text style={styles.emptyText}>No orders yet</Text>
            )}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  topBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: '#BFDBFE', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginTop: 2 },
  userRole: { fontSize: 10, color: '#93C5FD', fontWeight: '700', letterSpacing: 1, marginTop: 3 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  logoutText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  quickBillBtn: { backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  quickBillText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  seeAll: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 14, ...Shadow.sm },
  kpiIcon: { fontSize: 22, marginBottom: 8 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 11, color: Colors.gray500, marginTop: 3, fontWeight: '500' },

  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', ...Shadow.sm },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: Colors.gray700, textAlign: 'center' },

  card: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', ...Shadow.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },

  alertRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  alertName: { fontSize: 13, fontWeight: '600', color: Colors.gray900 },
  alertSku: { fontSize: 11, color: Colors.gray400, marginTop: 1 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockBadgeText: { fontSize: 11, fontWeight: '700' },

  orderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  orderNum: { fontSize: 12, fontFamily: 'monospace', color: Colors.gray600, fontWeight: '600' },
  orderCustomer: { fontSize: 13, color: Colors.gray800, fontWeight: '500', marginTop: 2 },
  orderAmt: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  statusDot: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  statusDotText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  emptyText: { padding: 20, textAlign: 'center', color: Colors.gray400, fontSize: 13 },
});
