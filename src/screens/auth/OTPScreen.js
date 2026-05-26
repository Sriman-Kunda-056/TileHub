import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius } from '../../theme';
import { authService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function OTPScreen({ route, navigation }) {
  const { phone } = route.params;
  const { verifyOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) { Alert.alert('Invalid', 'Please enter 6-digit OTP'); return; }
    setLoading(true);
    try { await verifyOTP(phone, otp); }
    catch(e) { Alert.alert('Error', e.response?.data?.error || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    try { await authService.sendOTP(phone); Alert.alert('Sent', 'New OTP sent to ' + phone); }
    catch(e) { Alert.alert('Error', 'Failed to resend'); }
    finally { setResending(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: Colors.white, marginBottom: 8 }}>Enter OTP</Text>
        <Text style={{ fontSize: 14, color: '#BFDBFE', marginBottom: 40 }}>Sent to {phone}</Text>
        <TextInput
          style={{ backgroundColor: Colors.white, borderRadius: 16, padding: 20, fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: 12, color: Colors.gray900, marginBottom: 24 }}
          value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor={Colors.gray300}
        />
        <TouchableOpacity style={{ backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 16 }} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={{ color: Colors.primary, fontSize: 16, fontWeight: '800' }}>Verify OTP</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={resend} disabled={resending} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#93C5FD', fontSize: 13 }}>{resending ? 'Resending...' : 'Resend OTP'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>← Change number</Text>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
