import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { Button, Card, Badge, Modal, Input } from '../../components/ui';
import { Project, ProjectFramework } from '../../models';
import { saveProject, deleteProject } from '../../storage';

export interface SettingsTabProps {
  project: Project;
  onUpdateProject?: (updated: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  project,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [name, setName] = useState<string>(project.name);
  const [description, setDescription] = useState<string>(project.description);
  const [framework, setFramework] = useState<ProjectFramework>(project.framework);
  const [category, setCategory] = useState<string>(project.category || 'Mobile App');
  const [gitRemote, setGitRemote] = useState<string>(project.gitRemote || '');
  const [gitBranch, setGitBranch] = useState<string>(project.gitBranch || 'main');
  const [previewUrl, setPreviewUrl] = useState<string>(project.previewUrl || '');

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [confirmNameInput, setConfirmNameInput] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  const frameworksList: { id: ProjectFramework; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
    { id: 'expo', label: 'Expo / React Native', icon: 'phone-portrait-outline', desc: 'Universal iOS & Android app' },
    { id: 'ios', label: 'iOS Native (SwiftUI)', icon: 'logo-apple', desc: 'Native Apple platform' },
    { id: 'react', label: 'React Mobile', icon: 'logo-react', desc: 'Cross-platform mobile web app' },
    { id: 'nextjs', label: 'Next.js Mobile Web', icon: 'globe-outline', desc: 'Server rendered web runtime' },
    { id: 'web', label: 'Web Application', icon: 'browsers-outline', desc: 'Standard browser runtime' },
    { id: 'game', label: 'Game Engine', icon: 'game-controller-outline', desc: 'Interactive Canvas / 3D' },
  ];

  // Save changes to storage
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Project name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updatedProject: Project = {
        ...project,
        name: name.trim(),
        description: description.trim(),
        framework,
        category: category.trim(),
        gitRemote: gitRemote.trim() || undefined,
        gitBranch: gitBranch.trim() || 'main',
        previewUrl: previewUrl.trim() || undefined,
        lastModified: new Date().toISOString(),
      };

      await saveProject(updatedProject);
      onUpdateProject?.(updatedProject);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to save project:', err);
      Alert.alert('Save Failed', 'Could not save project configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Delete project irreversibly
  const handleConfirmDelete = async () => {
    if (confirmNameInput.trim() !== project.name.trim()) {
      Alert.alert('Name Mismatch', `Please type "${project.name}" exactly to confirm deletion.`);
      return;
    }

    try {
      setDeleting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      await deleteProject(project.id);
      setDeleteModalVisible(false);
      onDeleteProject?.(project.id);
    } catch (err) {
      console.warn('Failed to delete project:', err);
      Alert.alert('Delete Failed', 'An error occurred while deleting the project.');
      setDeleting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Banner */}
      {saveSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.successBannerText}>Project configuration saved successfully!</Text>
        </View>
      )}

      {/* 1. General Project Details */}
      <Text style={styles.sectionHeader}>GENERAL CONFIGURATION</Text>
      <Card variant="bordered" style={styles.sectionCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PROJECT NAME *</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. NEXA Finance"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the application objective..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <TextInput
            style={styles.textInput}
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Finance & Fintech, Developer Tools"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </Card>

      {/* 2. Target Framework Selector */}
      <Text style={styles.sectionHeader}>FRAMEWORK & RUNTIME</Text>
      <View style={styles.frameworkGrid}>
        {frameworksList.map((item) => {
          const isSelected = framework === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.frameworkCard,
                isSelected && styles.frameworkCardSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
                setFramework(item.id);
              }}
            >
              <View style={styles.frameworkCardHeader}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isSelected ? colors.accentPrimary : colors.secondary}
                />
                <View
                  style={[
                    styles.radioIndicator,
                    isSelected && styles.radioIndicatorSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </View>
              <Text style={[styles.frameworkLabel, isSelected && styles.frameworkLabelSelected]}>
                {item.label}
              </Text>
              <Text style={styles.frameworkDesc}>{item.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Git & Cloud Deployment Link */}
      <Text style={styles.sectionHeader}>VERSION CONTROL & PREVIEW</Text>
      <Card variant="bordered" style={styles.sectionCard}>
        <View style={styles.fieldGroup}>
          <View style={styles.labelWithIconRow}>
            <Ionicons name="logo-github" size={14} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>GIT REMOTE URL</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.codeFont]}
            value={gitRemote}
            onChangeText={setGitRemote}
            placeholder="https://github.com/organization/repo.git"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelWithIconRow}>
            <Ionicons name="git-branch-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>DEFAULT BRANCH</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.codeFont]}
            value={gitBranch}
            onChangeText={setGitBranch}
            placeholder="main"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelWithIconRow}>
            <Ionicons name="globe-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>LIVE PREVIEW URL</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.codeFont]}
            value={previewUrl}
            onChangeText={setPreviewUrl}
            placeholder="exp://u.expo.dev/... or https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </Card>

