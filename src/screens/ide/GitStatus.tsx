import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontFamilies, fontSizes, fontWeights, spacing, radius } from '../../theme';

export type GitFileStatus = 'M' | 'A' | 'D' | 'U' | 'R';

export interface GitDiffLine {
  type: 'add' | 'del' | 'normal' | 'header';
  content: string;
}

export interface GitFile {
  id: string;
  path: string;
  name: string;
  status: GitFileStatus;
  staged: boolean;
  additions: number;
  deletions: number;
  diffLines?: GitDiffLine[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  filesCount: number;
}

export interface GitStatusProps {
  projectId?: string;
  currentBranch?: string;
  onBranchChange?: (branch: string) => void;
  onCommit?: (commit: { hash: string; message: string; branch: string; files: GitFile[] }) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

// Initial realistic git files
const INITIAL_FILES: GitFile[] = [
  {
    id: 'f1',
    name: 'DevTools.tsx',
    path: 'src/screens/ide/DevTools.tsx',
    status: 'M',
    staged: false,
    additions: 124,
    deletions: 12,
    diffLines: [
      { type: 'header', content: '@@ -14,6 +14,14 @@ import { theme } from "../../theme";' },
      { type: 'del', content: '- export const OldPanel = () => null;' },
      { type: 'add', content: '+ export const DevTools: React.FC<DevToolsProps> = ({' },
      { type: 'add', content: '+   isOpen,' },
      { type: 'add', content: '+   onToggle,' },
      { type: 'normal', content: '   }) => {' },
      { type: 'add', content: '+   const [activeTab, setActiveTab] = useState<DevToolsTab>("terminal");' },
      { type: 'normal', content: '     return (' },
    ],
  },
  {
    id: 'f2',
    name: 'Terminal.tsx',
    path: 'src/screens/ide/Terminal.tsx',
    status: 'A',
    staged: true,
    additions: 215,
    deletions: 0,
    diffLines: [
      { type: 'header', content: '@@ -0,0 +1,21 @@' },
      { type: 'add', content: '+ import React, { useState } from "react";' },
      { type: 'add', content: '+ import { View, Text, TextInput } from "react-native";' },
      { type: 'add', content: '+ export const Terminal = () => {' },
      { type: 'add', content: '+   // Authentic developer mobile CLI' },
      { type: 'add', content: '+ };' },
    ],
  },
  {
    id: 'f3',
    name: 'GitStatus.tsx',
    path: 'src/screens/ide/GitStatus.tsx',
    status: 'A',
    staged: true,
    additions: 198,
    deletions: 0,
    diffLines: [
      { type: 'header', content: '@@ -0,0 +1,18 @@' },
      { type: 'add', content: '+ import { GitStatus } from "./GitStatus";' },
      { type: 'add', content: '+ export default GitStatus;' },
    ],
  },
  {
    id: 'f4',
    name: 'package.json',
    path: 'package.json',
    status: 'M',
    staged: false,
    additions: 3,
    deletions: 1,
    diffLines: [
      { type: 'header', content: '@@ -12,2 +12,4 @@' },
      { type: 'del', content: '- "version": "0.9.0",' },
      { type: 'add', content: '+ "version": "1.0.0",' },
      { type: 'add', content: '+ "expo-haptics": "~14.0.1",' },
    ],
  },
  {
    id: 'f5',
    name: 'types.ts',
    path: 'src/models/types.ts',
    status: 'M',
    staged: false,
    additions: 45,
    deletions: 4,
    diffLines: [
      { type: 'header', content: '@@ -50,3 +50,7 @@' },
      { type: 'normal', content: ' export interface Project {' },
      { type: 'add', content: '+   gitBranch: string;' },
      { type: 'add', content: '+   buildStatus: BuildStatus;' },
    ],
  },
];

const INITIAL_HISTORY: GitCommit[] = [
  {
    hash: 'a38f92c',
    message: 'feat: add theme system & core model contracts',
    author: 'arena-developer',
    date: '10m ago',
    filesCount: 6,
  },
  {
    hash: '8b1d40e',
    message: 'chore: configure Expo 52 SDK & TypeScript workspace',
    author: 'arena-developer',
    date: '35m ago',
    filesCount: 4,
  },
  {
    hash: '3f09ac2',
    message: 'initial commit: arena studio repository initialized',
    author: 'system',
    date: '1h ago',
    filesCount: 12,
  },
];

const INITIAL_BRANCHES = [
  'main',
  'feature/agent-orchestrator',
  'feature/mobile-ide',
  'feature/skills-library',
  'fix/preview-tunnel',
];

const CONVENTIONAL_PREFIXES = ['feat:', 'fix:', 'refactor:', 'docs:', 'chore:', 'test:'];

export const GitStatus: React.FC<GitStatusProps> = ({
  projectId: _projectId,
  currentBranch: propBranch = 'main',
  onBranchChange,
  onCommit,
  containerStyle,
}) => {
  const [currentBranch, setCurrentBranch] = useState<string>(propBranch);
  const [branches, setBranches] = useState<string[]>(INITIAL_BRANCHES);
  const [files, setFiles] = useState<GitFile[]>(INITIAL_FILES);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [commitHistory, setCommitHistory] = useState<GitCommit[]>(INITIAL_HISTORY);
  const [aheadCount, setAheadCount] = useState<number>(1);
  const [behindCount, setBehindCount] = useState<number>(0);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [newBranchInput, setNewBranchInput] = useState<string>('');
  const [selectedDiffFile, setSelectedDiffFile] = useState<GitFile | null>(null);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const stagedFiles = files.filter((f) => f.staged);
  const unstagedFiles = files.filter((f) => !f.staged);

  const showBanner = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage(null);
    }, 3500);
  };

  // Toggle stage for single file
  const handleToggleStage = (fileId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, staged: !f.staged } : f))
    );
  };

  // Stage all
  const handleStageAll = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    setFiles((prev) => prev.map((f) => ({ ...f, staged: true })));
    showBanner(`Staged ${unstagedFiles.length} file(s)`, 'success');
  };

  // Unstage all
  const handleUnstageAll = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setFiles((prev) => prev.map((f) => ({ ...f, staged: false })));
    showBanner(`Unstaged ${stagedFiles.length} file(s)`, 'info');
  };

  // Discard changes
  const handleDiscard = (file: GitFile) => {
    Alert.alert(
      'Discard Changes?',
      `Are you sure you want to discard all changes in ${file.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            } catch {}
            setFiles((prev) => prev.filter((f) => f.id !== file.id));
            showBanner(`Discarded changes in ${file.name}`, 'info');
          },
        },
      ]
    );
  };

  // Commit staged changes
  const handleCommit = () => {
    const trimmed = commitMessage.trim();
    if (!trimmed) {
      showBanner('Please enter a commit message', 'error');
      return;
    }
    if (stagedFiles.length === 0) {
      showBanner('No staged changes to commit', 'error');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}

    const randomHash = Math.random().toString(36).substring(2, 9);
    const newCommit: GitCommit = {
      hash: randomHash,
      message: trimmed,
      author: 'arena-developer',
      date: 'Just now',
      filesCount: stagedFiles.length,
    };

    setCommitHistory((prev) => [newCommit, ...prev]);
    setFiles((prev) => prev.filter((f) => !f.staged));
    setAheadCount((prev) => prev + 1);
    setCommitMessage('');

    showBanner(`[${currentBranch} ${randomHash}] ${trimmed}`, 'success');

    if (onCommit) {
      onCommit({
        hash: randomHash,
        message: trimmed,
        branch: currentBranch,
        files: stagedFiles,
      });
    }
  };

  // Push to remote
  const handlePush = () => {
    setIsPushing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setTimeout(() => {
      setIsPushing(false);
      setAheadCount(0);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}
      showBanner(`Pushed commits to origin/${currentBranch}`, 'success');
    }, 1200);
  };

  // Pull from remote
  const handlePull = () => {
    setIsPulling(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setTimeout(() => {
      setIsPulling(false);
      setBehindCount(0);
      showBanner(`Branch origin/${currentBranch} is up to date`, 'info');
    }, 1000);
  };

  // Switch branch
  const handleSelectBranch = (branch: string) => {
    setCurrentBranch(branch);
    setIsBranchModalOpen(false);
    onBranchChange?.(branch);
    showBanner(`Switched to branch '${branch}'`, 'info');
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
  };

  // Create new branch
  const handleCreateBranch = () => {
    const trimmed = newBranchInput.trim().replace(/\s+/g, '-').toLowerCase();
    if (!trimmed) return;
    if (branches.includes(trimmed)) {
      showBanner(`Branch '${trimmed}' already exists`, 'error');
      return;
    }
    const updated = [...branches, trimmed];
    setBranches(updated);
    setCurrentBranch(trimmed);
    setNewBranchInput('');
    setIsBranchModalOpen(false);
    onBranchChange?.(trimmed);
    showBanner(`Created and checked out '${trimmed}'`, 'success');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
  };

  // Helper for status badge color
  const getStatusColor = (status: GitFileStatus) => {
    switch (status) {
      case 'M':
        return colors.git.modified;
      case 'A':
        return colors.git.added;
      case 'D':
        return colors.git.deleted;
      case 'U':
        return colors.git.untracked;
      case 'R':
        return colors.git.renamed;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: GitFileStatus) => {
    switch (status) {
      case 'M':
        return 'Modified';
      case 'A':
        return 'Added';
      case 'D':
        return 'Deleted';
      case 'U':
        return 'Untracked';
      case 'R':
        return 'Renamed';
      default:
        return 'Changed';
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Top Status & Branch Bar */}
      <View style={styles.topBar}>
        {/* Branch Switcher Button */}
        <TouchableOpacity
          style={styles.branchPill}
          onPress={() => setIsBranchModalOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="git-branch" size={15} color={colors.accentPrimary} />
          <Text style={styles.branchName} numberOfLines={1}>
            {currentBranch}
          </Text>
          <Ionicons name="chevron-down" size={13} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Sync / Remote Indicators */}
        <View style={styles.syncRow}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handlePull}
            disabled={isPulling}
            activeOpacity={0.7}
          >
            {isPulling ? (
              <ActivityIndicator size="small" color={colors.accentPrimary} />
            ) : (
              <>
                <Ionicons name="arrow-down" size={13} color={colors.textSecondary} />
                <Text style={styles.syncCount}>{behindCount}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncButton, aheadCount > 0 && styles.syncButtonActive]}
            onPress={handlePush}
            disabled={isPushing}
            activeOpacity={0.7}
          >
            {isPushing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons
                  name="arrow-up"
                  size={13}
                  color={aheadCount > 0 ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.syncCount,
                    aheadCount > 0 && { color: colors.white, fontWeight: fontWeights.bold },
                  ]}
                >
                  {aheadCount}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyIconButton}
            onPress={() => setShowHistoryModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Optional Notification Banner */}
      {bannerMessage && (
        <View
          style={[
            styles.banner,
            bannerMessage.type === 'success' && styles.bannerSuccess,
            bannerMessage.type === 'error' && styles.bannerError,
          ]}
        >
          <Ionicons
            name={
              bannerMessage.type === 'success'
                ? 'checkmark-circle'
                : bannerMessage.type === 'error'
                ? 'alert-circle'
                : 'information-circle'
            }
            size={14}
            color={
              bannerMessage.type === 'success'
                ? colors.success
                : bannerMessage.type === 'error'
                ? colors.error
                : colors.info
            }
          />
          <Text style={styles.bannerText} numberOfLines={2}>
            {bannerMessage.text}
          </Text>
        </View>
      )}

      {/* Main File Lists & Commit Area */}
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* STAGED SECTION */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>STAGED CHANGES</Text>
            <View style={[styles.badge, styles.stagedBadge]}>
              <Text style={styles.badgeText}>{stagedFiles.length}</Text>
            </View>
          </View>
          {stagedFiles.length > 0 && (
            <TouchableOpacity onPress={handleUnstageAll} activeOpacity={0.7}>
              <Text style={styles.sectionActionText}>Unstage All</Text>
            </TouchableOpacity>
          )}
        </View>

        {stagedFiles.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No staged changes</Text>
          </View>
        ) : (
          stagedFiles.map((file) => (
            <View key={file.id} style={styles.fileRow}>
              <TouchableOpacity
                style={styles.fileMain}
                onPress={() => setSelectedDiffFile(file)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: getStatusColor(file.status) + '22', borderColor: getStatusColor(file.status) },
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: getStatusColor(file.status) }]}>
                    {file.status}
                  </Text>
                </View>
                <View style={styles.filePathContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.filePath} numberOfLines={1}>
                    {file.path}
                  </Text>
                </View>
                <View style={styles.diffStats}>
                  <Text style={styles.statAdd}>+{file.additions}</Text>
                  <Text style={styles.statDel}>-{file.deletions}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleStage(file.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove-circle-outline" size={18} color={colors.warning} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* UNSTAGED SECTION */}
        <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>CHANGES</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unstagedFiles.length}</Text>
            </View>
          </View>
          {unstagedFiles.length > 0 && (
            <TouchableOpacity onPress={handleStageAll} activeOpacity={0.7}>
              <Text style={styles.sectionActionText}>Stage All</Text>
            </TouchableOpacity>
          )}
        </View>

        {unstagedFiles.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Working tree clean</Text>
          </View>
        ) : (
          unstagedFiles.map((file) => (
            <View key={file.id} style={styles.fileRow}>
              <TouchableOpacity
                style={styles.fileMain}
                onPress={() => setSelectedDiffFile(file)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: getStatusColor(file.status) + '22', borderColor: getStatusColor(file.status) },
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: getStatusColor(file.status) }]}>
                    {file.status}
                  </Text>
                </View>
                <View style={styles.filePathContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.filePath} numberOfLines={1}>
                    {file.path}
                  </Text>
                </View>
                <View style={styles.diffStats}>
                  <Text style={styles.statAdd}>+{file.additions}</Text>
                  <Text style={styles.statDel}>-{file.deletions}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDiscard(file)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleStage(file.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.accentPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: spacing.lg }} />
      </ScrollView>

      {/* COMMIT COMPOSER BAR */}
      <View style={styles.commitBox}>
        {/* Quick Conventional Prefixes */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.prefixRow}
          contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: 2 }}
        >
          {CONVENTIONAL_PREFIXES.map((prefix) => (
            <TouchableOpacity
              key={prefix}
              style={styles.prefixPill}
              onPress={() => {
                if (!commitMessage.startsWith(prefix)) {
                  setCommitMessage(prefix + ' ' + commitMessage.replace(/^[a-z]+:\s*/, ''));
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.prefixPillText}>{prefix}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input & Commit Button */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.commitInput}
            placeholder={`Commit message to '${currentBranch}'...`}
            placeholderTextColor={colors.textMuted}
            value={commitMessage}
            onChangeText={setCommitMessage}
            multiline
            maxLength={160}
          />
          <TouchableOpacity
            style={[
              styles.commitBtn,
              (stagedFiles.length === 0 || !commitMessage.trim()) && styles.commitBtnDisabled,
            ]}
            onPress={handleCommit}
            disabled={stagedFiles.length === 0 || !commitMessage.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="git-commit" size={16} color={colors.white} />
            <Text style={styles.commitBtnText}>Commit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BRANCH SWITCHER MODAL */}
      <Modal
        visible={isBranchModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBranchModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsBranchModalOpen(false)}
        >
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Ionicons name="git-branch" size={18} color={colors.accentPrimary} />
                <Text style={styles.modalTitle}>Switch Branch</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBranchModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Create new branch input */}
            <View style={styles.newBranchBox}>
              <TextInput
                style={styles.newBranchInput}
                placeholder="New branch name..."
                placeholderTextColor={colors.textMuted}
                value={newBranchInput}
                onChangeText={setNewBranchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.createBranchBtn, !newBranchInput.trim() && { opacity: 0.5 }]}
                onPress={handleCreateBranch}
                disabled={!newBranchInput.trim()}
              >
                <Text style={styles.createBranchBtnText}>Create</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.branchListTitle}>LOCAL BRANCHES</Text>
            <FlatList
              data={branches}
              keyExtractor={(item) => item}
              style={{ maxHeight: 220 }}
              renderItem={({ item }) => {
                const isActive = item === currentBranch;
                return (
                  <TouchableOpacity
                    style={[styles.branchItem, isActive && styles.branchItemActive]}
                    onPress={() => handleSelectBranch(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isActive ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={isActive ? colors.accentPrimary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.branchItemText,
                        isActive && { color: colors.accentPrimary, fontWeight: fontWeights.semibold },
                      ]}
                    >
                      {item}
                    </Text>
                    {isActive && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>HEAD</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* COMMIT HISTORY MODAL */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Ionicons name="time" size={18} color={colors.accentPurple} />
                <Text style={styles.modalTitle}>Git Commit History</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commitHistory}
              keyExtractor={(item) => item.hash}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.hashPill}>
                      <Text style={styles.hashText}>{item.hash}</Text>
                    </View>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.historyMessage}>{item.message}</Text>
                  <View style={styles.historyCardFooter}>
                    <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.historyAuthor}>{item.author}</Text>
                    <Text style={styles.historyMeta}>• {item.filesCount} files changed</Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* DIFF PREVIEW MODAL */}
      <Modal
        visible={!!selectedDiffFile}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDiffFile(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.diffModalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedDiffFile?.name}
                </Text>
                <Text style={styles.diffSubtitle} numberOfLines={1}>
                  {selectedDiffFile?.path} ({getStatusLabel(selectedDiffFile?.status || 'M')})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDiffFile(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.diffScrollView} horizontal={false}>
              {selectedDiffFile?.diffLines && selectedDiffFile.diffLines.length > 0 ? (
                selectedDiffFile.diffLines.map((line, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.diffLineRow,
                      line.type === 'add' && styles.diffLineAdd,
                      line.type === 'del' && styles.diffLineDel,
                      line.type === 'header' && styles.diffLineHeader,
                    ]}
                  >
                    <Text
                      style={[
                        styles.diffLineText,
                        line.type === 'add' && styles.diffTextAdd,
                        line.type === 'del' && styles.diffTextDel,
                        line.type === 'header' && styles.diffTextHeader,
                      ]}
                    >
                      {line.content}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>No diff preview available</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.diffFooter}>
              <TouchableOpacity
                style={styles.diffToggleBtn}
                onPress={() => {
                  if (selectedDiffFile) {
                    handleToggleStage(selectedDiffFile.id);
                    setSelectedDiffFile(null);
                  }
                }}
              >
                <Text style={styles.diffToggleBtnText}>
                  {selectedDiffFile?.staged ? 'Unstage File' : 'Stage File'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxWidth: '55%',
  },
  branchName: {
    fontSize: fontSizes.xs + 1,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncButtonActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.borderFocus,
  },
  syncCount: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  historyIconButton: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.statusBgInfo,
    borderBottomWidth: 1,
    borderBottomColor: colors.statusBorderInfo,
  },
  bannerSuccess: {
    backgroundColor: colors.statusBgSuccess,
    borderBottomColor: colors.statusBorderSuccess,
  },
  bannerError: {
    backgroundColor: colors.statusBgError,
    borderBottomColor: colors.statusBorderError,
  },
  bannerText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textPrimary,
    flex: 1,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stagedBadge: {
    backgroundColor: colors.accentPrimaryAlpha,
    borderColor: colors.accentPrimary,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  sectionActionText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.accentPrimary,
    fontWeight: fontWeights.medium,
  },
  emptySection: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  emptySectionText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  fileMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
  },
  filePathContainer: {
    flex: 1,
    marginRight: spacing.xs,
  },
  fileName: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  filePath: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.textMuted,
  },
  diffStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.xs,
  },
  statAdd: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.git.added,
  },
  statDel: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.git.deleted,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    padding: 3,
  },
  commitBox: {
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  prefixRow: {
    marginBottom: spacing.xs,
  },
  prefixPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefixPillText: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commitInput: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    minHeight: 36,
  },
  commitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  commitBtnDisabled: {
    opacity: 0.45,
  },
  commitBtnText: {
    color: colors.white,
    fontSize: fontSizes.xs + 1,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bgModal,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  newBranchBox: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  newBranchInput: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: fontSizes.xs + 1,
    fontFamily: fontFamilies.mono,
  },
  createBranchBtn: {
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    justifyContent: 'center',
  },
  createBranchBtnText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  branchListTitle: {
    fontSize: 10,
    fontFamily: fontFamilies.sans,
    color: colors.textMuted,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  branchItemActive: {
    backgroundColor: colors.accentPrimaryAlpha,
  },
  branchItemText: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
  },
  currentBadge: {
    backgroundColor: colors.accentPrimaryAlpha,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
  },
  currentBadgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    color: colors.accentPrimary,
    fontWeight: fontWeights.bold,
  },
  historyModalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.bgModal,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  historyCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hashPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  hashText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.accentCyan,
    fontWeight: fontWeights.bold,
  },
  historyDate: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: fontFamilies.mono,
  },
  historyMessage: {
    fontSize: fontSizes.xs + 1,
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.medium,
    marginBottom: 4,
  },
  historyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyAuthor: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fontFamilies.mono,
  },
  historyMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  diffModalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.bgModal,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  diffSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fontFamilies.mono,
  },
  diffScrollView: {
    maxHeight: 340,
    backgroundColor: colors.bgCode,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    marginVertical: spacing.sm,
  },
  diffLineRow: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  diffLineAdd: {
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
  },
  diffLineDel: {
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
  },
  diffLineHeader: {
    backgroundColor: 'rgba(56, 139, 253, 0.12)',
  },
  diffLineText: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.textCode,
    lineHeight: 16,
  },
  diffTextAdd: {
    color: colors.git.added,
  },
  diffTextDel: {
    color: colors.git.deleted,
  },
  diffTextHeader: {
    color: colors.accentCyan,
    fontWeight: fontWeights.bold,
  },
  diffFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  diffToggleBtn: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  diffToggleBtnText: {
    color: colors.white,
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.semibold,
  },
});

export default GitStatus;
