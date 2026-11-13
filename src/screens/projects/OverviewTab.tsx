import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { Card, Button, Badge } from '../../components/ui';
import { Project, Agent } from '../../models';

export interface OverviewTabProps {
  project: Project;
  agents: Agent[];
  onOpenIDE?: (project: Project) => void;
  onLaunchPreview?: (project: Project) => void;
  onNavigateTab?: (tab: 'overview' | 'files' | 'activity' | 'agents' | 'settings') => void;
  onRefresh?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  project,
  agents,
  onOpenIDE,
  onLaunchPreview,
  onNavigateTab,
  onRefresh,
}) => {
  // Assigned agents
  const assignedAgents = agents.filter(
    (a) => project.assignedAgentIds && project.assignedAgentIds.includes(a.id)
  );

  const handleLaunchPreview = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional fallback
    }
    if (onLaunchPreview) {
      onLaunchPreview(project);
    } else if (project.previewUrl) {
      Linking.openURL(project.previewUrl).catch((err) =>
        console.warn('Could not open preview URL:', err)
      );
    }
  };

  const handleOpenIDE = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onOpenIDE) {
      onOpenIDE(project);
    }
  };

  const handleShare = async () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (project.previewUrl) {
      await Share.share({
        title: project.name,
        message: `Check out ${project.name} on ARENA STUDIO: ${project.previewUrl}`,
        url: project.previewUrl,
      });
    }
  };

  // Helper for framework badge color
  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'expo':
        return colors.accentCyan;
      case 'ios':
        return colors.accentPrimary;
      case 'web':
      case 'react':
        return colors.accentCyan;
      case 'nextjs':
        return colors.textPrimary;
      case 'game':
        return colors.accentPurple;
      default:
        return colors.accentPrimary;
    }
  };

  // Helper for build status styling
  const getBuildStatusBadge = (status: Project['buildStatus']) => {
    switch (status) {
      case 'success':
        return {
          label: 'Passing',
          color: colors.success,
          bg: colors.statusBgSuccess,
          icon: 'checkmark-circle' as const,
        };
      case 'building':
        return {
          label: 'Building',
          color: colors.accentPrimary,
          bg: colors.accentPrimaryAlpha,
          icon: 'sync-outline' as const,
        };
      case 'failed':
        return {
          label: 'Failed',
          color: colors.error,
          bg: colors.statusBgError,
          icon: 'close-circle' as const,
        };
      case 'idle':
      default:
        return {
          label: 'Idle',
          color: colors.textMuted,
          bg: colors.bgTertiary,
          icon: 'pause-circle-outline' as const,
        };
    }
  };

  const buildBadge = getBuildStatusBadge(project.buildStatus);
  const formattedLOC = project.linesOfCode ? project.linesOfCode.toLocaleString() : '3,420';
  const formattedFiles = project.filesCount || 10;
  const lastModifiedFormatted = project.lastModified
    ? new Date(project.lastModified).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Hero Preview Action Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroStatusRow}>
            <View
              style={[
                styles.liveIndicatorDot,
                {
                  backgroundColor:
                    project.buildStatus === 'building'
                      ? colors.warning
                      : project.buildStatus === 'failed'
                      ? colors.error
                      : colors.success,
                },
              ]}
            />
            <Text style={styles.heroStatusText}>
              {project.buildStatus === 'building'
                ? 'BUNDLE COMPILING'
                : project.buildStatus === 'failed'
                ? 'BUILD FAILED'
                : 'LIVE PREVIEW READY'}
            </Text>
          </View>
          {project.previewUrl ? (
            <TouchableOpacity onPress={handleShare} style={styles.heroShareButton}>
              <Ionicons name="share-outline" size={16} color={colors.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.heroTitle}>{project.name}</Text>
        <Text style={styles.heroDescription} numberOfLines={3}>
          {project.description || 'Modern mobile workspace built with ARENA STUDIO.'}
        </Text>

        {project.previewUrl ? (
          <View style={styles.heroUrlBar}>
            <Ionicons name="link-outline" size={14} color={colors.accentPrimary} />
            <Text style={styles.heroUrlText} numberOfLines={1}>
              {project.previewUrl}
            </Text>
          </View>
        ) : null}

        <View style={styles.heroActionsRow}>
          <Button
            title="Launch Live Preview"
            variant="primary"
            size="md"
            iconName="play"
            onPress={handleLaunchPreview}
            style={styles.heroPrimaryButton}
          />
          <Button
            title="Open IDE"
            variant="secondary"
            size="md"
            iconName="code-slash"
            onPress={handleOpenIDE}
            style={styles.heroSecondaryButton}
          />
        </View>
      </View>

      {/* 2. Core Stats Grid (4 Cards) */}
      <Text style={styles.sectionTitle}>PROJECT METRICS</Text>
      <View style={styles.statsGrid}>
        {/* Stat 1: Files Count */}
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => onNavigateTab?.('files')}
        >
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total Files</Text>
            <View style={[styles.statIconBadge, { backgroundColor: colors.accentPrimaryAlpha }]}>
              <Ionicons name="folder-outline" size={16} color={colors.accentPrimary} />
            </View>
          </View>
          <Text style={styles.statValue}>{formattedFiles}</Text>
          <View style={styles.statFooter}>
            <Text style={styles.statSubtext}>Across project root</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Stat 2: Lines of Code */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Lines of Code</Text>
            <View style={[styles.statIconBadge, { backgroundColor: colors.accentCyanAlpha }]}>
              <Ionicons name="code-slash-outline" size={16} color={colors.accentCyan} />
            </View>
          </View>
          <Text style={styles.statValue}>{formattedLOC}</Text>
          <View style={styles.statFooter}>
            <Text style={styles.statSubtext}>Calculated LOC</Text>
          </View>
        </View>

        {/* Stat 3: Git Branch */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Git Branch</Text>
            <View style={[styles.statIconBadge, { backgroundColor: colors.accentPurpleAlpha }]}>
              <Ionicons name="git-branch-outline" size={16} color={colors.accentPurple} />
            </View>
          </View>
          <Text style={styles.statValue} numberOfLines={1}>
            {project.gitBranch || 'main'}
          </Text>
          <View style={styles.statFooter}>
            <Text style={styles.statSubtext}>Current active branch</Text>
          </View>
        </View>

        {/* Stat 4: Build Status */}
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => onNavigateTab?.('activity')}
        >
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Build Status</Text>
            <View style={[styles.statIconBadge, { backgroundColor: buildBadge.bg }]}>
              <Ionicons name={buildBadge.icon} size={16} color={buildBadge.color} />
            </View>
          </View>
          <View style={styles.statusPillRow}>
            <View style={[styles.statusDot, { backgroundColor: buildBadge.color }]} />
            <Text style={[styles.statValue, { color: buildBadge.color, fontSize: fontSizes.lg }]}>
              {buildBadge.label}
            </Text>
          </View>
          <View style={styles.statFooter}>
            <Text style={styles.statSubtext}>Latest build run</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. Assigned Specialist Team Members */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithCount}>
          <Text style={styles.sectionTitle}>ASSIGNED SPECIALISTS</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{assignedAgents.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onNavigateTab?.('agents')}
          style={styles.sectionActionLink}
        >
          <Text style={styles.sectionActionText}>Manage Team</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.accentPrimary} />
        </TouchableOpacity>
      </View>

      {assignedAgents.length === 0 ? (
        <Card variant="bordered" style={styles.emptyAgentsCard}>
          <View style={styles.emptyAgentsContent}>
            <Ionicons name="people-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyAgentsTitle}>No AI Specialists Assigned</Text>
            <Text style={styles.emptyAgentsSubtitle}>
              Assign autonomous agents to work on architecture, coding, UI, or tests for this project.
            </Text>
            <Button
              title="Assign Agents"
              size="sm"
              variant="outline"
              iconName="add"
              onPress={() => onNavigateTab?.('agents')}
              style={styles.assignAgentsBtn}
            />
          </View>
        </Card>
      ) : (
        <View style={styles.agentsList}>
          {assignedAgents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={styles.agentCard}
              activeOpacity={0.7}
              onPress={() => onNavigateTab?.('agents')}
            >
              <View style={styles.agentAvatarContainer}>
                <Text style={styles.agentAvatarEmoji}>{agent.avatar || '🤖'}</Text>
                <View
                  style={[
                    styles.agentStatusIndicator,
                    {
                      backgroundColor:
                        agent.status === 'working'
                          ? colors.accentGreen
                          : agent.status === 'paused'
                          ? colors.warning
                          : agent.status === 'ready'
                          ? colors.accentPrimary
                          : colors.textMuted,
                    },
                  ]}
                />
              </View>
              <View style={styles.agentInfo}>
                <View style={styles.agentTitleRow}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Badge
                    label={agent.status.toUpperCase()}
                    status={
                      agent.status === 'working'
                        ? 'success'
                        : agent.status === 'ready'
                        ? 'info'
                        : agent.status === 'paused'
                        ? 'warning'
                        : 'default'
                    }
                    size="xs"
                    dot
                  />
                </View>
                <Text style={styles.agentRole}>{agent.role}</Text>
                {agent.currentTaskId ? (
                  <View style={styles.agentTaskSnippet}>
                    <Ionicons name="hardware-chip-outline" size={11} color={colors.textSecondary} />
                    <Text style={styles.agentTaskSnippetText} numberOfLines={1}>
                      Task active: {agent.currentTaskId}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.borderLight} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 4. Repository & Configuration Summary */}
      <Text style={styles.sectionTitle}>ENVIRONMENT & METADATA</Text>
      <Card variant="bordered" style={styles.metaCard}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Framework</Text>
          <View style={styles.metaValueRow}>
            <View
              style={[
                styles.frameworkIndicator,
                { backgroundColor: getFrameworkColor(project.framework) },
              ]}
            />
            <Text style={styles.metaValueText}>
              {project.framework.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.metaValueText}>{project.category || 'General Mobile'}</Text>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Repository</Text>
          <Text style={[styles.metaValueText, styles.metaCodeText]} numberOfLines={1}>
            {project.gitRemote || 'Local repository'}
          </Text>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Last Modified</Text>
          <Text style={styles.metaValueText}>{lastModifiedFormatted}</Text>
        </View>
      </Card>

      {/* 5. Quick Shortcut Actions */}
      <View style={styles.quickShortcutsGrid}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => onNavigateTab?.('files')}
        >
          <Ionicons name="folder-open-outline" size={20} color={colors.accentPrimary} />
          <Text style={styles.shortcutText}>Browse Tree</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => onNavigateTab?.('activity')}
        >
          <Ionicons name="time-outline" size={20} color={colors.accentCyan} />
          <Text style={styles.shortcutText}>Audit Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => onNavigateTab?.('settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.accentPurple} />
          <Text style={styles.shortcutText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  // Hero Card
  heroCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  heroStatusText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  heroShareButton: {
    padding: spacing.xs,
  },
  heroTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  heroDescription: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  heroUrlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  heroUrlText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.textLink,
    marginLeft: spacing.xs,
    flex: 1,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroPrimaryButton: {
    flex: 1.2,
  },
  heroSecondaryButton: {
    flex: 1,
  },

  // Section Headers
  sectionTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  countPillText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.semibold,
  },
  sectionActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  sectionActionText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.accentPrimary,
    fontWeight: fontWeights.medium,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginVertical: 4,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  statSubtext: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
  },

  // Agents
  agentsList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  agentAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: spacing.md,
  },
  agentAvatarEmoji: {
    fontSize: 20,
  },
  agentStatusIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.bgSecondary,
  },
  agentInfo: {
    flex: 1,
  },
  agentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  agentName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  agentRole: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  agentTaskSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  agentTaskSnippetText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 1,
    color: colors.textSecondary,
    flex: 1,
  },
  emptyAgentsCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  emptyAgentsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  emptyAgentsTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  emptyAgentsSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
    maxWidth: 280,
  },
  assignAgentsBtn: {
    marginTop: spacing.xs,
  },

  // Metadata Card
  metaCard: {
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metaLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frameworkIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaValueText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  metaCodeText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.textCode,
    maxWidth: 200,
  },
  metaDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },

  // Quick Shortcuts
  quickShortcutsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  shortcutText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.secondary,
  },
});
