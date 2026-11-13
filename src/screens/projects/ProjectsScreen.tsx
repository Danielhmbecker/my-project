import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import {
  Button,
  Input,
  Badge,
  Card,
  Modal,
  EmptyState,
  LoadingState,
  BadgeStatus,
} from '../../components/ui';
import { Project, ProjectFramework, ProjectFile } from '../../models';
import {
  getProjects,
  deleteProject,
  duplicateProject,
  initializeStorage,
} from '../../storage';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectDetailScreen } from './ProjectDetailScreen';

export interface ProjectsScreenProps {
  onSelectProject?: (project: Project) => void;
  onOpenIDE?: (project: Project, file?: ProjectFile) => void;
  onViewDetails?: (project: Project) => void;
  onLaunchPreview?: (project: Project) => void;
}

type FilterCategory = 'all' | 'expo' | 'ios' | 'web' | 'react' | 'nextjs' | 'game';
type SectionTab = 'all' | 'user' | 'demo';

interface FilterOption {
  id: FilterCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORY_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'expo', label: 'Expo/React Native', icon: 'phone-portrait-outline' },
  { id: 'ios', label: 'iOS', icon: 'logo-apple' },
  { id: 'web', label: 'Web', icon: 'globe-outline' },
  { id: 'react', label: 'React', icon: 'code-slash-outline' },
  { id: 'nextjs', label: 'Next.js', icon: 'server-outline' },
  { id: 'game', label: 'Game dev', icon: 'game-controller-outline' },
];

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  onSelectProject,
  onOpenIDE,
  onViewDetails,
  onLaunchPreview,
}) => {
  const insets = useSafeAreaInsets();

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedSection, setSelectedSection] = useState<SectionTab>('all');

  // Modal State
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<'create' | 'import'>('create');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Fallback in-screen detail view if no external onViewDetails handler passed
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  // Load Projects from Storage
  const loadProjects = useCallback(async () => {
    try {
      await initializeStorage();
      const allProjects = await getProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('[ProjectsScreen] Failed to load projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadProjects();
  }, [loadProjects]);

  // Actions
  const handleOpenIDE = (project: Project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onOpenIDE) {
      onOpenIDE(project);
    } else if (onSelectProject) {
      onSelectProject(project);
    }
  };

  const handleViewDetails = (project: Project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onViewDetails) {
      onViewDetails(project);
    } else {
      setDetailProject(project);
    }
  };

  const handleDuplicate = async (project: Project) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDuplicatingId(project.id);
      const duplicated = await duplicateProject(project.id);
      if (duplicated) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadProjects();
      }
    } catch (error: any) {
      console.error('[ProjectsScreen] Duplicate failed:', error);
      Alert.alert('Duplicate Failed', error?.message || 'Could not duplicate project.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteProject(projectToDelete.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProjectToDelete(null);
      await loadProjects();
    } catch (error: any) {
      console.error('[ProjectsScreen] Delete failed:', error);
      Alert.alert('Delete Failed', error?.message || 'Could not delete project.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    loadProjects();
  };

  // Helper for framework badge styling
  const getFrameworkBadge = (framework: ProjectFramework) => {
    switch (framework) {
      case 'expo':
        return { label: 'Expo', status: 'accent' as BadgeStatus, icon: 'phone-portrait-outline' as const };
      case 'ios':
        return { label: 'iOS Native', status: 'cyan' as BadgeStatus, icon: 'logo-apple' as const };
      case 'nextjs':
        return { label: 'Next.js', status: 'purple' as BadgeStatus, icon: 'server-outline' as const };
      case 'react':
        return { label: 'React', status: 'info' as BadgeStatus, icon: 'code-slash-outline' as const };
      case 'web':
        return { label: 'Web', status: 'success' as BadgeStatus, icon: 'globe-outline' as const };
      case 'game':
        return { label: 'Game / 3D', status: 'warning' as BadgeStatus, icon: 'game-controller-outline' as const };
      default:
        return { label: framework, status: 'default' as BadgeStatus, icon: 'folder-outline' as const };
    }
  };

  // Helper for build status
  const getBuildStatusBadge = (status: Project['buildStatus']) => {
    switch (status) {
      case 'success':
        return { label: 'Build Passing', status: 'success' as BadgeStatus };
      case 'building':
        return { label: 'Compiling...', status: 'warning' as BadgeStatus };
      case 'failed':
        return { label: 'Build Failed', status: 'error' as BadgeStatus };
      case 'idle':
      default:
        return { label: 'Ready', status: 'default' as BadgeStatus };
    }
  };

  // Format relative timestamp
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Category filter
      if (selectedCategory !== 'all' && project.framework !== selectedCategory) {
        return false;
      }

      // Section filter
      if (selectedSection === 'user' && project.isDemo) return false;
      if (selectedSection === 'demo' && !project.isDemo) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = project.name.toLowerCase().includes(query);
        const descMatch = (project.description || '').toLowerCase().includes(query);
        const catMatch = (project.category || '').toLowerCase().includes(query);
        const branchMatch = (project.gitBranch || '').toLowerCase().includes(query);
        const fwMatch = project.framework.toLowerCase().includes(query);
        return nameMatch || descMatch || catMatch || branchMatch || fwMatch;
      }

      return true;
    });
  }, [projects, selectedCategory, selectedSection, searchQuery]);

  // Split into user and demo groups
  const userProjects = useMemo(
    () => filteredProjects.filter((p) => !p.isDemo),
    [filteredProjects]
  );
  const demoProjects = useMemo(
    () => filteredProjects.filter((p) => p.isDemo),
    [filteredProjects]
  );

  const totalUserCount = useMemo(() => projects.filter((p) => !p.isDemo).length, [projects]);
  const totalDemoCount = useMemo(() => projects.filter((p) => p.isDemo).length, [projects]);

  // If viewing details inline
  if (detailProject) {
    return (
      <ProjectDetailScreen
        project={detailProject}
        onBack={() => {
          Haptics.selectionAsync();
          setDetailProject(null);
          loadProjects();
        }}
        onOpenIDE={(p, file) => {
          setDetailProject(null);
          if (onOpenIDE) onOpenIDE(p, file);
        }}
        onLaunchPreview={onLaunchPreview}
        onProjectUpdated={(updated) => {
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setDetailProject(updated);
        }}
        onProjectDeleted={(deletedId) => {
          setProjects((prev) => prev.filter((p) => p.id !== deletedId));
          setDetailProject(null);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <Text style={styles.headerTitle}>Projects</Text>
          <Text style={styles.headerSubtitle}>
            {projects.length} Total • {totalUserCount} Workspace • {totalDemoCount} Blueprints
          </Text>
        </View>

        <View style={styles.topHeaderActions}>
          <Button
            title="Import"
            variant="outline"
            size="sm"
            iconName="cloud-download-outline"
            onPress={() => {
              Haptics.selectionAsync();
              setCreateModalMode('import');
              setIsCreateModalVisible(true);
            }}
            style={styles.headerActionBtn}
          />
          <Button
            title="New"
            variant="primary"
            size="sm"
            iconName="add"
            onPress={() => {
              Haptics.selectionAsync();
              setCreateModalMode('create');
              setIsCreateModalVisible(true);
            }}
            style={styles.headerActionBtn}
          />
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <Input
          placeholder="Search projects, categories, branches, frameworks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearable
          onClear={() => setSearchQuery('')}
          leftIconName="search-outline"
          containerStyle={styles.searchInputContainer}
          inputStyle={styles.searchInputText}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(cat.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? colors.textPrimary : colors.textSecondary}
                  style={styles.categoryPillIcon}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scope Switcher: All | Workspace Projects | Blueprints */}
      <View style={styles.scopeSwitcher}>
        <TouchableOpacity
          style={[styles.scopeBtn, selectedSection === 'all' && styles.scopeBtnActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedSection('all');
          }}
        >
          <Text
            style={[
              styles.scopeBtnText,
              selectedSection === 'all' && styles.scopeBtnTextActive,
            ]}
          >
            All ({projects.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scopeBtn, selectedSection === 'user' && styles.scopeBtnActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedSection('user');
          }}
        >
          <Text
            style={[
              styles.scopeBtnText,
              selectedSection === 'user' && styles.scopeBtnTextActive,
            ]}
          >
            Workspace ({totalUserCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scopeBtn, selectedSection === 'demo' && styles.scopeBtnActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedSection('demo');
          }}
        >
          <Text
            style={[
              styles.scopeBtnText,
              selectedSection === 'demo' && styles.scopeBtnTextActive,
            ]}
          >
            Blueprints ({totalDemoCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Project Content Feed */}
      {loading ? (
        <LoadingState message="Loading projects and blueprints..." size="large" />
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.contentScrollContent,
            { paddingBottom: insets.bottom + spacing['5xl'] },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accentPrimary}
              colors={[colors.accentPrimary]}
            />
          }
        >
          {filteredProjects.length === 0 ? (
            <EmptyState
              iconName="folder-open-outline"
              title="No Projects Found"
              description={
                searchQuery
                  ? `No projects matching "${searchQuery}". Try a different search term or clear filters.`
                  : 'You do not have any projects matching this filter yet.'
              }
              actionLabel={searchQuery || selectedCategory !== 'all' ? 'Clear Filters' : 'Create Project'}
              onAction={() => {
                Haptics.selectionAsync();
                if (searchQuery || selectedCategory !== 'all') {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedSection('all');
                } else {
                  setCreateModalMode('create');
                  setIsCreateModalVisible(true);
                }
              }}
            />
          ) : (
            <>
              {/* SECTION 1: USER PROJECTS */}
              {(selectedSection === 'all' || selectedSection === 'user') && (
                <View style={styles.projectSection}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderTitleRow}>
                      <Ionicons name="briefcase-outline" size={18} color={colors.accentPrimary} />
                      <Text style={styles.sectionTitle}>Your Workspace Projects</Text>
                      <Badge label={String(userProjects.length)} size="xs" status="accent" />
                    </View>
                    {userProjects.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCreateModalMode('create');
                          setIsCreateModalVisible(true);
                        }}
                      >
                        <Text style={styles.sectionActionText}>+ New</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {userProjects.length === 0 ? (
                    <View style={styles.emptyUserBox}>
                      <Ionicons name="sparkles-outline" size={24} color={colors.textMuted} />
                      <Text style={styles.emptyUserTitle}>No custom workspace projects yet</Text>
                      <Text style={styles.emptyUserSub}>
                        Create a new project from scratch, import from GitHub, or duplicate a demo template below.
                      </Text>
                      <Button
                        title="Create First Project"
                        variant="primary"
                        size="sm"
                        iconName="add"
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCreateModalMode('create');
                          setIsCreateModalVisible(true);
                        }}
                        style={{ marginTop: spacing.md }}
                      />
                    </View>
                  ) : (
                    userProjects.map((project) => renderProjectCard(project, false))
                  )}
                </View>
              )}

              {/* SECTION 2: DEMONSTRATION BLUEPRINTS */}
              {(selectedSection === 'all' || selectedSection === 'demo') && (
                <View style={[styles.projectSection, { marginTop: spacing.xl }]}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderTitleRow}>
                      <Ionicons name="cube-outline" size={18} color={colors.accentPurple} />
                      <Text style={styles.sectionTitle}>Demonstration Templates & Blueprints</Text>
                      <Badge label={String(demoProjects.length)} size="xs" status="purple" />
                    </View>
                    <Badge label="Clone Ready" size="xs" status="default" variant="subtle" />
                  </View>

                  {demoProjects.length === 0 ? (
                    <Text style={styles.emptyFilterText}>No templates match current filters.</Text>
                  ) : (
                    demoProjects.map((project) => renderProjectCard(project, true))
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Create / Import Project Modal */}
      <CreateProjectModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onProjectCreated={handleProjectCreated}
        existingProjects={projects}
        initialMode={createModalMode}
      />

      {/* Explicit Delete Confirmation Dialog */}
      <Modal
        visible={!!projectToDelete}
        onClose={() => !isDeleting && setProjectToDelete(null)}
        title="Delete Project?"
        variant="center"
        animationType="fade"
      >
        {projectToDelete && (
          <View style={styles.deleteDialogContent}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="warning-outline" size={32} color={colors.error} />
            </View>

            <Text style={styles.deleteDialogTitle}>
              Delete "{projectToDelete.name}"?
            </Text>

            <Text style={styles.deleteDialogWarning}>
              This action is permanent and cannot be undone. All project files (
              {projectToDelete.filesCount || 0} files), workspace state, and agent assignments will
              be completely deleted from local storage.
            </Text>

            <View style={styles.deleteProjectMeta}>
              <View style={styles.deleteMetaRow}>
                <Text style={styles.deleteMetaLabel}>Framework:</Text>
                <Text style={styles.deleteMetaVal}>
                  {projectToDelete.framework.toUpperCase()}
                </Text>
              </View>
              <View style={styles.deleteMetaRow}>
                <Text style={styles.deleteMetaLabel}>Branch:</Text>
                <Text style={styles.deleteMetaVal}>{projectToDelete.gitBranch}</Text>
              </View>
              <View style={styles.deleteMetaRow}>
                <Text style={styles.deleteMetaLabel}>Type:</Text>
                <Text style={styles.deleteMetaVal}>
                  {projectToDelete.isDemo ? 'Demonstration Template' : 'Workspace Project'}
                </Text>
              </View>
            </View>

            <View style={styles.deleteActionButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  Haptics.selectionAsync();
                  setProjectToDelete(null);
                }}
                disabled={isDeleting}
                style={{ flex: 1 }}
              />
              <Button
                title={isDeleting ? 'Deleting...' : 'Delete Project'}
                variant="danger"
                loading={isDeleting}
                iconName="trash-outline"
                onPress={confirmDelete}
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );

  // Render Project Card
  function renderProjectCard(project: Project, isDemo: boolean) {
    const fwBadge = getFrameworkBadge(project.framework);
    const buildBadge = getBuildStatusBadge(project.buildStatus);
    const isDuplicating = duplicatingId === project.id;

    return (
      <Card
        key={project.id}
        variant="bordered"
        style={[styles.projectCard, isDemo && styles.demoProjectCard]}
        onPress={() => handleViewDetails(project)}
      >
        {/* Card Header */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleBlock}>
            <View style={styles.cardNameRow}>
              <Text style={styles.projectCardTitle} numberOfLines={1}>
                {project.name}
              </Text>
              {isDemo && (
                <Badge
                  label="TEMPLATE"
                  status="purple"
                  size="xs"
                  style={styles.templatePill}
                />
              )}
            </View>
            <Text style={styles.projectCardCategory}>{project.category}</Text>
          </View>

          <Badge
            label={fwBadge.label}
            status={fwBadge.status}
            size="sm"
            iconName={fwBadge.icon}
          />
        </View>

        {/* Card Description */}
        <Text style={styles.projectCardDesc} numberOfLines={2}>
          {project.description || 'No description provided.'}
        </Text>

        {/* Metadata Badges Row */}
        <View style={styles.metaBadgesRow}>
          <View style={styles.metaItem}>
            <Ionicons name="git-branch-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{project.gitBranch}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{project.filesCount || 0} files</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatRelativeTime(project.lastModified)}</Text>
          </View>

          <View style={{ marginLeft: 'auto' }}>
            <Badge
              label={buildBadge.label}
              status={buildBadge.status}
              size="xs"
              dot
            />
          </View>
        </View>

        {/* Card Actions Footer */}
        <View style={styles.cardActionRow}>
          <Button
            title="IDE"
            variant="primary"
            size="sm"
            iconName="code-slash-outline"
            onPress={() => handleOpenIDE(project)}
            style={styles.actionBtnPrimary}
          />

          <Button
            title="Details"
            variant="secondary"
            size="sm"
            iconName="information-circle-outline"
            onPress={() => handleViewDetails(project)}
            style={styles.actionBtnSecondary}
          />

          <Button
            title="Duplicate"
            variant="outline"
            size="sm"
            iconName="copy-outline"
            loading={isDuplicating}
            onPress={() => handleDuplicate(project)}
            style={styles.actionBtnOutline}
          />

          <TouchableOpacity
            style={styles.deleteCardBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setProjectToDelete(project);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={17} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  topHeaderLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActionBtn: {
    minWidth: 70,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bgPrimary,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  searchInputText: {
    fontSize: fontSizes.sm,
  },
  categoryBar: {
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgPrimary,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.accentPrimaryAlphaMedium,
    borderColor: colors.accentPrimary,
  },
  categoryPillIcon: {
    marginRight: 4,
  },
  categoryPillText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  categoryPillTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  scopeSwitcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scopeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  scopeBtnActive: {
    backgroundColor: colors.bgElevated,
  },
  scopeBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  scopeBtnTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  projectSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionActionText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.accentPrimary,
  },
  emptyUserBox: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyUserTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptyUserSub: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  emptyFilterText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  projectCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  demoProjectCard: {
    borderColor: `${colors.accentPurple}40`,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitleBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  projectCardTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  templatePill: {
    alignSelf: 'center',
  },
  projectCardCategory: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  projectCardDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamilies.code,
    fontSize: fontSizes.xs - 1,
    color: colors.textSecondary,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtnPrimary: {
    flex: 1,
  },
  actionBtnSecondary: {
    flex: 1,
  },
  actionBtnOutline: {
    flex: 1.2,
  },
  deleteCardBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deleteIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.statusBgError,
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  deleteDialogTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  deleteDialogWarning: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  deleteProjectMeta: {
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  deleteMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteMetaLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  deleteMetaVal: {
    fontFamily: fontFamilies.code,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  deleteActionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
});
