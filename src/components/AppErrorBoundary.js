import React from 'react';
import {
  SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Colors, Shadow } from '../theme';

export default class AppErrorBoundary extends React.Component {
  state = {
    error: null,
    hasError: false,
    resetKey: 0,
  };

  static getDerivedStateFromError(error) {
    return { error, hasError: true };
  }

  componentDidCatch(error, info) {
    if (__DEV__) {
      console.error('TileHub screen error', error, info?.componentStack);
    }
  }

  returnHome = () => {
    this.setState(state => ({
      error: null,
      hasError: false,
      resetKey: state.resetKey + 1,
    }));
  };

  signOut = async () => {
    try {
      await this.props.onSignOut?.();
    } catch (error) {
      if (__DEV__) console.warn('Could not clear the current session', error);
    } finally {
      this.returnHome();
    }
  };

  render() {
    const { children } = this.props;
    const { error, hasError, resetKey } = this.state;

    if (!hasError) {
      return <React.Fragment key={resetKey}>{children}</React.Fragment>;
    }

    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>We hit a problem</Text>
          <Text style={styles.message}>
            The screen closed safely before it could leave you on a blank page.
          </Text>
          <Text style={styles.hint}>
            Unsaved changes may need to be entered again. Return home and reopen the screen,
            or sign out for a clean start.
          </Text>

          {__DEV__ && error?.message ? (
            <View style={styles.details}>
              <Text style={styles.detailsLabel}>Technical details</Text>
              <Text style={styles.detailsText}>{error.message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={this.returnHome}
          >
            <Text style={styles.primaryButtonText}>Return to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={this.signOut}
          >
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
    padding: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 30,
    ...Shadow.md,
  },
  icon: { fontSize: 48, marginBottom: 14 },
  title: {
    color: Colors.gray900,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: Colors.gray600,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  hint: {
    color: Colors.gray500,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  details: {
    alignSelf: 'stretch',
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
    padding: 10,
  },
  detailsLabel: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailsText: { color: Colors.gray700, fontSize: 11, lineHeight: 16 },
  primaryButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    marginTop: 22,
    paddingVertical: 14,
  },
  primaryButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderColor: Colors.gray200,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 10,
    paddingVertical: 13,
  },
  secondaryButtonText: { color: Colors.gray700, fontSize: 14, fontWeight: '600' },
});
