import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, ActivityIndicator, BackHandler } from 'react-native';
import { Colors } from '../theme';
import { useAuth } from '../hooks/useAuth';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';

// Owner/Admin Screens
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import BillingScreen from '../screens/owner/BillingScreen';
import CreateBillScreen from '../screens/owner/CreateBillScreen';
import InvoiceDetailScreen from '../screens/owner/InvoiceDetailScreen';
import InventoryScreen from '../screens/owner/InventoryScreen';
import OrdersScreen from '../screens/owner/OrdersScreen';
import CreateOrderScreen from '../screens/owner/CreateOrderScreen';
import AnalyticsScreen from '../screens/owner/AnalyticsScreen';
import CustomersScreen from '../screens/owner/CustomersScreen';

// Warehouse Screens
import WarehouseDashboard from '../screens/warehouse/WarehouseDashboard';
import ShipmentsScreen from '../screens/warehouse/ShipmentsScreen';
import QRScannerScreen from '../screens/warehouse/QRScannerScreen';
import ShipmentDetailScreen from '../screens/warehouse/ShipmentDetailScreen';

// Shared
import ProductsScreen from '../screens/shared/ProductsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
      <Text style={{ color: Colors.white, fontSize: 28, fontWeight: '700', marginBottom: 16 }}>
        Tile<Text style={{ color: '#93C5FD' }}>Hub</Text> Pro
      </Text>
      <ActivityIndicator color={Colors.white} size="large" />
    </View>
  );
}

// ─── Tab icon helper ──────────────────────────────────────────────────────────
function TabIcon({ name, focused }) {
  const icons = {
    Dashboard: focused ? '📊' : '📊',
    Billing:   focused ? '🧾' : '🧾',
    Orders:    focused ? '🛒' : '🛒',
    Inventory: focused ? '📦' : '📦',
    Shipments: focused ? '🚚' : '🚚',
    Scanner:   focused ? '📷' : '📷',
    Analytics: focused ? '📈' : '📈',
    Profile:   focused ? '👤' : '👤',
  };
  return <Text style={{ fontSize: 20 }}>{icons[name] || '⚪'}</Text>;
}

// ─── OWNER / ADMIN TABS ───────────────────────────────────────────────────────
function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray200,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboard} />
      <Tab.Screen name="Billing"   component={BillingScreen} />
      <Tab.Screen name="Orders"    component={OrdersScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── WAREHOUSE TABS ───────────────────────────────────────────────────────────
function WarehouseTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray200,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: Colors.warning,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Shipments" component={ShipmentsScreen} />
      <Tab.Screen name="Scanner"   component={QRScannerScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── AUTH STACK ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP"      component={OTPScreen} />
    </Stack.Navigator>
  );
}

// ─── MAIN APP STACK ───────────────────────────────────────────────────────────
function AppStack({ role }) {
  const MainTabs = role === 'warehouse' ? WarehouseTabs : OwnerTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"           component={MainTabs} />
      <Stack.Screen name="CreateBill"     component={CreateBillScreen} />
      <Stack.Screen name="InvoiceDetail"  component={InvoiceDetailScreen} />
      <Stack.Screen name="CreateOrder"    component={CreateOrderScreen} />
      <Stack.Screen name="QRScanner"      component={QRScannerScreen} />
      <Stack.Screen name="ShipmentDetail" component={ShipmentDetailScreen} />
      <Stack.Screen name="Analytics"      component={AnalyticsScreen} />
      <Stack.Screen name="Customers"      component={CustomersScreen} />
    </Stack.Navigator>
  );
}

// ─── ROOT NAVIGATOR ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {user ? <AppStack role={user.role} /> : <AuthStack />}
    </NavigationContainer>
  );
}
