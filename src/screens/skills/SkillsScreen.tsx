import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Skill, SkillCategory, Agent } from '../../models';
import {
  getSkills,
  getAgents,
  saveSkill,
  deleteSkill,
  assignSkillToAgent,
  removeSkillFromAgent,
  INITIAL_SKILLS,
  INITIAL_AGENTS,
} from '../../storage';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { SkillCard, getCategoryColor, getCategoryIcon } from './SkillCard';
import { CreateSkillModal } from './CreateSkillModal';
import { SkillDetailModal } from './SkillDetailModal';
import { EmptyState } from '../../components/ui/EmptyState';

type FilterCategory = 'ALL' | SkillCategory;

export const SkillsScreen: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [onlyAssigned, setOnlyAssigned] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'assigned'>('name');

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);

  // Load data from persistent storage
  const loadData = useCallback(async () => {
    try {
      const [storedSkills, storedAgents] = await Promise.all([
        getSkills(),
        getAgents(),
      ]);

      setSkills(storedSkills.length > 0 ? storedSkills : INITIAL_SKILLS);
      setAgents(storedAgents.length > 0 ? storedAgents : INITIAL_AGENTS);
    } catch (error) {
      console.error('Failed to load skills and agents from storage:', error);
      setSkills(INITIAL_SKILLS);
      setAgents(INITIAL_AGENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // Keep detailSkill updated if skills list changes
  useEffect(() => {
    if (detailSkill) {
      const fresh = skills.find((s) => s.id === detailSkill.id);
      if (fresh) {
        setDetailSkill(fresh);
      }
    }
  }, [skills, detailSkill]);

  // Handle saving new custom skill
  const handleCreateSkill = async (newSkill: Skill) => {
    await saveSkill(newSkill);
    // Assign any initially checked agents
    if (newSkill.assignedAgentIds && newSkill.assignedAgentIds.length > 0) {
      for (const agentId of newSkill.assignedAgentIds) {
        await assignSkillToAgent(agentId, newSkill.id);
      }
    }
    await loadData();
  };

  // Handle agent toggle in detail modal
  const handleToggleAgent = async (
    skillId: string,
    agentId: string,
    isCurrentlyAssigned: boolean
  ) => {
    if (isCurrentlyAssigned) {
      await removeSkillFromAgent(agentId, skillId);
    } else {
      await assignSkillToAgent(agentId, skillId);
    }

    // Refresh local dataset
    const [updatedSkills, updatedAgents] = await Promise.all([
      getSkills(),
      getAgents(),
    ]);

    setSkills(updatedSkills);
    setAgents(updatedAgents);

    const updatedDetail = updatedSkills.find((s) => s.id === skillId);
    if (updatedDetail) {
      setDetailSkill(updatedDetail);
    }
  };

  // Handle skill delete
  const handleDeleteSkill = async (skillId: string) => {
    await deleteSkill(skillId);
    setDetailSkill(null);
    await loadData();
  };

  // Filtered & sorted skills
  const filteredSkills = useMemo(() => {
    let result = [...skills];

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    // Only assigned filter
    if (onlyAssigned) {
      result = result.filter((s) => s.assignedAgentIds && s.assignedAgentIds.length > 0);
    }

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((skill) => {
        const matchesName = skill.name.toLowerCase().includes(q);
        const matchesDesc = skill.description.toLowerCase().includes(q);
        const matchesTools = skill.requiredTools.some((t) =>
          t.toLowerCase().includes(q)
        );
        const matchesAgent = agents.some(
          (a) =>
            skill.assignedAgentIds.includes(a.id) &&
            a.name.toLowerCase().includes(q)
        );
        return matchesName || matchesDesc || matchesTools || matchesAgent;
      });
    }

    // Sorting
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'assigned') {
      result.sort(
        (a, b) => (b.assignedAgentIds?.length || 0) - (a.assignedAgentIds?.length || 0)
      );
    }

    return result;
  }, [skills, agents, selectedCategory, onlyAssigned, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      ALL: skills.length,
      DEVELOPMENT: 0,
      DESIGN: 0,
      TESTING: 0,
      OPERATIONS: 0,
    };

    skills.forEach((s) => {
      if (counts[s.category] !== undefined) {
        counts[s.category]++;
      }
    });

    return counts;
  }, [skills]);

  // Total active agent assignment count
  const totalAssignments = useMemo(() => {
    return skills.reduce(
      (acc, s) => acc + (s.assignedAgentIds ? s.assignedAgentIds.length : 0),
      0
    );
  }, [skills]);

  const customSkillsCount = useMemo(() => {
    return skills.filter((s) => s.id.startsWith('skill-custom')).length;
  }, [skills]);

  const CATEGORY_TABS: { key: FilterCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'ALL', label: 'All', icon: 'layers-outline' },
    { key: 'DEVELOPMENT', label: 'Dev', icon: 'code-slash-outline' },
    { key: 'DESIGN', label: 'Design', icon: 'color-palette-outline' },
    { key: 'TESTING', label: 'QA', icon: 'shield-checkmark-outline' },
    { key: 'OPERATIONS', label: 'Ops', icon: 'rocket-outline' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
        <Text style={styles.loadingText}>Loading Skills Library...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="sparkles" size={18} color={colors.accentCyan} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Skills Library</Text>
            <Text style={styles.headerSubtitle}>
              {skills.length} Capabilities & Execution Guides
            </Text>
          </View>
        </View>

        {/* Create Skill Action */}
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setCreateModalVisible(true);
          }}
          style={styles.createButton}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.createButtonText}>New Skill</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Banner */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{skills.length}</Text>
          <Text style={styles.metricLabel}>TOTAL SKILLS</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.accentPrimary }]}>
            {totalAssignments}
          </Text>
          <Text style={styles.metricLabel}>ACTIVE ASSIGNMENTS</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.accentPurple }]}>
            {customSkillsCount}
          </Text>
          <Text style={styles.metricLabel}>CUSTOM BUILT</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={16}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search skills, tools, or assigned agents..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        {CATEGORY_TABS.map((tab) => {
          const isSelected = selectedCategory === tab.key;
          const count = categoryCounts[tab.key];
          const activeColor =
            tab.key === 'ALL'
              ? colors.accentPrimary
              : getCategoryColor(tab.key as SkillCategory);

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setSelectedCategory(tab.key);
                try {
                  Haptics.selectionAsync();
                } catch {}
              }}
              style={[
                styles.categoryTab,
                isSelected && [
                  styles.categoryTabActive,
                  { borderColor: activeColor, backgroundColor: `${activeColor}15` },
                ],
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={isSelected ? activeColor : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  isSelected && { color: activeColor, fontWeight: fontWeights.bold },
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.tabCounter,
                  isSelected && { backgroundColor: `${activeColor}30` },
                ]}
              >
                <Text
                  style={[
                    styles.tabCounterText,
                    isSelected && { color: activeColor },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Filters Strip */}
      <View style={styles.filterStrip}>
        <TouchableOpacity
          onPress={() => {
            setOnlyAssigned(!onlyAssigned);
            try {
              Haptics.selectionAsync();
            } catch {}
          }}
          style={[
            styles.filterChip,
            onlyAssigned && styles.filterChipActive,
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={onlyAssigned ? 'checkbox' : 'square-outline'}
            size={13}
            color={onlyAssigned ? colors.accentPrimary : colors.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterChipText,
              onlyAssigned && styles.filterChipTextActive,
            ]}
          >
            Assigned Only
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSortBy(sortBy === 'name' ? 'assigned' : 'name');
            try {
              Haptics.selectionAsync();
            } catch {}
          }}
          style={styles.filterChip}
          activeOpacity={0.7}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={13}
            color={colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.filterChipText}>
            Sort: {sortBy === 'name' ? 'Alphabetical' : 'Most Assigned'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skills FlatList */}
      <FlatList
        data={filteredSkills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SkillCard
            skill={item}
            agents={agents}
            onPress={(s) => setDetailSkill(s)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentPrimary}
            colors={[colors.accentPrimary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            iconName="search-outline"
            title="No skills found"
            description={
              searchQuery
                ? `No capabilities match "${searchQuery}". Try a different keyword or reset filters.`
                : 'No skills found in this category.'
            }
            actionLabel="Reset Filters"
            actionIcon="refresh-outline"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setOnlyAssigned(false);
            }}
          />
        }
      />

      {/* Create Custom Skill Modal */}
      <CreateSkillModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleCreateSkill}
        agents={agents}
      />

      {/* Skill Detail View Modal */}
      <SkillDetailModal
        skill={detailSkill}
        visible={!!detailSkill}
        onClose={() => setDetailSkill(null)}
        agents={agents}
        onToggleAgent={handleToggleAgent}
        onDeleteSkill={handleDeleteSkill}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    marginTop: spacing.md,
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
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(57, 197, 207, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 197, 207, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    marginTop: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  createButtonText: {
    color: '#ffffff',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.borderSubtle,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    gap: 6,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabActive: {
    borderWidth: 1,
  },
  categoryTabText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: fontWeights.medium,
  },
  tabCounter: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.pill,
    marginLeft: 4,
  },
  tabCounterText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.semibold,
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    borderColor: colors.accentPrimary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  filterChipTextActive: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl * 2,
  },
});

export default SkillsScreen;
