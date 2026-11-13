import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Skill, Agent, SkillCategory } from '../../models';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';

export interface SkillCardProps {
  skill: Skill;
  agents: Agent[];
  onPress: (skill: Skill) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const getCategoryColor = (category: SkillCategory): string => {
  switch (category) {
    case 'DEVELOPMENT':
      return colors.accentCyan; // #39c5cf
    case 'DESIGN':
      return colors.accentPurple; // #8957e5
    case 'TESTING':
      return colors.success; // #3fb950
    case 'OPERATIONS':
      return colors.accentOrange; // #f0883e
    default:
      return colors.accentPrimary; // #388bfd
  }
};

export const getCategoryIcon = (category: SkillCategory): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'DEVELOPMENT':
      return 'code-slash-outline';
    case 'DESIGN':
      return 'color-palette-outline';
    case 'TESTING':
      return 'shield-checkmark-outline';
    case 'OPERATIONS':
      return 'rocket-outline';
    default:
      return 'cube-outline';
  }
};

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  agents,
  onPress,
  style,
  testID,
}) => {
  const categoryColor = getCategoryColor(skill.category);
  const categoryIcon = getCategoryIcon(skill.category);

  // Match assigned agents from the full agent list
  const assignedAgents = agents.filter((agent) =>
    skill.assignedAgentIds.includes(agent.id)
  );

  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // safe fallback if not supported
    }
    onPress(skill);
  };

  const visibleAgents = assignedAgents.slice(0, 4);
  const remainingCount = assignedAgents.length - visibleAgents.length;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[styles.container, style]}
      testID={testID || `skill-card-${skill.id}`}
    >
      {/* Top Meta Row: Category Badge + Version + Chevron */}
      <View style={styles.topRow}>
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
            size={12}
            color={categoryColor}
            style={styles.categoryIcon}
          />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {skill.category}
          </Text>
        </View>

        <View style={styles.topRightRow}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{skill.version}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textMuted}
            style={styles.chevron}
          />
        </View>
      </View>

      {/* Skill Name */}
      <Text style={styles.name} numberOfLines={1}>
        {skill.name}
      </Text>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {skill.description}
      </Text>

      {/* Required Tools Chips */}
      {skill.requiredTools && skill.requiredTools.length > 0 && (
        <View style={styles.toolsRow}>
          <Ionicons
            name="construct-outline"
            size={11}
            color={colors.textMuted}
            style={styles.toolIcon}
          />
          <View style={styles.toolsList}>
            {skill.requiredTools.slice(0, 3).map((tool, idx) => (
              <View key={`${tool}-${idx}`} style={styles.toolChip}>
                <Text style={styles.toolChipText}>{tool}</Text>
              </View>
            ))}
            {skill.requiredTools.length > 3 && (
              <View style={styles.toolChipMore}>
                <Text style={styles.toolChipMoreText}>
                  +{skill.requiredTools.length - 3}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer: Assigned Agents Avatar List */}
      <View style={styles.footerRow}>
        <View style={styles.agentsLeft}>
          {assignedAgents.length > 0 ? (
            <View style={styles.avatarsGroup}>
              {visibleAgents.map((agent, index) => {
                const agentColor = agent.color || colors.accentPrimary;
                const iconName = (agent.avatar as keyof typeof Ionicons.glyphMap) || 'person-outline';

                return (
                  <View
                    key={agent.id}
                    style={[
                      styles.avatarCircle,
                      {
                        borderColor: colors.bgSecondary,
                        backgroundColor: `${agentColor}22`,
                        marginLeft: index === 0 ? 0 : -8,
                        zIndex: 10 - index,
                      },
                    ]}
                  >
                    <Ionicons name={iconName} size={11} color={agentColor} />
                  </View>
                );
              })}

              {remainingCount > 0 && (
                <View
                  style={[
                    styles.avatarCircle,
                    styles.avatarRemaining,
                    { marginLeft: -8, zIndex: 1 },
                  ]}
                >
                  <Text style={styles.remainingText}>+{remainingCount}</Text>
                </View>
              )}

              <Text style={styles.assignedLabel} numberOfLines={1}>
                {assignedAgents.length === 1
                  ? assignedAgents[0].name
                  : `${assignedAgents.length} agents assigned`}
              </Text>
            </View>
          ) : (
            <View style={styles.unassignedContainer}>
              <Ionicons
                name="person-outline"
                size={12}
                color={colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.unassignedText}>No agents assigned</Text>
            </View>
          )}
        </View>

        {/* Quick Assign Hint */}
        <View style={styles.detailsBadge}>
          <Text style={styles.detailsBadgeText}>Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 6,
  },
  versionText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  chevron: {
    marginLeft: 2,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toolIcon: {
    marginRight: 6,
  },
  toolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  toolChip: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: 4,
    marginBottom: 2,
  },
  toolChipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.mono,
    fontSize: 10,
  },
  toolChipMore: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  toolChipMoreText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: fontWeights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  agentsLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  avatarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRemaining: {
    backgroundColor: colors.bgTertiary,
    borderColor: colors.border,
  },
  remainingText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
  },
  assignedLabel: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    flex: 1,
  },
  unassignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unassignedText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
  },
  detailsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  detailsBadgeText: {
    color: colors.accentPrimary,
    fontSize: 11,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.sans,
  },
});

export default SkillCard;
