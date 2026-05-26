import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadow } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

const ROLES = [
  { key: 'customer',  label: 'Customer',         icon: '🪟', desc: 'Browse tiles and get quotes' },
  { key: 'sales',     label: 'Sales Staff',       icon: '🛒', desc: 'Manage orders and billing' },
  { key: 'warehouse', label: 'Warehouse Worker',  icon: '📦', desc: 'Handle dispatch and QR scanning' },
  { key: 'accountant',label: 'Accountant',        icon: '🧾', desc: 'Invoices and payment tracking' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password) {
      Alert.alert('Missing fields', 'Name, phone and password are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, phone: form.phone, email: form.email, password: form.password, role: form.role });
    } catch (err) {
      const msg = err.response?.data?.error;
      if (err.response?.status === 409) {
        Alert.alert('Already registered', 'This phone number is already in use.');
      } else {
        Alert.alert('Registration failed', msg || 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.gray50 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#93C5FD', fontSize: 14, fontWeight: '500' }}>← Back to Login</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join TileHub Pro</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>

          {/* Role selector */}
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.roleGrid}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.key}
                onPress={() => update('role', r.key)}
                style={[styles.rolePill, form.role === r.key && styles.rolePillActive]}
              >
                <Text style={styles.rolePillEmoji}>{r.icon}</Text>
                <Text style={[styles.rolePillText, form.role === r.key && { color: Colors.primary, fontWeight: '700' }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Fields */}
          {[
            { key: 'name',     label: 'Full name *',     icon: '👤', placeholder: 'Rahul Sharma',           keyboard: 'default' },
            { key: 'phone',    label: 'Phone number *',  icon: '📱', placeholder: '+91 98765 43210',        keyboard: 'phone-pad' },
            { key: 'email',    label: 'Email (optional)',icon: '📧', placeholder: 'rahul@example.com',      keyboard: 'email-address' },
          ].map(({ key, label, icon, placeholder, keyboard }) => (
            <View key={key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>{icon}</Text>
                <TextInput
                  style={styles.input}
                  value={form[key]}
                  onChangeText={v => update(key, v)}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.gray400}
                  keyboardType={keyboard}
                  autoCapitalize={key === 'name' ? 'words' : 'none'}
                />
              </View>
            </View>
          ))}

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password *</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.password}
                onChangeText={v => update('password', v)}
                placeholder="Min 6 characters"
                placeholderTextColor={Colors.gray400}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 8 }}>
                <Text style={{ color: Colors.gray500, fontSize: 12, fontWeight: '600' }}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm password *</Text>
            <View style={[styles.inputRow, form.confirmPassword && form.password !== form.confirmPassword && { borderColor: Colors.danger }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={form.confirmPassword}
                onChangeText={v => update('confirmPassword', v)}
                placeholder="Re-enter password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry={!showPass}
              />
            </View>
            {form.confirmPassword !== '' && form.password !== form.confirmPassword && (
              <Text style={{ color: Colors.danger, fontSize: 11, marginTop: 4 }}>Passwords do not match</Text>
            )}
          </View>

          {/* Note for admin */}
          <View style={{ backgroundColor: Colors.primaryBg, borderRadius: Radius.md, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: Colors.primaryBorder }}>
            <Text style={{ fontSize: 11, color: Colors.primaryDark, lineHeight: 16 }}>
              ℹ️  Admin accounts must be created by an existing admin from the web dashboard. Self-registration is for customers, sales, warehouse, and accountant roles.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.registerBtnText}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 28 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 14, color: '#BFDBFE', marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, ...Shadow.md },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.gray700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.gray200, backgroundColor: Colors.gray50, marginBottom: 4 },
  rolePillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  rolePillEmoji: { fontSize: 14, marginRight: 5 },
  rolePillText: { fontSize: 12, fontWeight: '500', color: Colors.gray600 },
  divider: { height: 1, backgroundColor: Colors.gray100, marginVertical: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 12, backgroundColor: Colors.white, paddingHorizontal: 12 },
  inputIcon: { fontSize: 15, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: Colors.gray900 },
  registerBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', ...Shadow.sm },
  registerBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
