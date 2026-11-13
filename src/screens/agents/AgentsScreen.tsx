import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Agent, AgentStatus, Skill } from '../../models/types';
import {
  getAgents,
  saveAgent,
  updateAgentStatus,
  getSkills,
  INITIAL_AGENTS,
  INITIAL_SKILLS,
  addAgentActivity,
} from '../../storage';
import { AgentCard, STATUS_CONFIG } from './AgentCard';
import { AgentDetailModal } from './AgentDetailModal';
import { CreateAgentModal } from './CreateAgentModal';

export const AgentsScreen: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal states
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Load agents and skills from persistent storage
  const loadData = useCallback(async () => {
    try {
      const [loadedAgents, loadedSkills] = await Promise.all([
        getAgents(),
        getSkills(),
      ]);

      if (loadedAgents && loadedAgents.length > 0) {
        setAgents(loadedAgents);
      } else {
        // Fallback to initial seed agents if storage is empty
        setAgents(INITIAL_AGENTS);
      }

      if (loadedSkills && loadedSkills.length > 0) {
        setSkills(loadedSkills);
      } else {
        setSkills(INITIAL_SKILLS);
      }
    } catch (err) {
      // In case of any storage read error, fallback to seed
      setAgents(INITIAL_AGENTS);
      setSkills(INITIAL_SKILLS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    loadData();
  };

  // Open detail modal for an agent
  const handleAgentPress = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailModalVisible(true);
  };

  // Pause / Resume toggle
  const handleToggleStatus = async (agent: Agent) => {
    let nextStatus: AgentStatus;
    if (agent.status === 'working') {
      nextStatus = 'paused';
    } else if (agent.status === 'paused') {
      nextStatus = 'working';
    } else if (agent.status === 'ready' || agent.status === 'idle') {
      nextStatus = 'working';
    } else if (agent.status === 'failed') {
      nextStatus = 'ready';
    } else {
      nextStatus = 'ready';
    }

    // Optimistic state update
    const updatedAgents = agents.map((a) =>
      a.id === agent.id ? { ...a, status: nextStatus } : a
    );
    setAgents(updatedAgents);

    try {
      await updateAgentStatus(agent.id, nextStatus);
      await addAgentActivity(agent.id, {
        message: `Status toggled from ${agent.status} to ${nextStatus}.`,
        type: nextStatus === 'working' ? 'info' : 'warning',
      });
    } catch (err) {
      // Fail silently or rollback if needed
    }
  };

  // Save updated agent from detail modal
  const handleSaveAgent = async (updated: Agent) => {
    // Optimistic update
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAgent(updated);

    try {
      await saveAgent(updated);
    } catch (err) {
      console.error('Failed to save agent to storage:', err);
    }
  };

  // Create custom agent
  const handleCreateAgent = async (newAgent: Agent) => {
    // Optimistic update
    setAgents((prev) => [newAgent, ...prev]);

    try {
      await saveAgent(newAgent);
    } catch (err) {
      console.error('Failed to persist created agent:', err);
    }
  };

  // Add activity log entry to an agent
  const handleAddActivity = async (
    agentId: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success'
  ) => {
    try {
      await addAgentActivity(agentId, { message, type });
      // Refresh local copy
      const current = agents.find((a) => a.id === agentId);
      if (current) {
        const newAct = {
          id: `act-${Date.now()}`,
          agentId,
          timestamp: new Date().toISOString(),
          message,
          type,
        };
        const updated = {
          ...current,
          activityHistory: [newAct, ...(current.activityHistory || [])],
        };
        setAgents((prev) => prev.map((a) => (a.id === agentId ? updated : a)));
        if (selectedAgent && selectedAgent.id === agentId) {
          setSelectedAgent(updated);
        }
      }
    } catch {
      // Ignore
    }
  };

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      all: agents.length,
      working: 0,
      ready: 0,
      idle: 0,
      paused: 0,
      failed: 0,
      completed: 0,
    };
    agents.forEach((a) => {
      if (a.status in counts) {
        counts[a.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [agents]);

  // Filtered agent list
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Status filter
      if (selectedStatusFilter !== 'all' && agent.status !== selectedStatusFilter) {
        return false;
      }
      // Search query filter (matches name, role, or skills)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = agent.name.toLowerCase().includes(q);
        const matchesRole = agent.role.toLowerCase().includes(q);
        const matchesDesc = agent.description.toLowerCase().includes(q);
        const matchesSkill = agent.assignedSkillIds.some((sId) => {
          const sk = skills.find((s) => s.id === sId);
          return (
            sId.toLowerCase().includes(q) ||
            (sk && sk.name.toLowerCase().includes(q))
          );
        });
        return matchesName || matchesRole || matchesDesc || matchesSkill;
      }
      return true;
    });
  }, [agents, selectedStatusFilter, searchQuery, skills]);

  const filterOptions = [
    { key: 'all', label: 'All', count: statusCounts.all },
    { key: 'working', label: 'Working', count: statusCounts.working },
    { key: 'ready', label: 'Ready', count: statusCounts.ready },
    { key: 'idle', label: 'Idle', count: statusCounts.idle },
    { key: 'paused', label: 'Paused', count: statusCounts.paused },
    { key: 'completed', label: 'Completed', count: statusCounts.completed },
    { key: 'failed', label: 'Failed', count: statusCounts.failed },
  ];

  return (
    <View style={styles.screenRoot}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.headerTitle}>AI Agent Centre</Text>
              <View style={styles.pulsePill}>
                <View style={styles.liveDot} />
                <Text style={styles.pulsePillText}>8 SPECIALISTS</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Autonomous multi-agent engineering team for ARENA STUDIO.
            </Text>
          </View>

          {/* Create Custom Agent Button */}
          <TouchableOpacity
            style={styles.createAgentButton}
            onPress={() => setIsCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.createAgentButtonText}>New Agent</Text>
          </TouchableOpacity>
        </View>

        {/* Status Metrics Strip */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{statusCounts.all}</Text>
            <Text style={styles.metricLabel}>Total Team</Text>
          </View>
          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricRow}>
              <View
                style={[
                  styles.metricDot,
                  { backgroundColor: colors.accentCyan },
                ]}
              />
              <Text style={[styles.metricNumber, { color: colors.accentCyan }]}>
                {statusCounts.working}
              </Text>
            </View>
            <Text style={styles.metricLabel}>Working</Text>
          </View>
          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricRow}>
              <View
                style={[
                  styles.metricDot,
                  { backgroundColor: colors.success },
                ]}
              />
              <Text style={[styles.metricNumber, { color: colors.success }]}>
                {statusCounts.ready}
              </Text>
            </View>
            <Text style={styles.metricLabel}>Ready</Text>
          </View>
          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricRow}>
              <View
                style={[
                  styles.metricDot,
                  { backgroundColor: colors.warning },
                ]}
              />
              <Text style={[styles.metricNumber, { color: colors.warning }]}>
                {statusCounts.paused}
              </Text>
            </View>
            <Text style={styles.metricLabel}>Paused</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search agents by name, role, or skill..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterOptions.map((filter) => {
            const isSelected = selectedStatusFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedStatusFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
                <View
                  style={[
                    styles.filterCountBadge,
                    isSelected && styles.filterCountBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      isSelected && styles.filterCountTextSelected,
                    ]}
                  >
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Agents List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
          <Text style={styles.loadingText}>Initializing specialist agent roster...</Text>
        </View>
      ) : filteredAgents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="hardware-chip-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No Specialist Agents Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No agents match "${searchQuery}". Try a different search term or clear filters.`
              : 'No agents match the selected status filter.'}
          </Text>
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchBtnText}>Clear Search</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSelectedStatusFilter('all')}
            >
              <Text style={styles.clearSearchBtnText}>Show All Agents</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredAgents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AgentCard
              agent={item}
              skills={skills}
              onPress={handleAgentPress}
              onToggleStatus={handleToggleStatus}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accentPrimary}
              colors={[colors.accentPrimary]}
            />
          }
        />
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          visible={isDetailModalVisible}
          agent={selectedAgent}
          skills={skills}
          onClose={() => {
            setIsDetailModalVisible(false);
            setSelectedAgent(null);
          }}
          onSaveAgent={handleSaveAgent}
          onAddActivity={handleAddActivity}
        />
      )}

      {/* Create Custom Agent Modal */}
      <CreateAgentModal
        visible={isCreateModalVisible}
        skills={skills}
        onClose={() => setIsCreateModalVisible(false)}
        onCreateAgent={handleCreateAgent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'ios' ? 52 : spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  pulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 197, 207, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 197, 207, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCyan,
  },
  pulsePillText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.accentCyan,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    marginTop: 2,
  },
  createAgentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.md,
    gap: 4,
  },
  createAgentButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricNumber: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  metricLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderSubtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 7 : 2,
    marginVertical: spacing.xs,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  filterScroll: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterScrollContent: {
    gap: 6,
    paddingRight: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 5,
  },
  filterChipSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  filterChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  filterChipTextSelected: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  filterCountBadge: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  filterCountBadgeSelected: {
    backgroundColor: colors.accentPrimary,
  },
  filterCountText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    color: colors.muted,
  },
  filterCountTextSelected: {
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearSearchBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.accentPrimary,
  },
});

export default AgentsScreen;
