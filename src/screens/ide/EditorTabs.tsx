import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontFamilies, fontSizes, spacing, radius } from '../../theme';

export interface EditorTabItem {
  id: string;
  name: string;
  path?: string;
  isDirty?: boolean;
  language?: string;
  hasErrors?: boolean;
  hasWarnings?: boolean;
}

export interface EditorTabsProps {
  tabs: EditorTabItem[];
  activeTabId?: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Returns an appropriate icon name and color based on file extension
 */
export function getFileIcon(filename: string): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
} {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return { icon: 'logo-react', color: '#388bfd' };
    case 'ts':
      return { icon: 'code-slash', color: '#58a6ff' };
    case 'js':
      return { icon: 'logo-javascript', color: '#e3b341' };
    case 'json':
      return { icon: 'code-working', color: '#f0883e' };
    case 'md':
      return { icon: 'document-text', color: '#8957e5' };
    case 'css':
    case 'scss':
      return { icon: 'color-palette', color: '#39c5cf' };
    case 'html':
      return { icon: 'globe-outline', color: '#f0883e' };
    case 'py':
      return { icon: 'logo-python', color: '#3fb950' };
    default:
      return { icon: 'document-outline', color: colors.secondary };
  }
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  containerStyle,
}) => {
  const handleSelect = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectTab(tabId);
  };

  const handleClose = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onCloseTab(tabId);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const { icon, color } = getFileIcon(tab.name);

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => handleSelect(tab.id)}
              style={[
                styles.tabItem,
                isActive ? styles.tabItemActive : styles.tabItemInactive,
              ]}
            >
              {/* Active top accent line */}
              {isActive && <View style={styles.activeIndicator} />}

              {/* File Icon */}
              <Ionicons
                name={icon}
                size={14}
                color={isActive ? color : colors.secondary}
                style={styles.fileIcon}
              />

              {/* File Name */}
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.name}
              </Text>

              {/* Diagnostics Indicator */}
              {tab.hasErrors && (
                <View style={[styles.diagDot, { backgroundColor: colors.error }]} />
              )}
              {!tab.hasErrors && tab.hasWarnings && (
                <View style={[styles.diagDot, { backgroundColor: colors.warning }]} />
              )}

              {/* Dirty indicator dot (*) */}
              {tab.isDirty && (
                <View style={styles.dirtyDotContainer}>
                  <View style={styles.dirtyDot} />
                </View>
              )}

              {/* Tab close button */}
              <TouchableOpacity
                onPress={() => handleClose(tab.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.closeButton}
                accessibilityLabel={`Close ${tab.name}`}
              >
                <Ionicons
                  name="close"
                  size={14}
                  color={isActive ? colors.secondary : colors.muted}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Optional Add / New tab button */}
        {onNewTab && (
          <TouchableOpacity
            style={styles.newTabButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onNewTab();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="New file"
          >
            <Ionicons name="add" size={16} color={colors.secondary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabItem: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
    minWidth: 100,
    maxWidth: 200,
  },
  tabItemActive: {
    backgroundColor: colors.bgPrimary,
  },
  tabItemInactive: {
    backgroundColor: colors.bgSecondary,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accentPrimary,
  },
  fileIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    flexShrink: 1,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabLabelInactive: {
    color: colors.secondary,
    fontWeight: '400',
  },
  dirtyDotContainer: {
    marginLeft: 5,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dirtyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentOrange,
  },
  diagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 4,
  },
  closeButton: {
    marginLeft: 6,
    padding: 2,
    borderRadius: radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newTabButton: {
    paddingHorizontal: spacing.sm,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditorTabs;
