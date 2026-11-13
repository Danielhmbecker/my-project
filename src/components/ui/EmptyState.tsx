import React from 'react';
import {
  View,
  Text,
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

export interface EmptyStateProps {
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  customAction?: React.ReactNode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconName = 'code-outline',
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  customAction,
  compact = false,
  style,
  titleStyle,
  descriptionStyle,
  testID,
}) => {
  const resolvedIcon = icon || (iconName ? (
    <Ionicons
      name={iconName}
      size={compact ? 28 : 40}
      color={colors.accentPrimary}
    />
  ) : null);

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        style,
      ]}
      testID={testID}
    >
      {resolvedIcon && (
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
          {resolvedIcon}
        </View>
      )}

      <Text style={[styles.title, compact && styles.titleCompact, titleStyle]}>
        {title}
      </Text>

      {description ? (
        <Text style={[styles.description, compact && styles.descriptionCompact, descriptionStyle]}>
          {description}
        </Text>
      ) : null}

      {(actionLabel || secondaryActionLabel || customAction) && (
        <View style={[styles.actionsRow, compact && styles.actionsRowCompact]}>
          {actionLabel && onAction && (
            <Button
              iconName={actionIcon}
              onPress={onAction}
              size={compact ? 'sm' : 'md'}
              title={actionLabel}
              variant="primary"
            />
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onPress={onSecondaryAction}
              size={compact ? 'sm' : 'md'}
              title={secondaryActionLabel}
              variant="outline"
            />
          )}

          {customAction}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
  },
  containerCompact: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircleCompact: {
    width: 52,
    height: 52,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
  },
  titleCompact: {
    fontSize: fontSizes.base,
    marginBottom: 2,
  },
  description: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm + 1,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  descriptionCompact: {
    fontSize: fontSizes.xs + 1,
    lineHeight: 16,
    maxWidth: 260,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionsRowCompact: {
    gap: spacing.sm,
  },
});

export default EmptyState;
