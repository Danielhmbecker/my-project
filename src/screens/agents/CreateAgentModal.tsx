import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Agent, Skill } from '../../models/types';

export interface CreateAgentModalProps {
  visible: boolean;
  skills?: Skill[];
  onClose: () => void;
  onCreateAgent: (newAgent: Agent) => Promise<void> | void;
}

const AVAILABLE_AVATARS: (keyof typeof Ionicons.glyphMap)[] = [
  'shield-checkmark-outline',
  'bug-outline',
  'analytics-outline',
  'server-outline',
  'terminal-outline',
  'flash-outline',
  'layers-outline',
  'globe-outline',
  'finger-print-outline',
  'cloud-upload-outline',
];

const ACCENT_COLORS = [
  '#388bfd', // Blue
  '#8957e5', // Purple
  '#39c5cf', // Cyan
  '#3fb950', // Green
  '#f0883e', // Orange
  '#d2a8ff', // Pink
];

const AVAILABLE_MODELS = [
  'Claude 3.5 Sonnet',
  'Gemini 1.5 Pro',
  'GPT-4o',
  'Claude 3.7 Sonnet',
];

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  visible,
  skills = [],
  onClose,
  onCreateAgent,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<keyof typeof Ionicons.glyphMap>(
    'shield-checkmark-outline'
  );
  const [selectedColor, setSelectedColor] = useState(ACCENT_COLORS[0]);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setRole('');
    setDescription('');
    setInstructions('');
    setSelectedSkillIds([]);
    setSelectedAvatar('shield-checkmark-outline');
    setSelectedColor(ACCENT_COLORS[0]);
    setSelectedModel(AVAILABLE_MODELS[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleToggleSkill = (skillId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSelectAvatar = (avatar: keyof typeof Ionicons.glyphMap) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setSelectedAvatar(avatar);
  };

  const handleSelectColor = (color: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setSelectedColor(color);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please provide a name for the custom agent.');
      return;
    }
    if (!role.trim()) {
      Alert.alert('Required Field', 'Please provide a role title for the agent.');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedId = `agent-custom-${Date.now()}`;
      const defaultDesc =
        description.trim() ||
        `${role.trim()} specialist executing custom autonomous directives.`;
      const defaultInst =
        instructions.trim() ||
        `You are ${name.trim()}, a specialized ${role.trim()} in ARENA STUDIO.\nExecute instructions with high precision, maintaining clean code and adherence to project architecture.`;

      const newAgent: Agent = {
        id: generatedId,
        name: name.trim(),
        role: role.trim(),
        description: defaultDesc,
        instructions: defaultInst,
        avatar: selectedAvatar,
        color: selectedColor,
        model: selectedModel,
        status: 'ready',
        assignedSkillIds: selectedSkillIds,
        permissions: ['read', 'write', 'terminal_exec'],
        temperature: 0.3,
        autoApprove: false,
        activityHistory: [
          {
            id: `act-${Date.now()}`,
            agentId: generatedId,
            timestamp: new Date().toISOString(),
            message: `Custom agent created: ${name.trim()} (${role.trim()}).`,
            type: 'info',
          },
        ],
      };

      await onCreateAgent(newAgent);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Ignore
      }
      resetForm();
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to create custom agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Create Custom Agent</Text>
            <Text style={styles.headerSubtitle}>
              Configure a dedicated specialist agent for your team.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar & Color Customization */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>ICON & ACCENT COLOR</Text>

            {/* Preview Banner */}
            <View style={styles.previewContainer}>
              <View
                style={[
                  styles.previewAvatar,
                  { borderColor: selectedColor, backgroundColor: `${selectedColor}22` },
                ]}
              >
                <Ionicons name={selectedAvatar} size={28} color={selectedColor} />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{name || 'Custom Agent'}</Text>
                <Text style={[styles.previewRole, { color: selectedColor }]}>
                  {role || 'Specialist Role'}
                </Text>
              </View>
            </View>

            {/* Avatar Row */}
            <Text style={styles.subFieldLabel}>Select Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
              {AVAILABLE_AVATARS.map((av) => {
                const isSelected = selectedAvatar === av;
                return (
                  <TouchableOpacity
                    key={av}
                    style={[
                      styles.avatarPickItem,
                      isSelected && {
                        borderColor: selectedColor,
                        backgroundColor: `${selectedColor}20`,
                      },
                    ]}
                    onPress={() => handleSelectAvatar(av)}
                  >
                    <Ionicons
                      name={av}
                      size={20}
                      color={isSelected ? selectedColor : colors.secondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Color Swatches */}
            <Text style={styles.subFieldLabel}>Select Color</Text>
            <View style={styles.colorsRow}>
              {ACCENT_COLORS.map((c) => {
                const isSelected = selectedColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      isSelected && styles.colorSwatchSelected,
                    ]}
                    onPress={() => handleSelectColor(c)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Name & Role Inputs */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>BASIC IDENTITY</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Agent Name <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Security Audit Agent"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Role / Title <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Vulnerability & Dependency Auditor"
                placeholderTextColor={colors.muted}
                value={role}
                onChangeText={setRole}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Short Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief summary of what this agent owns"
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Instructions Prompt Editor */}
          <View style={styles.cardSection}>
            <View style={styles.flexRowBetween}>
              <Text style={styles.sectionLabel}>CUSTOM INSTRUCTIONS PROMPT</Text>
              <Text style={styles.charCounter}>{instructions.length} chars</Text>
            </View>
            <Text style={styles.inputHelp}>
              Provide detailed prompt guidelines for how this specialist should analyze code, suggest solutions, or enforce rules.
            </Text>

            <TextInput
              style={styles.promptInput}
              placeholder="You are an expert specialist... Follow these guidelines..."
              placeholderTextColor={colors.muted}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Skill Picker */}
          <View style={styles.cardSection}>
            <View style={styles.flexRowBetween}>
              <Text style={styles.sectionLabel}>ASSIGN SKILLS & TOOLS</Text>
              <Text style={styles.charCounter}>{selectedSkillIds.length} selected</Text>
            </View>
            <Text style={styles.inputHelp}>
              Tap skills to grant capabilities and tools to this agent.
            </Text>

            <View style={styles.skillsChipContainer}>
              {skills.map((skill) => {
                const isSelected = selectedSkillIds.includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[
                      styles.skillChip,
                      isSelected && styles.skillChipSelected,
                    ]}
                    onPress={() => handleToggleSkill(skill.id)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={isSelected ? colors.accentPrimary : colors.secondary}
                    />
                    <Text
                      style={[
                        styles.skillChipText,
                        isSelected && styles.skillChipTextSelected,
                      ]}
                    >
                      {skill.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* AI Model Selection */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>AI MODEL</Text>
            <View style={styles.modelPillRow}>
              {AVAILABLE_MODELS.map((m) => {
                const isSelected = selectedModel === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modelPill,
                      isSelected && styles.modelPillSelected,
                    ]}
                    onPress={() => setSelectedModel(m)}
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={12}
                      color={isSelected ? colors.accentPrimary : colors.secondary}
                    />
                    <Text
                      style={[
                        styles.modelPillText,
                        isSelected && styles.modelPillTextSelected,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            <Ionicons name="sparkles" size={16} color={colors.white} />
            <Text style={styles.createButtonText}>
              {isSubmitting ? 'Creating...' : 'Create Agent'}
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
  header: {
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
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  headerSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
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
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  cardSection: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.secondary,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  subFieldLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  previewRole: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    marginTop: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  avatarPickItem: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  colorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.xs,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 2.5,
    borderColor: colors.white,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  inputHelp: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  charCounter: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  promptInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    minHeight: 140,
    lineHeight: 20,
  },
  skillsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 5,
  },
  skillChipSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  skillChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  skillChipTextSelected: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  modelPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 6,
  },
  modelPillSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  modelPillText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  modelPillTextSelected: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
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
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.secondary,
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
    gap: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
});

export default CreateAgentModal;
