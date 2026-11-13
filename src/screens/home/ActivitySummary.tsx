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
import { Agent, Workflow, AgentActivity, Task } from '../../models/types';
import { formatRelativeTime } from './ProjectCard';

export interface ActivitySummaryProps {
  workflows?: Workflow[];
  agents?: Agent[];
  activities?: AgentActivity[];
  onSelectWorkflow?: (workflow: Workflow) => void;
  onSelectAgent?: (agent: Agent) => void;
  onViewAllWorkflows?: () => void;
  onViewAllActivities?: () => void;
  onViewAllAgents?: () => void;
  style?: StyleProp<ViewStyle>;
}

// Fallback seed agents in case storage hasn't loaded yet
export const DEFAULT_SUMMARY_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'Architect Agent',
    role: 'System Architect',
    description: 'Designs application specifications & contracts',
    instructions: '',
    avatar: 'cube-outline',
    status: 'working',
    assignedSkillIds: ['skill-1'],
    currentTaskId: 'task-101',
    activityHistory: [],
    permissions: ['read', 'write'],
    color: '#8957e5',
  },
  {
    id: 'agent-2',
    name: 'Developer Agent',
    role: 'Full-stack Engineer',
    description: 'Implements frontend screens & state',
    instructions: '',
    avatar: 'code-slash',
    status: 'working',
    assignedSkillIds: ['skill-2'],
    currentTaskId: 'task-102',
    activityHistory: [],
    permissions: ['read', 'write'],
    color: '#388bfd',
  },
  {
    id: 'agent-3',
    name: 'Design Agent',
    role: 'UI/UX Specialist',
    description: 'Produces themes, tokens and assets',
    instructions: '',
    avatar: 'color-palette-outline',
    status: 'ready',
    assignedSkillIds: ['skill-3'],
    currentTaskId: null,
    activityHistory: [],
    permissions: ['read', 'write'],
    color: '#39c5cf',
  },
  {
    id: 'agent-4',
    name: 'QA Agent',
    role: 'Test Engineer',
    description: 'Runs test verification and assertions',
    instructions: '',
    avatar: 'shield-checkmark-outline',
    status: 'idle',
    assignedSkillIds: ['skill-4'],
    currentTaskId: null,
    activityHistory: [],
    permissions: ['read'],
    color: '#3fb950',
  },
  {
    id: 'agent-5',
    name: 'Release Agent',
    role: 'DevOps & EAS',
    description: 'Deploys builds to app stores & Vercel',
    instructions: '',
    avatar: 'rocket-outline',
    status: 'idle',
    assignedSkillIds: ['skill-5'],
    currentTaskId: null,
    activityHistory: [],
    permissions: ['read', 'write'],
    color: '#f0883e',
  },
];

// Fallback sample active workflow
export const DEFAULT_ACTIVE_WORKFLOW: Workflow = {
  id: 'wf-demo-1',
  title: 'Multi-Agent Feature Implementation',
  objective: 'Design and deploy authentication screens and biometrics flow',
  status: 'running',
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  tasks: [
    {
      id: 'task-101',
      title: 'Architect contract & biometric API bindings',
      description: 'Define TypeScript contracts for LocalAuthentication',
      assignedAgentId: 'agent-1',
      status: 'completed',
      priority: 'high',
      dependsOn: [],
      progress: 100,
    },
    {
      id: 'task-102',
      title: 'Implement AuthScreen & PIN fallback UI',
      description: 'Build biometric prompt and fallback keycode view',
      assignedAgentId: 'agent-2',
      status: 'in_progress',
      priority: 'critical',
      dependsOn: ['task-101'],
      progress: 65,
    },
    {
      id: 'task-103',
      title: 'Verify secure token storage on device keychain',
      description: 'Run automated assertions for credentials storage',
      assignedAgentId: 'agent-4',
      status: 'pending',
      priority: 'high',
      dependsOn: ['task-102'],
      progress: 0,
    },
  ],
};