      {/* Save Button */}
      <Button
        title="Save Project Configuration"
        variant="primary"
        size="md"
        iconName="save-outline"
        loading={saving}
        onPress={handleSave}
        style={styles.saveButton}
      />

      {/* 4. Danger Zone: Delete Project with Irreversible Confirmation */}
      <Text style={[styles.sectionHeader, styles.dangerSectionHeader]}>DANGER ZONE</Text>
      <View style={styles.dangerCard}>
        <View style={styles.dangerHeaderRow}>
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text style={styles.dangerTitle}>Delete Project</Text>
        </View>
        <Text style={styles.dangerDescription}>
          Permanently delete this project, along with its files, build histories, and agent task logs.
          This action is irreversible.
        </Text>
        <Button
          title="Delete Project..."
          variant="danger"
          size="md"
          iconName="trash-outline"
          onPress={() => {
            Haptics.selectionAsync();
            setConfirmNameInput('');
            setDeleteModalVisible(true);
          }}
          style={styles.deleteTriggerBtn}
        />
      </View>

      {/* Irreversible Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Irreversible Action"
        subtitle="Are you sure you want to delete this project?"
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            onPress: () => setDeleteModalVisible(false),
          },
          {
            label: 'Permanently Delete',
            variant: 'danger',
            loading: deleting,
            disabled: confirmNameInput.trim() !== project.name.trim(),
            onPress: handleConfirmDelete,
          },
        ]}
      >
        <View style={styles.modalDeleteContent}>
          <View style={styles.modalWarningBox}>
            <Ionicons name="alert-circle" size={24} color={colors.error} />
            <Text style={styles.modalWarningText}>
              All files, commits, agent orchestration DAGs, and build records for{' '}
              <Text style={styles.boldText}>{project.name}</Text> will be erased from local and cloud storage.
            </Text>
          </View>

          <Text style={styles.confirmPrompt}>
            To verify, type <Text style={styles.highlightName}>{project.name}</Text> below:
          </Text>

          <TextInput
            style={[styles.textInput, styles.confirmInput]}
            value={confirmNameInput}
            onChangeText={setConfirmNameInput}
            placeholder={project.name}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.statusBgSuccess,
    borderWidth: 1,
    borderColor: colors.statusBorderSuccess,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: fontWeights.semibold,
  },
  sectionHeader: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  dangerSectionHeader: {
    color: colors.error,
    marginTop: spacing.xl,
  },
  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: 4,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    color: colors.primary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  codeFont: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
  },

  // Framework Selector Grid
  frameworkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  frameworkCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 4,
  },
  frameworkCardSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  frameworkCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorSelected: {
    borderColor: colors.accentPrimary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
  frameworkLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.secondary,
    marginTop: 2,
  },
  frameworkLabelSelected: {
    color: colors.primary,
  },
  frameworkDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 2,
    color: colors.textMuted,
  },

  // Save Button
  saveButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  // Danger Zone
  dangerCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dangerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.bold,
    color: colors.error,
  },
  dangerDescription: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    lineHeight: 18,
  },
  deleteTriggerBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },

  // Modal
  modalDeleteContent: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  modalWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.statusBgError,
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  modalWarningText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    flex: 1,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  confirmPrompt: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  highlightName: {
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.error,
  },
  confirmInput: {
    borderColor: colors.borderLight,
  },
});
