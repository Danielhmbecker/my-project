import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Agent, AgentStatus, Skill } from '../../models/types';
import { Badge } from '../../components/ui/Badge';

export interface AgentCardProps {
  agent: Agent;
  skills?: Skill[];
  onPress: (agent: Agent) => void;
  onToggleStatus: (agent: Agent) => void;
  style?: StyleProp<ViewStyle>;
}

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const STATUS_CONFIG: Record<AgentStatus, StatusConfig> = {
  working: {
    label: 'Working',
    color: colors.accentCyan,
    bgColor: 'rgba(57, 197, 207, 0.15)',
    borderColor: 'rgba(57, 197, 207, 0.35)',
    icon: 'sync-outline',
  },
  ready: {
    label: 'Ready',
    color: colors.success,
    bgColor: colors.statusBgSuccess,
    borderColor: colors.statusBorderSuccess,
    icon: 'checkmark-circle-outline',
  },
  idle: {
    label: 'Idle',
    color: colors.secondary,
    bgColor: 'rgba(139, 148, 158, 0.12)',
    borderColor: 'rgba(139, 148, 158, 0.25)',
    icon: 'time-outline',
  },
  paused: {
    label: 'Paused',
    color: colors.warning,
    bgColor: colors.statusBgWarning,
    borderColor: colors.statusBorderWarning,
    icon: 'pause-circle-outline',
  },
  failed: {
    label: 'Failed',
    color: colors.error,
    bgColor: colors.statusBgError,
    borderColor: colors.statusBorderError,
    icon: 'alert-circle-outline',
  },
  completed: {
    label: 'Completed',
    color: colors.success,
    bgColor: colors.statusBgSuccess,
    borderColor: colors.statusBorderSuccess,
    icon: 'checkmark-done-circle-outline',
  },
};

/**
 * Status Pill component displaying current agent status with appropriate tint and icon
 */
