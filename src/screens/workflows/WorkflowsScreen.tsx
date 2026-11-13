import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Task, Workflow, WorkflowStatus, TaskStatus } from '../../models/types';
import { orchestrator, OrchestratorEvent } from '../../orchestration/orchestrator';
import { ExecutionLogEntry } from '../../orchestration/taskRunner';
import { WorkflowGraph, WorkflowStageNode } from './WorkflowGraph';
import { TaskQueueList, TaskQueueItem } from './TaskQueueList';

// Preset suggestions for rapid exploration
const PRESET_OBJECTIVES = [
  {
    id: 'finance',
    icon: 'wallet-outline',
    label: 'Personal Finance App',
    objective:
      'Build a mobile personal finance app with expense logging, monthly budget charts, and CSV data export.',
  },
  {
    id: 'ecommerce',
    icon: 'cart-outline',
    label: 'E-Commerce Store',
    objective:
      'Build a modern developer merchandise storefront with shopping cart, Stripe checkout flow, and order tracking.',
  },
  {
    id: 'ai-agents',
    icon: 'git-network-outline',
    label: 'Agent Task Visualizer',
    objective:
      'Build a multi-agent orchestration dashboard with interactive DAG graph, live logs timeline, and approval gates.',
  },
  {
    id: 'crypto',
    icon: 'trending-up-outline',
    label: 'Crypto Portfolio',
    objective:
      'Build a real-time crypto portfolio tracker with WebSocket live pricing, price alert notifications, and asset analytics.',
  },
];

// Stage static definitions
const STAGE_META: Record<
  string,
  {
    stageKey: 'architect' | 'designer' | 'developer' | 'qa' | 'release';
    stepNumber: number;
    stageName: string;
    agentName: string;
    agentRole: string;
    agentAvatar: string;
    agentColor: string;
    iconName: keyof typeof Ionicons.glyphMap;
  }
> = {
  'agent-architect': {
    stageKey: 'architect',
    stepNumber: 1,
    stageName: 'Architect',
    agentName: 'Architect Agent',
    agentRole: 'Architecture & Specifications',
    agentAvatar: '🏗️',
    agentColor: colors.accentPurple,
    iconName: 'cube-outline',
  },
  'agent-design': {
    stageKey: 'designer',
    stepNumber: 2,
    stageName: 'Designer',
    agentName: 'Design Agent',
    agentRole: 'UI Kit & Design Tokens',
    agentAvatar: '🎨',
    agentColor: colors.accentCyan,
    iconName: 'color-palette-outline',
  },
  'agent-developer': {
    stageKey: 'developer',
    stepNumber: 3,
    stageName: 'Developer',
    agentName: 'Developer Agent',
    agentRole: 'Screens & State Storage',
    agentAvatar: '💻',
    agentColor: colors.accentPrimary,
    iconName: 'code-slash-outline',
  },
  'agent-qa': {
    stageKey: 'qa',
    stepNumber: 4,
    stageName: 'QA',
    agentName: 'QA Agent',
    agentRole: 'Test Suite & Diagnostics',
    agentAvatar: '🧪',
    agentColor: colors.warning,
    iconName: 'shield-checkmark-outline',
  },
  'agent-release': {
    stageKey: 'release',
    stepNumber: 5,
    stageName: 'Release',
    agentName: 'Release Agent',
    agentRole: 'EAS Build & Release Packaging',
    agentAvatar: '🚀',
    agentColor: colors.accentOrange,
    iconName: 'rocket-outline',
  },
};

