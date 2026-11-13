import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProjectFile } from '../../models';
import { getProjectFiles, saveFile, deleteFile } from '../../storage';
import { colors, spacing, radius, fontFamilies, fontSizes, shadows } from '../../theme';
import { FileTreeItem, FileTreeNode, getFileIconInfo, formatFileSize } from './FileTreeItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Validation regex: illegal filename characters in UNIX / Windows
const ILLEGAL_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/;

/**
 * Rich default files for initial preview, fallback, and testing
 */
export const DEFAULT_EXPLORER_FILES: ProjectFile[] = [
  {
    id: 'f-root-app',
    projectId: 'default-project',
    name: 'App.tsx',
    path: 'App.tsx',
    isDirectory: false,
    parentId: null,
    language: 'typescript',
    size: 2150,
    lastModified: new Date().toISOString(),
    content: `import React from 'react';\nimport { SafeAreaProvider } from 'react-native-safe-area-context';\nimport { HomeScreen } from './src/screens/HomeScreen';\n\nexport default function App() {\n  return (\n    <SafeAreaProvider>\n      <HomeScreen />\n    </SafeAreaProvider>\n  );\n}\n`,
  },
  {
    id: 'f-root-pkg',
    projectId: 'default-project',
    name: 'package.json',
    path: 'package.json',
    isDirectory: false,
    parentId: null,
    language: 'json',
    size: 720,
    lastModified: new Date().toISOString(),
    content: `{\n  "name": "arena-studio-project",\n  "version": "1.0.0",\n  "main": "index.js"\n}`,
  },
  {
    id: 'f-root-tsconfig',
    projectId: 'default-project',
    name: 'tsconfig.json',
    path: 'tsconfig.json',
    isDirectory: false,
    parentId: null,
    language: 'json',
    size: 340,
    lastModified: new Date().toISOString(),
    content: `{\n  "compilerOptions": {\n    "strict": true,\n    "jsx": "react-native"\n  }\n}`,
  },
  {
    id: 'f-root-readme',
    projectId: 'default-project',
    name: 'README.md',
    path: 'README.md',
    isDirectory: false,
    parentId: null,
    language: 'markdown',
    size: 1240,
    lastModified: new Date().toISOString(),
    content: `# ARENA STUDIO\n\nMobile AI Code Editor & Development Suite.\n`,
  },
  {
    id: 'd-src',
    projectId: 'default-project',
    name: 'src',
    path: 'src',
    isDirectory: true,
    parentId: null,
    language: '',
    size: 0,
    lastModified: new Date().toISOString(),
  },
  {
    id: 'd-components',
    projectId: 'default-project',
    name: 'components',
    path: 'src/components',
    isDirectory: true,
    parentId: 'd-src',
    language: '',
    size: 0,
    lastModified: new Date().toISOString(),
  },
  {
    id: 'f-comp-header',
    projectId: 'default-project',
    name: 'Header.tsx',
    path: 'src/components/Header.tsx',
    isDirectory: false,
    parentId: 'd-components',
    language: 'typescript',
    size: 1420,
    lastModified: new Date().toISOString(),
    content: `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport const Header = () => (\n  <View>\n    <Text>Header Component</Text>\n  </View>\n);`,
  },
  {
    id: 'f-comp-button',
    projectId: 'default-project',
    name: 'Button.tsx',
    path: 'src/components/Button.tsx',
    isDirectory: false,
    parentId: 'd-components',
    language: 'typescript',
    size: 1850,
    lastModified: new Date().toISOString(),
    content: `import React from 'react';\nimport { TouchableOpacity, Text } from 'react-native';\n\nexport const Button = ({ title, onPress }: any) => (\n  <TouchableOpacity onPress={onPress}>\n    <Text>{title}</Text>\n  </TouchableOpacity>\n);`,
  },
  {
    id: 'd-screens',
    projectId: 'default-project',
    name: 'screens',
    path: 'src/screens',
    isDirectory: true,
    parentId: 'd-src',
    language: '',
    size: 0,
    lastModified: new Date().toISOString(),
  },
  {
    id: 'f-scr-home',
    projectId: 'default-project',
    name: 'HomeScreen.tsx',
    path: 'src/screens/HomeScreen.tsx',
    isDirectory: false,
    parentId: 'd-screens',
    language: 'typescript',
    size: 2600,
    lastModified: new Date().toISOString(),
    content: `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport const HomeScreen = () => (\n  <View>\n    <Text>Home Screen</Text>\n  </View>\n);`,
  },
  {
    id: 'f-scr-settings',
    projectId: 'default-project',
    name: 'SettingsScreen.tsx',
    path: 'src/screens/SettingsScreen.tsx',
    isDirectory: false,
    parentId: 'd-screens',
    language: 'typescript',
    size: 1980,
    lastModified: new Date().toISOString(),
    content: `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport const SettingsScreen = () => (\n  <View>\n    <Text>Settings Screen</Text>\n  </View>\n);`,
  },
  {
    id: 'd-theme',
    projectId: 'default-project',
    name: 'theme',
    path: 'src/theme',
    isDirectory: true,
    parentId: 'd-src',
    language: '',
    size: 0,
    lastModified: new Date().toISOString(),
  },
  {
    id: 'f-theme-colors',
    projectId: 'default-project',
    name: 'colors.ts',
    path: 'src/theme/colors.ts',
    isDirectory: false,
    parentId: 'd-theme',
    language: 'typescript',
    size: 980,
    lastModified: new Date().toISOString(),
    content: `export const colors = {\n  bgPrimary: '#0d0f12',\n  accentPrimary: '#388bfd',\n};\n`,
  },
  {
    id: 'd-assets',
    projectId: 'default-project',
    name: 'assets',
    path: 'assets',
    isDirectory: true,
    parentId: null,
    language: '',
    size: 0,
    lastModified: new Date().toISOString(),
  },
  {
    id: 'f-asset-icon',
    projectId: 'default-project',
    name: 'icon.png',
    path: 'assets/icon.png',
    isDirectory: false,
    parentId: 'd-assets',
    language: 'binary',
    size: 16400,
    lastModified: new Date().toISOString(),
  },
  {
    id: 'f-asset-styles',
    projectId: 'default-project',
    name: 'styles.css',
    path: 'assets/styles.css',
    isDirectory: false,
    parentId: 'd-assets',
    language: 'css',
    size: 890,
    lastModified: new Date().toISOString(),
    content: `body {\n  margin: 0;\n  background-color: #0d0f12;\n}\n`,
  },
];

