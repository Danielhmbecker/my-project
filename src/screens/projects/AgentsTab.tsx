import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { Button, Badge, Card, Modal } from '../../components/ui';
import { Project, Agent, AgentStatus } from '../../models';
import { getAgents, saveProject, updateAgentStatus, saveAgent } from '../../storage';

export interface AgentsTabProps {
  project: Project;
  agents?: Agent[];
  onUpdateProject?: (updated: Project) => void;
}

export const AgentsTab: React.FC<AgentsTabProps> = ({
  project,
  agents: propAgents,
  onUpdateProject,
}) => {
  const [allAgents, setAllAgents] = useState<Agent[]>(propAgents || []);
  const [loading, setLoading] = useState<boolean>(!propAgents || propAgents.length === 0);
  const [viewFilter, setViewFilter] = useState<'assigned' | 'all'>('assigned');
  const [selectedAgentForTask, setSelectedAgentForTask] = useState<Agent | null>(null);
  const [taskInput, setTaskInput] = useState<string>('');
  const [isAssigningTask, setIsAssigningTask] = useState<boolean>(false);

  // Load agents if not provided or empty
  useEffect(() => {
    let isMounted = true;
    async function fetchAgents() {
      if (propAgents && propAgents.length > 0) {
        setAllAgents(propAgents);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const storedAgents = await getAgents();
        if (isMounted) {
          setAllAgents(storedAgents || []);
        }
      } catch (err) {
        console.warn('Failed to fetch agents:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAgents();
    return () => {
      isMounted = false;
    };
  }, [propAgents]);

  const assignedAgentIds = project.assignedAgentIds || [];

  // Toggle assigning an agent to this project
  const handleToggleAssign = async (agent: Agent) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const isAssigned = assignedAgentIds.includes(agent.id);
    let updatedIds: string[];

    if (isAssigned) {
      updatedIds = assignedAgentIds.filter((id) => id !== agent.id);
    } else {
      updatedIds = [...assignedAgentIds, agent.id];
    }

    const updatedProject: Project = {
      ...project,
      assignedAgentIds: updatedIds,
      lastModified: new Date().toISOString(),
    };

    try {
      await saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
    } catch (err) {
      console.warn('Failed to update project agents:', err);
    }
  };

  // Cycle agent status (idle -> ready -> working -> paused -> idle)
  const handleCycleStatus = async (agent: Agent) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    const statusCycle: Record<AgentStatus, AgentStatus> = {
      idle: 'ready',
      ready: 'working',
      working: 'paused',
      paused: 'idle',
      failed: 'idle',
      completed: 'idle',
    };

    const nextStatus = statusCycle[agent.status] || 'idle';
    try {
      await updateAgentStatus(agent.id, nextStatus);
      setAllAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: nextStatus } : a))
      );
    } catch (err) {
      console.warn('Failed to update agent status:', err);
    }
  };

  // Submit new task assignment to an agent
  const handleConfirmTaskAssignment = async () => {
    if (!selectedAgentForTask || !taskInput.trim()) return;

    try {
      setIsAssigningTask(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updatedAgent: Agent = {
        ...selectedAgentForTask,
        currentTaskId: taskInput.trim(),
        status: 'working',
      };

      await saveAgent(updatedAgent);

      setAllAgents((prev) =>
        prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
      );

      setSelectedAgentForTask(null);
      setTaskInput('');
    } catch (err) {
      console.warn('Failed to assign task:', err);
    } finally {
      setIsAssigningTask(false);
    }
  };

  // Filter agents based on viewFilter
  const displayedAgents = allAgents.filter((agent) => {
    if (viewFilter === 'assigned') {
      return assignedAgentIds.includes(agent.id);
    }
    return true;
  });

  const assignedCount = assignedAgentIds.length;
  const workingCount = allAgents.filter(
    (a) => assignedAgentIds.includes(a.id) && a.status === 'working'
  ).length;
  const readyCount = allAgents.filter(
    (a) => assignedAgentIds.includes(a.id) && a.status === 'ready'
  ).length;

  // Status visual mapping
  const getStatusBadgeInfo = (status: AgentStatus) => {
    switch (status) {
      case 'working':
        return { label: 'WORKING', status: 'success' as const, icon: 'sync-outline' as const };
      case 'ready':
        return { label: 'READY', status: 'info' as const, icon: 'checkmark-circle-outline' as const };
      case 'paused':
        return { label: 'PAUSED', status: 'warning' as const, icon: 'pause-circle-outline' as const };
      case 'failed':
        return { label: 'FAILED', status: 'error' as const, icon: 'alert-circle-outline' as const };
      case 'completed':
        return { label: 'DONE', status: 'success' as const, icon: 'checkmark-done-outline' as const };
      case 'idle':
      default:
        return { label: 'IDLE', status: 'default' as const, icon: 'radio-button-off-outline' as const };
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Overview & Filter Tabs */}
      <View style={styles.headerBar}>
        <View style={styles.headerStatsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statCount}>{assignedCount}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statCount, { color: colors.success }]}>{workingCount}</Text>
            <Text style={styles.statLabel}>Working</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statCount, { color: colors.accentPrimary }]}>{readyCount}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
        </View>

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, viewFilter === 'assigned' && styles.filterPillActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setViewFilter('assigned');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                viewFilter === 'assigned' && styles.filterPillTextActive,
              ]}
            >
              Assigned ({assignedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, viewFilter === 'all' && styles.filterPillActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setViewFilter('all');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                viewFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Specialists ({allAgents.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Agents Scroll List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accentPrimary} />
          <Text style={styles.loadingText}>Loading specialist team members...</Text>
        </View>
      ) : displayedAgents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Agents Assigned Yet</Text>
          <Text style={styles.emptySubtitle}>
            Switch to the 'All Specialists' tab to assign specialist AI agents to this project.
          </Text>
          <Button
            title="Browse All Specialists"
            size="sm"
            variant="outline"
            iconName="search"
            onPress={() => setViewFilter('all')}
            style={styles.browseAllBtn}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.agentsScroll}
          contentContainerStyle={styles.agentsContent}
          showsVerticalScrollIndicator={false}
        >
          {displayedAgents.map((agent) => {
            const isAssigned = assignedAgentIds.includes(agent.id);
            const statusInfo = getStatusBadgeInfo(agent.status);

            return (
              <View
                key={agent.id}
                style={[
                  styles.agentCard,
                  isAssigned && styles.agentCardAssigned,
                ]}
              >
                {/* Top Row: Avatar, Name, Role, and Assignment Toggle */}
                <View style={styles.agentHeaderRow}>
                  <View style={styles.agentAvatar}>
                    <Text style={styles.avatarEmoji}>{agent.avatar || '🤖'}</Text>
                    <View
                      style={[
                        styles.avatarDot,
                        {
                          backgroundColor:
                            agent.status === 'working'
                              ? colors.success
                              : agent.status === 'ready'
                              ? colors.accentPrimary
                              : agent.status === 'paused'
                              ? colors.warning
                              : colors.textMuted,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.agentMetaCol}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentRole}>{agent.role}</Text>
                  </View>

                  {/* Quick Assignment Toggle Button */}
                  <TouchableOpacity
                    style={[
                      styles.assignToggleBtn,
                      isAssigned ? styles.assignToggleBtnActive : styles.assignToggleBtnInactive,
                    ]}
                    onPress={() => handleToggleAssign(agent)}
                  >
                    <Ionicons
                      name={isAssigned ? 'checkmark-circle' : 'add-circle-outline'}
                      size={16}
                      color={isAssigned ? colors.success : colors.secondary}
                    />
                    <Text
                      style={[
                        styles.assignToggleText,
                        isAssigned ? styles.assignToggleTextActive : styles.assignToggleTextInactive,
                      ]}
                    >
                      {isAssigned ? 'Assigned' : 'Assign'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Middle Row: Status Pill (Tap to cycle) & Skill chips */}
                <View style={styles.statusAndSkillsRow}>
                  <TouchableOpacity
                    style={styles.statusPillTouchable}
                    activeOpacity={0.7}
                    onPress={() => handleCycleStatus(agent)}
                  >
                    <Badge
                      label={statusInfo.label}
                      status={statusInfo.status}
                      size="xs"
                      dot
                    />
                    <Text style={styles.tapToChangeText}>tap to change</Text>
                  </TouchableOpacity>

                  {agent.assignedSkillIds && agent.assignedSkillIds.length > 0 ? (
                    <View style={styles.skillChipsRow}>
                      {agent.assignedSkillIds.slice(0, 2).map((skillId) => (
                        <View key={skillId} style={styles.skillChip}>
                          <Text style={styles.skillChipText}>
                            {skillId.replace('skill-', '').toUpperCase()}
                          </Text>
                        </View>
                      ))}
                      {agent.assignedSkillIds.length > 2 && (
                        <Text style={styles.moreSkillsText}>
                          +{agent.assignedSkillIds.length - 2}
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>

                {/* Task Assignment Box */}
                <View style={styles.taskContainer}>
                  <View style={styles.taskHeaderRow}>
                    <View style={styles.taskLabelRow}>
                      <Ionicons name="hardware-chip-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.taskLabelText}>CURRENT TASK ASSIGNMENT</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedAgentForTask(agent);
                        setTaskInput(agent.currentTaskId || '');
                      }}
                      style={styles.editTaskLink}
                    >
                      <Text style={styles.editTaskText}>
                        {agent.currentTaskId ? 'Reassign' : '+ Assign Task'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.taskDescription,
                      !agent.currentTaskId && styles.taskDescriptionEmpty,
                    ]}
                  >
                    {agent.currentTaskId ||
                      'Standing by. Ready to receive autonomous development instructions.'}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* 3. Assign Task Modal */}
      <Modal
        visible={!!selectedAgentForTask}
        onClose={() => setSelectedAgentForTask(null)}
        title={`Assign Task to ${selectedAgentForTask?.name || 'Agent'}`}
        subtitle="Provide specific objective instructions for the specialist to execute."
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            onPress: () => setSelectedAgentForTask(null),
          },
          {
            label: 'Assign & Execute',
            variant: 'primary',
            loading: isAssigningTask,
            disabled: !taskInput.trim(),
            onPress: handleConfirmTaskAssignment,
          },
        ]}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalInputLabel}>TASK OBJECTIVE</Text>
          <TextInput
            style={styles.modalTextInput}
            placeholder="e.g. Implement responsive user profile cards with dark theme and unit tests..."
            placeholderTextColor={colors.textMuted}
            value={taskInput}
            onChangeText={setTaskInput}
            multiline
            numberOfLines={4}
            autoFocus
          />
          <Text style={styles.modalHelpText}>
            Specialist will immediately switch to WORKING status and stream progress to the activity log.
          </Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  headerBar: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  statCol: {
    alignItems: 'center',
  },
  statCount: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderSubtle,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: colors.accentPrimaryAlpha,
    borderColor: colors.accentPrimary,
  },
  filterPillText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    fontWeight: fontWeights.medium,
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },

  // Agents List
  agentsScroll: {
    flex: 1,
  },
  agentsContent: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
  agentCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  agentCardAssigned: {
    borderColor: colors.borderLight,
  },
  agentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.bgSecondary,
  },
  agentMetaCol: {
    flex: 1,
  },
  agentName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  agentRole: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  assignToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  assignToggleBtnActive: {
    backgroundColor: colors.statusBgSuccess,
    borderColor: colors.statusBorderSuccess,
  },
  assignToggleBtnInactive: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.borderSubtle,
  },
  assignToggleText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  assignToggleTextActive: {
    color: colors.success,
  },
  assignToggleTextInactive: {
    color: colors.secondary,
  },

  // Status & Skills
  statusAndSkillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  statusPillTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tapToChangeText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 2,
    color: colors.textMuted,
  },
  skillChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillChip: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  skillChipText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.textSecondary,
  },
  moreSkillsText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.textMuted,
  },

  // Task
  taskContainer: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskLabelText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  editTaskLink: {
    padding: 2,
  },
  editTaskText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 1,
    color: colors.accentPrimary,
    fontWeight: fontWeights.medium,
  },
  taskDescription: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  taskDescriptionEmpty: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Modal
  modalContent: {
    paddingVertical: spacing.xs,
  },
  modalInputLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalTextInput: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.primary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalHelpText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 16,
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  browseAllBtn: {
    marginTop: spacing.xs,
  },
});
