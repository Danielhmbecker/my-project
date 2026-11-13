import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { TabType } from '../models/types';

export interface TabConfig {
  id: TabType;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  badge?: number | string | boolean;
}

export const PRIMARY_TABS: TabConfig[] = [
  {
    id: 'home',
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    id: 'projects',
    label: 'Projects',
    activeIcon: 'folder',
    inactiveIcon: 'folder-outline',
  },
  {
    id: 'ide',
    label: 'IDE',
    activeIcon: 'code-slash',
    inactiveIcon: 'code-slash-outline',
  },
  {
    id: 'agents',
    label: 'Agents',
    activeIcon: 'hardware-chip',
    inactiveIcon: 'hardware-chip-outline',
  },
  {
    id: 'tools',
    label: 'Tools',
    activeIcon: 'hammer',
    inactiveIcon: 'hammer-outline',
  },
];

export interface BottomTabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  badges?: Partial<Record<TabType, number | string | boolean>>;
  hidden?: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  badges = {},
  hidden = false,
}) => {
  const insets = useSafeAreaInsets();

  if (hidden) {
    return null;
  }

  const handlePress = (tabId: TabType) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch {
      // Haptics fallback on unsupported environments
    }
    onTabPress(tabId);
  };

  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
        },
      ]}
      accessibilityRole="tablist"
    >
      <View style={styles.tabBarInner}>
        {PRIMARY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badgeValue = badges[tab.id] ?? tab.badge;
          const iconName = isActive ? tab.activeIcon : tab.inactiveIcon;
          const iconColor = isActive ? colors.accentPrimary : colors.textMuted;
          const textColor = isActive ? colors.textPrimary : colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
              style={styles.tabButton}
              onPress={() => handlePress(tab.id)}
              activeOpacity={0.7}
            >
              {/* Active Tab Top Indicator Bar */}
              {isActive && <View style={styles.activeTopBar} />}

              {/* Icon Container with Badge */}
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <Ionicons name={iconName} size={22} color={iconColor} />

                {/* Badge Indicator */}
                {badgeValue !== undefined && badgeValue !== false && (
                  <View
                    style={[
                      styles.badge,
                      typeof badgeValue === 'boolean'
                        ? styles.badgeDot
                        : styles.badgePill,
                    ]}
                  >
                    {typeof badgeValue !== 'boolean' && (
                      <Text style={styles.badgeText}>
                        {typeof badgeValue === 'number' && badgeValue > 99
                          ? '99+'
                          : badgeValue}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Tab Label */}
              <Text
                style={[
                  styles.tabLabel,
                  { color: textColor },
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 52,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingHorizontal: spacing.xs,
  },
  activeTopBar: {
    position: 'absolute',
    top: -spacing.xs,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.full,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  activeIconWrapper: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: fontSizes.xs - 1, // ~10px
    fontWeight: fontWeights.medium,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  activeTabLabel: {
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.bgSecondary,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentCyan,
  },
  badgePill: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: fontWeights.bold,
    lineHeight: 11,
  },
});

export default BottomTabBar;