// Fallback recent activity timeline items
export const DEFAULT_ACTIVITIES: AgentActivity[] = [
  {
    id: 'act-1',
    agentId: 'agent-2',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    message: 'Developer Agent completed AuthScreen layout and haptic bindings',
    type: 'success',
  },
  {
    id: 'act-2',
    agentId: 'agent-1',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    message: 'Architect Agent verified storage schema and interface parity',
    type: 'info',
  },
  {
    id: 'act-3',
    agentId: 'agent-5',
    timestamp: new Date(Date.now() - 2700000).toISOString(),
    message: 'Release Agent generated iOS preview build for simulator',
    type: 'success',
  },
  {
    id: 'act-4',
    agentId: 'agent-3',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    message: 'Design Agent updated dark Xcode charcoal tokens in palette',
    type: 'info',
  },
];

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({
  workflows,
  agents = DEFAULT_SUMMARY_AGENTS,
  activities = DEFAULT_ACTIVITIES,
  onSelectWorkflow,
  onSelectAgent,
  onViewAllWorkflows,
  onViewAllActivities,
  onViewAllAgents,
  style,
}) => {
  // Determine active workflow
  const activeWorkflow =
    workflows?.find((w) => w.status === 'running') || DEFAULT_ACTIVE_WORKFLOW;

  // Calculate workflow progress
  const tasks = activeWorkflow?.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const overallProgress =
    tasks.length > 0
      ? Math.round(
          tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / tasks.length
        )
      : 0;

  // Agent counts
  const workingCount = agents.filter((a) => a.status === 'working').length;
  const readyCount = agents.filter((a) => a.status === 'ready').length;
  const idleCount = agents.filter((a) => a.status === 'idle').length;
  const totalAgents = agents.length;

  // Active task currently in progress
  const currentTask = tasks.find((t) => t.status === 'in_progress') || tasks[0];

  const handleWorkflowPress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (activeWorkflow) onSelectWorkflow?.(activeWorkflow);
  };

  const handleAgentPress = (agent: Agent) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onSelectAgent?.(agent);
  };

  const getActivityIcon = (
    type: AgentActivity['type']
  ): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } => {
    switch (type) {
      case 'success':
        return {
          name: 'checkmark-circle',
          color: colors.success,
          bg: colors.statusBgSuccess,
        };
      case 'warning':
        return {
          name: 'alert-circle',
          color: colors.warning,
          bg: colors.statusBgWarning,
        };
      case 'error':
        return {
          name: 'close-circle',
          color: colors.error,
          bg: colors.statusBgError,
        };
      default:
        return {
          name: 'information-circle',
          color: colors.accentPrimary,
          bg: colors.statusBgInfo,
        };
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* ==================================================================== */}
      {/* 1. RUNNING WORKFLOWS SUMMARY WIDGET                                 */}
      {/* ==================================================================== */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleLeft}>
          <Ionicons name="git-network-outline" size={16} color={colors.accentPrimary} />
          <Text style={styles.sectionTitle}>Active Orchestration</Text>
        </View>

        {onViewAllWorkflows && (
          <TouchableOpacity
            onPress={onViewAllWorkflows}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.sectionActionText}>Workflows →</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleWorkflowPress}
        style={styles.workflowCard}
      >
        {/* Top bar: status indicator, task counts & view button */}
        <View style={styles.wfHeaderRow}>
          <View style={styles.wfStatusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.wfStatusText}>RUNNING</Text>
          </View>

          <View style={styles.wfTaskCountBadge}>
            <Ionicons name="list-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.wfTaskCountText}>
              {completedTasks}/{tasks.length} tasks done
            </Text>
          </View>
        </View>

        {/* Workflow Title & Objective */}
        <Text style={styles.wfTitle} numberOfLines={1}>
          {activeWorkflow.title}
        </Text>
        <Text style={styles.wfObjective} numberOfLines={2}>
          {activeWorkflow.objective}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(5, overallProgress)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{overallProgress}%</Text>
        </View>

        {/* Current In-Flight Task Banner */}
        {currentTask && (
          <View style={styles.currentTaskBanner}>
            <View style={styles.currentTaskLeft}>
              <Ionicons
                name="play-circle-outline"
                size={14}
                color={colors.accentPrimary}
              />
              <Text style={styles.currentTaskLabel} numberOfLines={1}>
                {currentTask.title}
              </Text>
            </View>
            <View style={styles.currentTaskProgress}>
              <Text style={styles.currentTaskProgressText}>
                {currentTask.progress}%
              </Text>
            </View>
          </View>
        )}

        {/* Active Agent Heads Row */}
        <View style={styles.wfFooterRow}>
          <View style={styles.agentHeadsContainer}>
            <Text style={styles.agentHeadsLabel}>Active Specialists:</Text>
            <View style={styles.avatarStack}>
              {agents.slice(0, 4).map((agent, index) => {
                const isWorking = agent.status === 'working';
                return (
                  <View
                    key={agent.id}
                    style={[
                      styles.avatarHead,
                      {
                        borderColor: isWorking
                          ? colors.accentPrimary
                          : colors.border,
                        zIndex: 10 - index,
                        marginLeft: index === 0 ? 0 : -8,
                        backgroundColor: agent.color || colors.bgTertiary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        (agent.avatar as keyof typeof Ionicons.glyphMap) ||
                        'hardware-chip-outline'
                      }
                      size={12}
                      color={colors.white}
                    />
                    {isWorking && <View style={styles.avatarWorkingDot} />}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.viewPipelineButton}>
            <Text style={styles.viewPipelineText}>Pipeline</Text>
            <Ionicons
              name="chevron-forward"
              size={12}
              color={colors.accentPrimary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* ==================================================================== */}
      {/* 2. AGENT TEAM STATUS SUMMARY                                        */}
      {/* ==================================================================== */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <View style={styles.sectionTitleLeft}>
          <Ionicons name="hardware-chip-outline" size={16} color={colors.accentCyan} />
          <Text style={styles.sectionTitle}>Agent Team Status</Text>
        </View>

        {onViewAllAgents && (
          <TouchableOpacity
            onPress={onViewAllAgents}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.sectionActionText}>All Agents ({totalAgents}) →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.agentStatsCard}>
        {/* Stat metrics columns */}
        <View style={styles.agentMetricsGrid}>
          {/* Working */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.metricLabel}>Working</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.success }]}>
              {workingCount}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Ready */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.accentCyan }]} />
              <Text style={styles.metricLabel}>Ready</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.accentCyan }]}>
              {readyCount}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Idle */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.textMuted }]} />
              <Text style={styles.metricLabel}>Idle</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.textSecondary }]}>
              {idleCount}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Total Team */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="people-outline" size={10} color={colors.accentPurple} />
              <Text style={[styles.metricLabel, { marginLeft: 3 }]}>Total</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {totalAgents}
            </Text>
          </View>
        </View>

        {/* Quick Agent Roster Pills */}
        <View style={styles.rosterRow}>
          {agents.slice(0, 5).map((agent) => {
            const isWorking = agent.status === 'working';
            return (
              <TouchableOpacity
                key={agent.id}
                onPress={() => handleAgentPress(agent)}
                style={[
                  styles.rosterPill,
                  isWorking && styles.rosterPillWorking,
                ]}
              >
                <View
                  style={[
                    styles.rosterDot,
                    {
                      backgroundColor:
                        agent.status === 'working'
                          ? colors.success
                          : agent.status === 'ready'
                          ? colors.accentCyan
                          : colors.textMuted,
                    },
                  ]}
                />
                <Text style={styles.rosterAgentName} numberOfLines={1}>
                  {agent.name.replace(' Agent', '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 3. RECENT ACTIVITY TIMELINE FEED                                    */}
      {/* ==================================================================== */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <View style={styles.sectionTitleLeft}>
          <Ionicons name="time-outline" size={16} color={colors.accentOrange} />
          <Text style={styles.sectionTitle}>Recent Activity Timeline</Text>
        </View>

        {onViewAllActivities && (
          <TouchableOpacity
            onPress={onViewAllActivities}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.sectionActionText}>Audit Feed →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.timelineCard}>
        {activities.map((item, index) => {
          const iconMeta = getActivityIcon(item.type);
          const isLast = index === activities.length - 1;

          return (
            <View key={item.id} style={styles.timelineItemRow}>
              {/* Left Column: Icon and connecting vertical line */}
              <View style={styles.timelineLeftCol}>
                <View
                  style={[
                    styles.timelineIconBadge,
                    { backgroundColor: iconMeta.bg },
                  ]}
                >
                  <Ionicons name={iconMeta.name} size={14} color={iconMeta.color} />
                </View>
                {!isLast && <View style={styles.timelineVerticalLine} />}
              </View>

              {/* Right Column: Message & Timestamp */}
              <View style={[styles.timelineContentCol, !isLast && { paddingBottom: spacing.md }]}>
                <Text style={styles.timelineMessage}>{item.message}</Text>
                <View style={styles.timelineMetaRow}>
                  <Text style={styles.timelineTimestamp}>
                    {formatRelativeTime(item.timestamp)}
                  </Text>
                  {item.taskId && (
                    <Text style={styles.timelineTaskId}>#{item.taskId}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionActionText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    color: colors.accentPrimary,
  },

  // 1. Workflow Card
  workflowCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  wfHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  wfStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(63, 185, 80, 0.35)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  wfStatusText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.success,
    letterSpacing: 0.5,
  },
  wfTaskCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  wfTaskCountText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  wfTitle: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 2,
  },
  wfObjective: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    width: 32,
    textAlign: 'right',
  },
  currentTaskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentPrimary,
    marginBottom: spacing.sm,
  },
  currentTaskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  currentTaskLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  currentTaskProgress: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  currentTaskProgressText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
  },
  wfFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  agentHeadsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  agentHeadsLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textMuted,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarWorkingDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.bgSecondary,
  },
  viewPipelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewPipelineText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    color: colors.accentPrimary,
  },

  // 2. Agent Team Status Summary
  agentStatsCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  agentMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderSubtle,
  },
  rosterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  rosterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rosterPillWorking: {
    borderColor: 'rgba(63, 185, 80, 0.4)',
    backgroundColor: 'rgba(63, 185, 80, 0.08)',
  },
  rosterDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  rosterAgentName: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
  },

  // 3. Activity Timeline Feed
  timelineCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeftCol: {
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 24,
  },
  timelineIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: colors.borderSubtle,
    marginVertical: 4,
  },
  timelineContentCol: {
    flex: 1,
  },
  timelineMessage: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 3,
  },
  timelineTimestamp: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textMuted,
  },
  timelineTaskId: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.accentPrimary,
  },
});
