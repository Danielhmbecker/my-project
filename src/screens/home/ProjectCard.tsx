import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Project, ProjectFramework, BuildStatus } from '../../models/types';

export interface ProjectCardProps {
  project: Project;
  onPress?: (project: Project) => void;
  onLaunchPreview?: (project: Project) => void;
  onOpenIDE?: (project: Project) => void;
  variant?: 'carousel' | 'list';
  style?: StyleProp<ViewStyle>;
}

/**
 * Format timestamp into relative readable developer time
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Metadata config for project frameworks
 */
export const FRAMEWORK_CONFIG: Record<
  ProjectFramework,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> = {
  expo: {
    label: 'Expo',
    icon: 'flash',
    color: '#388bfd',
    bgColor: 'rgba(56, 139, 253, 0.12)',
  },
  ios: {
    label: 'iOS / Swift',
    icon: 'logo-apple',
    color: '#8957e5',
    bgColor: 'rgba(137, 87, 229, 0.12)',
  },
  nextjs: {
    label: 'Next.js',
    icon: 'globe-outline',
    color: '#f0f6fc',
    bgColor: 'rgba(240, 246, 252, 0.1)',
  },
  react: {
    label: 'React Native',
    icon: 'code-slash',
    color: '#39c5cf',
    bgColor: 'rgba(57, 197, 207, 0.12)',
  },
  web: {
    label: 'Web',
    icon: 'browsers-outline',
    color: '#3fb950',
    bgColor: 'rgba(63, 185, 80, 0.12)',
  },
  game: {
    label: 'Game Dev',
    icon: 'game-controller-outline',
    color: '#f0883e',
    bgColor: 'rgba(240, 136, 62, 0.12)',
  },
};

/**
 * Metadata config for build statuses
 */
export const BUILD_STATUS_CONFIG: Record<
  BuildStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string; borderColor: string }
