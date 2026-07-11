import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import RootNavigator from './src/navigation';

function AppContent() {
  const { logout } = useAuth();

  return (
    <AppErrorBoundary onSignOut={logout}>
      <RootNavigator />
    </AppErrorBoundary>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppContent />
        <Toast />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
