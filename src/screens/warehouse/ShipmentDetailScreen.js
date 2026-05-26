import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Shadow } from '../../theme';
import { shipmentService } from '../../services/api';

export default function ShipmentDetailScreen({ route, navigation }) {
  const { shipmentId } = route.params;
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shipmentService.getOne(shipmentId).then(r => setShipment(r.data)).finally(() => setLoading(false));
  }, [shipmentId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!shipment) return <View style={styles.center}><Text>Shipment not found</Text></View>;

  const isDelivered  = shipment.status === 'delivered';
  const isDispatched = shipment.status === 'dispatched';
  const isPending    = shipment.status === 'pending';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <LinearGradient colors={[Colors.gray900, Colors.gray800]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{shipment.shipment_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: isDelivered ? Colors.successBg : isDispatched ? Colors.primaryBg : Colors.warningBg }]}>
          <Text style={[styles.statusText, { color: isDelivered ? Colors.success : isDispatched ? Colors.primary : Colors.warning }]}>
            {isDelivered ? '✅ Delivered' : isDispatched ? '🚚 Dispatched' : '🕐 Pending'}
          </Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CUSTOMER</Text>
          <Text style={styles.bigText}>{shipment.customer_name}</Text>
          <Text style={styles.subText}>{shipment.delivery_address}</Text>
          {shipment.driver_name && <Text style={styles.subText}>🚗 {shipment.driver_name} · {shipment.vehicle_number}</Text>}
        </View>
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>ITEMS</Text>
          {(shipment.items || []).map((item, i) => (
            <View key={i} style={[styles.itemRow, i < shipment.items.length - 1 && styles.rowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemSku}>{item.sku}</Text>
              </View>
              <Text style={styles.itemQty}>{item.quantity_boxes} boxes</Text>
            </View>
          ))}
        </View>
        {shipment.qr_code_data && (
          <View style={[styles.card, { marginTop: 12, alignItems: 'center' }]}>
            <Text style={styles.sectionTitle}>SHIPMENT QR CODE</Text>
            <View style={{ marginTop: 12, padding: 16, backgroundColor: Colors.white, borderRadius: 12 }}>
              <QRCode value={shipment.qr_code_data} size={200} />
            </View>
            <Text style={{ fontSize: 11, color: Colors.gray400, marginTop: 10, textAlign: 'center' }}>
              Scan this QR to dispatch and auto-deduct inventory
            </Text>
          </View>
        )}
        {isPending && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary, marginTop: 16 }]} onPress={() => navigation.navigate('QRScanner')}>
            <Text style={styles.btnText}>📷 Open Scanner to Dispatch</Text>
          </TouchableOpacity>
        )}
        {isDispatched && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.success, marginTop: 16 }]}
            onPress={async () => { await shipmentService.markDelivered(shipment.id); navigation.goBack(); }}>
            <Text style={styles.btnText}>✓ Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  back: { color: Colors.gray300, fontSize: 14, fontWeight: '500', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, fontFamily: 'monospace', marginBottom: 10 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: Colors.gray400, letterSpacing: 1, marginBottom: 10 },
  bigText: { fontSize: 16, fontWeight: '700', color: Colors.gray900 },
  subText: { fontSize: 12, color: Colors.gray500, marginTop: 3 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  itemName: { fontSize: 13, fontWeight: '600', color: Colors.gray900 },
  itemSku: { fontSize: 11, color: Colors.gray400, marginTop: 1 },
  itemQty: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
