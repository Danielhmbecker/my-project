import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import {
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../components/ui/Button';
import {
  Input,
  InputVariant,
} from '../../components/ui/Input';
import {
  Card,
  CardVariant,
} from '../../components/ui/Card';
import {
  Badge,
  BadgeStatus,
  BadgeVariant,
} from '../../components/ui/Badge';
import {
  Modal,
} from '../../components/ui/Modal';
import {
  BottomSheet,
} from '../../components/ui/BottomSheet';
import {
  EmptyState,
} from '../../components/ui/EmptyState';
import {
  LoadingState,
} from '../../components/ui/LoadingState';

export const ComponentGallery: React.FC = () => {
  // Global Interactive Preview Toggles
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalDisabled, setGlobalDisabled] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Input States
  const [sampleText, setSampleText] = useState('ARENA_WORKSPACE_TOKEN_v1');
  const [emailText, setEmailText] = useState('dev@arenastudio.ai');
  const [passwordText, setPasswordText] = useState('super-secret-key-42');
  const [inputHasError, setInputHasError] = useState(false);

  // Modal & BottomSheet Visibility
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Active Category Section Filter
  const [activeSection, setActiveSection] = useState<
    'all' | 'buttons' | 'inputs' | 'badges' | 'cards' | 'overlays' | 'states'
  >('all');

  const handleButtonClick = (name: string) => {
    setClickCount((prev) => prev + 1);
  };

  const SECTIONS = [
    { id: 'all', label: 'All Components' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'badges', label: 'Badges' },
    { id: 'cards', label: 'Cards' },
    { id: 'overlays', label: 'Sheets & Modals' },
    { id: 'states', label: 'State Screens' },
  ] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Interactive Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.controlsBarHeader}>
          <View style={styles.controlsBarTitleRow}>
            <Ionicons name="options-outline" size={16} color="#388bfd" />
            <Text style={styles.controlsBarTitle}>Interactive State Controller</Text>
          </View>
          <Text style={styles.clickBadge}>Clicks: {clickCount}</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Loading State</Text>
            <Switch
              value={globalLoading}
              onValueChange={setGlobalLoading}
              trackColor={{ false: colors.bgTertiary, true: '#388bfd' }}
              thumbColor={globalLoading ? '#ffffff' : '#8b949e'}
            />
          </View>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Disabled State</Text>
            <Switch
              value={globalDisabled}
              onValueChange={setGlobalDisabled}
              trackColor={{ false: colors.bgTertiary, true: '#f85149' }}
              thumbColor={globalDisabled ? '#ffffff' : '#8b949e'}
            />
          </View>
        </View>
      </View>

      {/* Category Pills Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryPillsScroll}
        contentContainerStyle={styles.categoryPillsContent}
      >
        {SECTIONS.map((sec) => (
          <TouchableOpacity
            key={sec.id}
            style={[
              styles.categoryPill,
              activeSection === sec.id && styles.categoryPillActive,
            ]}
            onPress={() => setActiveSection(sec.id)}
          >
            <Text
              style={[
                styles.categoryPillText,
                activeSection === sec.id && styles.categoryPillTextActive,
              ]}
            >
              {sec.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 1. BUTTONS */}
      {(activeSection === 'all' || activeSection === 'buttons') && (
        <View style={styles.componentGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>BUTTONS (Button.tsx)</Text>
            <Text style={styles.groupSubtitle}>
              Variants (primary, secondary, outline, ghost, danger) & sizes (sm, md, lg).
            </Text>
          </View>

          {/* Variants Row */}
          <Text style={styles.sublabel}>VARIANTS</Text>
          <View style={styles.buttonShowcaseRow}>
            {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as ButtonVariant[]).map(
              (v) => (
                <Button
                  key={v}
                  variant={v}
                  title={v.charAt(0).toUpperCase() + v.slice(1)}
                  loading={globalLoading}
                  disabled={globalDisabled}
                  onPress={() => handleButtonClick(v)}
                  style={styles.showcaseButton}
                />
              )
            )}
          </View>

          {/* Sizes Row */}
          <Text style={[styles.sublabel, { marginTop: spacing.md }]}>SIZES & ICONS</Text>
          <View style={styles.buttonShowcaseRow}>
            <Button
              size="sm"
              variant="primary"
              title="Small"
              iconName="flash"
              loading={globalLoading}
              disabled={globalDisabled}
              onPress={() => handleButtonClick('sm')}
            />
            <Button
              size="md"
              variant="secondary"
              title="Medium"
              iconName="cube-outline"
              loading={globalLoading}
              disabled={globalDisabled}
              onPress={() => handleButtonClick('md')}
            />
            <Button
              size="lg"
              variant="outline"
              title="Large"
              iconName="rocket-outline"
              iconPosition="right"
              loading={globalLoading}
              disabled={globalDisabled}
              onPress={() => handleButtonClick('lg')}
            />
          </View>
        </View>
      )}

      {/* 2. TEXT INPUTS */}
      {(activeSection === 'all' || activeSection === 'inputs') && (
        <View style={styles.componentGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>INPUTS (Input.tsx)</Text>
            <Text style={styles.groupSubtitle}>
              Labels, clearable, secure, monospace code variant, and error handling.
            </Text>
          </View>

          {/* Standard Input */}
          <Input
            label="PROJECT IDENTIFIER"
            placeholder="arena-mobile-preview"
            leftIconName="folder-outline"
            value={sampleText}
            onChangeText={setSampleText}
            clearable
            onClear={() => setSampleText('')}
            disabled={globalDisabled}
            helperText="Alphanumeric lowercase string used for bundle ID."
            containerStyle={styles.inputSpacing}
          />

          {/* Code / Monospace Input */}
          <Input
            label="API SECRET / TOKEN (MONOSPACE CODE)"
            placeholder="ak_live_89f02c4b71..."
            variant="code"
            leftIconName="key-outline"
            value={sampleText}
            onChangeText={setSampleText}
            clearable
            disabled={globalDisabled}
            containerStyle={styles.inputSpacing}
          />

          {/* Secure Password Input */}
          <Input
            label="PASSWORD / PRIVATE KEY"
            placeholder="Enter secure passphrase"
            secure
            leftIconName="lock-closed-outline"
            value={passwordText}
            onChangeText={setPasswordText}
            disabled={globalDisabled}
            containerStyle={styles.inputSpacing}
          />

          {/* Error State Toggle Input */}
          <View style={styles.errorToggleRow}>
            <Text style={styles.sublabel}>TEST ERROR VALIDATION</Text>
            <TouchableOpacity
              style={styles.errorTriggerPill}
              onPress={() => setInputHasError(!inputHasError)}
            >
              <Text style={styles.errorTriggerPillText}>
                {inputHasError ? 'Clear Error' : 'Trigger Error'}
              </Text>
            </TouchableOpacity>
          </View>
          <Input
            label="DATABASE CONNECTION STRING"
            placeholder="postgresql://user:pass@host:5432/db"
            value={emailText}
            onChangeText={setEmailText}
            error={
              inputHasError
                ? 'Invalid connection string format: missing SSL certificate flag.'
                : undefined
            }
            leftIconName="server-outline"
            disabled={globalDisabled}
          />
        </View>
      )}

      {/* 3. BADGES & STATUS PILLS */}
      {(activeSection === 'all' || activeSection === 'badges') && (
        <View style={styles.componentGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>BADGES (Badge.tsx)</Text>
            <Text style={styles.groupSubtitle}>
              Status variants (default, success, warning, error, info, accent) and styles.
            </Text>
          </View>

          <Text style={styles.sublabel}>STATUS VARIANTS (SUBTLE WITH DOT)</Text>
          <View style={styles.badgeRow}>
            {(
              [
                'default',
                'success',
                'warning',
                'error',
                'info',
                'accent',
                'purple',
                'cyan',
              ] as BadgeStatus[]
            ).map((st) => (
              <Badge
                key={st}
                status={st}
                variant="subtle"
                dot
                label={st.toUpperCase()}
                style={styles.showcaseBadge}
              />
            ))}
          </View>

          <Text style={[styles.sublabel, { marginTop: spacing.md }]}>
            OUTLINE & FILLED STYLES WITH ICONS
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              status="success"
              variant="outline"
              iconName="checkmark-circle-outline"
              label="Build Passing"
              size="md"
            />
            <Badge
              status="accent"
              variant="filled"
              iconName="git-branch-outline"
              label="main @ 7f8a12"
              size="md"
            />
            <Badge
              status="warning"
              variant="outline"
              iconName="warning-outline"
              label="3 Deprecations"
              size="md"
            />
            <Badge
              status="purple"
              variant="subtle"
              iconName="sparkles-outline"
              label="AI Agent Active"
              size="md"
            />
          </View>
        </View>
      )}

      {/* 4. CARDS */}
      {(activeSection === 'all' || activeSection === 'cards') && (
        <View style={styles.componentGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>CARDS (Card.tsx)</Text>
            <Text style={styles.groupSubtitle}>
              Header actions, elevation variants, and Xcode dark border styling.
            </Text>
          </View>

          {/* Bordered Card */}
          <Card
            title="Arena Mobile Workspace"
            subtitle="React Native 0.76 • Expo SDK 52"
            iconName="hardware-chip-outline"
            headerAction={
              <Badge status="success" dot label="READY" size="sm" variant="subtle" />
            }
            footer={
              <View style={styles.cardFooterActions}>
                <Button
                  size="sm"
                  variant="outline"
                  title="Configure"
                  iconName="cog-outline"
                  onPress={() => Alert.alert('Configure', 'Opened project configuration.')}
                />
                <Button
                  size="sm"
                  variant="primary"
                  title="Launch Preview"
                  iconName="play"
                  onPress={() => Alert.alert('Launch', 'Started Live Preview simulator.')}
                />
              </View>
            }
            variant="bordered"
            style={styles.cardSpacing}
          >
            <Text style={styles.cardBodyText}>
              Autonomous multi-agent orchestration environment running 8 specialist agents.
              State stored in persistent local SQLite & AsyncStorage.
            </Text>
          </Card>

          {/* Elevated Interactive Card */}
          <Card
            title="EAS Cloud Build Pipeline"
            subtitle="Target: iOS Simulator / Internal TestFlight"
            iconName="cloud-upload-outline"
            headerAction={
              <Badge status="info" label="QUEUED" size="sm" variant="filled" />
            }
            variant="elevated"
            elevation="md"
            onPress={() => Alert.alert('EAS Build', 'Viewing active build queue #1048.')}
          >
            <Text style={styles.cardBodyText}>
              Tap to inspect live compilation logs and dependency graphs in the cloud runner.
            </Text>
          </Card>
        </View>
      )}

      {/* 5. SHEETS & MODALS */}
      {(activeSection === 'all' || activeSection === 'overlays') && (
        <View style={styles.componentGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>SHEETS & MODALS (Modal.tsx & BottomSheet.tsx)</Text>
            <Text style={styles.groupSubtitle}>
              Slide-up bottom sheets with gesture handle, and dialog modals.
            </Text>
          </View>

          <View style={styles.buttonShowcaseRow}>
            <Button
              variant="primary"
              title="Open Dialog Modal"
              iconName="albums-outline"
              onPress={() => setModalVisible(true)}
              style={styles.showcaseButton}
            />
            <Button
              variant="secondary"
              title="Open Bottom Sheet"
              iconName="arrow-up-circle-outline"
              onPress={() => setSheetVisible(true)}
              style={styles.showcaseButton}
            />
          </View>
          <View style={[styles.buttonShowcaseRow, { marginTop: spacing.sm }]}>
            <Button
              variant="danger"
              title="Open Danger Confirm Modal"
              iconName="alert-circle-outline"
              onPress={() => setConfirmModalVisible(true)}
              style={styles.showcaseButton}
            />
          </View>
        </View>
      )}

      {/* 6. EMPTY & LOADING STATES */}
      {(activeSection === 'all' || activeSection === 'states') && (
        <View style={styles.componentGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>EMPTY & LOADING STATES</Text>
            <Text style={styles.groupSubtitle}>
              Pre-built developer loading indicators and empty workspace screens.
            </Text>
          </View>

          {/* EmptyState Preview Container */}
          <View style={styles.stateContainer}>
            <EmptyState
              iconName="cube-outline"
              title="No Active Agents Running"
              description="Deploy a specialist agent from the AI Agent Centre or trigger an automated pipeline workflow."
              actionLabel="Deploy Architect Agent"
              actionIcon="add"
              onAction={() => Alert.alert('Deploy Agent', 'Routing to Agent Centre...')}
            />
          </View>

          {/* LoadingState Preview Container */}
          <View style={[styles.stateContainer, { marginTop: spacing.md }]}>
            <LoadingState
              message="Compiling Native Bundle..."
              subtitle="Transforming 42 modules via Metro bundler"
              progress={68}
              steps={['Parse AST', 'Tree Shaking', 'Bundle Assets', 'Emit JS Bytecode']}
              currentStepIndex={2}
            />
          </View>
        </View>
      )}

      {/* LIVE MODAL PREVIEW */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Inspector Dialog"
        subtitle="UI Primitive Test Modal"
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            onPress: () => setModalVisible(false),
          },
          {
            label: 'Save Changes',
            variant: 'primary',
            onPress: () => {
              setModalVisible(false);
              Alert.alert('Saved', 'Changes successfully applied.');
            },
          },
        ]}
      >
        <Text style={styles.modalBodyText}>
          This dialog modal demonstrates dark elevation shadows, backdrop blurring, and safe
          dialog keyboard avoidance.
        </Text>
      </Modal>

      {/* DANGER CONFIRM MODAL */}
      <Modal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        title="Delete Project Configuration?"
        subtitle="This action cannot be undone"
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            onPress: () => setConfirmModalVisible(false),
          },
          {
            label: 'Confirm Delete',
            variant: 'danger',
            onPress: () => {
              setConfirmModalVisible(false);
              Alert.alert('Deleted', 'Project configuration reset.');
            },
          },
        ]}
      >
        <Text style={styles.modalBodyText}>
          Are you sure you want to delete all cached design tokens and build artifacts?
        </Text>
      </Modal>

      {/* LIVE BOTTOM SHEET PREVIEW */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Design System Inspector"
        subtitle="Quick Inspector Action Sheet"
        footer={
          <Button
            fullWidth
            variant="primary"
            title="Done"
            onPress={() => setSheetVisible(false)}
          />
        }
      >
        <View style={styles.sheetInnerContent}>
          <Text style={styles.sheetParagraph}>
            The BottomSheet primitive supports gesture pan drag-to-dismiss, safe-area insets,
            and custom action footers.
          </Text>
          <View style={styles.sheetPillsRow}>
            <Badge status="success" label="Gesture Enabled" size="sm" />
            <Badge status="info" label="Safe Insets" size="sm" />
            <Badge status="accent" label="Theme Synced" size="sm" />
          </View>
        </View>
      </BottomSheet>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  controlsBar: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  controlsBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  controlsBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlsBarTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  clickBadge: {
    color: '#39c5cf',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: '600',
    backgroundColor: 'rgba(57, 197, 207, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  categoryPillsScroll: {
    marginBottom: spacing.lg,
  },
  categoryPillsContent: {
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  categoryPillText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  categoryPillTextActive: {
    color: '#ffffff',
    fontWeight: fontWeights.semibold,
  },
  componentGroup: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  groupHeader: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  groupSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  sublabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  buttonShowcaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  showcaseButton: {
    marginBottom: 4,
  },
  inputSpacing: {
    marginBottom: spacing.md,
  },
  errorToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  errorTriggerPill: {
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  errorTriggerPillText: {
    color: '#f85149',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  showcaseBadge: {
    marginBottom: 4,
  },
  cardSpacing: {
    marginBottom: spacing.md,
  },
  cardBodyText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  cardFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  stateContainer: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBodyText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 22,
  },
  sheetInnerContent: {
    paddingVertical: spacing.sm,
  },
  sheetParagraph: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  sheetPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
});
