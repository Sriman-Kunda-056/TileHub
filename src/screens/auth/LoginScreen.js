import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

const ROLES = [
  { key: 'admin',      label: 'Owner / Admin',    icon: '🏢', color: '#7C3AED', phone: '+919876543210' },
  { key: 'sales',      label: 'Sales Staff',       icon: '🛒', color: '#1D4ED8', phone: '+919876543211' },
  { key: 'warehouse',  label: 'Warehouse Worker',  icon: '📦', color: '#D97706', phone: '+919876543212' },
  { key: 'accountant', label: 'Accountant',        icon: '🧾', color: '#059669', phone: '+919876543213' },
  { key: 'customer',   label: 'Customer',          icon: '🪟', color: '#DB2777', phone: '+919876500001' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [step, setStep] = useState('role'); // role | form
  const [selectedRole, setSelectedRole] = useState(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = ROLES.find(r => r.key === selectedRole);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Missing fields', 'Please enter phone and password');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
      // Navigation handled by RootNavigator reacting to auth state
    } catch (err) {
      const msg = err.response?.data?.error;
      if (err.response?.status === 401) {
        Alert.alert('Login Failed', 'Incorrect phone or password.\n\nDemo password: Admin@1234');
      } else if (!err.response) {
        Alert.alert('Connection Error', 'Cannot reach server. Check if backend is running.\n\nFor emulator use: 10.0.2.2:5000\nFor real device use your PC\'s IP address.');
      } else {
        Alert.alert('Error', msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickFill = () => {
    if (!role) return;
    setPhone(role.phone);
    setPassword('Admin@1234');
  };

  // ── ROLE SELECTION ──
  if (step === 'role') {
    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.gradientContainer}>
        <View style={styles.header}>
          <Text style={styles.brandText}>Tile<Text style={styles.brandAccent}>Hub</Text> Pro</Text>
          <Text style={styles.tagline}>Select your role to continue</Text>
        </View>
        <View style={styles.rolesCard}>
          <Text style={styles.rolesTitle}>Who are you?</Text>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={styles.roleRow}
              onPress={() => { setSelectedRole(r.key); setPhone(r.phone); setStep('form'); }}
              activeOpacity={0.75}
            >
              <View style={[styles.roleIcon, { backgroundColor: r.color + '18' }]}>
                <Text style={styles.roleEmoji}>{r.icon}</Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleLabel}>{r.label}</Text>
              </View>
              <Text style={styles.roleArrow}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.signupBtn}
          >
            <Text style={styles.signupText}>New user? <Text style={{ color: Colors.primary, fontWeight: '600' }}>Create account</Text></Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ── LOGIN FORM ──
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.gray50 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.formHeader}>
        <TouchableOpacity onPress={() => setStep('role')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.formBrand}>Tile<Text style={{ color: '#93C5FD' }}>Hub</Text> Pro</Text>
        <View style={[styles.roleBadge, { backgroundColor: role?.color + '30', borderColor: role?.color + '50' }]}>
          <Text style={styles.roleBadgeEmoji}>{role?.icon}</Text>
          <Text style={[styles.roleBadgeText, { color: Colors.white }]}>{role?.label}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign in</Text>
          <Text style={styles.formSub}>Access the {role?.label} panel</Text>

          {/* Demo fill button */}
          <TouchableOpacity style={styles.demoBtn} onPress={quickFill}>
            <Text style={styles.demoBtnText}>⚡  Fill demo credentials</Text>
          </TouchableOpacity>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.gray400}
                secureTextEntry={!showPass}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 8 }}>
                <Text style={{ color: Colors.gray500, fontSize: 12, fontWeight: '600' }}>
                  {showPass ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Credentials hint */}
          <View style={styles.credHint}>
            <Text style={styles.credHintTitle}>📋 Demo credentials</Text>
            <View style={styles.credRow}>
              <Text style={styles.credKey}>Phone</Text>
              <Text style={styles.credVal}>{role?.phone}</Text>
            </View>
            <View style={styles.credRow}>
              <Text style={styles.credKey}>Password</Text>
              <Text style={styles.credVal}>Admin@1234</Text>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: role?.color || Colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.loginBtnText}>Sign in as {role?.label}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={styles.signupText}>Don't have an account? <Text style={{ color: Colors.primary, fontWeight: '600' }}>Sign up</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  header: { paddingTop: 80, paddingHorizontal: 28, paddingBottom: 32 },
  brandText: { fontSize: 34, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  brandAccent: { color: '#93C5FD' },
  tagline: { fontSize: 15, color: '#BFDBFE', marginTop: 6, fontWeight: '400' },
  rolesCard: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  rolesTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray900, marginBottom: 16 },
  roleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.gray100,
    marginBottom: 10, backgroundColor: Colors.white, ...Shadow.sm,
  },
  roleIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  roleEmoji: { fontSize: 22 },
  roleInfo: { flex: 1, marginLeft: 14 },
  roleLabel: { fontSize: 15, fontWeight: '600', color: Colors.gray900 },
  roleArrow: { fontSize: 22, color: Colors.gray300, fontWeight: '300' },
  signupBtn: { marginTop: 20, alignItems: 'center' },
  signupText: { fontSize: 13, color: Colors.gray500 },

  formHeader: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 28 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#93C5FD', fontSize: 14, fontWeight: '500' },
  formBrand: { fontSize: 24, fontWeight: '800', color: Colors.white, marginBottom: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
  roleBadgeEmoji: { fontSize: 14, marginRight: 6 },
  roleBadgeText: { fontSize: 12, fontWeight: '600' },

  formBody: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  formCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 24, ...Shadow.md },
  formTitle: { fontSize: 22, fontWeight: '700', color: Colors.gray900, marginBottom: 4 },
  formSub: { fontSize: 13, color: Colors.gray500, marginBottom: 20 },

  demoBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray200,
    borderRadius: Radius.lg, paddingVertical: 12, marginBottom: 20,
    backgroundColor: Colors.gray50,
  },
  demoBtnText: { fontSize: 13, color: Colors.gray600, fontWeight: '500' },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 6, letterSpacing: 0.2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.lg,
    backgroundColor: Colors.white, paddingHorizontal: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: Colors.gray900 },

  credHint: { backgroundColor: Colors.gray50, borderRadius: Radius.md, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.gray100 },
  credHintTitle: { fontSize: 11, fontWeight: '700', color: Colors.gray500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  credRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  credKey: { fontSize: 12, color: Colors.gray400 },
  credVal: { fontSize: 12, color: Colors.gray900, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  loginBtn: { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', ...Shadow.sm },
  loginBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
