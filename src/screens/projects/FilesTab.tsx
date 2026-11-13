import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { Button, Card, Badge } from '../../components/ui';
import { Project, ProjectFile } from '../../models';
import { getProjectFiles } from '../../storage';

export interface FilesTabProps {
  project: Project;
  onOpenIDE?: (project: Project, file?: ProjectFile) => void;
}

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  file?: ProjectFile;
  children: TreeNode[];
  level: number;
}

export const FilesTab: React.FC<FilesTabProps> = ({ project, onOpenIDE }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);

  // Load project files from storage
  useEffect(() => {
    let isMounted = true;

    async function loadFiles() {
      try {
        setLoading(true);
        const projectFiles = await getProjectFiles(project.id);
        if (isMounted) {
          if (projectFiles && projectFiles.length > 0) {
            setFiles(projectFiles);
            // Default select the primary file if available
            const mainFile = projectFiles.find(
              (f) => !f.isDirectory && (f.name === 'App.tsx' || f.name === 'index.ts' || f.name === 'package.json')
            );
            if (mainFile) setSelectedFile(mainFile);
          } else {
            // Generate synthetic default files if project has no recorded files yet
            const defaultFiles: ProjectFile[] = [
              {
                id: `${project.id}-pkg`,
                projectId: project.id,
                path: 'package.json',
                name: 'package.json',
                isDirectory: false,
                parentId: null,
                language: 'json',
                size: 720,
                lastModified: project.lastModified || new Date().toISOString(),
                content: `{\n  "name": "${project.name.toLowerCase().replace(/\\s+/g, '-')}",\n  "version": "1.0.0",\n  "framework": "${project.framework}"\n}`,
              },
              {
                id: `${project.id}-app`,
                projectId: project.id,
                path: 'App.tsx',
                name: 'App.tsx',
                isDirectory: false,
                parentId: null,
                language: 'typescript',
                size: 1450,
                lastModified: project.lastModified || new Date().toISOString(),
                content: `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function App() {\n  return (\n    <View>\n      <Text>${project.name}</Text>\n    </View>\n  );\n}`,
              },
              {
                id: `${project.id}-src`,
                projectId: project.id,
                path: 'src',
                name: 'src',
                isDirectory: true,
                parentId: null,
                language: 'directory',
                size: 0,
                lastModified: project.lastModified || new Date().toISOString(),
              },
              {
                id: `${project.id}-index`,
                projectId: project.id,
                path: 'src/index.ts',
                name: 'index.ts',
                isDirectory: false,
                parentId: `${project.id}-src`,
                language: 'typescript',
                size: 890,
                lastModified: project.lastModified || new Date().toISOString(),
                content: `export * from './App';`,
              },
              {
                id: `${project.id}-readme`,
                projectId: project.id,
                path: 'README.md',
                name: 'README.md',
                isDirectory: false,
                parentId: null,
                language: 'markdown',
                size: 512,
                lastModified: project.lastModified || new Date().toISOString(),
                content: `# ${project.name}\n\n${project.description}`,
              },
            ];
            setFiles(defaultFiles);
            setSelectedFile(defaultFiles[1]);
          }
        }
      } catch (err) {
        console.warn('Failed to load project files:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFiles();

    return () => {
      isMounted = false;
    };
  }, [project.id, project.name, project.description, project.framework, project.lastModified]);

  // Build tree data structure from flat project files
  const fileTree = useMemo(() => {
    const rootNodes: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    // Filter files if search is active
    const filteredFiles = searchQuery.trim()
      ? files.filter(
          (f) =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.path.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : files;

    // Create tree nodes
    filteredFiles.forEach((file) => {
      const parts = file.path.split('/');
      let currentPath = '';

      parts.forEach((part, index) => {
        const isLeaf = index === parts.length - 1;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const isDir = !isLeaf || file.isDirectory;
          const newNode: TreeNode = {
            id: isLeaf ? file.id : `dir-${currentPath}`,
            name: part,
            path: currentPath,
            isDirectory: isDir,
            file: isLeaf ? file : undefined,
            children: [],
            level: index,
          };
          nodeMap.set(currentPath, newNode);

          if (parentPath && nodeMap.has(parentPath)) {
            const parent = nodeMap.get(parentPath)!;
            // Prevent duplicate children
            if (!parent.children.find((c) => c.path === newNode.path)) {
              parent.children.push(newNode);
            }
          } else if (index === 0) {
            // Root node
            if (!rootNodes.find((r) => r.path === newNode.path)) {
              rootNodes.push(newNode);
            }
          }
        }
      });
    });

    // Sort folders first, then alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((n) => sortNodes(n.children));
    };

    sortNodes(rootNodes);
    return rootNodes;
  }, [files, searchQuery]);

  const toggleCollapse = (path: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setCollapsedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const expandAll = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCollapsedPaths({});
  };

  const collapseAll = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const newCollapsed: Record<string, boolean> = {};
    files.forEach((f) => {
      if (f.isDirectory) newCollapsed[f.path] = true;
    });
    setCollapsedPaths(newCollapsed);
  };

  const handleSelectFile = (file?: ProjectFile) => {
    if (!file) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedFile(file);
  };

  const handleOpenInIDE = (file?: ProjectFile) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onOpenIDE?.(project, file || selectedFile || undefined);
  };

  // Helper for file type icons
  const getFileIcon = (fileName: string, isDir: boolean, isExpanded: boolean) => {
    if (isDir) {
      return (
        <Ionicons
          name={isExpanded ? 'folder-open' : 'folder'}
          size={16}
          color={colors.accentPrimary}
        />
      );
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <Ionicons name="code-slash" size={16} color={colors.accentCyan} />;
      case 'js':
      case 'jsx':
        return <Ionicons name="logo-javascript" size={16} color={colors.accentYellow} />;
      case 'json':
        return <Ionicons name="document-text-outline" size={16} color={colors.accentOrange} />;
      case 'md':
        return <Ionicons name="reader-outline" size={16} color={colors.textSecondary} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'svg':
        return <Ionicons name="image-outline" size={16} color={colors.accentGreen} />;
      default:
        return <Ionicons name="document-outline" size={16} color={colors.secondary} />;
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Recursive renderer for tree nodes
  const renderTreeNode = (node: TreeNode) => {
    const isCollapsed = !!collapsedPaths[node.path];
    const isSelected = selectedFile?.path === node.path;
    const paddingLeft = node.level * 18 + 8;

    return (
      <View key={node.path} style={styles.treeNodeWrapper}>
        <TouchableOpacity
          style={[
            styles.treeNodeRow,
            { paddingLeft },
            isSelected && styles.treeNodeRowSelected,
          ]}
          activeOpacity={0.7}
          onPress={() => {
            if (node.isDirectory) {
              toggleCollapse(node.path);
            } else {
              handleSelectFile(node.file);
            }
          }}
        >
          {/* Indent Guide Line */}
          {node.level > 0 && <View style={[styles.treeIndentGuide, { left: (node.level - 1) * 18 + 14 }]} />}

          {/* Directory chevron */}
          {node.isDirectory ? (
            <Ionicons
              name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
              size={14}
              color={colors.textSecondary}
              style={styles.chevronIcon}
            />
          ) : (
            <View style={styles.chevronPlaceholder} />
          )}

          {/* File / Folder icon */}
          <View style={styles.nodeIcon}>
            {getFileIcon(node.name, node.isDirectory, !isCollapsed)}
          </View>

          {/* Label */}
          <Text
            style={[
              styles.nodeName,
              node.isDirectory ? styles.dirName : styles.fileName,
              isSelected && styles.nodeNameSelected,
            ]}
            numberOfLines={1}
          >
            {node.name}
          </Text>

          {/* File size badge for non-directories */}
          {!node.isDirectory && node.file?.size ? (
            <Text style={styles.nodeSize}>{formatSize(node.file.size)}</Text>
          ) : null}
        </TouchableOpacity>

        {/* Children if directory and not collapsed */}
        {node.isDirectory && !isCollapsed && (
          <View style={styles.treeChildren}>
            {node.children.map((child) => renderTreeNode(child))}
          </View>
        )}
      </View>
    );
  };

  const actualFileCount = files.filter((f) => !f.isDirectory).length;
  const directoryCount = files.filter((f) => f.isDirectory).length;

  return (
    <View style={styles.container}>
      {/* 1. Header Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarSummary}>
          <Text style={styles.toolbarTitle}>EXPLORER</Text>
          <Text style={styles.toolbarSubtitle}>
            {actualFileCount} files • {directoryCount} folders
          </Text>
        </View>

        <View style={styles.toolbarActions}>
          <TouchableOpacity onPress={expandAll} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="expand-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={collapseAll} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="contract-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <Button
            title="Open in IDE"
            size="sm"
            variant="primary"
            iconName="code-slash"
            onPress={() => handleOpenInIDE()}
            style={styles.openIDEBtn}
          />
        </View>
      </View>

      {/* 2. Search & Filter Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={14} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter files by name or path..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
            <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 3. Tree Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accentPrimary} />
          <Text style={styles.loadingText}>Reading project filesystem...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.treeScroll}
          contentContainerStyle={styles.treeScrollContent}
          showsVerticalScrollIndicator={true}
        >
          {fileTree.length === 0 ? (
            <View style={styles.emptySearch}>
              <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptySearchTitle}>No matching files found</Text>
              <Text style={styles.emptySearchText}>
                No files matched '{searchQuery}'. Try another query.
              </Text>
            </View>
          ) : (
            fileTree.map((node) => renderTreeNode(node))
          )}
        </ScrollView>
      )}

      {/* 4. Bottom Selected File Inspector Card */}
      {selectedFile ? (
        <View style={styles.inspectorContainer}>
          <View style={styles.inspectorHeader}>
            <View style={styles.inspectorFileMeta}>
              <View style={styles.inspectorIcon}>
                {getFileIcon(selectedFile.name, false, false)}
              </View>
              <View style={styles.inspectorTitleCol}>
                <Text style={styles.inspectorFileName}>{selectedFile.name}</Text>
                <Text style={styles.inspectorFilePath} numberOfLines={1}>
                  {selectedFile.path}
                </Text>
              </View>
            </View>
            <Button
              title="Edit File"
              size="sm"
              variant="secondary"
              iconName="create-outline"
              onPress={() => handleOpenInIDE(selectedFile)}
            />
          </View>

          {/* File details tags */}
          <View style={styles.inspectorTags}>
            <Badge
              label={(selectedFile.language || 'text').toUpperCase()}
              status="info"
              size="xs"
            />
            {selectedFile.size ? (
              <Badge
                label={formatSize(selectedFile.size)}
                status="default"
                size="xs"
              />
            ) : null}
            <Text style={styles.inspectorModified}>
              Updated: {new Date(selectedFile.lastModified || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {/* Quick content snippet preview */}
          {selectedFile.content ? (
            <View style={styles.codeSnippetContainer}>
              <Text style={styles.codeSnippetText} numberOfLines={4}>
                {selectedFile.content}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgSecondary,
  },
  toolbarSummary: {
    flex: 1,
  },
  toolbarTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  toolbarSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    marginTop: 2,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    padding: spacing.xs,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.sm,
  },
  openIDEBtn: {
    paddingHorizontal: spacing.sm,
    height: 32,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.primary,
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: spacing.xs,
  },

  // Tree View
  treeScroll: {
    flex: 1,
  },
  treeScrollContent: {
    paddingVertical: spacing.xs,
    paddingBottom: 20,
  },
  treeNodeWrapper: {
    position: 'relative',
  },
  treeNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingRight: spacing.md,
    borderRadius: radius.sm,
    marginHorizontal: 4,
  },
  treeNodeRowSelected: {
    backgroundColor: colors.bgTertiary,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentPrimary,
  },
  treeIndentGuide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.borderSubtle,
  },
  chevronIcon: {
    width: 16,
    marginRight: 2,
  },
  chevronPlaceholder: {
    width: 16,
    marginRight: 2,
  },
  nodeIcon: {
    marginRight: spacing.xs,
  },
  nodeName: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    flex: 1,
  },
  dirName: {
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
  fileName: {
    color: colors.textSecondary,
  },
  nodeNameSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  nodeSize: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  treeChildren: {
    position: 'relative',
  },

  // Inspector
  inspectorContainer: {
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  inspectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  inspectorFileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  inspectorIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  inspectorTitleCol: {
    flex: 1,
  },
  inspectorFileName: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  inspectorFilePath: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
  },
  inspectorTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  inspectorModified: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs - 2,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  codeSnippetContainer: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  codeSnippetText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.textCode,
    lineHeight: 16,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptySearchTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  emptySearchText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
