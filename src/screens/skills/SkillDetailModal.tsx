import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Skill, Agent } from '../../models';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { getCategoryColor, getCategoryIcon } from './SkillCard';

export interface SkillDetailModalProps {
  skill: Skill | null;
  visible: boolean;
  onClose: () => void;
  agents: Agent[];
  onToggleAgent: (skillId: string, agentId: string, isCurrentlyAssigned: boolean) => Promise<void>;
  onDeleteSkill?: (skillId: string) => Promise<void>;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  visible,
  onClose,
  agents,
  onToggleAgent,
  onDeleteSkill,
}) => {
  const [copied, setCopied] = useState(false);
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!skill) return null;

  const categoryColor = getCategoryColor(skill.category);
  const categoryIcon = getCategoryIcon(skill.category);

  const handleCopyInstructions = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAgentToggle = async (agentId: string, isAssigned: boolean) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    setTogglingAgentId(agentId);
    try {
      await onToggleAgent(skill.id, agentId, isAssigned);
    } catch (err) {
      console.error('Failed to toggle agent assignment:', err);
      Alert.alert('Assignment Error', 'Could not update agent skill assignment.');
    } finally {
      setTogglingAgentId(null);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to delete "${skill.name}"? This will unassign it from all active agents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!onDeleteSkill) return;
            setDeleting(true);
            try {
              await onDeleteSkill(skill.id);
              onClose();
            } catch (err) {
              console.error('Failed to delete skill:', err);
              Alert.alert('Error', 'Failed to delete skill from storage.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const assignedCount = skill.assignedAgentIds.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: `${categoryColor}18`,
                    borderColor: `${categoryColor}40`,
                  },
                ]}
              >
                <Ionicons
                  name={categoryIcon}
                  size={13}
                  color={categoryColor}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {skill.category}
                </Text>
              </View>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v{skill.version}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Title Banner */}
          <View style={styles.titleBanner}>
            <Text style={styles.skillTitle}>{skill.name}</Text>
            <Text style={styles.skillSubtitle}>
              {assignedCount === 0
                ? 'Not currently assigned to any agent'
                : `Assigned to ${assignedCount} of ${agents.length} specialist agents`}
            </Text>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Description Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>OVERVIEW</Text>
              <Text style={styles.descriptionText}>{skill.description}</Text>
            </View>

            {/* Required Tools Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>REQUIRED TOOLS & RUNTIMES</Text>
                <Text style={styles.badgeCounter}>
                  {skill.requiredTools.length} {skill.requiredTools.length === 1 ? 'tool' : 'tools'}
                </Text>
              </View>

              <View style={styles.toolsChipsContainer}>
                {skill.requiredTools.map((tool) => (
                  <View key={tool} style={styles.toolChip}>
                    <Ionicons
                      name="terminal-outline"
                      size={12}
                      color={categoryColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.toolChipText}>{tool}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* System Instructions / Prompt Guide */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>INSTRUCTIONS & SYSTEM PROMPT</Text>
                <TouchableOpacity
                  onPress={handleCopyInstructions}
                  style={styles.copyButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={13}
                    color={copied ? colors.success : colors.accentPrimary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.copyButtonText,
                      copied && { color: colors.success },
                    ]}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.codeContainer}>
                <View style={styles.codeHeader}>
                  <View style={styles.windowDots}>
                    <View style={[styles.dot, { backgroundColor: '#f85149' }]} />
                    <View style={[styles.dot, { backgroundColor: '#d29922' }]} />
                    <View style={[styles.dot, { backgroundColor: '#3fb950' }]} />
                  </View>
                  <Text style={styles.codeLanguage}>system-prompt.md</Text>
                </View>
                <Text style={styles.codeText}>{skill.instructions}</Text>
              </View>
            </View>

            {/* Agent Capability Matrix (Assign / Unassign) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>AGENT ASSIGNMENTS</Text>
                <Text style={styles.badgeCounter}>
                  {assignedCount} / {agents.length} Equipped
                </Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Toggle which agents have this skill active in their capability matrix.
              </Text>

              <View style={styles.agentsList}>
                {agents.map((agent) => {
                  const isAssigned = skill.assignedAgentIds.includes(agent.id);
                  const isPending = togglingAgentId === agent.id;
                  const agentColor = agent.color || colors.accentPrimary;
                  const iconName = (agent.avatar as keyof typeof Ionicons.glyphMap) || 'person-outline';

                  return (
                    <View
                      key={agent.id}
                      style={[
                        styles.agentRow,
                        isAssigned && styles.agentRowAssigned,
                      ]}
                    >
                      <View
                        style={[
                          styles.agentAvatar,
                          {
                            backgroundColor: `${agentColor}20`,
                            borderColor: isAssigned ? agentColor : colors.border,
                          },
                        ]}
                      >
                        <Ionicons name={iconName} size={16} color={agentColor} />
                      </View>

                      <View style={styles.agentMeta}>
                        <View style={styles.agentNameRow}>
                          <Text style={styles.agentName}>{agent.name}</Text>
                          {isAssigned && (
                            <View
                              style={[
                                styles.equippedPill,
                                { backgroundColor: `${categoryColor}18` },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.equippedPillText,
                                  { color: categoryColor },
                                ]}
                              >
                                ACTIVE
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.agentRole} numberOfLines={1}>
                          {agent.role}
                        </Text>
                      </View>

                      {/* Toggle Button */}
                      <TouchableOpacity
                        onPress={() => handleAgentToggle(agent.id, isAssigned)}
                        style={[
                          styles.toggleButton,
                          isAssigned
                            ? [styles.toggleButtonAssigned, { backgroundColor: categoryColor }]
                            : styles.toggleButtonUnassigned,
                          isPending && { opacity: 0.6 },
                        ]}
                        activeOpacity={0.7}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <ActivityIndicator
                            size="small"
                            color={isAssigned ? '#ffffff' : colors.textPrimary}
                          />
                        ) : isAssigned ? (
                          <>
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#ffffff"
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.toggleButtonAssignedText}>Assigned</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="add"
                              size={14}
                              color={colors.textSecondary}
                              style={{ marginRight: 2 }}
                            />
                            <Text style={styles.toggleButtonUnassignedText}>Assign</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Delete Skill Action (if provided) */}
            {onDeleteSkill && (
              <View style={styles.dangerZone}>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.error}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.deleteButtonText}>Delete Skill</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneButton}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    maxHeight: '92%',
    ...shadows.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.semibold,
  },
  versionBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  versionText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
  },
  closeButton: {
    padding: spacing.xs,
  },
  titleBanner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skillTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  skillSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  badgeCounter: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  sectionSubtitle: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  descriptionText: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  toolsChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toolChipText: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
    fontSize: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  copyButtonText: {
    color: colors.accentPrimary,
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.medium,
  },
  codeContainer: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  windowDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  codeLanguage: {
    color: colors.textMuted,
    fontFamily: fontFamilies.mono,
    fontSize: 10,
  },
  codeText: {
    color: colors.textCode,
    fontFamily: fontFamilies.code,
    fontSize: 12,
    lineHeight: 19,
    padding: spacing.md,
  },
  agentsList: {
    gap: spacing.xs,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  agentRowAssigned: {
    borderColor: colors.borderLight,
    backgroundColor: colors.bgElevated,
  },
  agentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  agentMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  agentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentName: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  equippedPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  equippedPillText: {
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
  },
  agentRole: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 1,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    minWidth: 84,
  },
  toggleButtonAssigned: {
    borderWidth: 0,
  },
  toggleButtonAssignedText: {
    color: '#ffffff',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  toggleButtonUnassigned: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toggleButtonUnassignedText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  dangerZone: {
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.3)',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
});

export default SkillDetailModal;