> = {
  idle: {
    label: 'Idle',
    icon: 'ellipse-outline',
    color: colors.textSecondary,
    bgColor: 'rgba(139, 148, 158, 0.12)',
    borderColor: 'rgba(139, 148, 158, 0.25)',
  },
  building: {
    label: 'Building...',
    icon: 'sync-outline',
    color: colors.warning,
    bgColor: colors.statusBgWarning,
    borderColor: colors.statusBorderWarning,
  },
  success: {
    label: 'Passing',
    icon: 'checkmark-circle-outline',
    color: colors.success,
    bgColor: colors.statusBgSuccess,
    borderColor: colors.statusBorderSuccess,
  },
  failed: {
    label: 'Failed',
    icon: 'close-circle-outline',
    color: colors.error,
    bgColor: colors.statusBgError,
    borderColor: colors.statusBorderError,
  },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onPress,
  onLaunchPreview,
  onOpenIDE,
  variant = 'carousel',
  style,
}) => {
  const fw = FRAMEWORK_CONFIG[project.framework] || FRAMEWORK_CONFIG.expo;
  const build = BUILD_STATUS_CONFIG[project.buildStatus] || BUILD_STATUS_CONFIG.idle;
  const isCarousel = variant === 'carousel';

  const hasPreview = Boolean(project.previewUrl || project.buildStatus === 'success');

  const handleCardPress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onPress?.(project);
  };

  const handlePreviewPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onLaunchPreview?.(project);
  };

  const handleIDEPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onOpenIDE?.(project);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleCardPress}
      style={[
        styles.card,
        isCarousel ? styles.cardCarousel : styles.cardList,
        style,
      ]}
    >
      {/* Top Header: Framework pill & Project Origin Tag (Demo vs User) */}
      <View style={styles.headerRow}>
        <View style={styles.pillsContainer}>
          {/* Framework pill */}
          <View style={[styles.frameworkPill, { backgroundColor: fw.bgColor, borderColor: `${fw.color}40` }]}>
            <Ionicons name={fw.icon} size={12} color={fw.color} style={styles.frameworkIcon} />
            <Text style={[styles.frameworkText, { color: fw.color }]}>{fw.label}</Text>
          </View>

          {/* Demo vs User project tag */}
          {project.isDemo ? (
            <View style={styles.demoTag}>
              <Ionicons name="sparkles" size={10} color={colors.accentPurple} style={{ marginRight: 3 }} />
              <Text style={styles.demoTagText}>DEMO</Text>
            </View>
          ) : (
            <View style={styles.userTag}>
              <Ionicons name="person-outline" size={10} color={colors.accentCyan} style={{ marginRight: 3 }} />
              <Text style={styles.userTagText}>PROJECT</Text>
            </View>
          )}
        </View>

        {/* Build Status Badge */}
        <View
          style={[
            styles.buildBadge,
            { backgroundColor: build.bgColor, borderColor: build.borderColor },
          ]}
        >
          <Ionicons
            name={build.icon}
            size={11}
            color={build.color}
            style={[styles.buildIcon, project.buildStatus === 'building' ? styles.spinning : undefined]}
          />
          <Text style={[styles.buildText, { color: build.color }]}>{build.label}</Text>
        </View>
      </View>

      {/* Project Title & Description */}
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <Text style={styles.projectName} numberOfLines={1} ellipsizeMode="tail">
            {project.name}
          </Text>
        </View>

        {project.description ? (
          <Text
            style={styles.projectDescription}
            numberOfLines={isCarousel ? 2 : 1}
            ellipsizeMode="tail"
          >
            {project.description}
          </Text>
        ) : null}
      </View>

      {/* Meta Bar: Branch, Files count, and Last Modified */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          {project.gitBranch ? (
            <View style={styles.branchChip}>
              <Ionicons name="git-branch-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.branchText} numberOfLines={1}>
                {project.gitBranch}
              </Text>
            </View>
          ) : null}

          {project.filesCount !== undefined ? (
            <View style={styles.fileCountChip}>
              <Ionicons name="document-text-outline" size={11} color={colors.textMuted} />
              <Text style={styles.fileCountText}>{project.filesCount} files</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.modifiedText}>{formatRelativeTime(project.lastModified)}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Action Footer: Preview Availability & Quick Launch Buttons */}
      <View style={styles.footerRow}>
        {/* Preview status pill */}
        <View style={styles.previewStatusContainer}>
          <View
            style={[
              styles.previewStatusDot,
              { backgroundColor: hasPreview ? colors.success : colors.textMuted },
            ]}
          />
          <Text style={[styles.previewStatusLabel, { color: hasPreview ? colors.success : colors.textMuted }]}>
            {hasPreview ? 'Preview Available' : 'Preview Offline'}
          </Text>
        </View>

        {/* Quick action buttons */}
        <View style={styles.actionButtonsRow}>
          {onOpenIDE && (
            <TouchableOpacity
              onPress={handleIDEPress}
              style={styles.ideActionButton}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="code-slash" size={13} color={colors.textSecondary} />
              <Text style={styles.ideActionText}>IDE</Text>
            </TouchableOpacity>
          )}

          {onLaunchPreview && (
            <TouchableOpacity
              onPress={handlePreviewPress}
              disabled={!hasPreview}
              style={[
                styles.previewActionButton,
                !hasPreview && styles.previewActionButtonDisabled,
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="play"
                size={12}
                color={hasPreview ? colors.accentPrimary : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.previewActionText,
                  !hasPreview && styles.previewActionTextDisabled,
                ]}
              >
                Preview
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  cardCarousel: {
    width: 300,
    marginRight: spacing.md,
  },
  cardList: {
    width: '100%',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  frameworkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  frameworkIcon: {
    marginRight: 4,
  },
  frameworkText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
  },
  demoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(137, 87, 229, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(137, 87, 229, 0.3)',
  },
  demoTagText: {
    color: colors.accentPurple,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  userTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 197, 207, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(57, 197, 207, 0.25)',
  },
  userTagText: {
    color: colors.accentCyan,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  buildBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  buildIcon: {
    marginRight: 4,
  },
  spinning: {
    // Rotation if animated
  },
  buildText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.medium,
  },
  contentSection: {
    marginVertical: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  projectName: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.sans,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  projectDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  branchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    maxWidth: 110,
  },
  branchText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    marginLeft: 3,
  },
  fileCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileCountText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    marginLeft: 3,
  },
  modifiedText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  previewStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  previewStatusLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.medium,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ideActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ideActionText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  previewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPrimaryAlpha,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 139, 253, 0.4)',
  },
  previewActionButtonDisabled: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.borderSubtle,
    opacity: 0.6,
  },
  previewActionText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
  },
  previewActionTextDisabled: {
    color: colors.textMuted,
  },
});
