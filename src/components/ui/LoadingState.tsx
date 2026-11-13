import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { Button } from './Button';

export interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  steps?: string[];
  currentStepIndex?: number;
  progress?: number; // 0 to 1 or 0 to 100
  showCancel?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  style?: StyleProp<ViewStyle>;
  messageStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  subtitle,
  size = 'large',
  color = colors.accentPrimary,
  fullScreen = false,
  steps,
  currentStepIndex = 0,
  progress,
  showCancel = false,
  cancelLabel = 'Cancel',
  onCancel,
  style,
  messageStyle,
  subtitleStyle,
  testID,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  // Normalize progress to percentage (0 - 100)
  const normalizedProgress =
    progress !== undefined
      ? progress <= 1
        ? Math.round(progress * 100)
        : Math.min(100, Math.max(0, Math.round(progress)))
      : undefined;

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreenContainer,
        style,
      ]}
      testID={testID}
    >
      <View style={styles.spinnerOuter}>
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: pulseAnim,
              borderColor: color,
            },
          ]}
        />
        <ActivityIndicator
          size={size}
          color={color}
          style={styles.spinner}
        />
      </View>

      <Text style={[styles.message, messageStyle]}>{message}</Text>

      {subtitle ? (
        <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
      ) : null}

      {/* Progress Bar */}
      {normalizedProgress !== undefined && (
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${normalizedProgress}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{normalizedProgress}%</Text>
        </View>
      )}

      {/* Developer Monospace Steps */}
      {steps && steps.length > 0 && (
        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <View key={`${step}-${idx}`} style={styles.stepRow}>
                {isDone ? (
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                ) : isCurrent ? (
                  <Ionicons name="ellipse" size={10} color={colors.accentPrimary} />
                ) : (
                  <Ionicons name="ellipse-outline" size={10} color={colors.borderLight} />
                )}
                <Text
                  style={[
                    styles.stepText,
                    isDone && styles.stepDone,
                    isCurrent && styles.stepCurrent,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Cancel button */}
      {showCancel && onCancel && (
        <View style={styles.cancelWrapper}>
          <Button
            onPress={onCancel}
            size="sm"
            title={cancelLabel}
            variant="ghost"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 15, 18, 0.88)',
    zIndex: 999,
  },
  spinnerOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    marginBottom: spacing.md,
  },
  glowRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: radius.full,
    borderWidth: 2,
  },
  spinner: {
    transform: [{ scale: 1.1 }],
  },
  message: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md + 1,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  progressBarWrapper: {
    width: 200,
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  stepsContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 220,
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  stepDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  stepCurrent: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  cancelWrapper: {
    marginTop: spacing.lg,
  },
});

export default LoadingState;
