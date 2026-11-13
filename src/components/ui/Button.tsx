import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  icon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loadingColor?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  icon,
  iconLeft,
  iconRight,
  iconName,
  iconPosition = 'left',
  style,
  textStyle,
  loadingColor,
  onPress,
  activeOpacity = 0.75,
  ...rest
}) => {
  const isInteractive = !disabled && !loading;

  const handlePress = (e: any) => {
    if (!isInteractive) return;
    if (haptic) {
      try {
        if (variant === 'danger') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      } catch {
        // Haptics safe fallback for web / unsupported environments
      }
    }
    onPress?.(e);
  };

  // Resolve icon elements
  const namedIcon = iconName ? (
    <Ionicons
      name={iconName}
      size={getIconSize(size)}
      color={getIconColor(variant, disabled)}
    />
  ) : null;

  const resolvedLeftIcon = iconLeft || (iconPosition === 'left' ? icon || namedIcon : null);
  const resolvedRightIcon = iconRight || (iconPosition === 'right' ? icon || namedIcon : null);

  const containerStyles: StyleProp<ViewStyle> = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const labelStyles: StyleProp<TextStyle> = [
    styles.textBase,
    styles[`text_size_${size}`],
    styles[`text_variant_${variant}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const resolvedLoadingColor =
    loadingColor ||
    (variant === 'primary' || variant === 'danger'
      ? colors.white
      : colors.accentPrimary);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      activeOpacity={activeOpacity}
      disabled={!isInteractive}
      onPress={handlePress}
      style={containerStyles}
      {...rest}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === 'sm' ? 'small' : 'small'}
            color={resolvedLoadingColor}
          />
          {title ? (
            <Text style={[labelStyles, styles.loadingText]}>{title}</Text>
          ) : typeof children === 'string' ? (
            <Text style={[labelStyles, styles.loadingText]}>{children}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.contentRow}>
          {resolvedLeftIcon && (
            <View style={[styles.iconWrapper, styles.iconLeftSpacing]}>
              {resolvedLeftIcon}
            </View>
          )}

          {title ? (
            <Text style={labelStyles}>{title}</Text>
          ) : typeof children === 'string' ? (
            <Text style={labelStyles}>{children}</Text>
          ) : (
            children
          )}

          {resolvedRightIcon && (
            <View style={[styles.iconWrapper, styles.iconRightSpacing]}>
              {resolvedRightIcon}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getIconSize = (size: ButtonSize): number => {
  switch (size) {
    case 'sm':
      return 14;
    case 'lg':
      return 20;
    case 'md':
    default:
      return 16;
  }
};

const getIconColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return colors.textDisabled;
  switch (variant) {
    case 'primary':
      return colors.white;
    case 'danger':
      return colors.white;
    case 'secondary':
      return colors.textPrimary;
    case 'outline':
      return colors.textPrimary;
    case 'ghost':
      return colors.accentPrimary;
    default:
      return colors.textPrimary;
  }
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  loading: {
    opacity: 0.85,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.xs,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeftSpacing: {
    marginRight: spacing.sm,
  },
  iconRightSpacing: {
    marginLeft: spacing.sm,
  },

  // SIZES
  size_sm: {
    height: 32,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm + 2,
  },
  size_md: {
    height: 40,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  size_lg: {
    height: 48,
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },

  // VARIANTS
  variant_primary: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.borderFocus,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  variant_secondary: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.border,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderColor: colors.borderLight,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  // TEXT BASE
  textBase: {
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  textDisabled: {
    color: colors.textDisabled,
  },

  // TEXT SIZES
  text_size_sm: {
    fontSize: fontSizes.xs + 1,
    lineHeight: 16,
  },
  text_size_md: {
    fontSize: fontSizes.sm + 1,
    lineHeight: 20,
  },
  text_size_lg: {
    fontSize: fontSizes.md + 1,
    lineHeight: 24,
  },

  // TEXT VARIANTS
  text_variant_primary: {
    color: colors.white,
  },
  text_variant_secondary: {
    color: colors.textPrimary,
  },
  text_variant_outline: {
    color: colors.textPrimary,
  },
  text_variant_ghost: {
    color: colors.accentPrimary,
  },
  text_variant_danger: {
    color: colors.white,
  },
});

export default Button;
