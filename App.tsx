import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, theme, colors, typographyPresets, spacing, radius } from './src/theme';
import { initializeStorage, resetToSeedData } from './src/storage';
import { AppNavigator } from './src/navigation';

// ============================================================================
// Developer Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class DeveloperErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled ARENA STUDIO Exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0d0f12" />
          <View style={styles.errorHeader}>
            <View style={styles.errorIconBadge}>
              <Ionicons name="warning-outline" size={28} color={colors.status.error} />
            </View>
            <View style={styles.errorTitleContainer}>
              <Text style={styles.errorTitle}>ARENA STUDIO Diagnostic Alert</Text>
              <Text style={styles.errorSubtitle}>Unhandled component runtime exception</Text>
            </View>
          </View>

          <ScrollView style={styles.errorScrollView} contentContainerStyle={styles.errorContent}>
            <View style={styles.errorBox}>
              <Text style={styles.errorMessage}>
                {this.state.error?.name}: {this.state.error?.message}
              </Text>
            </View>

            {this.state.errorInfo?.componentStack ? (
              <View style={styles.stackBox}>
                <Text style={styles.stackTitle}>Component Stack Trace</Text>
                <Text style={styles.stackText}>{this.state.errorInfo.componentStack.trim()}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.errorButtonPrimary} onPress={this.handleReset}>
              <Ionicons name="reload-outline" size={18} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.errorButtonPrimaryText}>Reload Workspace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.errorButtonSecondary}
              onPress={async () => {
                await resetToSeedData();
                this.handleReset();
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.accentPrimary} style={styles.buttonIcon} />
              <Text style={styles.errorButtonSecondaryText}>Reset to Seed Blueprints</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Main Application Component
// ============================================================================

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const initApp = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);
      // Initialize persistent storage and verify seed data
      await initializeStorage();
      setIsInitializing(false);
    } catch (err: any) {
      console.error('Storage Initialization Error:', err);
      setInitError(err?.message || 'Failed to initialize local data repository');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // Splash / Initialization Screen
  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0f12" />
        <View style={styles.splashBrand}>
          <View style={styles.splashIconBox}>
            <Ionicons name="hardware-chip" size={36} color={colors.accentPrimary} />
          </View>
          <Text style={styles.splashTitle}>ARENA STUDIO</Text>
          <Text style={styles.splashSubtitle}>Autonomous Multi-Agent Mobile IDE</Text>
        </View>

        <View style={styles.splashLoading}>
          <ActivityIndicator size="small" color={colors.accentPrimary} />
          <Text style={styles.splashLoadingText}>Mounting storage & specialist agents...</Text>
        </View>
      </View>
    );
  }

  // Initialization Error Screen
  if (initError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0f12" />
        <View style={styles.errorHeader}>
          <View style={styles.errorIconBadge}>
            <Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />
          </View>
          <View style={styles.errorTitleContainer}>
            <Text style={styles.errorTitle}>Storage Initialization Failed</Text>
            <Text style={styles.errorSubtitle}>Unable to mount local databases</Text>
          </View>
        </View>

        <View style={styles.errorBox}>
          <Text style={styles.errorMessage}>{initError}</Text>
        </View>

        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.errorButtonPrimary} onPress={initApp}>
            <Ionicons name="reload" size={18} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.errorButtonPrimaryText}>Retry Initialization</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Active Application Shell
  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
        <DeveloperErrorBoundary>
          <AppNavigator />
        </DeveloperErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0d0f12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  splashBrand: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  splashIconBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#16191f',
    borderWidth: 1,
    borderColor: '#30363d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f0f6fc',
    letterSpacing: 0.5,
  },
  splashSubtitle: {
    fontSize: 13,
    color: '#8b949e',
    marginTop: 4,
  },
  splashLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  splashLoadingText: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0d0f12',
    padding: spacing.lg,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  errorIconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248, 81, 73, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitleContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f6fc',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 2,
  },
  errorScrollView: {
    flex: 1,
    marginVertical: spacing.md,
  },
  errorContent: {
    paddingBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: '#16191f',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.4)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.status.error,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  stackBox: {
    backgroundColor: '#16191f',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#30363d',
    padding: spacing.md,
  },
  stackTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b949e',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stackText: {
    fontSize: 11,
    color: '#c9d1d9',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  errorActions: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  errorButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  errorButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  errorButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
});
