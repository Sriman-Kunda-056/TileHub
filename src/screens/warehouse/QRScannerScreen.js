import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  PermissionsAndroid, Platform, Linking, AppState,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { shipmentService } from '../../services/api';
import { Colors } from '../../theme';

export default function QRScannerScreen({ navigation }) {
  const [scanned, setScanned] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(
    Platform.OS === 'android' ? 'checking' : 'granted'
  );
  const scanLock = useRef(false);

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      setPermissionStatus('granted');
      return;
    }

    setPermissionStatus('checking');
    try {
      const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
      const alreadyGranted = await PermissionsAndroid.check(permission);
      if (alreadyGranted) {
        setPermissionStatus('granted');
        return;
      }

      const result = await PermissionsAndroid.request(permission, {
        title: 'Camera permission',
        message: 'TileHub Pro needs camera access to scan shipment QR codes.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });

      setPermissionStatus(
        result === PermissionsAndroid.RESULTS.GRANTED
          ? 'granted'
          : result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ? 'blocked'
            : 'denied'
      );
    } catch (err) {
      setPermissionStatus('error');
    }
  };

  useEffect(() => {
    requestCameraPermission();

    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (granted) setPermissionStatus('granted');
      }
    });

    return () => subscription.remove();
  }, []);

  const handleScan = async ({ nativeEvent }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setScanned(true);
    const qrData = nativeEvent.codeStringValue;
    try {
      const res = await shipmentService.scanQR(qrData);
      Alert.alert('Scanned', res.data.message || 'QR processed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.error || 'Could not process QR code', [
        { text: 'Try Again', onPress: () => { scanLock.current = false; setScanned(false); } },
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {permissionStatus === 'granted' ? (
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType={CameraType.Back}
          scanBarcode={true}
          onReadCode={handleScan}
          onError={() => setPermissionStatus('error')}
          showFrame={true}
          laserColor={Colors.primary}
          frameColor={Colors.white}
        />
      ) : (
        <View style={styles.permissionContainer}>
          {permissionStatus === 'checking' ? (
            <ActivityIndicator color={Colors.primary} size="large" />
          ) : (
            <>
              <Text style={styles.permissionIcon}>📷</Text>
              <Text style={styles.permissionTitle}>
                {permissionStatus === 'error' ? 'Camera unavailable' : 'Camera access required'}
              </Text>
              <Text style={styles.permissionText}>
                {permissionStatus === 'error'
                  ? 'The camera could not be started. Check camera access and try again.'
                  : 'Allow camera access to scan shipment QR codes.'}
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={permissionStatus === 'blocked' ? () => Linking.openSettings() : requestCameraPermission}
              >
                <Text style={styles.permissionButtonText}>
                  {permissionStatus === 'blocked' ? 'Open Settings' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Shipment QR</Text>
      </View>

      {scanned && (
        <View style={styles.processingBanner}>
          <ActivityIndicator color={Colors.white} size="small" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}

      {permissionStatus === 'granted' && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Point camera at the QR code on the shipment box</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, backgroundColor: Colors.gray900,
  },
  permissionIcon: { fontSize: 54, marginBottom: 16 },
  permissionTitle: { color: Colors.white, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  permissionText: { color: Colors.gray300, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  permissionButton: {
    marginTop: 20, backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  permissionButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  title: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  processingBanner: {
    position: 'absolute', top: '50%', alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  processingText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  hint: {
    position: 'absolute', bottom: 48, left: 24, right: 24,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  hintText: { color: Colors.white, textAlign: 'center', fontSize: 13, lineHeight: 20 },
});
