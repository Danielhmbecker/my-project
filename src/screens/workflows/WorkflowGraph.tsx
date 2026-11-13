import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Task, TaskStatus, TaskPriority } from '../../models/types';

export interface WorkflowStageNode {
  id: string;
  stageKey: 'architect' | 'designer' | 'developer' | 'qa' | 'release';
  stepNumber: number;
  stageName: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  agentColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  task: Task;
  outputArtifact?: string;
  latestThought?: string;
}

export interface WorkflowGraphProps {
  nodes: WorkflowStageNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onApproveCheckpoint?: (taskId: string) => void;
  onRejectCheckpoint?: (taskId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const WorkflowGraph: React.FC<WorkflowGraphProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onApproveCheckpoint,
  onRejectCheckpoint,
  style,
}) => {
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const scrollViewRef = useRef<ScrollView>(null);

  // Pulsing animation for nodes in progress
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: colors.success,
          bg: colors.statusBgSuccess,
          border: colors.statusBorderSuccess,
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: colors.accentPrimary,
          bg: colors.accentPrimaryAlpha,
          border: colors.borderActive,
          icon: 'sync-outline' as keyof typeof Ionicons.glyphMap,
        };
      case 'needs_approval':
        return {
          label: 'Needs Approval',
          color: colors.warning,
          bg: colors.statusBgWarning,
          border: colors.statusBorderWarning,
          icon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'blocked':
        return {
          label: 'Blocked',
          color: colors.error,
          bg: colors.statusBgError,
          border: colors.statusBorderError,
          icon: 'close-circle-outline' as keyof typeof Ionicons.glyphMap,
        };
      case 'failed':
        return {
          label: 'Failed',
          color: colors.error,
          bg: colors.statusBgError,
          border: colors.statusBorderError,
          icon: 'alert-outline' as keyof typeof Ionicons.glyphMap,
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          color: colors.textMuted,
          bg: 'rgba(72, 79, 88, 0.15)',
          border: colors.border,
          icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const getLinkStatus = (sourceNode: WorkflowStageNode, targetNode: WorkflowStageNode) => {
    if (sourceNode.task.status === 'completed' && targetNode.task.status === 'completed') {
      return {
        color: colors.success,
        lineStyle: 'solid',
        active: true,
        icon: 'checkmark' as keyof typeof Ionicons.glyphMap,
      };
    }
    if (sourceNode.task.status === 'completed' && targetNode.task.status === 'in_progress') {
      return {
        color: colors.accentPrimary,
        lineStyle: 'solid',
        active: true,
        icon: 'arrow-forward' as keyof typeof Ionicons.glyphMap,
      };
    }
    if (sourceNode.task.status === 'completed' && targetNode.task.status === 'needs_approval') {
      return {
        color: colors.warning,
        lineStyle: 'solid',
        active: true,
        icon: 'hand-left-outline' as keyof typeof Ionicons.glyphMap,
      };
    }
    return {
      color: colors.border,
      lineStyle: 'dashed',
      active: false,
      icon: 'chevron-forward' as keyof typeof Ionicons.glyphMap,
    };
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header Bar */}
      <View style={styles.graphHeader}>
        <View style={styles.graphHeaderLeft}>
          <View style={styles.graphTitleRow}>
            <Ionicons name="git-network-outline" size={16} color={colors.accentPrimary} />
            <Text style={styles.graphTitle}>Pipeline Dependency Graph</Text>
          </View>
          <Text style={styles.graphSubtitle}>
            5-Stage Autonomous Agent Pipeline with Human Verification Gate
          </Text>
        </View>

        {/* View Mode Switcher */}
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'horizontal' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('horizontal')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="swap-horizontal"
              size={14}
              color={viewMode === 'horizontal' ? colors.primary : colors.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'vertical' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('vertical')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="swap-vertical"
              size={14}
              color={viewMode === 'vertical' ? colors.primary : colors.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Pipeline Graph */}
      {viewMode === 'horizontal' ? (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {nodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            const statusCfg = getStatusConfig(node.task.status);
            const isLast = index === nodes.length - 1;
            const nextNode = !isLast ? nodes[index + 1] : null;
            const link = nextNode ? getLinkStatus(node, nextNode) : null;
            const isInProgress = node.task.status === 'in_progress';
            const isNeedsApproval = node.task.status === 'needs_approval';

            return (
              <React.Fragment key={node.id}>
                {/* Stage Node Card */}
                <TouchableOpacity
                  style={[
                    styles.nodeCard,
                    isSelected && styles.nodeCardSelected,
                    isInProgress && styles.nodeCardInProgress,
                    isNeedsApproval && styles.nodeCardNeedsApproval,
                  ]}
                  onPress={() => onSelectNode(node.id)}
                  activeOpacity={0.85}
                >
                  {/* Step Badge & Agent Indicator */}
                  <View style={styles.nodeHeaderRow}>
                    <View
                      style={[
                        styles.stepIndicator,
                        { borderColor: node.agentColor, backgroundColor: colors.bgPrimary },
                      ]}
                    >
                      <Text style={[styles.stepNumberText, { color: node.agentColor }]}>
                        0{node.stepNumber}
                      </Text>
                    </View>

                    <View style={styles.nodeAgentInfo}>
                      <Text style={styles.nodeStageName}>{node.stageName}</Text>
                      <Text style={styles.nodeAgentRole} numberOfLines={1}>
                        {node.agentRole}
                      </Text>
                    </View>

                    {/* Agent Avatar Badge */}
                    <View
                      style={[
                        styles.agentAvatarPill,
                        { backgroundColor: `${node.agentColor}20`, borderColor: node.agentColor },
                      ]}
                    >
                      <Ionicons name={node.iconName} size={13} color={node.agentColor} />
                    </View>
                  </View>

                  {/* Task Title */}
                  <Text style={styles.nodeTaskTitle} numberOfLines={2}>
                    {node.task.title}
                  </Text>

                  {/* Progress Bar Track */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, Math.max(0, node.task.progress))}%`,
                          backgroundColor:
                            node.task.status === 'completed'
                              ? colors.success
                              : node.task.status === 'needs_approval'
                              ? colors.warning
                              : node.agentColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Footer Row: Status Pill & Percentage */}
                  <View style={styles.nodeFooterRow}>
                    <View
                      style={[
                        styles.nodeStatusBadge,
                        { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
                      ]}
                    >
                      {isInProgress ? (
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                          <View
                            style={[
                              styles.liveDot,
                              { backgroundColor: colors.accentPrimary },
                            ]}
                          />
                        </Animated.View>
                      ) : (
                        <Ionicons
                          name={statusCfg.icon}
                          size={11}
                          color={statusCfg.color}
                          style={{ marginRight: 3 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.nodeStatusText,
                          { color: statusCfg.color },
                        ]}
                      >
                        {statusCfg.label}
                      </Text>
                    </View>

                    <Text style={styles.nodeProgressPercent}>
                      {node.task.progress}%
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Dependency Connector Link (Between Nodes) */}
                {!isLast && link && (
                  <View style={styles.connectorContainer}>
                    <View
                      style={[
                        styles.connectorLine,
                        {
                          backgroundColor: link.color,
                          opacity: link.active ? 1 : 0.45,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.connectorBadge,
                        {
                          borderColor: link.color,
                          backgroundColor: colors.bgSecondary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={link.icon}
                        size={12}
                        color={link.color}
                      />
                    </View>
                    <View
                      style={[
                        styles.connectorLine,
                        {
                          backgroundColor: link.color,
                          opacity: link.active ? 1 : 0.45,
                        },
                      ]}
                    />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      ) : (
        /* Vertical DAG Flow */
        <View style={styles.verticalContainer}>
          {nodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            const statusCfg = getStatusConfig(node.task.status);
            const isLast = index === nodes.length - 1;
            const nextNode = !isLast ? nodes[index + 1] : null;
            const link = nextNode ? getLinkStatus(node, nextNode) : null;
            const isInProgress = node.task.status === 'in_progress';
            const isNeedsApproval = node.task.status === 'needs_approval';

            return (
              <View key={node.id} style={styles.verticalStepWrapper}>
                <TouchableOpacity
                  style={[
                    styles.verticalNodeCard,
                    isSelected && styles.nodeCardSelected,
                    isInProgress && styles.nodeCardInProgress,
                    isNeedsApproval && styles.nodeCardNeedsApproval,
                  ]}
                  onPress={() => onSelectNode(node.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.verticalLeftCol}>
                    <View
                      style={[
                        styles.verticalStepCircle,
                        { borderColor: node.agentColor, backgroundColor: colors.bgPrimary },
                      ]}
                    >
                      <Ionicons name={node.iconName} size={15} color={node.agentColor} />
                    </View>
                    <Text style={[styles.verticalStepNum, { color: node.agentColor }]}>
                      0{node.stepNumber}
                    </Text>
                  </View>

                  <View style={styles.verticalMidCol}>
                    <View style={styles.verticalTopMeta}>
                      <Text style={styles.nodeStageName}>{node.stageName}</Text>
                      <Text style={styles.nodeAgentRole}>• {node.agentName}</Text>
                    </View>
                    <Text style={styles.verticalTaskTitle} numberOfLines={1}>
                      {node.task.title}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, Math.max(0, node.task.progress))}%`,
                            backgroundColor:
                              node.task.status === 'completed'
                                ? colors.success
                                : node.task.status === 'needs_approval'
                                ? colors.warning
                                : node.agentColor,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.verticalRightCol}>
                    <View
                      style={[
                        styles.nodeStatusBadge,
                        { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
                      ]}
                    >
                      <Text style={[styles.nodeStatusText, { color: statusCfg.color }]}>
                        {statusCfg.label}
                      </Text>
                    </View>
                    <Text style={styles.nodeProgressPercent}>{node.task.progress}%</Text>
                  </View>
                </TouchableOpacity>

                {/* Vertical Connector */}
                {!isLast && link && (
                  <View style={styles.verticalConnector}>
                    <View
                      style={[
                        styles.verticalConnectorLine,
                        { backgroundColor: link.color, opacity: link.active ? 1 : 0.4 },
                      ]}
                    />
                    <View
                      style={[
                        styles.verticalConnectorBadge,
                        { borderColor: link.color, backgroundColor: colors.bgSecondary },
                      ]}
                    >
                      <Ionicons name="arrow-down" size={10} color={link.color} />
                    </View>
                    <View
                      style={[
                        styles.verticalConnectorLine,
                        { backgroundColor: link.color, opacity: link.active ? 1 : 0.4 },
                      ]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderLeft}>
              <View
                style={[
                  styles.detailAvatarBox,
                  { backgroundColor: `${selectedNode.agentColor}22`, borderColor: selectedNode.agentColor },
                ]}
              >
                <Ionicons
                  name={selectedNode.iconName}
                  size={18}
                  color={selectedNode.agentColor}
                />
              </View>
              <View>
                <View style={styles.detailStageRow}>
                  <Text style={styles.detailStageText}>
                    STAGE {selectedNode.stepNumber}: {selectedNode.stageName.toUpperCase()}
                  </Text>
                  <Text style={styles.detailAgentText}>• {selectedNode.agentName}</Text>
                </View>
                <Text style={styles.detailTaskTitle}>{selectedNode.task.title}</Text>
              </View>
            </View>

            {/* Checkpoint Badge */}
            {selectedNode.task.status === 'needs_approval' && (
              <View style={styles.checkpointAlertPill}>
                <Ionicons name="shield-checkmark-outline" size={12} color={colors.warning} />
                <Text style={styles.checkpointAlertText}>Gate Check</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={styles.detailDescription}>
            {selectedNode.task.description}
          </Text>

          {/* Dependencies Chips */}
          <View style={styles.detailDepsRow}>
            <Text style={styles.detailDepsLabel}>Depends on:</Text>
            {selectedNode.task.dependsOn.length === 0 ? (
              <Text style={styles.detailDepsNone}>None (Pipeline Root Stage)</Text>
            ) : (
              selectedNode.task.dependsOn.map((depId) => {
                const depNode = nodes.find((n) => n.task.id === depId || n.id === depId);
                const depName = depNode ? depNode.stageName : depId;
                const isDepDone = depNode ? depNode.task.status === 'completed' : false;

                return (
                  <View
                    key={depId}
                    style={[
                      styles.depChip,
                      isDepDone ? styles.depChipDone : styles.depChipPending,
                    ]}
                  >
                    <Ionicons
                      name={isDepDone ? 'checkmark-circle' : 'time-outline'}
                      size={11}
                      color={isDepDone ? colors.success : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.depChipText,
                        { color: isDepDone ? colors.success : colors.textSecondary },
                      ]}
                    >
                      {depName}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Output Artifact or Latest Thought */}
          {selectedNode.outputArtifact ? (
            <View style={styles.artifactBox}>
              <View style={styles.artifactHeader}>
                <Ionicons name="document-text-outline" size={13} color={colors.accentCyan} />
                <Text style={styles.artifactHeaderText}>Generated Stage Deliverable</Text>
              </View>
              <Text style={styles.artifactContent} numberOfLines={3}>
                {selectedNode.outputArtifact}
              </Text>
            </View>
          ) : selectedNode.latestThought ? (
            <View style={styles.thoughtBox}>
              <View style={styles.thoughtHeader}>
                <Ionicons name="hardware-chip-outline" size={13} color={colors.accentPurple} />
                <Text style={styles.thoughtHeaderText}>Agent Reasoning State</Text>
              </View>
              <Text style={styles.thoughtContent} numberOfLines={2}>
                {selectedNode.latestThought}
              </Text>
            </View>
          ) : null}

          {/* Human Approval Gate Action Bar inside details if currently needing approval */}
          {selectedNode.task.status === 'needs_approval' && (
            <View style={styles.checkpointActionRow}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => onApproveCheckpoint?.(selectedNode.task.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                <Text style={styles.approveButtonText}>Approve & Continue Pipeline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => onRejectCheckpoint?.(selectedNode.task.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={15} color={colors.error} />
                <Text style={styles.rejectButtonText}>Reject & Revise</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
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
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  graphHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  graphTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  graphTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    letterSpacing: -0.2,
  },
  graphSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginTop: 2,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewToggleButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.bgElevated,
  },
  horizontalScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  nodeCard: {
    width: 200,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  nodeCardSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.bgElevated,
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeCardInProgress: {
    borderColor: colors.accentPrimary,
  },
  nodeCardNeedsApproval: {
    borderColor: colors.warning,
    backgroundColor: colors.statusBgWarning,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: radius.round,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  stepNumberText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  nodeAgentInfo: {
    flex: 1,
  },
  nodeStageName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  nodeAgentRole: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: colors.secondary,
  },
  agentAvatarPill: {
    width: 24,
    height: 24,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeTaskTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
    minHeight: 32,
    lineHeight: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  nodeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  nodeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  nodeStatusText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: fontWeights.medium,
  },
  nodeProgressPercent: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.secondary,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 36,
    justifyContent: 'center',
  },
  connectorLine: {
    flex: 1,
    height: 2,
  },
  connectorBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  verticalContainer: {
    paddingVertical: spacing.xs,
  },
  verticalStepWrapper: {
    alignItems: 'center',
  },
  verticalNodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  verticalLeftCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalStepCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.round,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalStepNum: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
  verticalMidCol: {
    flex: 1,
  },
  verticalTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verticalTaskTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.primary,
    marginVertical: 2,
  },
  verticalRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  verticalConnector: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
  },
  verticalConnectorLine: {
    width: 2,
    flex: 1,
  },
  verticalConnectorBadge: {
    width: 16,
    height: 16,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  detailCard: {
    marginTop: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  detailAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailStageText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
    letterSpacing: 0.5,
  },
  detailAgentText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.secondary,
  },
  detailTaskTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginTop: 2,
  },
  checkpointAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusBgWarning,
    borderWidth: 1,
    borderColor: colors.statusBorderWarning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  checkpointAlertText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.warning,
  },
  detailDescription: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  detailDepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  detailDepsLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.textMuted,
  },
  detailDepsNone: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  depChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    gap: 4,
  },
  depChipDone: {
    backgroundColor: colors.statusBgSuccess,
    borderColor: colors.statusBorderSuccess,
  },
  depChipPending: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.border,
  },
  depChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: fontWeights.medium,
  },
  artifactBox: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  artifactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  artifactHeaderText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.accentCyan,
    textTransform: 'uppercase',
  },
  artifactContent: {
    fontFamily: fontFamilies.code,
    fontSize: 11,
    color: colors.textCode,
    lineHeight: 16,
  },
  thoughtBox: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  thoughtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  thoughtHeaderText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.accentPurple,
    textTransform: 'uppercase',
  },
  thoughtContent: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.secondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  checkpointActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  approveButton: {
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
  approveButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  rejectButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.error,
  },
});
