import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme';

export default function QRScannerScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.gray900, '#1a1a2e']} style={styles.gradient}>
        <Text style={styles.icon}>📷</Text>
        <Text style={styles.title}>QR Scanner</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.body}>
          QR scanning will be available in the next update.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.primary, fontWeight: '700', marginBottom: 12 },
  body: { fontSize: 14, color: Colors.gray300, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
