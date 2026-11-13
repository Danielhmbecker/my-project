import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Task, TaskPriority, TaskStatus, WorkflowStatus } from '../../models/types';

export interface TaskQueueItem extends Task {
  agentName: string;
  agentRole: string;
  agentColor: string;
  agentAvatarIcon: keyof typeof Ionicons.glyphMap;
  stageName: string;
  stepNumber: number;
  outputArtifact?: string;
  executionLogs?: string[];
  executionTime?: string;
}

export interface TaskQueueListProps {
  tasks: TaskQueueItem[];
  workflowStatus: WorkflowStatus;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onApproveTask: (taskId: string) => void;
  onRejectTask: (taskId: string) => void;
  onSelectTask?: (taskId: string) => void;
  selectedTaskId?: string | null;
  speed: number;
  onSpeedChange: (speed: number) => void;
  style?: StyleProp<ViewStyle>;
}

export const TaskQueueList: React.FC<TaskQueueListProps> = ({
  tasks,
  workflowStatus,
  onPlay,
  onPause,
  onReset,
  onApproveTask,
  onRejectTask,
  onSelectTask,
  selectedTaskId,
  speed,
  onSpeedChange,
  style,
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'needs_approval' | 'completed'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Compute metrics
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const needsApprovalTask = tasks.find((t) => t.status === 'needs_approval');
  const needsApprovalCount = tasks.filter((t) => t.status === 'needs_approval').length;
  const totalTasks = tasks.length;
  const overallProgressPercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'in_progress') return task.status === 'in_progress';
    if (filter === 'needs_approval') return task.status === 'needs_approval';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return {
          label: 'CRITICAL',
          color: colors.error,
          bg: colors.statusBgError,
          border: colors.statusBorderError,
          icon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'high':
        return {
          label: 'HIGH',
          color: colors.accentOrange,
          bg: 'rgba(240, 136, 62, 0.15)',
          border: 'rgba(240, 136, 62, 0.35)',
          icon: 'arrow-up-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          color: colors.accentPrimary,
          bg: colors.accentPrimaryAlpha,
          border: colors.borderActive,
          icon: 'remove-circle-outline' as keyof typeof Ionicons.glyphMap,
        };
      case 'low':
      default:
        return {
          label: 'LOW',
          color: colors.textSecondary,
          bg: colors.bgTertiary,
          border: colors.border,
          icon: 'arrow-down-circle' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'COMPLETED',
          color: colors.success,
          bg: colors.statusBgSuccess,
          border: colors.statusBorderSuccess,
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'in_progress':
        return {
          label: 'IN PROGRESS',
          color: colors.accentPrimary,
          bg: colors.accentPrimaryAlpha,
          border: colors.borderActive,
          icon: 'sync' as keyof typeof Ionicons.glyphMap,
        };
      case 'needs_approval':
        return {
          label: 'NEEDS APPROVAL',
          color: colors.warning,
          bg: colors.statusBgWarning,
          border: colors.statusBorderWarning,
          icon: 'shield-outline' as keyof typeof Ionicons.glyphMap,
        };
      case 'blocked':
        return {
          label: 'BLOCKED',
          color: colors.error,
          bg: colors.statusBgError,
          border: colors.statusBorderError,
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'failed':
        return {
          label: 'FAILED',
          color: colors.error,
          bg: colors.statusBgError,
          border: colors.statusBorderError,
          icon: 'alert' as keyof typeof Ionicons.glyphMap,
        };
      case 'pending':
      default:
        return {
          label: 'PENDING',
          color: colors.textMuted,
          bg: 'rgba(72, 79, 88, 0.15)',
          border: colors.border,
          icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
    onSelectTask?.(taskId);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Workflow Controls Toolbar */}
      <View style={styles.controlsHeader}>
        <View style={styles.controlsTitleRow}>
          <View style={styles.controlsTitleLeft}>
            <Ionicons name="list-outline" size={17} color={colors.accentPrimary} />
            <Text style={styles.controlsTitle}>Prioritized Task Queue</Text>
          </View>

          {/* Workflow Status Pill */}
          <View
            style={[
              styles.workflowStatusPill,
              workflowStatus === 'running' && styles.statusPillRunning,
              workflowStatus === 'paused' && styles.statusPillPaused,
              workflowStatus === 'completed' && styles.statusPillCompleted,
            ]}
          >
            {workflowStatus === 'running' ? (
              <ActivityIndicator size="small" color={colors.accentPrimary} style={{ marginRight: 4 }} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      workflowStatus === 'completed'
                        ? colors.success
                        : workflowStatus === 'paused'
                        ? colors.warning
                        : colors.textMuted,
                  },
                ]}
              />
            )}
            <Text style={styles.workflowStatusText}>
              {workflowStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Progress Bar Summary */}
        <View style={styles.overallProgressContainer}>
          <View style={styles.overallProgressHeader}>
            <Text style={styles.overallProgressText}>
              Overall Execution: {completedCount}/{totalTasks} Stages Done
            </Text>
            <Text style={styles.overallPercentText}>{overallProgressPercent}%</Text>
          </View>
          <View style={styles.overallTrack}>
            <View
              style={[
                styles.overallFill,
                {
                  width: `${overallProgressPercent}%`,
                  backgroundColor:
                    overallProgressPercent === 100 ? colors.success : colors.accentPrimary,
                },
              ]}
            />
          </View>
        </View>

        {/* Action Buttons: Play / Pause / Reset / Speed */}
        <View style={styles.buttonActionRow}>
          <View style={styles.mainControlsGroup}>
            {workflowStatus === 'running' ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.pauseButton]}
                onPress={onPause}
                activeOpacity={0.8}
              >
                <Ionicons name="pause" size={15} color="#ffffff" />
                <Text style={styles.actionButtonText}>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.playButton]}
                onPress={onPlay}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={workflowStatus === 'completed' ? 'refresh' : 'play'}
                  size={15}
                  color="#ffffff"
                />
                <Text style={styles.actionButtonText}>
                  {workflowStatus === 'completed' ? 'Re-run Pipeline' : 'Run Pipeline'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.resetButton]}
              onPress={onReset}
              activeOpacity={0.8}
            >
              <Ionicons name="stop-circle-outline" size={15} color={colors.secondary} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Speed Selector (1x, 2x, 5x) */}
          <View style={styles.speedSelectorGroup}>
            <Text style={styles.speedLabel}>Speed:</Text>
            {[1, 2, 5].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.speedButton,
                  speed === s && styles.speedButtonActive,
                ]}
                onPress={() => onSpeedChange(s)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    speed === s && styles.speedButtonTextActive,
                  ]}
                >
                  {s}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Human Approval Checkpoint Banner (When applicable) */}
      {needsApprovalTask && (
        <View style={styles.checkpointBanner}>
          <View style={styles.checkpointBannerHeader}>
            <View style={styles.checkpointAlertIcon}>
              <Ionicons name="shield-half-outline" size={20} color={colors.warning} />
            </View>
            <View style={styles.checkpointBannerTextContainer}>
              <Text style={styles.checkpointBannerTitle}>
                HUMAN APPROVAL REQUIRED
              </Text>
              <Text style={styles.checkpointBannerSubtitle}>
                Stage 0{needsApprovalTask.stepNumber} ({needsApprovalTask.stageName}) has requested verification before triggering downstream operations.
              </Text>
            </View>
          </View>

          {/* Checkpoint Target Details */}
          <View style={styles.checkpointTargetBox}>
            <View style={styles.checkpointTargetRow}>
              <Text style={styles.checkpointTargetLabel}>Target Task:</Text>
              <Text style={styles.checkpointTargetTitle} numberOfLines={1}>
                {needsApprovalTask.title}
              </Text>
            </View>
            <View style={styles.checkpointTargetRow}>
              <Text style={styles.checkpointTargetLabel}>Assigned Agent:</Text>
              <Text style={styles.checkpointTargetAgent}>
                {needsApprovalTask.agentName} ({needsApprovalTask.agentRole})
              </Text>
            </View>
            {needsApprovalTask.outputArtifact && (
              <View style={styles.checkpointArtifactBox}>
                <Text style={styles.checkpointArtifactHeader}>Reviewable Deliverable:</Text>
                <Text style={styles.checkpointArtifactBody} numberOfLines={2}>
                  {needsApprovalTask.outputArtifact}
                </Text>
              </View>
            )}
          </View>

          {/* Action Checkpoint Buttons */}
          <View style={styles.checkpointButtonsRow}>
            <TouchableOpacity
              style={styles.bannerApproveButton}
              onPress={() => onApproveTask(needsApprovalTask.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={17} color="#ffffff" />
              <Text style={styles.bannerApproveText}>Approve & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bannerRejectButton}
              onPress={() => onRejectTask(needsApprovalTask.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="reload" size={15} color={colors.error} />
              <Text style={styles.bannerRejectText}>Reject & Revise</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({totalTasks})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'in_progress' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('in_progress')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'in_progress' && styles.filterTabTextActive,
            ]}
          >
            In Progress ({inProgressCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'needs_approval' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('needs_approval')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'needs_approval' && styles.filterTabTextActive,
            ]}
          >
            Needs Approval
          </Text>
          {needsApprovalCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{needsApprovalCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('completed')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task Queue Cards List */}
      <View style={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No tasks matching this filter</Text>
            <Text style={styles.emptySubtitle}>
              Switch filters or generate a new workflow to inspect queue items.
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id || selectedTaskId === task.id;
            const priorityCfg = getPriorityConfig(task.priority);
            const statusCfg = getStatusBadge(task.status);
            const isInProgress = task.status === 'in_progress';
            const isNeedsApproval = task.status === 'needs_approval';

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  isExpanded && styles.taskCardExpanded,
                  isInProgress && styles.taskCardInProgress,
                  isNeedsApproval && styles.taskCardNeedsApproval,
                ]}
              >
                {/* Header Row: Agent Info, Priority Pill, Status Badge */}
                <TouchableOpacity
                  style={styles.taskCardTouchableHeader}
                  onPress={() => toggleExpand(task.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.taskCardHeaderTop}>
                    {/* Agent Avatar & Name */}
                    <View style={styles.agentRow}>
                      <View
                        style={[
                          styles.agentAvatarCircle,
                          {
                            backgroundColor: `${task.agentColor}22`,
                            borderColor: task.agentColor,
                          },
                        ]}
                      >
                        <Ionicons
                          name={task.agentAvatarIcon}
                          size={15}
                          color={task.agentColor}
                        />
                      </View>
                      <View>
                        <Text style={styles.agentNameText}>{task.agentName}</Text>
                        <Text style={styles.agentRoleText}>
                          {task.agentRole} • Stage 0{task.stepNumber}
                        </Text>
                      </View>
                    </View>

                    {/* Status & Priority Badges */}
                    <View style={styles.badgesCluster}>
                      {/* Priority Chip */}
                      <View
                        style={[
                          styles.priorityPill,
                          {
                            backgroundColor: priorityCfg.bg,
                            borderColor: priorityCfg.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={priorityCfg.icon}
                          size={10}
                          color={priorityCfg.color}
                          style={{ marginRight: 3 }}
                        />
                        <Text
                          style={[styles.priorityText, { color: priorityCfg.color }]}
                        >
                          {priorityCfg.label}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusCfg.bg,
                            borderColor: statusCfg.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={statusCfg.icon}
                          size={11}
                          color={statusCfg.color}
                          style={{ marginRight: 3 }}
                        />
                        <Text
                          style={[styles.statusText, { color: statusCfg.color }]}
                        >
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Task Title & Description */}
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription} numberOfLines={isExpanded ? undefined : 2}>
                    {task.description}
                  </Text>

                  {/* Dependencies Chips */}
                  <View style={styles.dependenciesRow}>
                    <Text style={styles.depLabel}>Dependencies:</Text>
                    {task.dependsOn.length === 0 ? (
                      <View style={styles.depNonePill}>
                        <Text style={styles.depNoneText}>Root Stage (None)</Text>
                      </View>
                    ) : (
                      task.dependsOn.map((depId) => {
                        const depTask = tasks.find((t) => t.id === depId);
                        const depTitle = depTask ? depTask.stageName : depId;
                        const isDone = depTask?.status === 'completed';

                        return (
                          <View
                            key={depId}
                            style={[
                              styles.dependencyChip,
                              isDone ? styles.dependencyChipDone : styles.dependencyChipWait,
                            ]}
                          >
                            <Ionicons
                              name={isDone ? 'checkmark' : 'time-outline'}
                              size={11}
                              color={isDone ? colors.success : colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.dependencyChipText,
                                { color: isDone ? colors.success : colors.textSecondary },
                              ]}
                            >
                              {depTitle}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Progress Bar & Percent Indicator */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, Math.max(0, task.progress))}%`,
                            backgroundColor:
                              task.status === 'completed'
                                ? colors.success
                                : task.status === 'needs_approval'
                                ? colors.warning
                                : task.agentColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressPercentText}>{task.progress}%</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.secondary}
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Deliverable / Output Artifact */}
                    {task.outputArtifact && (
                      <View style={styles.expandedArtifactBox}>
                        <View style={styles.expandedArtifactHeader}>
                          <Ionicons
                            name="code-working-outline"
                            size={14}
                            color={colors.accentCyan}
                          />
                          <Text style={styles.expandedArtifactTitle}>
                            Stage Output / Verification Artifact
                          </Text>
                        </View>
                        <Text style={styles.expandedArtifactBody}>
                          {task.outputArtifact}
                        </Text>
                      </View>
                    )}

                    {/* Execution Logs */}
                    {task.executionLogs && task.executionLogs.length > 0 && (
                      <View style={styles.logsBox}>
                        <Text style={styles.logsBoxTitle}>Execution Log Trace:</Text>
                        {task.executionLogs.map((log, lIdx) => (
                          <Text key={lIdx} style={styles.logLine}>
                            › {log}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* Inline Human Approval Action Buttons for this card */}
                    {task.status === 'needs_approval' && (
                      <View style={styles.cardApprovalRow}>
                        <TouchableOpacity
                          style={styles.cardApproveButton}
                          onPress={() => onApproveTask(task.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                          <Text style={styles.cardApproveText}>Approve & Continue</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cardRejectButton}
                          onPress={() => onRejectTask(task.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="refresh" size={14} color={colors.error} />
                          <Text style={styles.cardRejectText}>Reject & Revise</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  controlsHeader: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  controlsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlsTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  workflowStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgTertiary,
  },
  statusPillRunning: {
    borderColor: colors.borderActive,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  statusPillPaused: {
    borderColor: colors.statusBorderWarning,
    backgroundColor: colors.statusBgWarning,
  },
  statusPillCompleted: {
    borderColor: colors.statusBorderSuccess,
    backgroundColor: colors.statusBgSuccess,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  workflowStatusText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  overallProgressContainer: {
    gap: 4,
    backgroundColor: colors.bgTertiary,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallProgressText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  overallPercentText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  overallTrack: {
    height: 6,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  overallFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  buttonActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mainControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  playButton: {
    backgroundColor: colors.accentPrimary,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  resetButton: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: '#ffffff',
  },
  resetButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.secondary,
  },
  speedSelectorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speedLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.textMuted,
    paddingHorizontal: 6,
  },
  speedButton: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  speedButtonActive: {
    backgroundColor: colors.bgElevated,
  },
  speedButtonText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
    fontWeight: fontWeights.bold,
  },
  speedButtonTextActive: {
    color: colors.accentPrimary,
  },
  checkpointBanner: {
    backgroundColor: colors.statusBgWarning,
    borderWidth: 1.5,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  checkpointBannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkpointAlertIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: 'rgba(210, 153, 34, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkpointBannerTextContainer: {
    flex: 1,
  },
  checkpointBannerTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.warning,
    letterSpacing: 0.5,
  },
  checkpointBannerSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.primary,
    marginTop: 2,
    lineHeight: 16,
  },
  checkpointTargetBox: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 4,
  },
  checkpointTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkpointTargetLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  checkpointTargetTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    flex: 1,
  },
  checkpointTargetAgent: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.accentPrimary,
  },
  checkpointArtifactBox: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  checkpointArtifactHeader: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.accentCyan,
  },
  checkpointArtifactBody: {
    fontFamily: fontFamilies.code,
    fontSize: 10,
    color: colors.textCode,
    marginTop: 2,
  },
  checkpointButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  bannerApproveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  bannerApproveText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  bannerRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  bannerRejectText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.error,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radius.sm,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: colors.bgElevated,
  },
  filterTabText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: colors.secondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  filterBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  filterBadgeText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textInverse,
  },
  tasksList: {
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    textAlign: 'center',
    maxWidth: 240,
  },
  taskCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  taskCardExpanded: {
    borderColor: colors.borderLight,
    backgroundColor: colors.bgElevated,
  },
  taskCardInProgress: {
    borderColor: colors.accentPrimary,
  },
  taskCardNeedsApproval: {
    borderColor: colors.warning,
    backgroundColor: colors.statusBgWarning,
  },
  taskCardTouchableHeader: {
    gap: spacing.xs,
  },
  taskCardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  agentAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentNameText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  agentRoleText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: colors.secondary,
  },
  badgesCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  priorityText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
  },
  taskTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginTop: 2,
  },
  taskDescription: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  dependenciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  depLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginRight: 2,
  },
  depNonePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xs,
  },
  depNoneText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  dependencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    gap: 3,
  },
  dependencyChipDone: {
    backgroundColor: colors.statusBgSuccess,
    borderColor: colors.statusBorderSuccess,
  },
  dependencyChipWait: {
    backgroundColor: colors.bgPrimary,
    borderColor: colors.border,
  },
  dependencyChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: fontWeights.medium,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressPercentText: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.secondary,
    minWidth: 32,
    textAlign: 'right',
  },
  expandedContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  expandedArtifactBox: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  expandedArtifactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  expandedArtifactTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.accentCyan,
  },
  expandedArtifactBody: {
    fontFamily: fontFamilies.code,
    fontSize: 11,
    color: colors.textCode,
    lineHeight: 16,
  },
  logsBox: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 2,
  },
  logsBoxTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 2,
  },
  logLine: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
    lineHeight: 14,
  },
  cardApprovalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cardApproveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 8,
    borderRadius: radius.sm,
    gap: 4,
  },
  cardApproveText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  cardRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    paddingVertical: 8,
    borderRadius: radius.sm,
    gap: 4,
  },
  cardRejectText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.error,
  },
});
