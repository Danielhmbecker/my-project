import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Skill, SkillCategory, Agent } from '../../models';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { getCategoryColor, getCategoryIcon } from './SkillCard';

export interface CreateSkillModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (skill: Skill) => Promise<void>;
  agents: Agent[];
}

const CATEGORIES: SkillCategory[] = [
  'DEVELOPMENT',
  'DESIGN',
  'TESTING',
  'OPERATIONS',
];

const PRESET_TOOLS: Record<SkillCategory, string[]> = {
  DEVELOPMENT: ['expo-cli', 'metro', 'tsc', 'git', 'node', 'async-storage', 'sqlite3', 'graphql'],
  DESIGN: ['figma', 'svgo', 'vector-icons', 'blender-headless', 'three', 'style-dictionary'],
  TESTING: ['jest', 'detox', 'maestro', 'hermes-profile', 'systrace', 'testing-library'],
  OPERATIONS: ['eas-cli', 'vercel-cli', 'gh-cli', 'docker', 'fastlane', 'npm'],
};

export const CreateSkillModal: React.FC<CreateSkillModalProps> = ({
  visible,
  onClose,
  onSave,
  agents,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('DEVELOPMENT');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [toolsInput, setToolsInput] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCategory('DEVELOPMENT');
    setVersion('1.0.0');
    setDescription('');
    setInstructions('');
    setToolsInput('');
    setSelectedTools([]);
    setSelectedAgentIds([]);
    setErrorMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTogglePresetTool = (tool: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleToggleAgent = (agentId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    if (selectedAgentIds.includes(agentId)) {
      setSelectedAgentIds(selectedAgentIds.filter((id) => id !== agentId));
    } else {
      setSelectedAgentIds([...selectedAgentIds, agentId]);
    }
  };

  const handleAddCustomTool = () => {
    const trimmed = toolsInput.trim().toLowerCase();
    if (!trimmed) return;

    const parts = trimmed
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const merged = Array.from(new Set([...selectedTools, ...parts]));
    setSelectedTools(merged);
    setToolsInput('');
  };

  const handleRemoveTool = (tool: string) => {
    setSelectedTools(selectedTools.filter((t) => t !== tool));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage('Skill name is required.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Description is required.');
      return;
    }

    if (!instructions.trim()) {
      setErrorMessage('System prompt instructions are required.');
      return;
    }

    // Merge any remaining typed tool input
    let finalTools = [...selectedTools];
    if (toolsInput.trim()) {
      const extra = toolsInput
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      finalTools = Array.from(new Set([...finalTools, ...extra]));
    }

    const newSkill: Skill = {
      id: `skill-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      instructions: instructions.trim(),
      requiredTools: finalTools.length > 0 ? finalTools : ['custom-tool'],
      version: version.trim() || '1.0.0',
      assignedAgentIds: selectedAgentIds,
    };

    setLoading(true);
    setErrorMessage(null);

    try {
      await onSave(newSkill);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to create skill:', err);
      setErrorMessage(err?.message || 'Failed to save skill to storage.');
    } finally {
      setLoading(false);
    }
  };

  const categoryColor = getCategoryColor(category);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconContainer, { backgroundColor: `${categoryColor}20` }]}>
                <Ionicons name="sparkles" size={18} color={categoryColor} />
              </View>
              <View>
                <Text style={styles.title}>Create Custom Skill</Text>
                <Text style={styles.subtitle}>
                  Register a new specialist capability & instruction prompt
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.error}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Category Selector */}
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const catColor = getCategoryColor(cat);
                const catIcon = getCategoryIcon(cat);

                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                    }}
                    style={[
                      styles.categoryCard,
                      isSelected && {
                        backgroundColor: `${catColor}15`,
                        borderColor: catColor,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={catIcon}
                      size={15}
                      color={isSelected ? catColor : colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.categoryCardText,
                        isSelected && { color: catColor, fontWeight: fontWeights.bold },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name & Version Row */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 3, marginRight: spacing.sm }]}>
                <Text style={styles.inputLabel}>
                  SKILL NAME <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. GraphQL Realtime Client"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>VERSION</Text>
                <TextInput
                  style={[styles.textInput, styles.monoInput]}
                  placeholder="1.0.0"
                  placeholderTextColor={colors.textMuted}
                  value={version}
                  onChangeText={setVersion}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>
                DESCRIPTION <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="High-level description of what this capability empowers agents to do..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Required Tools */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>REQUIRED TOOLS</Text>
              <View style={styles.toolsInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: spacing.sm }]}
                  placeholder="Type a tool name and tap Add..."
                  placeholderTextColor={colors.textMuted}
                  value={toolsInput}
                  onChangeText={setToolsInput}
                  onSubmitEditing={handleAddCustomTool}
                  returnKeyType="done"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={handleAddCustomTool}
                  style={styles.addToolButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.textPrimary} />
                  <Text style={styles.addToolButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Selected Tools Chips */}
              {selectedTools.length > 0 && (
                <View style={styles.selectedToolsList}>
                  {selectedTools.map((tool) => (
                    <View key={tool} style={styles.selectedToolChip}>
                      <Text style={styles.selectedToolChipText}>{tool}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveTool(tool)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={14}
                          color={colors.textMuted}
                          style={{ marginLeft: 4 }}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Suggested Preset Tools */}
              <Text style={styles.presetsLabel}>Suggested {category} Tools:</Text>
              <View style={styles.presetToolsList}>
                {PRESET_TOOLS[category].map((tool) => {
                  const isChecked = selectedTools.includes(tool);
                  return (
                    <TouchableOpacity
                      key={tool}
                      onPress={() => handleTogglePresetTool(tool)}
                      style={[
                        styles.presetChip,
                        isChecked && styles.presetChipActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isChecked ? 'checkmark-circle' : 'add-outline'}
                        size={12}
                        color={isChecked ? colors.accentPrimary : colors.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.presetChipText,
                          isChecked && styles.presetChipTextActive,
                        ]}
                      >
                        {tool}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Instructions Prompt */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>
                  INSTRUCTIONS PROMPT <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Text style={styles.inputHelper}>Agent execution guidelines</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  styles.multilineInput,
                  styles.codeEditorInput,
                ]}
                placeholder={`// Enter prompt guidelines for this skill...\n1. Use strict typing\n2. Handle edge cases and timeouts\n3. Enforce offline resilience`}
                placeholderTextColor={colors.textMuted}
                value={instructions}
                onChangeText={(val) => {
                  setInstructions(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Initial Agent Assignment */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>ASSIGN TO SPECIALIST AGENTS</Text>
              <Text style={styles.inputHelper}>
                Select team members to equip with this skill upon creation
              </Text>

              <View style={styles.agentsGrid}>
                {agents.map((agent) => {
                  const isAssigned = selectedAgentIds.includes(agent.id);
                  const agentColor = agent.color || colors.accentPrimary;
                  const iconName = (agent.avatar as keyof typeof Ionicons.glyphMap) || 'person-outline';

                  return (
                    <TouchableOpacity
                      key={agent.id}
                      onPress={() => handleToggleAgent(agent.id)}
                      style={[
                        styles.agentPickCard,
                        isAssigned && {
                          borderColor: agentColor,
                          backgroundColor: `${agentColor}18`,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.agentIconCircle,
                          {
                            backgroundColor: `${agentColor}22`,
                            borderColor: agentColor,
                          },
                        ]}
                      >
                        <Ionicons name={iconName} size={14} color={agentColor} />
                      </View>
                      <View style={styles.agentInfo}>
                        <Text style={styles.agentName} numberOfLines={1}>
                          {agent.name}
                        </Text>
                        <Text style={styles.agentRole} numberOfLines={1}>
                          {agent.role}
                        </Text>
                      </View>
                      <Ionicons
                        name={isAssigned ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={isAssigned ? agentColor : colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.cancelButton}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.saveButton,
                { backgroundColor: categoryColor },
                loading && { opacity: 0.7 },
              ]}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color="#ffffff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveButtonText}>Create Skill</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
    ...shadows.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    borderColor: 'rgba(248, 81, 73, 0.4)',
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryCardText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  requiredAsterisk: {
    color: colors.error,
  },
  inputHelper: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    fontFamily: fontFamilies.sans,
  },
  textInput: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
  },
  monoInput: {
    fontFamily: fontFamilies.mono,
    textAlign: 'center',
  },
  multilineInput: {
    minHeight: 70,
    paddingTop: 10,
  },
  codeEditorInput: {
    backgroundColor: colors.bgPrimary,
    fontFamily: fontFamilies.code,
    fontSize: 12,
    lineHeight: 18,
    borderColor: colors.borderLight,
    color: colors.textCode,
    minHeight: 110,
  },
  toolsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addToolButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    marginLeft: 2,
  },
  selectedToolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: 4,
  },
  selectedToolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderFocus,
  },
  selectedToolChipText: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
    fontSize: 11,
  },
  presetsLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  presetToolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  presetChipActive: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    borderColor: colors.accentPrimary,
  },
  presetChipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.mono,
    fontSize: 10,
  },
  presetChipTextActive: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  agentsGrid: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  agentPickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  agentIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  agentInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  agentName: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  agentRole: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.md,
    minWidth: 130,
  },
  saveButtonText: {
    color: '#ffffff',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
});

export default CreateSkillModal;
