import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Agent, AgentActivity, AgentStatus, Skill } from '../../models/types';
import { AgentStatusPill, STATUS_CONFIG } from './AgentCard';

export interface AgentDetailModalProps {
  visible: boolean;
  agent: Agent | null;
  skills?: Skill[];
  onClose: () => void;
  onSaveAgent: (updatedAgent: Agent) => Promise<void> | void;
  onAddActivity?: (agentId: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

type TabType = 'instructions' | 'skills' | 'settings' | 'activity';

const ALL_PERMISSIONS = [
  { key: 'read', label: 'Filesystem Read', desc: 'Inspect source code, configs, and assets' },
  { key: 'write', label: 'Filesystem Write', desc: 'Create, modify, and delete project files' },
  { key: 'terminal_exec', label: 'Terminal Execution', desc: 'Run shell commands and build scripts' },
  { key: 'git_commit', label: 'Git Operations', desc: 'Stage files, commit, branch, and merge' },
  { key: 'network_access', label: 'Network Access', desc: 'Make external API requests and web research' },
  { key: 'deploy_access', label: 'Cloud Deployment', desc: 'Trigger EAS builds and production publishes' },
];

const AVAILABLE_MODELS = [
  { id: 'Claude 3.5 Sonnet', name: 'Claude 3.5 Sonnet (Recommended)', provider: 'Anthropic' },
  { id: 'Gemini 1.5 Pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'GPT-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'Claude 3.7 Sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic' },
];

const TEMPERATURE_PRESETS = [
  { value: 0.1, label: '0.1 Precise / Code' },
  { value: 0.3, label: '0.3 Architectural' },
  { value: 0.7, label: '0.7 Balanced' },
  { value: 1.0, label: '1.0 Creative' },
];

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  visible,
  agent,
  skills = [],
  onClose,
  onSaveAgent,
  onAddActivity,
}) => {
  if (!agent) return null;

  const [activeTab, setActiveTab] = useState<TabType>('instructions');
  const [instructions, setInstructions] = useState(agent.instructions || '');
  const [assignedSkillIds, setAssignedSkillIds] = useState<string[]>(agent.assignedSkillIds || []);
  const [temperature, setTemperature] = useState<number>(agent.temperature ?? 0.3);
  const [autoApprove, setAutoApprove] = useState<boolean>(agent.autoApprove ?? false);
  const [permissions, setPermissions] = useState<string[]>(agent.permissions || ['read', 'write']);
  const [model, setModel] = useState<string>(agent.model || 'Claude 3.5 Sonnet');
  const [status, setStatus] = useState<AgentStatus>(agent.status);
  const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync state when agent changes
  useEffect(() => {
    if (agent) {
      setInstructions(agent.instructions || '');
      setAssignedSkillIds(agent.assignedSkillIds || []);
      setTemperature(agent.temperature ?? 0.3);
      setAutoApprove(agent.autoApprove ?? false);
      setPermissions(agent.permissions || ['read', 'write']);
      setModel(agent.model || 'Claude 3.5 Sonnet');
      setStatus(agent.status);
      setActiveTab('instructions');
      setSaveSuccessMsg(null);
    }
  }, [agent]);

  const agentColor = agent.color || colors.accentPrimary;

  const handleTabChange = (tab: TabType) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setActiveTab(tab);
  };

  const handleTogglePermission = (key: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleRemoveSkill = (skillId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore
    }
    setAssignedSkillIds((prev) => prev.filter((id) => id !== skillId));
  };

  const handleAddSkill = (skillId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    if (!assignedSkillIds.includes(skillId)) {
      setAssignedSkillIds((prev) => [...prev, skillId]);
    }
    setIsSkillPickerOpen(false);
  };

  const handleResetInstructions = () => {
    Alert.alert(
      'Reset Instructions',
      'Are you sure you want to reset this agent\'s instructions to system defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setInstructions(agent.instructions || '');
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              // Ignore
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: Agent = {
        ...agent,
        instructions,
        assignedSkillIds,
        temperature,
        autoApprove,
        permissions,
        model,
        status,
      };

      await onSaveAgent(updated);

      if (onAddActivity) {
        onAddActivity(
          agent.id,
          `Agent configuration updated: Prompt updated, ${assignedSkillIds.length} skills assigned, model: ${model}.`,
          'info'
        );
      }

      setSaveSuccessMsg('Agent settings saved successfully!');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Ignore
      }
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (err) {
      Alert.alert('Error', 'Failed to save agent settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Find unassigned skills for the skill picker
  const unassignedSkills = skills.filter(
    (skill) => !assignedSkillIds.includes(skill.id)
  );

  const validIcon: keyof typeof Ionicons.glyphMap =
    agent.avatar && agent.avatar in Ionicons.glyphMap
      ? (agent.avatar as keyof typeof Ionicons.glyphMap)
      : 'hardware-chip-outline';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.agentAvatar,
                {
                  borderColor: agentColor,
                  backgroundColor: `${agentColor}22`,
                },
              ]}
            >
              <Ionicons name={validIcon} size={22} color={agentColor} />
            </View>
            <View style={styles.headerTitleCol}>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerAgentName}>{agent.name}</Text>
                <AgentStatusPill status={status} size="sm" />
              </View>
              <Text style={[styles.headerRole, { color: agentColor }]}>
                {agent.role}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'instructions' && styles.tabItemActive]}
            onPress={() => handleTabChange('instructions')}
          >
            <Ionicons
              name="document-text-outline"
              size={15}
              color={activeTab === 'instructions' ? colors.accentPrimary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'instructions' && styles.tabTextActive,
              ]}
            >
              Prompt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'skills' && styles.tabItemActive]}
            onPress={() => handleTabChange('skills')}
          >
            <Ionicons
              name="construct-outline"
              size={15}
              color={activeTab === 'skills' ? colors.accentPrimary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'skills' && styles.tabTextActive,
              ]}
            >
              Skills ({assignedSkillIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            onPress={() => handleTabChange('settings')}
          >
            <Ionicons
              name="options-outline"
              size={15}
              color={activeTab === 'settings' ? colors.accentPrimary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'settings' && styles.tabTextActive,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'activity' && styles.tabItemActive]}
            onPress={() => handleTabChange('activity')}
          >
            <Ionicons
              name="time-outline"
              size={15}
              color={activeTab === 'activity' ? colors.accentPrimary : colors.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'activity' && styles.tabTextActive,
              ]}
            >
              History ({agent.activityHistory?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Success Banner */}
        {saveSuccessMsg && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successBannerText}>{saveSuccessMsg}</Text>
          </View>
        )}

        {/* Tab Content Body */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* TAB 1: INSTRUCTIONS PROMPT EDITOR */}
          {activeTab === 'instructions' && (
            <View style={styles.tabSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Agent System Instructions</Text>
                  <Text style={styles.sectionSubtitle}>
                    Defines the specialist persona, execution boundaries, and prompt directives.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetInstructions}
                >
                  <Ionicons name="refresh-outline" size={13} color={colors.secondary} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.promptEditorCard}>
                <View style={styles.editorStatusBar}>
                  <View style={styles.editorIndicator}>
                    <View style={styles.dotPulse} />
                    <Text style={styles.editorLanguageTag}>SYSTEM PROMPT</Text>
                  </View>
                  <Text style={styles.charCountText}>
                    {instructions.length} chars | ~{Math.round(instructions.length / 4)} tokens
                  </Text>
                </View>

                <TextInput
                  style={styles.promptTextInput}
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                  placeholder="Enter detailed agent instructions..."
                  placeholderTextColor={colors.muted}
                  textAlignVertical="top"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.tipBox}>
                <Ionicons name="information-circle-outline" size={16} color={colors.accentPrimary} />
                <Text style={styles.tipText}>
                  Tip: Specialist prompts are compiled into every autonomous task step. Clear guidelines on imports, error handling, and file ownership maximize code quality.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 2: ASSIGNED SKILLS PICKER */}
          {activeTab === 'skills' && (
            <View style={styles.tabSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Assigned Capabilities</Text>
                  <Text style={styles.sectionSubtitle}>
                    Active toolkits and domain guidelines assigned to this specialist.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addSkillTriggerButton}
                  onPress={() => setIsSkillPickerOpen(!isSkillPickerOpen)}
                >
                  <Ionicons
                    name={isSkillPickerOpen ? 'close' : 'add-circle-outline'}
                    size={16}
                    color={colors.accentPrimary}
                  />
                  <Text style={styles.addSkillTriggerText}>
                    {isSkillPickerOpen ? 'Cancel' : 'Add Skill'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add Skill Dropdown / Selector */}
              {isSkillPickerOpen && (
                <View style={styles.skillPickerPanel}>
                  <Text style={styles.pickerHeader}>Available Skills to Add</Text>
                  {unassignedSkills.length === 0 ? (
                    <Text style={styles.noSkillsText}>All available skills are already assigned.</Text>
                  ) : (
                    <View style={styles.availableSkillList}>
                      {unassignedSkills.map((skill) => (
                        <TouchableOpacity
                          key={skill.id}
                          style={styles.availableSkillItem}
                          onPress={() => handleAddSkill(skill.id)}
                        >
                          <View style={styles.skillItemLeft}>
                            <Ionicons name="add" size={15} color={colors.accentPrimary} />
                            <View style={{ marginLeft: 6 }}>
                              <Text style={styles.availableSkillName}>{skill.name}</Text>
                              <Text style={styles.availableSkillCategory}>
                                {skill.category} v{skill.version}
                              </Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={14} color={colors.secondary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* List of currently assigned skills */}
              {assignedSkillIds.length === 0 ? (
                <View style={styles.emptySkillsState}>
                  <Ionicons name="construct-outline" size={32} color={colors.muted} />
                  <Text style={styles.emptySkillsTitle}>No Skills Assigned</Text>
                  <Text style={styles.emptySkillsDesc}>
                    Add skills from the library to grant specialized tools and workflows.
                  </Text>
                </View>
              ) : (
                <View style={styles.assignedSkillsList}>
                  {assignedSkillIds.map((skillId) => {
                    const skill = skills.find((s) => s.id === skillId);
                    const skillName = skill ? skill.name : skillId;
                    const category = skill?.category || 'DEVELOPMENT';
                    const tools = skill?.requiredTools || [];

                    return (
                      <View key={skillId} style={styles.assignedSkillCard}>
                        <View style={styles.skillCardHeader}>
                          <View style={styles.skillCardTitleRow}>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{category}</Text>
                            </View>
                            <Text style={styles.skillCardTitle}>{skillName}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeSkillBtn}
                            onPress={() => handleRemoveSkill(skillId)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={15} color={colors.error} />
                          </TouchableOpacity>
                        </View>

                        {skill?.description && (
                          <Text style={styles.skillCardDesc} numberOfLines={2}>
                            {skill.description}
                          </Text>
                        )}

                        {tools.length > 0 && (
                          <View style={styles.toolsRow}>
                            <Text style={styles.toolsLabel}>Tools:</Text>
                            {tools.map((tool, tIdx) => (
                              <View key={tIdx} style={styles.toolChip}>
                                <Text style={styles.toolChipText}>{tool}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* TAB 3: EXECUTION SETTINGS */}
          {activeTab === 'settings' && (
            <View style={styles.tabSection}>
              {/* Status Selector */}
              <View style={styles.settingGroupCard}>
                <Text style={styles.settingGroupTitle}>Runtime Status</Text>
                <Text style={styles.settingGroupSubtitle}>
                  Current lifecycle state for this specialist agent.
                </Text>
                <View style={styles.statusChipsRow}>
                  {(['idle', 'ready', 'working', 'paused', 'failed', 'completed'] as AgentStatus[]).map(
                    (st) => {
                      const cfg = STATUS_CONFIG[st];
                      const isSelected = status === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.statusChip,
                            isSelected && {
                              backgroundColor: cfg.bgColor,
                              borderColor: cfg.color,
                            },
                          ]}
                          onPress={() => setStatus(st)}
                        >
                          <View
                            style={[
                              styles.statusDotSmall,
                              { backgroundColor: isSelected ? cfg.color : colors.muted },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusChipText,
                              isSelected && { color: cfg.color, fontWeight: fontWeights.bold },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              </View>

              {/* Model Picker */}
              <View style={styles.settingGroupCard}>
                <Text style={styles.settingGroupTitle}>AI Engine Model</Text>
                <Text style={styles.settingGroupSubtitle}>
                  Select the underlying LLM backing this specialist.
                </Text>
                <View style={styles.modelsContainer}>
                  {AVAILABLE_MODELS.map((m) => {
                    const isSelected = model === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.modelChoice,
                          isSelected && styles.modelChoiceSelected,
                        ]}
                        onPress={() => setModel(m.id)}
                      >
                        <View style={styles.modelChoiceLeft}>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={16}
                            color={isSelected ? colors.accentPrimary : colors.muted}
                          />
                          <View style={{ marginLeft: 8 }}>
                            <Text
                              style={[
                                styles.modelChoiceName,
                                isSelected && styles.modelChoiceNameSelected,
                              ]}
                            >
                              {m.id}
                            </Text>
                            <Text style={styles.modelProvider}>{m.provider}</Text>
                          </View>
                        </View>
                        {isSelected && (
                          <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>ACTIVE</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Temperature Selector */}
              <View style={styles.settingGroupCard}>
                <View style={styles.flexRowBetween}>
                  <Text style={styles.settingGroupTitle}>Execution Temperature</Text>
                  <Text style={styles.temperatureValueBadge}>{temperature.toFixed(2)}</Text>
                </View>
                <Text style={styles.settingGroupSubtitle}>
                  Lower is deterministic and precise; higher is exploratory and creative.
                </Text>
                <View style={styles.presetButtonsRow}>
                  {TEMPERATURE_PRESETS.map((preset) => {
                    const isSelected = Math.abs(temperature - preset.value) < 0.05;
                    return (
                      <TouchableOpacity
                        key={preset.value}
                        style={[
                          styles.presetButton,
                          isSelected && styles.presetButtonSelected,
                        ]}
                        onPress={() => setTemperature(preset.value)}
                      >
                        <Text
                          style={[
                            styles.presetButtonText,
                            isSelected && styles.presetButtonTextSelected,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Auto-Approve Switch */}
              <View style={styles.settingGroupCard}>
                <View style={styles.flexRowBetween}>
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    <Text style={styles.settingGroupTitle}>Auto-Approve Actions</Text>
                    <Text style={styles.settingGroupSubtitle}>
                      When enabled, agent proceeds through task steps without prompting for manual human confirmation.
                    </Text>
                  </View>
                  <Switch
                    value={autoApprove}
                    onValueChange={setAutoApprove}
                    trackColor={{ false: colors.bgTertiary, true: colors.accentPrimary }}
                    thumbColor={autoApprove ? colors.white : colors.secondary}
                  />
                </View>
              </View>

              {/* Permissions Checklist */}
              <View style={styles.settingGroupCard}>
                <Text style={styles.settingGroupTitle}>Security & Access Permissions</Text>
                <Text style={styles.settingGroupSubtitle}>
                  Explicit access capabilities granted to this agent workspace.
                </Text>

                <View style={styles.permissionsList}>
                  {ALL_PERMISSIONS.map((perm) => {
                    const isGranted = permissions.includes(perm.key);
                    return (
                      <TouchableOpacity
                        key={perm.key}
                        style={styles.permissionItem}
                        onPress={() => handleTogglePermission(perm.key)}
                      >
                        <View style={styles.permCheckbox}>
                          <Ionicons
                            name={isGranted ? 'checkbox' : 'square-outline'}
                            size={18}
                            color={isGranted ? colors.accentPrimary : colors.secondary}
                          />
                        </View>
                        <View style={styles.permTextGroup}>
                          <Text
                            style={[
                              styles.permLabel,
                              isGranted && styles.permLabelGranted,
                            ]}
                          >
                            {perm.label}
                          </Text>
                          <Text style={styles.permDesc}>{perm.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* TAB 4: ACTIVITY HISTORY LOG */}
          {activeTab === 'activity' && (
            <View style={styles.tabSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Agent Audit Log</Text>
                  <Text style={styles.sectionSubtitle}>
                    Timestamped history of decisions, command execution, and outputs.
                  </Text>
                </View>
              </View>

              {!agent.activityHistory || agent.activityHistory.length === 0 ? (
                <View style={styles.emptyHistoryState}>
                  <Ionicons name="document-text-outline" size={32} color={colors.muted} />
                  <Text style={styles.emptyHistoryTitle}>No Activity Recorded</Text>
                  <Text style={styles.emptyHistoryDesc}>
                    This agent has not executed any tasks in the active project yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {agent.activityHistory.map((act, index) => {
                    const isLast = index === agent.activityHistory.length - 1;
                    const dateFormatted = new Date(act.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                    const dateFull = new Date(act.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    });

                    const typeColor =
                      act.type === 'success'
                        ? colors.success
                        : act.type === 'error'
                        ? colors.error
                        : act.type === 'warning'
                        ? colors.warning
                        : colors.info;

                    const typeIcon: keyof typeof Ionicons.glyphMap =
                      act.type === 'success'
                        ? 'checkmark-circle'
                        : act.type === 'error'
                        ? 'alert-circle'
                        : act.type === 'warning'
                        ? 'warning'
                        : 'information-circle';

                    return (
                      <View key={act.id || index} style={styles.timelineItem}>
                        <View style={styles.timelineGutter}>
                          <View
                            style={[styles.timelineNode, { borderColor: typeColor }]}
                          >
                            <Ionicons name={typeIcon} size={11} color={typeColor} />
                          </View>
                          {!isLast && <View style={styles.timelineLine} />}
                        </View>

                        <View style={styles.timelineCard}>
                          <View style={styles.timelineHeader}>
                            <View style={styles.timeTag}>
                              <Ionicons name="time-outline" size={11} color={colors.secondary} />
                              <Text style={styles.timeTagText}>
                                {dateFull} {dateFormatted}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.typeBadge,
                                {
                                  backgroundColor: `${typeColor}15`,
                                  borderColor: `${typeColor}40`,
                                },
                              ]}
                            >
                              <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                                {act.type.toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.timelineMessage}>{act.message}</Text>

                          {(act.taskId || act.projectId) && (
                            <View style={styles.timelineMetaRow}>
                              {act.taskId && (
                                <Text style={styles.timelineMetaCode}>Task: {act.taskId}</Text>
                              )}
                              {act.projectId && (
                                <Text style={styles.timelineMetaCode}>
                                  Proj: {act.projectId}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Modal Action Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelFooterButton}
            onPress={onClose}
            disabled={isSaving}
          >
            <Text style={styles.cancelFooterText}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveFooterButton, isSaving && styles.saveFooterButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="save-outline" size={16} color={colors.white} />
            <Text style={styles.saveFooterText}>
              {isSaving ? 'Saving Changes...' : 'Save Agent'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 54 : spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAgentName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  headerRole: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.accentPrimary,
  },
  tabText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.secondary,
  },
  tabTextActive: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusBgSuccess,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.statusBorderSuccess,
    gap: 6,
  },
  successBannerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.success,
    fontWeight: fontWeights.medium,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  tabSection: {
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginTop: 2,
    maxWidth: 260,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  resetButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    fontWeight: fontWeights.medium,
  },
  promptEditorCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  editorStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentPrimary,
  },
  editorLanguageTag: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
    fontWeight: fontWeights.bold,
  },
  charCountText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  promptTextInput: {
    minHeight: 220,
    maxHeight: 400,
    padding: spacing.md,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accentPrimaryAlpha,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 139, 253, 0.3)',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.accentPrimary,
    lineHeight: 18,
  },
  addSkillTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPrimaryAlpha,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 139, 253, 0.4)',
    gap: 4,
  },
  addSkillTriggerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  skillPickerPanel: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pickerHeader: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  noSkillsText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.muted,
    fontStyle: 'italic',
  },
  availableSkillList: {
    gap: 6,
  },
  availableSkillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  skillItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableSkillName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  availableSkillCategory: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  emptySkillsState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptySkillsTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  emptySkillsDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  assignedSkillsList: {
    gap: spacing.sm,
  },
  assignedSkillCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  categoryBadgeText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    color: colors.accentPrimary,
    fontWeight: fontWeights.bold,
  },
  skillCardTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  removeSkillBtn: {
    padding: 4,
  },
  skillCardDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginTop: 6,
    lineHeight: 16,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  toolsLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
    marginRight: 4,
  },
  toolChip: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  toolChipText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
  },
  settingGroupCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  settingGroupTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  settingGroupSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  modelsContainer: {
    gap: 6,
    marginTop: spacing.xs,
  },
  modelChoice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modelChoiceSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  modelChoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelChoiceName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  modelChoiceNameSelected: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  modelProvider: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  activeTag: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  activeTagText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  temperatureValueBadge: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  presetButton: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  presetButtonSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  presetButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  presetButtonTextSelected: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  permissionsList: {
    gap: 8,
    marginTop: spacing.xs,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgTertiary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  permCheckbox: {
    marginRight: 8,
    marginTop: 1,
  },
  permTextGroup: {
    flex: 1,
  },
  permLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  permLabelGranted: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  permDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: 1,
  },
  emptyHistoryState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyHistoryTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  emptyHistoryDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  timelineList: {
    marginTop: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  timelineGutter: {
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 20,
  },
  timelineNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  timelineMessage: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  timelineMetaCode: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  cancelFooterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelFooterText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.secondary,
  },
  saveFooterButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
    gap: 6,
  },
  saveFooterButtonDisabled: {
    opacity: 0.6,
  },
  saveFooterText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
});

export default AgentDetailModal;
