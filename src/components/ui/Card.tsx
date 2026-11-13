import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';

export type CardVariant = 'bordered' | 'elevated' | 'flat' | 'interactive';
export type CardElevation = 'none' | 'sm' | 'md' | 'card' | 'lg';

export interface CardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: CardVariant;
  elevation?: CardElevation;
  onPress?: TouchableOpacityProps['onPress'];
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  iconName,
  headerAction,
  footer,
  variant = 'bordered',
  elevation = 'card',
  onPress,
  activeOpacity = 0.8,
  style,
  contentStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  footerStyle,
  testID,
}) => {
  const isInteractive = Boolean(onPress) || variant === 'interactive';

  const handlePress = (e: any) => {
    if (!onPress) return;
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // Safe fallback
    }
    onPress(e);
  };

  const resolvedIcon = icon || (iconName ? (
    <Ionicons
      name={iconName}
      size={20}
      color={colors.accentPrimary}
    />
  ) : null);

  const hasHeader = Boolean(title || subtitle || resolvedIcon || headerAction);

  const containerStyles: StyleProp<ViewStyle> = [
    styles.container,
    styles[`variant_${variant}`],
    variant === 'elevated' && shadows[elevation] ? shadows[elevation] : null,
    style,
  ];

  const content = (
    <>
      {hasHeader && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            {resolvedIcon && (
              <View style={styles.iconContainer}>
                {resolvedIcon}
              </View>
            )}
            <View style={styles.titleColumn}>
              {typeof title === 'string' ? (
                <Text numberOfLines={1} style={[styles.title, titleStyle]}>
                  {title}
                </Text>
              ) : (
                title
              )}
              {typeof subtitle === 'string' ? (
                <Text numberOfLines={2} style={[styles.subtitle, subtitleStyle]}>
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )}
            </View>
          </View>

          {headerAction && (
            <View style={styles.headerActionContainer}>
              {headerAction}
            </View>
          )}
        </View>
      )}

      {children && (
        <View style={[styles.body, hasHeader && styles.bodyWithHeader, contentStyle]}>
          {children}
        </View>
      )}

      {footer && (
        <View style={[styles.footer, footerStyle]}>
          {footer}
        </View>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={activeOpacity}
        onPress={handlePress}
        style={containerStyles}
        testID={testID}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles} testID={testID}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  // VARIANTS
  variant_bordered: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_elevated: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  variant_flat: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 0,
  },
  variant_interactive: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActionContainer: {
    marginLeft: spacing.md,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // BODY
  body: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  bodyWithHeader: {
    paddingTop: spacing.xs,
  },

  // FOOTER
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});

export default Card;
