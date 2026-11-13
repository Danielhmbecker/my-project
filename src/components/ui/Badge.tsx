import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

export type BadgeStatus =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'accent'
  | 'purple'
  | 'cyan';

export type BadgeVariant = 'filled' | 'outline' | 'subtle';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
  label?: React.ReactNode;
  children?: React.ReactNode;
  status?: BadgeStatus;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  dotStyle?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  children,
  status = 'default',
  variant = 'subtle',
  size = 'sm',
  dot = false,
  icon,
  iconName,
  onPress,
  style,
  textStyle,
  dotStyle,
}) => {
  const content = label !== undefined ? label : children;
  const isInteractive = Boolean(onPress);

  const statusColors = getStatusColors(status, variant);

  const resolvedIcon = icon || (iconName ? (
    <Ionicons
      name={iconName}
      size={getBadgeIconSize(size)}
      color={statusColors.text}
    />
  ) : null);

  const badgeComponent = (
    <View
      style={[
        styles.badge,
        styles[`size_${size}`],
        {
          backgroundColor: statusColors.bg,
          borderColor: statusColors.border,
          borderWidth: variant === 'filled' ? 0 : 1,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            styles[`dot_size_${size}`],
            { backgroundColor: statusColors.dot },
            dotStyle,
          ]}
        />
      )}

      {resolvedIcon && (
        <View style={styles.iconWrapper}>
          {resolvedIcon}
        </View>
      )}

      {typeof content === 'string' || typeof content === 'number' ? (
        <Text
          numberOfLines={1}
          style={[
            styles.text,
            styles[`text_size_${size}`],
            { color: statusColors.text },
            textStyle,
          ]}
        >
          {content}
        </Text>
      ) : (
        content
      )}
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.touchableWrapper}
      >
        {badgeComponent}
      </TouchableOpacity>
    );
  }

  return badgeComponent;
};

const getBadgeIconSize = (size: BadgeSize): number => {
  switch (size) {
    case 'xs':
      return 10;
    case 'md':
      return 14;
    case 'sm':
    default:
      return 12;
  }
};

interface ResolvedColors {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

const getStatusColors = (status: BadgeStatus, variant: BadgeVariant): ResolvedColors => {
  let mainColor: string;
  let subtleBg: string;
  let subtleBorder: string;

  switch (status) {
    case 'success':
      mainColor = colors.success;
      subtleBg = colors.statusBgSuccess;
      subtleBorder = colors.statusBorderSuccess;
      break;
    case 'warning':
      mainColor = colors.warning;
      subtleBg = colors.statusBgWarning;
      subtleBorder = colors.statusBorderWarning;
      break;
    case 'error':
      mainColor = colors.error;
      subtleBg = colors.statusBgError;
      subtleBorder = colors.statusBorderError;
      break;
    case 'info':
      mainColor = colors.info;
      subtleBg = colors.statusBgInfo;
      subtleBorder = colors.statusBorderInfo;
      break;
    case 'accent':
      mainColor = colors.accentPrimary;
      subtleBg = colors.accentPrimaryAlpha;
      subtleBorder = 'rgba(56, 139, 253, 0.35)';
      break;
    case 'purple':
      mainColor = colors.accentPurple;
      subtleBg = colors.accentPurpleAlpha;
      subtleBorder = 'rgba(137, 87, 229, 0.35)';
      break;
    case 'cyan':
      mainColor = colors.accentCyan;
      subtleBg = colors.accentCyanAlpha;
      subtleBorder = 'rgba(57, 197, 207, 0.35)';
      break;
    case 'default':
    default:
      mainColor = colors.textSecondary;
      subtleBg = colors.bgTertiary;
      subtleBorder = colors.border;
      break;
  }

  switch (variant) {
    case 'filled':
      return {
        bg: mainColor,
        border: mainColor,
        text: status === 'default' ? colors.textPrimary : colors.white,
        dot: colors.white,
      };
    case 'outline':
      return {
        bg: 'transparent',
        border: subtleBorder || mainColor,
        text: mainColor,
        dot: mainColor,
      };
    case 'subtle':
    default:
      return {
        bg: subtleBg,
        border: subtleBorder,
        text: mainColor,
        dot: mainColor,
      };
  }
};

const styles = StyleSheet.create({
  touchableWrapper: {
    alignSelf: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
  },
  iconWrapper: {
    marginRight: 4,
  },
  dot: {
    borderRadius: radius.pill,
    marginRight: 5,
  },
  text: {
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
  },

  // SIZES
  size_xs: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    minHeight: 18,
  },
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minHeight: 22,
  },
  size_md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 26,
  },

  // DOT SIZES
  dot_size_xs: {
    width: 4,
    height: 4,
  },
  dot_size_sm: {
    width: 6,
    height: 6,
  },
  dot_size_md: {
    width: 7,
    height: 7,
  },

  // TEXT SIZES
  text_size_xs: {
    fontSize: 10,
    lineHeight: 12,
  },
  text_size_sm: {
    fontSize: fontSizes.xs,
    lineHeight: 14,
  },
  text_size_md: {
    fontSize: fontSizes.sm,
    lineHeight: 16,
  },
});

export default Badge;