export const AgentStatusPill: React.FC<{
  status: AgentStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 6 : 8,
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: config.color }]} />
      <Text
        style={[
          styles.statusText,
          {
            color: config.color,
            fontSize: isSm ? 10 : 11,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  skills = [],
  onPress,
  onToggleStatus,
  style,
}) => {
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const agentColor = agent.color || colors.accentPrimary;

  // Map assigned skill IDs to skill objects or readable names
  const assignedSkills = agent.assignedSkillIds
    .map((skillId) => {
      const found = skills.find((s) => s.id === skillId);
      if (found) return found.name;
      // Fallback: humanize skillId (e.g. 'skill-dev-ts' -> 'TypeScript')
      return skillId.replace(/^skill-(dev-|des-|ops-|test-)?/, '').toUpperCase();
    })
    .filter(Boolean);

  const visibleSkills = assignedSkills.slice(0, 3);
  const remainingSkillsCount = assignedSkills.length - visibleSkills.length;

  const handleCardPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore haptics error on web or unsupported platforms
    }
    onPress(agent);
  };

  const handleTogglePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore
    }
    onToggleStatus(agent);
  };

  // Determine button label and icon based on status
  const isWorking = agent.status === 'working';
  const isPaused = agent.status === 'paused';
  const buttonLabel = isWorking ? 'Pause' : isPaused ? 'Resume' : agent.status === 'failed' ? 'Retry' : 'Run';
  const buttonIcon: keyof typeof Ionicons.glyphMap = isWorking
    ? 'pause'
    : isPaused
    ? 'play'
    : agent.status === 'failed'
    ? 'refresh'
    : 'play';

  // Determine valid vector icon or fallback
  const validIcon: keyof typeof Ionicons.glyphMap =
    agent.avatar && agent.avatar in Ionicons.glyphMap
      ? (agent.avatar as keyof typeof Ionicons.glyphMap)
      : 'hardware-chip-outline';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleCardPress}
      style={[styles.card, style]}
    >
      {/* Top Row: Avatar, Name & Role, Status Pill */}
      <View style={styles.headerRow}>
        <View style={styles.agentInfoGroup}>
          <View
            style={[
              styles.avatarContainer,
              {
                borderColor: agentColor,
                backgroundColor: `${agentColor}18`,
              },
            ]}
          >
            <Ionicons name={validIcon} size={22} color={agentColor} />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.nameRow}>
              <Text style={styles.agentName} numberOfLines={1}>
                {agent.name}
              </Text>
            </View>
            <View style={styles.roleBadgeContainer}>
              <Text style={[styles.roleBadgeText, { color: agentColor }]} numberOfLines={1}>
                {agent.role}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Pill */}
        <AgentStatusPill status={agent.status} />
      </View>

      {/* Current Assigned Task */}
      <View style={styles.taskContainer}>
        <View style={styles.taskHeader}>
          <Ionicons
            name="flash-outline"
            size={13}
            color={isWorking ? colors.accentCyan : colors.textMuted}
            style={styles.taskIcon}
          />
          <Text style={styles.taskLabel}>CURRENT TASK</Text>
        </View>
        <Text
          style={[
            styles.taskText,
            !agent.currentTaskId && styles.taskTextIdle,
          ]}
          numberOfLines={2}
        >
          {agent.currentTaskId
            ? agent.description
            : 'Idle — ready for next orchestration batch or manual task assignment.'}
        </Text>
      </View>

      {/* Active Skills Tags */}
      {assignedSkills.length > 0 && (
        <View style={styles.skillsSection}>
          <View style={styles.skillsRow}>
            {visibleSkills.map((skillName, idx) => (
              <View key={idx} style={styles.skillTag}>
                <Ionicons
                  name="code-working-outline"
                  size={11}
                  color={colors.secondary}
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.skillTagText} numberOfLines={1}>
                  {skillName}
                </Text>
              </View>
            ))}
            {remainingSkillsCount > 0 && (
              <View style={styles.moreSkillsTag}>
                <Text style={styles.moreSkillsText}>+{remainingSkillsCount}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Footer: Metadata & Pause/Resume Action */}
      <View style={styles.footerRow}>
        <View style={styles.metadataGroup}>
          {agent.model && (
            <View style={styles.metaBadge}>
              <Ionicons name="sparkles-outline" size={11} color={colors.accentPurple} />
              <Text style={styles.metaText}>{agent.model}</Text>
            </View>
          )}
          {agent.temperature !== undefined && (
            <View style={styles.metaBadge}>
              <Ionicons name="thermometer-outline" size={11} color={colors.secondary} />
              <Text style={styles.metaText}>{agent.temperature.toFixed(1)}</Text>
            </View>
          )}
          {agent.autoApprove && (
            <View style={[styles.metaBadge, styles.autoApproveBadge]}>
              <Ionicons name="checkmark-done" size={11} color={colors.success} />
              <Text style={[styles.metaText, { color: colors.success }]}>Auto</Text>
            </View>
          )}
        </View>

        {/* Pause/Resume Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleTogglePress}
          style={[
            styles.actionButton,
            isWorking && styles.actionButtonPause,
            isPaused && styles.actionButtonResume,
          ]}
        >
          <Ionicons
            name={buttonIcon}
            size={13}
            color={
              isWorking
                ? colors.warning
                : isPaused
                ? colors.success
                : colors.accentPrimary
            }
          />
          <Text
            style={[
              styles.actionButtonText,
              {
                color: isWorking
                  ? colors.warning
                  : isPaused
                  ? colors.success
                  : colors.accentPrimary,
              },
            ]}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>
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
    marginBottom: spacing.md,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  agentInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  titleColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  roleBadgeContainer: {
    marginTop: 2,
  },
  roleBadgeText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskContainer: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentPrimary,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  taskIcon: {
    marginRight: 4,
  },
  taskLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  taskText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  taskTextIdle: {
    color: colors.secondary,
    fontStyle: 'italic',
  },
  skillsSection: {
    marginTop: spacing.sm,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxWidth: 160,
  },
  skillTagText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
  },
  moreSkillsTag: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  moreSkillsText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
    fontWeight: fontWeights.semibold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  metadataGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
    gap: 3,
  },
  autoApproveBadge: {
    backgroundColor: colors.statusBgSuccess,
  },
  metaText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  actionButtonPause: {
    borderColor: colors.statusBorderWarning,
    backgroundColor: colors.statusBgWarning,
  },
  actionButtonResume: {
    borderColor: colors.statusBorderSuccess,
    backgroundColor: colors.statusBgSuccess,
  },
  actionButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
});

export default AgentCard;