/**
 * Determine starter file template based on filename and extension
 */
export function getDefaultStarterContent(filename: string): string {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
  const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '');
  const cleanName = baseName.charAt(0).toUpperCase() + baseName.slice(1) || 'Component';

  switch (ext) {
    case 'tsx':
      return `import React from 'react';\nimport { StyleSheet, View, Text } from 'react-native';\n\nexport interface ${cleanName}Props {\n  title?: string;\n}\n\nexport const ${cleanName}: React.FC<${cleanName}Props> = ({ title = '${cleanName}' }) => {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.text}>{title}</Text>\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    padding: 16,\n  },\n  text: {\n    fontSize: 14,\n    color: '#f0f6fc',\n  },\n});\n\nexport default ${cleanName};\n`;
    case 'ts':
      return `/**\n * ${filename}\n */\n\nexport interface ${cleanName}Config {\n  id: string;\n  name: string;\n  enabled: boolean;\n}\n\nexport function init${cleanName}(): void {\n  console.log('${filename} initialized');\n}\n`;
    case 'jsx':
      return `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function ${cleanName}() {\n  return (\n    <View>\n      <Text>${cleanName}</Text>\n    </View>\n  );\n}\n`;
    case 'js':
      return `/**\n * ${filename}\n */\n\nmodule.exports = {\n  ready: true,\n};\n`;
    case 'json':
      return `{\n  "name": "${filename.replace('.json', '')}",\n  "version": "1.0.0"\n}\n`;
    case 'css':
    case 'scss':
      return `/* ${filename} */\n.container {\n  display: flex;\n  box-sizing: border-box;\n}\n`;
    case 'md':
      return `# ${cleanName}\n\nDocumentation for ${filename}.\n`;
    case 'html':
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${cleanName}</title>\n</head>\n<body>\n  <h1>${cleanName}</h1>\n</body>\n</html>\n`;
    default:
      return '';
  }
}

/**
 * Detect language string from file extension
 */
export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'html':
    case 'htm':
      return 'html';
    case 'py':
      return 'python';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return 'binary';
    default:
      return 'text';
  }
}

/**
 * Convert flat ProjectFile list into sorted hierarchical tree
 */
export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const nodeMap = new Map<string, FileTreeNode>();
  const pathToId = new Map<string, string>();

  // Initialize node entries
  files.forEach((f) => {
    nodeMap.set(f.id, {
      ...f,
      children: [],
      depth: 0,
      hasChildren: f.isDirectory,
    });
    if (f.isDirectory) {
      pathToId.set(f.path, f.id);
    }
  });

  const rootNodes: FileTreeNode[] = [];

  // Build parent-child relationships
  files.forEach((f) => {
    const node = nodeMap.get(f.id)!;
    let resolvedParentId = f.parentId;

    // If parentId is not explicitly set, attempt lookup via path hierarchy
    if (!resolvedParentId && f.path.includes('/')) {
      const parentPath = f.path.substring(0, f.path.lastIndexOf('/'));
      if (pathToId.has(parentPath)) {
        resolvedParentId = pathToId.get(parentPath)!;
      }
    }

    if (resolvedParentId && nodeMap.has(resolvedParentId)) {
      const parent = nodeMap.get(resolvedParentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
      parent.hasChildren = true;
    } else {
      rootNodes.push(node);
    }
  });

  // Recursive sort and depth assignment
  function sortAndAssignDepth(nodes: FileTreeNode[], depth: number) {
    nodes.sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      // Alphabetical case-insensitive
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    nodes.forEach((node) => {
      node.depth = depth;
      if (node.children && node.children.length > 0) {
        sortAndAssignDepth(node.children, depth + 1);
      }
    });
  }

  sortAndAssignDepth(rootNodes, 0);
  return rootNodes;
}

/**
 * Flatten tree for virtualized FlatList rendering respecting expanded state
 */
export function flattenVisibleTree(
  nodes: FileTreeNode[],
  expandedFolderIds: Set<string>,
  result: FileTreeNode[] = []
): FileTreeNode[] {
  for (const node of nodes) {
    result.push(node);
    if (node.isDirectory && expandedFolderIds.has(node.id) && node.children && node.children.length > 0) {
      flattenVisibleTree(node.children, expandedFolderIds, result);
    }
  }
  return result;
}

/**
 * Find all ancestor directory IDs of a given file or folder
 */
export function getAncestorFolderIds(fileId: string, files: ProjectFile[]): string[] {
  const fileMap = new Map(files.map((f) => [f.id, f]));
  const ancestors: string[] = [];
  let current = fileMap.get(fileId);

  while (current && current.parentId) {
    ancestors.push(current.parentId);
    current = fileMap.get(current.parentId);
  }
  return ancestors;
}

export interface FileExplorerProps {
  projectId?: string;
  files?: ProjectFile[];
  activeFileId?: string | null;
  onSelectFile?: (file: ProjectFile) => void;
  onCreateFile?: (newFile: ProjectFile) => Promise<void> | void;
  onCreateFolder?: (newFolder: ProjectFile) => Promise<void> | void;
  onRenameFile?: (fileId: string, newName: string, updatedFile: ProjectFile) => Promise<void> | void;
  onDeleteFile?: (fileId: string) => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
  headerTitle?: string;
  showHeader?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projectId = 'default-project',
  files: propsFiles,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
  onRefresh,
  headerTitle = 'EXPLORER',
  showHeader = true,
  style,
}) => {
  // Local project files state
  const [files, setFiles] = useState<ProjectFile[]>(propsFiles || DEFAULT_EXPLORER_FILES);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(activeFileId || null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);

  // Expanded folders state
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(['d-src', 'd-components', 'd-screens', 'd-theme', 'd-assets'])
  );

  // Modal Dialogs state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createTargetFolderId, setCreateTargetFolderId] = useState<string | null>(null);
  const [createNameInput, setCreateNameInput] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameTargetItem, setRenameTargetItem] = useState<ProjectFile | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState<ProjectFile | null>(null);

  const [isActionMenuOpen, setIsActionMenuOpen] = useState<boolean>(false);
  const [actionMenuItem, setActionMenuItem] = useState<FileTreeNode | null>(null);

  // Sync with prop files if passed
  useEffect(() => {
    if (propsFiles) {
      setFiles(propsFiles);
    }
  }, [propsFiles]);

  // Sync activeFileId prop
  useEffect(() => {
    if (activeFileId !== undefined) {
      setSelectedFileId(activeFileId);
      if (activeFileId) {
        // Auto-expand ancestors of active file
        const ancestors = getAncestorFolderIds(activeFileId, files);
        if (ancestors.length > 0) {
          setExpandedFolderIds((prev) => {
            const next = new Set(prev);
            ancestors.forEach((id) => next.add(id));
            return next;
          });
        }
      }
    }
  }, [activeFileId, files]);

  // Load from persistent storage on mount or projectId change if propsFiles not provided
  useEffect(() => {
    if (!propsFiles && projectId) {
      let isMounted = true;
      getProjectFiles(projectId)
        .then((loaded) => {
          if (isMounted && loaded && loaded.length > 0) {
            setFiles(loaded);
            // Default expand all top-level directories
            const folderIds = loaded.filter((f) => f.isDirectory).map((f) => f.id);
            setExpandedFolderIds(new Set(folderIds));
          }
        })
        .catch(() => {
          // Gracefully continue with defaults
        });
      return () => {
        isMounted = false;
      };
    }
  }, [projectId, propsFiles]);

  // All folders available for parent directory selection
  const folderList = useMemo(() => {
    return files
      .filter((f) => f.isDirectory)
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [files]);

  // Build hierarchical file tree
  const fileTree = useMemo(() => {
    return buildFileTree(files);
  }, [files]);

  // Flattened visible items for FlatList
  const visibleItems = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      return files
        .filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
        .map((f) => ({
          ...f,
          depth: 0,
          children: [],
          hasChildren: f.isDirectory,
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
    }
    return flattenVisibleTree(fileTree, expandedFolderIds);
  }, [fileTree, expandedFolderIds, files, searchQuery]);

  // Toggle folder expansion
  const handleToggleExpand = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Expand all folders
  const handleExpandAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const allFolderIds = files.filter((f) => f.isDirectory).map((f) => f.id);
    setExpandedFolderIds(new Set(allFolderIds));
  }, [files]);

  // Collapse all folders
  const handleCollapseAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpandedFolderIds(new Set());
  }, []);

  // Select file handler
  const handleSelectFile = useCallback(
    (item: FileTreeNode) => {
      setSelectedFileId(item.id);
      if (onSelectFile) {
        onSelectFile(item);
      }
    },
    [onSelectFile]
  );

  // Open context action menu
  const handleActionMenu = useCallback((item: FileTreeNode) => {
    setActionMenuItem(item);
    setIsActionMenuOpen(true);
  }, []);

  // Quick refresh
  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onRefresh) {
      await onRefresh();
    } else if (projectId) {
      try {
        const loaded = await getProjectFiles(projectId);
        if (loaded && loaded.length > 0) {
          setFiles(loaded);
        }
      } catch {
        // Fallback
      }
    }
  }, [onRefresh, projectId]);

  // Validate filename
  const validateItemName = (
    name: string,
    targetParentId: string | null,
    currentId?: string
  ): string | null => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return 'Name cannot be empty.';
    }
    if (ILLEGAL_CHARS_REGEX.test(trimmed)) {
      return 'Name contains invalid characters: < > : " / \\ | ? *';
    }
    // Check sibling duplicate
    const siblings = files.filter((f) => f.parentId === targetParentId && f.id !== currentId);
    const exists = siblings.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return 'An item with this name already exists in this folder.';
    }
    return null;
  };

  // Open Create Dialog
  const openCreateDialog = (type: 'file' | 'folder', defaultFolderId?: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCreateType(type);
    setCreateTargetFolderId(defaultFolderId !== undefined ? defaultFolderId : null);
    setCreateNameInput('');
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Confirm Create
  const handleConfirmCreate = async () => {
    const trimmedName = createNameInput.trim();
    const error = validateItemName(trimmedName, createTargetFolderId);
    if (error) {
      setCreateError(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    const parentFolder = files.find((f) => f.id === createTargetFolderId);
    const parentPath = parentFolder ? parentFolder.path : '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
    const isDir = createType === 'folder';

    const newFile: ProjectFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      name: trimmedName,
      path: newPath,
      isDirectory: isDir,
      parentId: createTargetFolderId,
      language: isDir ? '' : detectLanguage(trimmedName),
      size: isDir ? 0 : getDefaultStarterContent(trimmedName).length,
      lastModified: new Date().toISOString(),
      content: isDir ? undefined : getDefaultStarterContent(trimmedName),
    };

    try {
      // Save to storage
      await saveFile(newFile);
    } catch {
      // Storage save error ignored for in-memory operation
    }

    // Update local state
    setFiles((prev) => [...prev, newFile]);

    // If folder was targeted, ensure parent folder is expanded
    if (createTargetFolderId) {
      setExpandedFolderIds((prev) => new Set([...prev, createTargetFolderId]));
    }
    // If folder created, expand it too
    if (isDir) {
      setExpandedFolderIds((prev) => new Set([...prev, newFile.id]));
    } else {
      setSelectedFileId(newFile.id);
      onSelectFile?.(newFile);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsCreateModalOpen(false);

    if (isDir) {
      onCreateFolder?.(newFile);
    } else {
      onCreateFile?.(newFile);
    }
  };

  // Open Rename Dialog
  const openRenameDialog = (item: ProjectFile) => {
    setIsActionMenuOpen(false);
    setRenameTargetItem(item);
    setRenameInput(item.name);
    setRenameError(null);
    setIsRenameModalOpen(true);
  };

  // Confirm Rename
  const handleConfirmRename = async () => {
    if (!renameTargetItem) return;
    const trimmedName = renameInput.trim();
    const error = validateItemName(trimmedName, renameTargetItem.parentId, renameTargetItem.id);
    if (error) {
      setRenameError(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    const oldPath = renameTargetItem.path;
    const parentFolder = files.find((f) => f.id === renameTargetItem.parentId);
    const parentPath = parentFolder ? parentFolder.path : '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    const updatedItem: ProjectFile = {
      ...renameTargetItem,
      name: trimmedName,
      path: newPath,
      language: renameTargetItem.isDirectory ? '' : detectLanguage(trimmedName),
      lastModified: new Date().toISOString(),
    };

    // If directory, update descendant paths as well
    const updatedFilesList = files.map((f) => {
      if (f.id === renameTargetItem.id) return updatedItem;
      if (renameTargetItem.isDirectory && f.path.startsWith(`${oldPath}/`)) {
        const subPath = f.path.substring(oldPath.length);
        return {
          ...f,
          path: `${newPath}${subPath}`,
          lastModified: new Date().toISOString(),
        };
      }
      return f;
    });

    try {
      await saveFile(updatedItem);
      // Save modified descendants
      if (renameTargetItem.isDirectory) {
        for (const f of updatedFilesList) {
          if (f.path.startsWith(`${newPath}/`)) {
            await saveFile(f);
          }
        }
      }
    } catch {
      // In-memory fallback
    }

    setFiles(updatedFilesList);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsRenameModalOpen(false);
    onRenameFile?.(renameTargetItem.id, trimmedName, updatedItem);
  };

  // Open Delete Dialog
  const openDeleteDialog = (item: ProjectFile) => {
    setIsActionMenuOpen(false);
    setDeleteTargetItem(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetItem) return;
    const targetId = deleteTargetItem.id;
    const targetPath = deleteTargetItem.path;

    try {
      await deleteFile(targetId);
    } catch {
      // In-memory fallback
    }

    // Filter out target item and all children if directory
    const remainingFiles = files.filter((f) => {
      if (f.id === targetId) return false;
      if (deleteTargetItem.isDirectory) {
        if (f.parentId === targetId) return false;
        if (f.path.startsWith(`${targetPath}/`)) return false;
      }
      return true;
    });

    setFiles(remainingFiles);

    // If active file was inside deleted items, reset selection
    if (selectedFileId === targetId || (deleteTargetItem.isDirectory && files.find(f => f.id === selectedFileId)?.path.startsWith(`${targetPath}/`))) {
      setSelectedFileId(null);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsDeleteModalOpen(false);
    onDeleteFile?.(targetId);
  };

  // Duplicate File
  const handleDuplicateFile = async (item: ProjectFile) => {
    setIsActionMenuOpen(false);
    if (item.isDirectory) return;

    const parts = item.name.split('.');
    const ext = parts.length > 1 ? `.${parts.pop()}` : '';
    const base = parts.join('.');
    const copyName = `${base}_copy${ext}`;

    const parentFolder = files.find((f) => f.id === item.parentId);
    const parentPath = parentFolder ? parentFolder.path : '';
    const copyPath = parentPath ? `${parentPath}/${copyName}` : copyName;

    const duplicateItem: ProjectFile = {
      ...item,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: copyName,
      path: copyPath,
      lastModified: new Date().toISOString(),
    };

    try {
      await saveFile(duplicateItem);
    } catch {
      // In-memory fallback
    }

    setFiles((prev) => [...prev, duplicateItem]);
    setSelectedFileId(duplicateItem.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSelectFile?.(duplicateItem);
    onCreateFile?.(duplicateItem);
  };

  // Target directory name helper
  const getParentFolderName = (folderId: string | null): string => {
    if (!folderId) return '/ (root)';
    const folder = files.find((f) => f.id === folderId);
    return folder ? `${folder.path}/` : '/ (root)';
  };

  // Calculate number of child files inside a directory for delete warning
  const getChildItemsCount = (item: ProjectFile | null): number => {
    if (!item || !item.isDirectory) return 0;
    return files.filter(
      (f) => f.id !== item.id && (f.parentId === item.id || f.path.startsWith(`${item.path}/`))
    ).length;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Top Explorer Header & Action Bar */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="folder-open" size={16} color={colors.accentPrimary} />
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <View style={styles.fileCountPill}>
                <Text style={styles.fileCountPillText}>
                  {files.filter((f) => !f.isDirectory).length}
                </Text>
              </View>
            </View>

            {/* Quick Action Toolbar Buttons */}
            <View style={styles.headerActions}>
              {/* Search Toggle */}
              <TouchableOpacity
                style={[styles.headerActionButton, isSearchVisible && styles.headerActionButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setIsSearchVisible(!isSearchVisible);
                  if (isSearchVisible) setSearchQuery('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons
                  name={isSearchVisible ? 'search' : 'search-outline'}
                  size={16}
                  color={isSearchVisible ? colors.accentPrimary : colors.textSecondary}
                />
              </TouchableOpacity>

              {/* New File */}
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => openCreateDialog('file')}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <MaterialCommunityIcons
                  name="file-plus-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* New Folder */}
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => openCreateDialog('folder')}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <MaterialCommunityIcons
                  name="folder-plus-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Collapse/Expand All */}
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={expandedFolderIds.size > 0 ? handleCollapseAll : handleExpandAll}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons
                  name={expandedFolderIds.size > 0 ? 'contract-outline' : 'expand-outline'}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Refresh */}
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleRefresh}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Collapsible Filter / Search Bar */}
          {isSearchVisible && (
            <View style={styles.searchBarContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search-outline" size={15} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Filter by name or path..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="never"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {searchQuery.length > 0 && (
                <View style={styles.searchStatsBadge}>
                  <Text style={styles.searchStatsBadgeText}>
                    {visibleItems.length} {visibleItems.length === 1 ? 'match' : 'matches'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* File Tree List */}
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FileTreeItem
            item={item}
            depth={item.depth}
            isSelected={item.id === selectedFileId}
            isExpanded={expandedFolderIds.has(item.id)}
            onSelect={handleSelectFile}
            onToggleExpand={handleToggleExpand}
            onActionMenu={handleActionMenu}
            isSearching={searchQuery.trim().length > 0}
            searchQuery={searchQuery}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery.trim().length > 0 ? (
              <>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No matching files</Text>
                <Text style={styles.emptySubtitle}>
                  No files or folders matching &quot;{searchQuery}&quot;
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.emptyActionButtonText}>Clear Search</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="folder-open-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No files in project</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first file to start editing.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => openCreateDialog('file')}
                >
                  <Ionicons name="add" size={16} color={colors.white} />
                  <Text style={styles.emptyActionButtonText}>Create File</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      {/* ====================================================================== */}
      {/* MODAL: CREATE FILE / FOLDER                                            */}
      {/* ====================================================================== */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalDialogCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MaterialCommunityIcons
                  name={createType === 'file' ? 'file-plus-outline' : 'folder-plus-outline'}
                  size={20}
                  color={colors.accentPrimary}
                />
                <Text style={styles.modalTitle}>
                  {createType === 'file' ? 'New File' : 'New Folder'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Target Location Directory Badge */}
            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>Location:</Text>
              <View style={styles.locationPill}>
                <Ionicons name="folder" size={12} color="#e3b341" />
                <Text style={styles.locationPillText}>
                  {getParentFolderName(createTargetFolderId)}
                </Text>
              </View>
            </View>

            {/* Parent Directory Selector (if multiple exist) */}
            {folderList.length > 0 && (
              <View style={styles.folderPickerRow}>
                <TouchableOpacity
                  style={[
                    styles.folderPickerChip,
                    createTargetFolderId === null && styles.folderPickerChipActive,
                  ]}
                  onPress={() => setCreateTargetFolderId(null)}
                >
                  <Text
                    style={[
                      styles.folderPickerChipText,
                      createTargetFolderId === null && styles.folderPickerChipTextActive,
                    ]}
                  >
                    / (root)
                  </Text>
                </TouchableOpacity>
                {folderList.slice(0, 4).map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.folderPickerChip,
                      createTargetFolderId === f.id && styles.folderPickerChipActive,
                    ]}
                    onPress={() => setCreateTargetFolderId(f.id)}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.folderPickerChipText,
                        createTargetFolderId === f.id && styles.folderPickerChipTextActive,
                      ]}
                    >
                      {f.name}/
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Input Field */}
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                value={createNameInput}
                onChangeText={(text) => {
                  setCreateNameInput(text);
                  if (createError) setCreateError(null);
                }}
                placeholder={
                  createType === 'file' ? 'e.g. NavigationBar.tsx' : 'e.g. components'
                }
                placeholderTextColor={colors.textMuted}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Quick Extension Pills for Files */}
            {createType === 'file' && (
              <View style={styles.extQuickPickRow}>
                {['.tsx', '.ts', '.json', '.css', '.md'].map((ext) => (
                  <TouchableOpacity
                    key={ext}
                    style={styles.extChip}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      if (!createNameInput.includes('.')) {
                        setCreateNameInput(
                          (createNameInput.trim() || 'NewComponent') + ext
                        );
                      } else {
                        const base = createNameInput.substring(
                          0,
                          createNameInput.lastIndexOf('.')
                        );
                        setCreateNameInput((base || 'NewComponent') + ext);
                      }
                      if (createError) setCreateError(null);
                    }}
                  >
                    <Text style={styles.extChipText}>{ext}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Error Message */}
            {createError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={14} color={colors.error} />
                <Text style={styles.errorBannerText}>{createError}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  createNameInput.trim().length === 0 && styles.modalPrimaryButtonDisabled,
                ]}
                onPress={handleConfirmCreate}
                disabled={createNameInput.trim().length === 0}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {createType === 'file' ? 'Create File' : 'Create Folder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL: RENAME FILE / FOLDER                                            */}
      {/* ====================================================================== */}
      <Modal
        visible={isRenameModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalDialogCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="pencil-outline" size={18} color={colors.accentPrimary} />
                <Text style={styles.modalTitle}>
                  Rename {renameTargetItem?.isDirectory ? 'Folder' : 'File'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsRenameModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {renameTargetItem && (
              <View style={styles.locationContainer}>
                <Text style={styles.locationLabel}>Current path:</Text>
                <Text style={styles.locationPillText} numberOfLines={1}>
                  {renameTargetItem.path}
                </Text>
              </View>
            )}

            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                value={renameInput}
                onChangeText={(text) => {
                  setRenameInput(text);
                  if (renameError) setRenameError(null);
                }}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {renameError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={14} color={colors.error} />
                <Text style={styles.errorBannerText}>{renameError}</Text>
              </View>
            )}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setIsRenameModalOpen(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  renameInput.trim().length === 0 && styles.modalPrimaryButtonDisabled,
                ]}
                onPress={handleConfirmRename}
                disabled={renameInput.trim().length === 0}
              >
                <Text style={styles.modalPrimaryButtonText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                             */}
      {/* ====================================================================== */}
      <Modal
        visible={isDeleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialogCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.modalTitle, { color: colors.error }]}>
                  Delete {deleteTargetItem?.isDirectory ? 'Folder' : 'File'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDeleteModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.deleteWarningBody}>
              <Text style={styles.deleteWarningMessage}>
                Are you sure you want to permanently delete{' '}
                <Text style={styles.deleteTargetHighlight}>
                  &quot;{deleteTargetItem?.name}&quot;
                </Text>
                ?
              </Text>

              {deleteTargetItem?.isDirectory && (
                <View style={styles.deleteFolderAlertBox}>
                  <Ionicons name="warning-outline" size={16} color={colors.warning} />
                  <Text style={styles.deleteFolderAlertText}>
                    This folder contains {getChildItemsCount(deleteTargetItem)} item(s) that
                    will also be deleted. This action cannot be undone.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setIsDeleteModalOpen(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDangerButton}
                onPress={handleConfirmDelete}
              >
                <Ionicons name="trash-outline" size={16} color={colors.white} />
                <Text style={styles.modalDangerButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL: ITEM CONTEXT ACTION SHEET                                       */}
      {/* ====================================================================== */}
      <Modal
        visible={isActionMenuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsActionMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setIsActionMenuOpen(false)}
        >
          <View style={styles.actionSheetContent} onStartShouldSetResponder={() => true}>
            {/* Sheet Handle */}
            <View style={styles.sheetDragHandle} />

            {/* Item Title & Info Header */}
            {actionMenuItem && (
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderRow}>
                  <Text style={styles.sheetItemTitle} numberOfLines={1}>
                    {actionMenuItem.name}
                  </Text>
                  <Text style={styles.sheetItemTypeBadge}>
                    {actionMenuItem.isDirectory ? 'DIRECTORY' : actionMenuItem.language || 'FILE'}
                  </Text>
                </View>
                <Text style={styles.sheetItemPath} numberOfLines={1}>
                  {actionMenuItem.path}
                </Text>
              </View>
            )}

            {/* Menu Options */}
            <View style={styles.sheetMenuList}>
              {actionMenuItem?.isDirectory ? (
                <>
                  <TouchableOpacity
                    style={styles.sheetMenuItem}
                    onPress={() => {
                      setIsActionMenuOpen(false);
                      openCreateDialog('file', actionMenuItem.id);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="file-plus-outline"
                      size={20}
                      color={colors.accentPrimary}
                    />
                    <Text style={styles.sheetMenuItemText}>New File in folder</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetMenuItem}
                    onPress={() => {
                      setIsActionMenuOpen(false);
                      openCreateDialog('folder', actionMenuItem.id);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="folder-plus-outline"
                      size={20}
                      color="#e3b341"
                    />
                    <Text style={styles.sheetMenuItemText}>New Subfolder</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.sheetMenuItem}
                  onPress={() => {
                    if (actionMenuItem) handleDuplicateFile(actionMenuItem);
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.accentCyan} />
                  <Text style={styles.sheetMenuItemText}>Duplicate File</Text>
                </TouchableOpacity>
              )}

              {/* Rename */}
              <TouchableOpacity
                style={styles.sheetMenuItem}
                onPress={() => {
                  if (actionMenuItem) openRenameDialog(actionMenuItem);
                }}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.accentPrimary} />
                <Text style={styles.sheetMenuItemText}>Rename</Text>
              </TouchableOpacity>

              {/* Copy Path */}
              <TouchableOpacity
                style={styles.sheetMenuItem}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  setIsActionMenuOpen(false);
                  Alert.alert('Path Copied', actionMenuItem?.path || '');
                }}
              >
                <Ionicons name="clipboard-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.sheetMenuItemText}>Copy Relative Path</Text>
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                style={[styles.sheetMenuItem, styles.sheetMenuItemDanger]}
                onPress={() => {
                  if (actionMenuItem) openDeleteDialog(actionMenuItem);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.sheetMenuItemText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.sheetCancelButton}
              onPress={() => setIsActionMenuOpen(false)}
            >
              <Text style={styles.sheetCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 38,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  fileCountPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    marginLeft: 6,
  },
  fileCountPillText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  headerActionButtonActive: {
    backgroundColor: colors.bgTertiary,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 34,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
    marginLeft: spacing.xs,
  },
  searchStatsBadge: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  searchStatsBadgeText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.accentPrimary,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  emptyActionButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.white,
  },

  // Modal dialog styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalDialogCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    ...shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  locationLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: 4,
  },
  locationPillText: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.textPrimary,
  },
  folderPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  folderPickerChip: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  folderPickerChipActive: {
    backgroundColor: 'rgba(56, 139, 253, 0.2)',
    borderColor: colors.accentPrimary,
  },
  folderPickerChipText: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.textSecondary,
  },
  folderPickerChipTextActive: {
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  modalInputWrapper: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 2,
    marginBottom: spacing.md,
  },
  modalInput: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    height: 38,
  },
  extQuickPickRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  extChip: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  extChipText: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.accentPrimary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.35)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorBannerText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.error,
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalSecondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
  },
  modalSecondaryButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  modalPrimaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
  },
  modalPrimaryButtonDisabled: {
    opacity: 0.5,
  },
  modalPrimaryButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.white,
  },
  deleteWarningBody: {
    marginBottom: spacing.lg,
  },
  deleteWarningMessage: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  deleteTargetHighlight: {
    fontFamily: fontFamilies.mono,
    fontWeight: '700',
    color: colors.accentPrimary,
  },
  deleteFolderAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(210, 153, 34, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(210, 153, 34, 0.35)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  deleteFolderAlertText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.warning,
    flex: 1,
    lineHeight: 18,
  },
  modalDangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    gap: spacing.xs,
  },
  modalDangerButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.white,
  },

  // Action sheet styles
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.bottomSheet,
  },
  sheetDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetItemTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  sheetItemTypeBadge: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: '600',
    color: colors.accentPrimary,
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  sheetItemPath: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  sheetMenuList: {
    paddingVertical: spacing.xs,
  },
  sheetMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  sheetMenuItemDanger: {
    marginTop: spacing.xs,
  },
  sheetMenuItemText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  sheetCancelButton: {
    backgroundColor: colors.bgTertiary,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  sheetCancelButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default FileExplorer;