export const WorkflowsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Primary input state
  const [objectiveInput, setObjectiveInput] = useState<string>(
    'Build a personal finance application with expense tracking, budgeting charts, and CSV export'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Workflow state
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('idle');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [executionSpeed, setExecutionSpeed] = useState<number>(1);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'queue' | 'timeline' | 'artifacts'>('queue');

  // Streaming Timeline Activity Logs
  const [activityLogs, setActivityLogs] = useState<ExecutionLogEntry[]>([]);
  const [timelineFilterAgent, setTimelineFilterAgent] = useState<string>('all');
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const timelineScrollRef = useRef<ScrollView>(null);

  // Fallback / Initial Seed Setup
  useEffect(() => {
    let isMounted = true;

    async function loadInitialWorkflow() {
      try {
        const workflows = await orchestrator.getWorkflows();
        if (!isMounted) return;

        if (workflows && workflows.length > 0) {
          const latest = workflows[workflows.length - 1];
          setCurrentWorkflow(latest);
          setWorkflowStatus(latest.status);
          if (latest.tasks.length > 0) {
            setSelectedNodeId(latest.tasks[0].id);
          }
        } else {
          // Generate default initial workflow
          const initial = await orchestrator.createWorkflowFromObjective(objectiveInput, {
            autoStart: false,
            requireHumanApprovalForQA: true,
          });
          if (isMounted) {
            setCurrentWorkflow(initial);
            setWorkflowStatus(initial.status);
            if (initial.tasks.length > 0) {
              setSelectedNodeId(initial.tasks[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading initial workflow:', err);
      }
    }

    loadInitialWorkflow();

    // Subscribe to Orchestrator events
    const unsubscribe = orchestrator.subscribe((event: OrchestratorEvent) => {
      if (!isMounted) return;

      if (event.log) {
        setActivityLogs((prev) => [...prev, event.log!]);
        if (autoScrollLogs) {
          setTimeout(() => {
            timelineScrollRef.current?.scrollToEnd({ animated: true });
          }, 60);
        }
      }

      if (event.type === 'workflow:started') {
        setWorkflowStatus('running');
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } catch {}
      } else if (event.type === 'workflow:paused') {
        setWorkflowStatus('paused');
      } else if (event.type === 'workflow:completed') {
        setWorkflowStatus('completed');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch {}
      } else if (event.type === 'workflow:cancelled') {
        setWorkflowStatus('idle');
      }

      // Sync tasks and approval checkpoints
      if (event.workflow) {
        setCurrentWorkflow({ ...event.workflow });
        setWorkflowStatus(event.workflow.status);
      } else if (event.task) {
        setCurrentWorkflow((prev) => {
          if (!prev) return prev;
          const updatedTasks = prev.tasks.map((t) =>
            t.id === event.task!.id ? { ...event.task! } : t
          );
          return {
            ...prev,
            tasks: updatedTasks,
          };
        });

        if (event.task.status === 'needs_approval') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          } catch {}
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Handler: Generate Workflow from objective input
  const handleGenerateWorkflow = async (targetObjective?: string) => {
    const objective = (targetObjective || objectiveInput).trim();
    if (!objective) return;

    try {
      setIsGenerating(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}

      // If a workflow is running, cancel first
      if (currentWorkflow && workflowStatus === 'running') {
        await orchestrator.cancelWorkflow(currentWorkflow.id);
      }

      // Generate clean new 5-stage pipeline
      const newWorkflow = await orchestrator.createWorkflowFromObjective(objective, {
        autoStart: false,
        requireHumanApprovalForQA: true,
      });

      setCurrentWorkflow(newWorkflow);
      setWorkflowStatus('idle');
      setActivityLogs([]);
      if (newWorkflow.tasks.length > 0) {
        setSelectedNodeId(newWorkflow.tasks[0].id);
      }

      // Initial synthetic announcement log
      const initialLog: ExecutionLogEntry = {
        id: `log-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        taskId: newWorkflow.tasks[0]?.id || '',
        workflowId: newWorkflow.id,
        level: 'info',
        agentName: 'ARENA Orchestrator',
        message: `Generated multi-agent pipeline with 5 stages for objective: "${objective}"`,
      };
      setActivityLogs([initialLog]);
    } catch (err: any) {
      console.error('Error generating workflow:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Workflow Controls: Play / Pause / Reset
  const handlePlay = async () => {
    if (!currentWorkflow) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const stepDelay = Math.max(100, Math.round(300 / executionSpeed));
      if (workflowStatus === 'paused') {
        await orchestrator.resumeWorkflow(currentWorkflow.id, stepDelay);
      } else {
        await orchestrator.startWorkflow(currentWorkflow.id, stepDelay);
      }
      setWorkflowStatus('running');
    } catch (err) {
      console.error('Error starting workflow:', err);
    }
  };

  const handlePause = async () => {
    if (!currentWorkflow) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await orchestrator.pauseWorkflow(currentWorkflow.id);
      setWorkflowStatus('paused');
    } catch (err) {
      console.error('Error pausing workflow:', err);
    }
  };

  const handleReset = async () => {
    if (!currentWorkflow) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await orchestrator.cancelWorkflow(currentWorkflow.id);
      setWorkflowStatus('idle');

      // Reset all tasks to pending
      setCurrentWorkflow((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'idle',
          tasks: prev.tasks.map((t) => ({
            ...t,
            status: 'pending',
            progress: 0,
            result: undefined,
          })),
        };
      });
    } catch (err) {
      console.error('Error resetting workflow:', err);
    }
  };

  // Human Checkpoint Gate Actions
  const handleApproveCheckpoint = async (taskId: string) => {
    if (!currentWorkflow) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const stepDelay = Math.max(100, Math.round(300 / executionSpeed));
      await orchestrator.approveTask(currentWorkflow.id, taskId, 'Approved by human reviewer', stepDelay);
    } catch (err) {
      console.error('Error approving checkpoint:', err);
    }
  };

  const handleRejectCheckpoint = async (taskId: string) => {
    if (!currentWorkflow) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      await orchestrator.rejectTask(
        currentWorkflow.id,
        taskId,
        'User rejected verification gate. Revision required.'
      );
    } catch (err) {
      console.error('Error rejecting checkpoint:', err);
    }
  };

  // Prepare nodes data for WorkflowGraph
  const graphNodes: WorkflowStageNode[] = useMemo(() => {
    if (!currentWorkflow || !currentWorkflow.tasks) return [];

    return currentWorkflow.tasks.map((task, index) => {
      const meta =
        STAGE_META[task.assignedAgentId || ''] || {
          stageKey: 'architect' as const,
          stepNumber: index + 1,
          stageName: `Stage ${index + 1}`,
          agentName: 'Agent Specialist',
          agentRole: 'Orchestrated Agent',
          agentAvatar: '🤖',
          agentColor: colors.accentPrimary,
          iconName: 'hardware-chip-outline' as keyof typeof Ionicons.glyphMap,
        };

      // Extract latest thought or artifact for this stage
      const stageLogs = activityLogs.filter((l) => l.taskId === task.id);
      const latestThought = stageLogs.length > 0 ? stageLogs[stageLogs.length - 1].message : undefined;

      return {
        id: task.id,
        stageKey: meta.stageKey,
        stepNumber: meta.stepNumber,
        stageName: meta.stageName,
        agentId: task.assignedAgentId || 'unknown',
        agentName: meta.agentName,
        agentRole: meta.agentRole,
        agentAvatar: meta.agentAvatar,
        agentColor: meta.agentColor,
        iconName: meta.iconName,
        task,
        outputArtifact: task.result,
        latestThought,
      };
    });
  }, [currentWorkflow, activityLogs]);

  // Prepare items for TaskQueueList
  const taskQueueItems: TaskQueueItem[] = useMemo(() => {
    if (!currentWorkflow || !currentWorkflow.tasks) return [];

    return currentWorkflow.tasks.map((task, index) => {
      const meta =
        STAGE_META[task.assignedAgentId || ''] || {
          stepNumber: index + 1,
          stageName: `Stage ${index + 1}`,
          agentName: 'Agent Specialist',
          agentRole: 'Orchestrated Agent',
          agentAvatar: '🤖',
          agentColor: colors.accentPrimary,
          iconName: 'hardware-chip-outline' as keyof typeof Ionicons.glyphMap,
        };

      const stageLogs = activityLogs
        .filter((l) => l.taskId === task.id)
        .map((l) => `${new Date(l.timestamp).toLocaleTimeString()}: ${l.message}`);

      return {
        ...task,
        stepNumber: meta.stepNumber,
        stageName: meta.stageName,
        agentName: meta.agentName,
        agentRole: meta.agentRole,
        agentColor: meta.agentColor,
        agentAvatarIcon: meta.iconName,
        outputArtifact: task.result,
        executionLogs: stageLogs,
      };
    });
  }, [currentWorkflow, activityLogs]);

  // Filtered timeline logs
  const filteredLogs = useMemo(() => {
    if (timelineFilterAgent === 'all') return activityLogs;
    return activityLogs.filter((l) =>
      l.agentName?.toLowerCase().includes(timelineFilterAgent.toLowerCase())
    );
  }, [activityLogs, timelineFilterAgent]);

  // Metrics
  const completedTasks = currentWorkflow?.tasks.filter((t) => t.status === 'completed').length || 0;
  const totalTasks = currentWorkflow?.tasks.length || 5;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: Math.max(insets.top, 16) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={[styles.mainScrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header / Branding Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerLogo}>
                <Ionicons name="git-branch" size={18} color="#ffffff" />
              </View>
              <Text style={styles.headerTitle}>ARENA WORKFLOWS</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Multi-Agent Orchestration & Real-Time Pipeline Visualizer
            </Text>
          </View>

          {/* Quick Metrics Badge */}
          <View style={styles.headerMetricsBadge}>
            <Text style={styles.metricsNumber}>{progressPercent}%</Text>
            <Text style={styles.metricsLabel}>COMPLETE</Text>
          </View>
        </View>

        {/* Objective Input Section */}
        <View style={styles.objectiveCard}>
          <View style={styles.objectiveHeaderRow}>
            <Ionicons name="sparkles" size={15} color={colors.accentPrimary} />
            <Text style={styles.objectiveCardTitle}>High-Level Objective</Text>
          </View>

          {/* Text Input Row */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.objectiveTextInput}
              value={objectiveInput}
              onChangeText={setObjectiveInput}
              placeholder="e.g. Build a personal finance app with expense logging and charts..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />
            {objectiveInput.length > 0 && (
              <TouchableOpacity
                style={styles.clearInputButton}
                onPress={() => setObjectiveInput('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Preset Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScroll}
          >
            {PRESET_OBJECTIVES.map((preset) => {
              const isSelected = objectiveInput === preset.objective;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => {
                    setObjectiveInput(preset.objective);
                    handleGenerateWorkflow(preset.objective);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={preset.icon as any}
                    size={12}
                    color={isSelected ? colors.accentPrimary : colors.secondary}
                  />
                  <Text
                    style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Button: Generate Workflow */}
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={() => handleGenerateWorkflow()}
            disabled={isGenerating || !objectiveInput.trim()}
            activeOpacity={0.85}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="flash-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Synthesizing Pipeline...' : 'Generate Multi-Agent Workflow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Pipeline / Dependency Graph */}
        <WorkflowGraph
          nodes={graphNodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onApproveCheckpoint={handleApproveCheckpoint}
          onRejectCheckpoint={handleRejectCheckpoint}
          style={styles.sectionMargin}
        />

        {/* Tab Switcher: Task Queue vs Live Activity Timeline vs Artifacts */}
        <View style={styles.workspaceTabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'queue' && styles.tabButtonActive]}
            onPress={() => setActiveTab('queue')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="layers-outline"
              size={15}
              color={activeTab === 'queue' ? colors.accentPrimary : colors.secondary}
            />
            <Text style={[styles.tabButtonText, activeTab === 'queue' && styles.tabButtonTextActive]}>
              Task Queue ({taskQueueItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'timeline' && styles.tabButtonActive]}
            onPress={() => setActiveTab('timeline')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pulse-outline"
              size={15}
              color={activeTab === 'timeline' ? colors.accentCyan : colors.secondary}
            />
            <Text style={[styles.tabButtonText, activeTab === 'timeline' && styles.tabButtonTextActive]}>
              Agent Timeline ({activityLogs.length})
            </Text>
            {workflowStatus === 'running' && (
              <View style={styles.liveActivityIndicator} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'artifacts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('artifacts')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text-outline"
              size={15}
              color={activeTab === 'artifacts' ? colors.accentPurple : colors.secondary}
            />
            <Text style={[styles.tabButtonText, activeTab === 'artifacts' && styles.tabButtonTextActive]}>
              Artifacts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Task Queue List */}
        {activeTab === 'queue' && (
          <TaskQueueList
            tasks={taskQueueItems}
            workflowStatus={workflowStatus}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onApproveTask={handleApproveCheckpoint}
            onRejectTask={handleRejectCheckpoint}
            onSelectTask={setSelectedNodeId}
            selectedTaskId={selectedNodeId}
            speed={executionSpeed}
            onSpeedChange={setExecutionSpeed}
          />
        )}

        {/* Tab 2: Live Agent Activity Timeline */}
        {activeTab === 'timeline' && (
          <View style={styles.timelineContainer}>
            {/* Timeline Filter and Controls Bar */}
            <View style={styles.timelineHeader}>
              <View style={styles.timelineTitleRow}>
                <Ionicons name="terminal-outline" size={16} color={colors.accentCyan} />
                <Text style={styles.timelineTitle}>Streaming Agent Activity Trace</Text>
              </View>

              <View style={styles.timelineControlsGroup}>
                <TouchableOpacity
                  style={[
                    styles.autoScrollButton,
                    autoScrollLogs && styles.autoScrollButtonActive,
                  ]}
                  onPress={() => setAutoScrollLogs(!autoScrollLogs)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={autoScrollLogs ? 'arrow-down-circle' : 'pause-circle-outline'}
                    size={13}
                    color={autoScrollLogs ? colors.accentCyan : colors.secondary}
                  />
                  <Text
                    style={[
                      styles.autoScrollText,
                      autoScrollLogs && styles.autoScrollTextActive,
                    ]}
                  >
                    Auto-scroll
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.clearLogsButton}
                  onPress={() => setActivityLogs([])}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={13} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter by Agent Specialist */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.agentFilterScroll}
            >
              {['all', 'Architect', 'Design', 'Developer', 'QA', 'Release'].map((ag) => {
                const isActive = timelineFilterAgent.toLowerCase() === ag.toLowerCase();
                return (
                  <TouchableOpacity
                    key={ag}
                    style={[
                      styles.agentFilterChip,
                      isActive && styles.agentFilterChipActive,
                    ]}
                    onPress={() => setTimelineFilterAgent(ag)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.agentFilterText,
                        isActive && styles.agentFilterTextActive,
                      ]}
                    >
                      {ag === 'all' ? 'All Agents' : `${ag} Agent`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Live Streaming Log Feed */}
            <ScrollView
              ref={timelineScrollRef}
              style={styles.logsScrollView}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {filteredLogs.length === 0 ? (
                <View style={styles.logsEmpty}>
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.logsEmptyTitle}>No activity logs yet</Text>
                  <Text style={styles.logsEmptySub}>
                    Start the pipeline to watch autonomous agents plan, reason, and code live.
                  </Text>
                </View>
              ) : (
                filteredLogs.map((log) => {
                  const isAgentThought =
                    log.message.includes('Reasoning:') ||
                    log.message.includes('Evaluating') ||
                    log.message.includes('Drafting') ||
                    log.level === 'agent';

                  const isError = log.level === 'error';
                  const isSuccess = log.level === 'success';
                  const isWarn = log.level === 'warn';

                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.logEntry,
                        isError && styles.logEntryError,
                        isSuccess && styles.logEntrySuccess,
                        isWarn && styles.logEntryWarn,
                      ]}
                    >
                      {/* Meta Row: Time, Agent Pill, Level Badge */}
                      <View style={styles.logMetaRow}>
                        <Text style={styles.logTimestamp}>
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </Text>

                        {log.agentName && (
                          <View style={styles.logAgentPill}>
                            <Text style={styles.logAgentName}>{log.agentName}</Text>
                          </View>
                        )}

                        <View
                          style={[
                            styles.logLevelBadge,
                            isError && styles.logLevelBadgeError,
                            isSuccess && styles.logLevelBadgeSuccess,
                            isWarn && styles.logLevelBadgeWarn,
                          ]}
                        >
                          <Text style={styles.logLevelText}>{log.level.toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Message Content */}
                      <Text
                        style={[
                          styles.logMessage,
                          isAgentThought && styles.logThoughtMessage,
                          isError && styles.logMessageError,
                        ]}
                      >
                        {log.message}
                      </Text>

                      {/* Code / Artifact Payload Snippet Preview */}
                      {log.payload && log.payload.code && (
                        <View style={styles.codeSnippetContainer}>
                          <Text style={styles.codeSnippetText}>
                            {String(log.payload.code)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        {/* Tab 3: Generated Artifacts Inspector */}
        {activeTab === 'artifacts' && (
          <View style={styles.artifactsContainer}>
            <View style={styles.artifactsHeader}>
              <Ionicons name="folder-open-outline" size={17} color={colors.accentPurple} />
              <Text style={styles.artifactsTitle}>Pipeline Generated Deliverables</Text>
            </View>

            {graphNodes.map((node) => (
              <View key={node.id} style={styles.artifactStageCard}>
                <View style={styles.artifactStageHeader}>
                  <View
                    style={[
                      styles.artifactIconBox,
                      { backgroundColor: `${node.agentColor}20`, borderColor: node.agentColor },
                    ]}
                  >
                    <Ionicons name={node.iconName} size={15} color={node.agentColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.artifactStageName}>
                      STAGE 0{node.stepNumber}: {node.stageName} ({node.agentName})
                    </Text>
                    <Text style={styles.artifactTaskTitle}>{node.task.title}</Text>
                  </View>
                  <View
                    style={[
                      styles.artifactStatusPill,
                      node.task.status === 'completed' && styles.statusPillCompleted,
                    ]}
                  >
                    <Text style={styles.artifactStatusText}>
                      {node.task.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {node.outputArtifact ? (
                  <View style={styles.artifactBodyContainer}>
                    <Text style={styles.artifactCodeBody}>{node.outputArtifact}</Text>
                  </View>
                ) : (
                  <Text style={styles.artifactPendingNotice}>
                    Artifact pending execution of stage 0{node.stepNumber}.
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginTop: 2,
  },
  headerMetricsBadge: {
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricsNumber: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
  },
  metricsLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
  },
  objectiveCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  objectiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  objectiveCardTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  inputContainer: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  objectiveTextInput: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
    minHeight: 46,
    textAlignVertical: 'top',
    paddingRight: 24,
  },
  clearInputButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  presetsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  presetChipActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  presetChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.secondary,
    fontWeight: fontWeights.medium,
  },
  presetChipTextActive: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPrimary,
    paddingVertical: 11,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  sectionMargin: {
    marginTop: spacing.xs,
  },
  workspaceTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    gap: 5,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: colors.bgElevated,
  },
  tabButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: colors.secondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  liveActivityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCyan,
    position: 'absolute',
    top: 6,
    right: 8,
  },
  timelineContainer: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timelineTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  timelineControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  autoScrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: colors.bgTertiary,
    gap: 3,
  },
  autoScrollButtonActive: {
    backgroundColor: colors.accentCyanAlpha,
  },
  autoScrollText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
  },
  autoScrollTextActive: {
    color: colors.accentCyan,
    fontWeight: fontWeights.bold,
  },
  clearLogsButton: {
    padding: 4,
    borderRadius: radius.xs,
    backgroundColor: colors.bgTertiary,
  },
  agentFilterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  agentFilterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agentFilterChipActive: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.accentCyan,
  },
  agentFilterText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: colors.secondary,
  },
  agentFilterTextActive: {
    color: colors.accentCyan,
    fontWeight: fontWeights.bold,
  },
  logsScrollView: {
    maxHeight: 380,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  logsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  logsEmptyTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  logsEmptySub: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    textAlign: 'center',
    maxWidth: 240,
  },
  logEntry: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  logEntryError: {
    backgroundColor: colors.statusBgError,
  },
  logEntrySuccess: {
    backgroundColor: colors.statusBgSuccess,
  },
  logEntryWarn: {
    backgroundColor: colors.statusBgWarning,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  logTimestamp: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    color: colors.textMuted,
  },
  logAgentPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  logAgentName: {
    fontFamily: fontFamilies.sans,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
  },
  logLevelBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    backgroundColor: colors.bgTertiary,
  },
  logLevelBadgeError: {
    backgroundColor: colors.error,
  },
  logLevelBadgeSuccess: {
    backgroundColor: colors.success,
  },
  logLevelBadgeWarn: {
    backgroundColor: colors.warning,
  },
  logLevelText: {
    fontFamily: fontFamilies.mono,
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  logMessage: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  logThoughtMessage: {
    fontFamily: fontFamilies.sans,
    color: colors.accentPurple,
    fontStyle: 'italic',
  },
  logMessageError: {
    color: colors.error,
  },
  codeSnippetContainer: {
    backgroundColor: colors.bgCode,
    borderRadius: radius.xs,
    padding: spacing.xs,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  codeSnippetText: {
    fontFamily: fontFamilies.code,
    fontSize: 10,
    color: colors.textCode,
    lineHeight: 14,
  },
  artifactsContainer: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  artifactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  artifactsTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  artifactStageCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  artifactStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  artifactIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artifactStageName: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
  },
  artifactTaskTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  artifactStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillCompleted: {
    backgroundColor: colors.statusBgSuccess,
    borderColor: colors.statusBorderSuccess,
  },
  artifactStatusText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.secondary,
  },
  artifactBodyContainer: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  artifactCodeBody: {
    fontFamily: fontFamilies.code,
    fontSize: 10,
    color: colors.textCode,
    lineHeight: 15,
  },
  artifactPendingNotice: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});

export default WorkflowsScreen;
