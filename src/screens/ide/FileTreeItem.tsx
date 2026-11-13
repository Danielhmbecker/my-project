import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProjectFile } from '../../models';
import { colors, spacing, radius, fontFamilies, fontSizes } from '../../theme';

export interface FileTreeNode extends ProjectFile {
  children?: FileTreeNode[];
  depth: number;
  hasChildren?: boolean;
}

export type IconFamily = 'MaterialCommunityIcons' | 'Ionicons';

export interface FileIconDescriptor {
  family: IconFamily;
  name: string;
  color: string;
}

/**
 * Returns icon descriptor (family, name, color) based on file type and state.
 * Supports TypeScript, JavaScript, JSON, CSS, Markdown, Images, Folders, and configs.
 */
export function getFileIconInfo(
  filename: string,
  isDirectory: boolean,
  isExpanded: boolean = false
): FileIconDescriptor {
  if (isDirectory) {
    return {
      family: 'Ionicons',
      name: isExpanded ? 'folder-open' : 'folder',
      color: isExpanded ? '#f0883e' : '#e3b341',
    };
  }

  const parts = filename.toLowerCase().split('.');
  const ext = parts.length > 1 ? parts.pop() || '' : '';
  const baseName = filename.toLowerCase();

  // Config and special files
  if (baseName === '.gitignore' || baseName === '.gitattributes') {
    return { family: 'MaterialCommunityIcons', name: 'git', color: '#f05032' };
  }
  if (baseName.startsWith('.env')) {
    return { family: 'Ionicons', name: 'key-outline', color: '#e3b341' };
  }
  if (baseName === 'package.json') {
    return { family: 'MaterialCommunityIcons', name: 'package-variant', color: '#cb3837' };
  }
  if (baseName === 'tsconfig.json') {
    return { family: 'MaterialCommunityIcons', name: 'file-cog-outline', color: '#3178c6' };
  }
  if (baseName === 'app.json' || baseName === 'eas.json') {
    return { family: 'MaterialCommunityIcons', name: 'file-cog-outline', color: '#8957e5' };
  }

  // Extensions
  switch (ext) {
    case 'ts':
    case 'tsx':
      return { family: 'MaterialCommunityIcons', name: 'language-typescript', color: '#3178c6' };
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return { family: 'MaterialCommunityIcons', name: 'language-javascript', color: '#f7df1e' };
    case 'json':
    case 'jsonc':
    case 'lock':
      return { family: 'MaterialCommunityIcons', name: 'code-json', color: '#cbcb41' };
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return { family: 'MaterialCommunityIcons', name: 'language-css3', color: '#39c5cf' };
    case 'md':
    case 'markdown':
    case 'mdx':
      return { family: 'MaterialCommunityIcons', name: 'language-markdown', color: '#8957e5' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return { family: 'Ionicons', name: 'image-outline', color: '#3fb950' };
    case 'html':
    case 'htm':
      return { family: 'MaterialCommunityIcons', name: 'language-html5', color: '#e34f26' };
    case 'py':
      return { family: 'MaterialCommunityIcons', name: 'language-python', color: '#3776ab' };
    case 'sh':
    case 'bash':
    case 'zsh':
      return { family: 'MaterialCommunityIcons', name: 'console', color: '#58a6ff' };
    case 'yml':
    case 'yaml':
      return { family: 'MaterialCommunityIcons', name: 'file-cog-outline', color: '#cb3837' };
    case 'txt':
    case 'log':
      return { family: 'Ionicons', name: 'document-text-outline', color: '#8b949e' };
    default:
      return { family: 'Ionicons', name: 'document-outline', color: '#8b949e' };
  }
}

/**
 * Format bytes into human readable string
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface FileTreeItemProps {
  item: FileTreeNode;
  depth?: number;
  isSelected?: boolean;
  isExpanded?: boolean;
  onSelect: (item: FileTreeNode) => void;
  onToggleExpand: (folderId: string) => void;
  onActionMenu?: (item: FileTreeNode) => void;
  isSearching?: boolean;
  searchQuery?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  depth = item.depth || 0,
  isSelected = false,
  isExpanded = false,
  onSelect,
  onToggleExpand,
  onActionMenu,
  isSearching = false,
  searchQuery,
  containerStyle,
}) => {
  const iconInfo = getFileIconInfo(item.name, item.isDirectory, isExpanded);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (item.isDirectory) {
      onToggleExpand(item.id);
    } else {
      onSelect(item);
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onActionMenu) {
      onActionMenu(item);
    }
  };

  const handleChevronPress = (e: any) => {
    e.stopPropagation?.();
    Haptics.selectionAsync().catch(() => {});
    onToggleExpand(item.id);
  };

  const handleActionPress = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onActionMenu) {
      onActionMenu(item);
    }
  };

  const childCount = item.children ? item.children.length : 0;
  const indentOffset = isSearching ? 0 : depth * 18;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        { paddingLeft: indentOffset + spacing.xs },
        containerStyle,
      ]}
    >
      {/* Active state indicator line on left */}
      {isSelected && <View style={styles.activeIndicator} />}

      {/* Indentation guide vertical lines */}
      {!isSearching && depth > 0 && (
        <View style={styles.indentGuidesContainer} pointerEvents="none">
          {Array.from({ length: depth }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.indentGuideLine,
                { left: index * 18 + 14 },
              ]}
            />
          ))}
        </View>
      )}

      {/* Folder Chevron or Spacer */}
      {item.isDirectory ? (
        <TouchableOpacity
          style={styles.chevronButton}
          onPress={handleChevronPress}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={13}
            color={isSelected ? colors.textPrimary : colors.textSecondary}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.chevronSpacer} />
      )}

      {/* File/Folder Icon */}
      <View style={styles.iconContainer}>
        {iconInfo.family === 'MaterialCommunityIcons' ? (
          <MaterialCommunityIcons
            name={iconInfo.name as any}
            size={18}
            color={iconInfo.color}
          />
        ) : (
          <Ionicons
            name={iconInfo.name as any}
            size={18}
            color={iconInfo.color}
          />
        )}
      </View>

      {/* File/Folder Name & Subtitle for Search */}
      <View style={styles.textContainer}>
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          style={[
            styles.nameText,
            item.isDirectory ? styles.directoryNameText : styles.fileNameText,
            isSelected && styles.nameTextSelected,
          ]}
        >
          {item.name}
        </Text>

        {/* If in search mode, display the containing path */}
        {isSearching && item.path && (
          <Text numberOfLines={1} style={styles.pathSubtext}>
            {item.path}
          </Text>
        )}
      </View>

      {/* Right-side metadata badge & action button */}
      <View style={styles.rightActionsContainer}>
        {item.isDirectory && childCount > 0 && !isSearching && (
          <Text style={styles.childCountBadge}>{childCount}</Text>
        )}

        {!item.isDirectory && !isSearching && item.size > 0 && (
          <Text style={styles.fileSizeText}>{formatFileSize(item.size)}</Text>
        )}

        {/* Action Menu Trigger Button */}
        {onActionMenu && (
          <TouchableOpacity
            style={styles.actionMenuButton}
            onPress={handleActionPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={14}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingRight: spacing.sm,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  containerSelected: {
    backgroundColor: 'rgba(56, 139, 253, 0.12)',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 2,
    bottom: 2,
    width: 3,
    backgroundColor: colors.accentPrimary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  indentGuidesContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  indentGuideLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#272c35',
  },
  chevronButton: {
    width: 20,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronSpacer: {
    width: 20,
    height: 38,
  },
  iconContainer: {
    width: 22,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    letterSpacing: -0.2,
  },
  directoryNameText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fileNameText: {
    fontWeight: '400',
    color: '#d0d7de',
  },
  nameTextSelected: {
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  pathSubtext: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  childCountBadge: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.textMuted,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.xs,
    marginRight: 4,
  },
  fileSizeText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginRight: 6,
  },
  actionMenuButton: {
    padding: 4,
    borderRadius: radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FileTreeItem;
