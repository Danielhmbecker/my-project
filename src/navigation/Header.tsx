import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

export type HeaderStatusType =
  | 'ready'
  | 'building'
  | 'working'
  | 'offline'
  | 'needs_approval'
  | 'syncing'
  | 'idle';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  backTitle?: string;
  isModal?: boolean;
  onClose?: () => void;
  // Status indicator
  showStatus?: boolean;
  status?: HeaderStatusType;
  statusText?: string;
  onStatusPress?: () => void;
  // Quick Action Buttons
  showActions?: boolean;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  onOpenPreview?: () => void;
  onOpenDeploy?: () => void;
  onOpenArena?: () => void;
  onOpenWorkflows?: () => void;
  // Custom right/left slots
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'ARENA STUDIO',
  subtitle,
  showBack = false,
  onBack,
  backTitle,
  isModal = false,
  onClose,
  showStatus = true,
  status = 'ready',
  statusText,
  onStatusPress,
  showActions = true,
  onOpenNotifications,
  unreadCount = 0,
  onOpenPreview,
  onOpenDeploy,
  onOpenArena,
  onOpenWorkflows,
  leftAction,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch {
      // Haptics fallback
    }
  };

  const getStatusConfig = (st: HeaderStatusType) => {
    switch (st) {
      case 'ready':
        return {
          color: colors.success,
          text: statusText || 'Ready',
          dotColor: colors.success,
        };
      case 'building':
        return {
          color: colors.accentPrimary,
          text: statusText || 'Building',
          dotColor: colors.accentPrimary,
        };
      case 'working':
        return {
          color: colors.accentPurple,
          text: statusText || 'Agents Active',
          dotColor: colors.accentPurple,
        };
      case 'needs_approval':
        return {
          color: colors.warning,
          text: statusText || 'Approval Required',
          dotColor: colors.warning,
        };
      case 'offline':
        return {
          color: colors.error,
          text: statusText || 'Offline',
          dotColor: colors.error,
        };
      case 'syncing':
        return {
          color: colors.accentCyan,
          text: statusText || 'Syncing',
          dotColor: colors.accentCyan,
        };
      case 'idle':
      default:
        return {
          color: colors.textMuted,
          text: statusText || 'Idle',
          dotColor: colors.textMuted,
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const topPadding = Math.max(insets.top, 10);

  return (
    <View style={[styles.wrapper, { paddingTop: topPadding }]}>
      <View style={styles.headerContent}>
        {/* Left Section: Back / Close button or Logo */}
        <View style={styles.leftSection}>
          {leftAction ? (
            leftAction
          ) : isModal && onClose ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              style={styles.backButton}
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : showBack && onBack ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              onPress={() => {
                triggerHaptic();
                onBack();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={colors.accentPrimary} />
              {backTitle ? (
                <Text style={styles.backTitleText} numberOfLines={1}>
                  {backTitle}
                </Text>
              ) : null}
            </TouchableOpacity>
          ) : (
            <View style={styles.brandingWrapper}>
              <View style={styles.logoBadge}>
                <Ionicons name="cube" size={14} color={colors.accentPrimary} />
              </View>
            </View>
          )}

          {/* Title & Subtitle */}
          <View style={styles.titleWrapper}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>

              {/* Status Pill Indicator */}
              {showStatus && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`System status: ${statusConfig.text}`}
                  onPress={onStatusPress}
                  disabled={!onStatusPress}
                  style={[
                    styles.statusPill,
                    { borderColor: statusConfig.color + '40' },
                  ]}
                  activeOpacity={onStatusPress ? 0.7 : 1}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusConfig.dotColor },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: statusConfig.color }]}
                    numberOfLines={1}
                  >
                    {statusConfig.text}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {subtitle ? (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right Section: Action Buttons */}
        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : showActions ? (
            <View style={styles.actionsRow}>
              {/* Arena.ai Jump */}
              {onOpenArena && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Open Arena.ai Workspace"
                  style={styles.actionIconButton}
                  onPress={() => {
                    triggerHaptic();
                    onOpenArena();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={19}
                    color={colors.accentCyan}
                  />
                </TouchableOpacity>
              )}

              {/* Workflows / Orchestration */}
              {onOpenWorkflows && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Open Multi-Agent Workflows"
                  style={styles.actionIconButton}
                  onPress={() => {
                    triggerHaptic();
                    onOpenWorkflows();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="git-network-outline"
                    size={19}
                    color={colors.accentPurple}
                  />
                </TouchableOpacity>
              )}

              {/* Live Preview Button */}
              {onOpenPreview && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Launch Live Preview"
                  style={styles.actionIconButton}
                  onPress={() => {
                    triggerHaptic();
                    onOpenPreview();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="play-circle-outline"
                    size={20}
                    color={colors.success}
                  />
                </TouchableOpacity>
              )}

              {/* Deploy Action */}
              {onOpenDeploy && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Build and Deploy"
                  style={styles.actionIconButton}
                  onPress={() => {
                    triggerHaptic();
                    onOpenDeploy();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={19}
                    color={colors.accentPrimary}
                  />
                </TouchableOpacity>
              )}

              {/* Notification Bell */}
              {onOpenNotifications && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="View Notifications"
                  style={styles.actionIconButton}
                  onPress={() => {
                    triggerHaptic();
                    onOpenNotifications();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={19}
                    color={colors.textSecondary}
                  />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 100,
  },
  headerContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  backTitleText: {
    color: colors.accentPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    marginLeft: 2,
    maxWidth: 80,
  },
  brandingWrapper: {
    marginRight: spacing.sm,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  subtitleText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs - 1,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: fontSizes.xs - 2, // ~9px
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: fontWeights.bold,
    lineHeight: 10,
  },
});

export default Header;
