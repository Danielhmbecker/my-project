import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontFamilies, fontSizes, spacing, radius, shadows } from '../../theme';
import { ProjectFile } from '../../models';
import EditorTabs, { EditorTabItem } from './EditorTabs';
import LineNumbers, { LineMarker } from './LineNumbers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LINE_HEIGHT = 22;
const FONT_SIZE = 13.5;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 8;

// Developer keyboard accessory characters
const DEVELOPER_KEYS = [
  '{', '}', '[', ']', '(', ')', ';', ':', '=', '<', '>', '/', '"', "'", '$', '.',
  '⇥', '//', '=>', '!', '&', '|', '_',
];

// Rich default sample files for standalone rendering / initial state
const DEFAULT_FILES: ProjectFile[] = [
  {
    id: 'file-app-tsx',
    projectId: 'demo-proj-1',
    path: 'src/App.tsx',
    name: 'App.tsx',
    isDirectory: false,
    parentId: null,
    language: 'typescript',
    size: 1420,
    lastModified: new Date().toISOString(),
    content: `import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [count, setCount] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'ready' | 'running'>('ready');

  useEffect(() => {
    console.log('[ARENA STUDIO] Mobile engine initialized.');
  }, []);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.title}>ARENA STUDIO</Text>
          <Text style={styles.subtitle}>Mobile Cloud IDE & Multi-Agent Workspace</Text>
        </View>

        <View style={styles.counterCard}>
          <Text style={styles.counterLabel}>Action Counter</Text>
          <Text style={styles.counterValue}>{count}</Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleIncrement}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Increment State</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f12',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f0f6fc',
  },
  subtitle: {
    fontSize: 14,
    color: '#8b949e',
    marginTop: 4,
  },
  counterCard: {
    backgroundColor: '#16191f',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
  },
  counterLabel: {
    color: '#8b949e',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  counterValue: {
    color: '#388bfd',
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#388bfd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
`,
  },
  {
    id: 'file-package-json',
    projectId: 'demo-proj-1',
    path: 'package.json',
    name: 'package.json',
    isDirectory: false,
    parentId: null,
    language: 'json',
    size: 680,
    lastModified: new Date().toISOString(),
    content: `{
  "name": "arena-studio-app",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "react-native-safe-area-context": "4.12.0",
    "@expo/vector-icons": "^14.0.4"
  }
}
`,
  },
  {
    id: 'file-theme-ts',
    projectId: 'demo-proj-1',
    path: 'src/theme.ts',
    name: 'theme.ts',
    isDirectory: false,
    parentId: null,
    language: 'typescript',
    size: 420,
    lastModified: new Date().toISOString(),
    content: `export const colors = {
  bgPrimary: '#0d0f12',
  bgSecondary: '#16191f',
  bgTertiary: '#21262d',
  border: '#30363d',
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  accentPrimary: '#388bfd',
  accentPurple: '#8957e5',
  accentCyan: '#39c5cf',
  success: '#3fb950',
  warning: '#d29922',
  error: '#f85149',
} as const;

export default colors;
`,
  },
];

// Default diagnostics for demonstration
const DEFAULT_DIAGNOSTICS: Record<string, LineMarker[]> = {
  'file-app-tsx': [
    {
      line: 6,
      type: 'warning',
      message: "Variable 'status' is declared but its value is never read.",
    },
  ],
};

export interface CodeEditorProps {
  files?: ProjectFile[];
  activeFileId?: string;
  onFileSelect?: (fileId: string) => void;
  onSave?: (fileId: string, content: string) => void;
  onCloseFile?: (fileId: string) => void;
  onNewFile?: () => void;
  onToggleDevTools?: () => void;
  onToggleExplorer?: () => void;
  onRunPreview?: () => void;
  diagnostics?: Record<string, LineMarker[]>;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files: initialFilesProp,
  activeFileId: initialActiveIdProp,
  onFileSelect,
  onSave,
  onCloseFile,
  onNewFile,
  onToggleDevTools,
  onToggleExplorer,
  onRunPreview,
  diagnostics: externalDiagnostics,
  readOnly = false,
}) => {
  // File state
  const [files, setFiles] = useState<ProjectFile[]>(() => {
    return initialFilesProp && initialFilesProp.length > 0
      ? initialFilesProp
      : DEFAULT_FILES;
  });

  // Track active file ID
  const [activeId, setActiveId] = useState<string>(() => {
    if (initialActiveIdProp) return initialActiveIdProp;
    return initialFilesProp && initialFilesProp.length > 0
      ? initialFilesProp[0].id
      : DEFAULT_FILES[0].id;
  });

  // Track unsaved contents for each open file: { [fileId]: editedContent }
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});

  // Active file resolved object
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeId) || files[0] || null;
  }, [files, activeId]);

  // Current content of active file
  const currentContent = useMemo(() => {
    if (!activeFile) return '';
    if (editedContents[activeFile.id] !== undefined) {
      return editedContents[activeFile.id];
    }
    return activeFile.content || '';
  }, [activeFile, editedContents]);

  // Check dirty state: compares edited content with activeFile.content
  const isDirty = useMemo(() => {
    if (!activeFile) return false;
    const edited = editedContents[activeFile.id];
    if (edited === undefined) return false;
    return edited !== (activeFile.content || '');
  }, [activeFile, editedContents]);

  // Text selection & cursor tracking
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  // Search state
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState<boolean>(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Selected diagnostic marker for banner display
  const [selectedMarker, setSelectedMarker] = useState<LineMarker | null>(null);

  // Saved notification feedback
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Refs
  const textInputRef = useRef<TextInput>(null);
  const verticalScrollRef = useRef<ScrollView>(null);

  // Calculate lines & total lines
  const lines = useMemo(() => {
    return currentContent.split('\n');
  }, [currentContent]);

  const totalLines = useMemo(() => {
    return lines.length;
  }, [lines]);

  // Calculate line where cursor is located
  const currentLine = useMemo(() => {
    const textBeforeCursor = currentContent.substring(0, selection.start);
    return (textBeforeCursor.match(/\n/g) || []).length + 1;
  }, [currentContent, selection.start]);

  // Max line length for horizontal width estimation
  const maxLineLength = useMemo(() => {
    let max = 20;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > max) {
        max = lines[i].length;
      }
    }
    return max;
  }, [lines]);

  // Merge external and default diagnostics
  const allDiagnostics = useMemo(() => {
    return externalDiagnostics || DEFAULT_DIAGNOSTICS;
  }, [externalDiagnostics]);

  const activeFileMarkers = useMemo(() => {
    if (!activeFile) return [];
    const markers = allDiagnostics[activeFile.id] || [];

    // Optional lightweight JSON syntax check
    if (activeFile.name.endsWith('.json')) {
      try {
        JSON.parse(currentContent);
      } catch (err: any) {
        // extract line number from message if possible
        const match = err?.message?.match(/at position (\d+)/);
        let errorLine = 1;
        if (match) {
          const pos = parseInt(match[1], 10);
          errorLine = (currentContent.substring(0, pos).match(/\n/g) || []).length + 1;
        }
        return [
          ...markers,
          {
            line: errorLine,
            type: 'error' as const,
            message: `JSON Syntax Error: ${err?.message || 'Invalid JSON syntax'}`,
          },
        ];
      }
    }

    return markers;
  }, [activeFile, allDiagnostics, currentContent]);

  // Build tabs for EditorTabs component
  const editorTabs = useMemo<EditorTabItem[]>(() => {
    return files.map((f) => {
      const edited = editedContents[f.id];
      const dirty = edited !== undefined && edited !== (f.content || '');
      const markers = allDiagnostics[f.id] || [];
      const hasErrors = markers.some((m) => m.type === 'error');
      const hasWarnings = markers.some((m) => m.type === 'warning');

      return {
        id: f.id,
        name: f.name,
        path: f.path,
        isDirty: dirty,
        language: f.language,
        hasErrors,
        hasWarnings,
      };
    });
  }, [files, editedContents, allDiagnostics]);

  // Find all matches for search query
  const searchMatches = useMemo(() => {
    if (!searchQuery) return [];

    const matches: { index: number; line: number }[] = [];
    const source = searchCaseSensitive ? currentContent : currentContent.toLowerCase();
    const query = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase();

    let pos = 0;
    while ((pos = source.indexOf(query, pos)) !== -1) {
      const textBefore = currentContent.substring(0, pos);
      const lineNum = (textBefore.match(/\n/g) || []).length + 1;
      matches.push({ index: pos, line: lineNum });
      pos += query.length;
    }

    return matches;
  }, [currentContent, searchQuery, searchCaseSensitive]);

  // Switch Tab Handler
  const handleSelectTab = (tabId: string) => {
    setActiveId(tabId);
    setSelectedMarker(null);
    if (onFileSelect) {
      onFileSelect(tabId);
    }
  };

  // Close Tab Handler
  const handleCloseTab = (tabId: string) => {
    const fileToClose = files.find((f) => f.id === tabId);
    const edited = editedContents[tabId];
    const isUnsaved = edited !== undefined && edited !== (fileToClose?.content || '');

    const performClose = () => {
      const nextFiles = files.filter((f) => f.id !== tabId);
      if (nextFiles.length === 0) {
        Alert.alert('Cannot Close', 'At least one file must remain open.');
        return;
      }
      setFiles(nextFiles);
      if (activeId === tabId) {
        setActiveId(nextFiles[0].id);
      }
      // Clean up edited state for this file
      setEditedContents((prev) => {
        const copy = { ...prev };
        delete copy[tabId];
        return copy;
      });
      if (onCloseFile) {
        onCloseFile(tabId);
      }
    };

    if (isUnsaved) {
      Alert.alert(
        'Unsaved Changes',
        `Do you want to discard unsaved changes to "${fileToClose?.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard & Close', style: 'destructive', onPress: performClose },
        ]
      );
    } else {
      performClose();
    }
  };

  // Content Change Handler
  const handleContentChange = (text: string) => {
    if (!activeFile) return;
    setEditedContents((prev) => ({
      ...prev,
      [activeFile.id]: text,
    }));
  };

  // Selection change
  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    setSelection(e.nativeEvent.selection);
  };

  // Explicit Save Action
  const handleSave = useCallback(() => {
    if (!activeFile || !isDirty) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Update activeFile.content in files list
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: currentContent } : f))
    );

    // Clear dirty state for this file
    setEditedContents((prev) => {
      const copy = { ...prev };
      delete copy[activeFile.id];
      return copy;
    });

    if (onSave) {
      onSave(activeFile.id, currentContent);
    }

    // Show temporary feedback toast
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2000);
  }, [activeFile, isDirty, currentContent, onSave]);

  // Search Navigation: Next Match
  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(searchMatches[nextIdx]);
  };

  // Search Navigation: Previous Match
  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(searchMatches[prevIdx]);
  };

  const scrollToMatch = (match: { index: number; line: number }) => {
    if (!match) return;
    setSelection({
      start: match.index,
      end: match.index + searchQuery.length,
    });
    // Scroll vertical container to match line
    const targetY = Math.max(0, (match.line - 3) * LINE_HEIGHT);
    verticalScrollRef.current?.scrollTo({ y: targetY, animated: true });
  };

  // Developer Keyboard Accessory Key Click
  const handleInsertKey = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    let insertText = key;
    if (key === '⇥') {
      insertText = '  '; // 2 spaces for tab
    } else if (key === '//') {
      insertText = '// ';
    } else if (key === '=>') {
      insertText = ' => ';
    }

    const { start, end } = selection;

    // If text is selected and inserting an enclosing pair
    const pairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
      "'": "'",
      '<': '>',
    };

    let newContent = '';
    let newCursorPos = start + insertText.length;

    if (start !== end && pairs[key]) {
      const selectedText = currentContent.substring(start, end);
      const wrapped = `${key}${selectedText}${pairs[key]}`;
      newContent =
        currentContent.substring(0, start) + wrapped + currentContent.substring(end);
      newCursorPos = start + wrapped.length;
    } else {
      newContent =
        currentContent.substring(0, start) + insertText + currentContent.substring(end);
      newCursorPos = start + insertText.length;
    }

    handleContentChange(newContent);
    setSelection({ start: newCursorPos, end: newCursorPos });
  };

  // Handle marker press in gutter
  const handleMarkerPress = (marker: LineMarker) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedMarker(marker);
  };

  const handleLinePress = (lineNum: number) => {
    // Jump selection to beginning of clicked line
    let pos = 0;
    for (let i = 0; i < lineNum - 1; i++) {
      pos += lines[i].length + 1;
    }
    setSelection({ start: pos, end: pos });
  };

  return (
    <KeyboardAvoidingView
      style={styles.rootContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ==================================================================== */}
      {/* Top Header Toolbar */}
      {/* ==================================================================== */}
      <View style={styles.headerToolbar}>
        {/* Left Side: Explorer Toggle & File Info */}
        <View style={styles.headerLeft}>
          {onToggleExplorer && (
            <TouchableOpacity
              onPress={onToggleExplorer}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Toggle File Explorer"
            >
              <Ionicons name="folder-outline" size={18} color={colors.secondary} />
            </TouchableOpacity>
          )}

          <View style={styles.fileInfoBadge}>
            <Text style={styles.fileNameHeader} numberOfLines={1}>
              {activeFile?.name || 'No file selected'}
            </Text>
            {isDirty && (
              <View style={styles.unsavedPill}>
                <Text style={styles.unsavedPillText}>Unsaved *</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Side: Search, Save, DevTools, Run */}
        <View style={styles.headerRight}>
          {/* Search Toggle */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setSearchVisible((prev) => !prev);
            }}
            style={[
              styles.iconButton,
              searchVisible && styles.iconButtonActive,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Search in file"
          >
            <Ionicons
              name="search"
              size={17}
              color={searchVisible ? colors.accentPrimary : colors.secondary}
            />
          </TouchableOpacity>

          {/* DevTools Toggle */}
          {onToggleDevTools && (
            <TouchableOpacity
              onPress={onToggleDevTools}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Toggle DevTools"
            >
              <Ionicons name="terminal-outline" size={17} color={colors.secondary} />
            </TouchableOpacity>
          )}

          {/* Preview Run Button */}
          {onRunPreview && (
            <TouchableOpacity
              onPress={onRunPreview}
              style={[styles.iconButton, styles.previewButton]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Run Preview"
            >
              <Ionicons name="play" size={16} color={colors.success} />
            </TouchableOpacity>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isDirty || readOnly}
            style={[
              styles.saveButton,
              isDirty && styles.saveButtonDirty,
              !isDirty && styles.saveButtonClean,
            ]}
            activeOpacity={0.8}
            accessibilityLabel="Save File"
          >
            <Ionicons
              name={isDirty ? 'save' : 'checkmark-done'}
              size={14}
              color={isDirty ? colors.white : colors.muted}
              style={styles.saveIcon}
            />
            <Text
              style={[
                styles.saveButtonText,
                isDirty ? styles.saveButtonTextDirty : styles.saveButtonTextClean,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* Multi-File Tab Bar */}
      {/* ==================================================================== */}
      <EditorTabs
        tabs={editorTabs}
        activeTabId={activeId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={onNewFile}
      />

      {/* ==================================================================== */}
      {/* Floating In-File Search Bar */}
      {/* ==================================================================== */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            {/* Search Input */}
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={14}
                color={colors.secondary}
                style={styles.searchInnerIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Find in file..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setCurrentMatchIndex(0);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={14} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Case sensitive toggle */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSearchCaseSensitive((prev) => !prev);
              }}
              style={[
                styles.caseButton,
                searchCaseSensitive && styles.caseButtonActive,
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text
                style={[
                  styles.caseButtonText,
                  searchCaseSensitive && styles.caseButtonTextActive,
                ]}
              >
                Aa
              </Text>
            </TouchableOpacity>

            {/* Match Counter */}
            <Text style={styles.matchCountText}>
              {searchQuery.length > 0
                ? searchMatches.length > 0
                  ? `${currentMatchIndex + 1} of ${searchMatches.length}`
                  : 'No matches'
                : ''}
            </Text>

            {/* Prev Match Button */}
            <TouchableOpacity
              onPress={handlePrevMatch}
              disabled={searchMatches.length === 0}
              style={[
                styles.navMatchButton,
                searchMatches.length === 0 && styles.navMatchButtonDisabled,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="chevron-up"
                size={16}
                color={searchMatches.length > 0 ? colors.primary : colors.muted}
              />
            </TouchableOpacity>

            {/* Next Match Button */}
            <TouchableOpacity
              onPress={handleNextMatch}
              disabled={searchMatches.length === 0}
              style={[
                styles.navMatchButton,
                searchMatches.length === 0 && styles.navMatchButtonDisabled,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="chevron-down"
                size={16}
                color={searchMatches.length > 0 ? colors.primary : colors.muted}
              />
            </TouchableOpacity>

            {/* Close Search Button */}
            <TouchableOpacity
              onPress={() => setSearchVisible(false)}
              style={styles.closeSearchButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ==================================================================== */}
      {/* Diagnostic Marker Alert Banner */}
      {/* ==================================================================== */}
      {selectedMarker && (
        <View
          style={[
            styles.diagnosticBanner,
            selectedMarker.type === 'error'
              ? styles.diagnosticErrorBanner
              : styles.diagnosticWarningBanner,
          ]}
        >
          <Ionicons
            name={selectedMarker.type === 'error' ? 'alert-circle' : 'warning'}
            size={16}
            color={selectedMarker.type === 'error' ? colors.error : colors.warning}
            style={styles.diagnosticBannerIcon}
          />
          <View style={styles.diagnosticBannerTextContainer}>
            <Text style={styles.diagnosticBannerTitle}>
              Line {selectedMarker.line}: {selectedMarker.type.toUpperCase()}
            </Text>
            <Text style={styles.diagnosticBannerMessage}>
              {selectedMarker.message || 'Diagnostic issue detected on this line.'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedMarker(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.diagnosticCloseButton}
          >
            <Ionicons name="close" size={14} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Saved Toast Overlay */}
      {showSavedToast && (
        <View style={styles.savedToast}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.savedToastText}>File saved</Text>
        </View>
      )}

      {/* ==================================================================== */}
      {/* Editor Body: Vertical & Horizontal Scroll View */}
      {/* ==================================================================== */}
      <ScrollView
        ref={verticalScrollRef}
        style={styles.verticalScrollView}
        contentContainerStyle={styles.verticalScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.editorRow}>
          {/* Left Gutter: Line Numbers & Error/Warning markers */}
          <LineNumbers
            totalLines={totalLines}
            currentLine={currentLine}
            lineHeight={LINE_HEIGHT}
            markers={activeFileMarkers}
            onMarkerPress={handleMarkerPress}
            onLinePress={handleLinePress}
            paddingTop={PADDING_TOP}
            paddingBottom={PADDING_BOTTOM}
          />

          {/* Right Area: Horizontally scrollable Monospace Text Input */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={[
              styles.horizontalScrollContent,
              {
                minWidth: Math.max(SCREEN_WIDTH - 60, maxLineLength * 8.5 + 40),
              },
            ]}
          >
            <TextInput
              ref={textInputRef}
              multiline
              scrollEnabled={false}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              editable={!readOnly}
              value={currentContent}
              onChangeText={handleContentChange}
              onSelectionChange={handleSelectionChange}
              style={[styles.codeInput, { lineHeight: LINE_HEIGHT }]}
            />
          </ScrollView>
        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* Bottom Status / Stats Bar */}
      {/* ==================================================================== */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusText}>
            Ln {currentLine}, Col {selection.start + 1}
          </Text>
          <Text style={styles.statusDivider}>•</Text>
          <Text style={styles.statusText}>{totalLines} lines</Text>
          <Text style={styles.statusDivider}>•</Text>
          <Text style={styles.statusText}>UTF-8</Text>
        </View>

        <View style={styles.statusRight}>
          {activeFileMarkers.length > 0 && (
            <TouchableOpacity
              style={styles.diagBadge}
              onPress={() => {
                if (activeFileMarkers[0]) setSelectedMarker(activeFileMarkers[0]);
              }}
            >
              <Ionicons
                name="alert-circle"
                size={12}
                color={
                  activeFileMarkers.some((m) => m.type === 'error')
                    ? colors.error
                    : colors.warning
                }
              />
              <Text style={styles.diagBadgeText}>{activeFileMarkers.length}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.statusLanguage}>
            {activeFile?.language?.toUpperCase() || 'PLAINTEXT'}
          </Text>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* Mobile Keyboard Accessory Toolbar */}
      {/* ==================================================================== */}
      {!readOnly && (
        <View style={styles.accessoryToolbar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accessoryScrollContent}
            keyboardShouldPersistTaps="always"
          >
            {DEVELOPER_KEYS.map((char) => (
              <TouchableOpacity
                key={`key-${char}`}
                onPress={() => handleInsertKey(char)}
                style={styles.accessoryKey}
                activeOpacity={0.6}
              >
                <Text style={styles.accessoryKeyText}>{char}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  headerToolbar: {
    height: 44,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 1,
  },
  fileNameHeader: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  unsavedPill: {
    backgroundColor: 'rgba(240, 136, 62, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(240, 136, 62, 0.4)',
  },
  unsavedPillText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.accentOrange,
    fontWeight: '600',
  },
  iconButton: {
    padding: 6,
    borderRadius: radius.sm,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
  },
  previewButton: {
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.sm,
    marginLeft: 6,
  },
  saveButtonDirty: {
    backgroundColor: colors.accentPrimary,
    ...shadows.sm,
  },
  saveButtonClean: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  saveIcon: {
    marginRight: 4,
  },
  saveButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  saveButtonTextDirty: {
    color: colors.white,
  },
  saveButtonTextClean: {
    color: colors.muted,
  },
  searchContainer: {
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    ...shadows.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    height: 32,
  },
  searchInnerIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.primary,
    padding: 0,
  },
  caseButton: {
    paddingHorizontal: 6,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caseButtonActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
  },
  caseButtonText: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
  },
  caseButtonTextActive: {
    color: colors.accentPrimary,
  },
  matchCountText: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.secondary,
    marginHorizontal: 8,
    minWidth: 50,
    textAlign: 'center',
  },
  navMatchButton: {
    padding: 4,
    borderRadius: radius.xs,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 4,
  },
  navMatchButtonDisabled: {
    opacity: 0.4,
  },
  closeSearchButton: {
    padding: 4,
    marginLeft: 6,
  },
  diagnosticBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  diagnosticErrorBanner: {
    backgroundColor: 'rgba(248, 81, 73, 0.12)',
    borderBottomColor: 'rgba(248, 81, 73, 0.3)',
  },
  diagnosticWarningBanner: {
    backgroundColor: 'rgba(210, 153, 34, 0.12)',
    borderBottomColor: 'rgba(210, 153, 34, 0.3)',
  },
  diagnosticBannerIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  diagnosticBannerTextContainer: {
    flex: 1,
  },
  diagnosticBannerTitle: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  diagnosticBannerMessage: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  diagnosticCloseButton: {
    padding: 4,
  },
  savedToast: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.statusBorderSuccess,
    ...shadows.card,
  },
  savedToastText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 6,
  },
  verticalScrollView: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  verticalScrollContent: {
    flexGrow: 1,
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  horizontalScrollContent: {
    paddingRight: 32,
  },
  codeInput: {
    fontFamily: fontFamilies.mono,
    fontSize: FONT_SIZE,
    color: colors.textPrimary,
    paddingTop: PADDING_TOP,
    paddingBottom: PADDING_BOTTOM,
    paddingHorizontal: 10,
    textAlignVertical: 'top',
  },
  statusBar: {
    height: 26,
    backgroundColor: '#0a0c0e',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  statusDivider: {
    color: colors.border,
    marginHorizontal: 6,
    fontSize: 10,
  },
  statusLanguage: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  diagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(210, 153, 34, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
    marginRight: 8,
  },
  diagBadgeText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.warning,
    marginLeft: 3,
    fontWeight: '600',
  },
  accessoryToolbar: {
    height: 40,
    backgroundColor: '#16191f',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'center',
  },
  accessoryScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  accessoryKey: {
    minWidth: 32,
    height: 32,
    backgroundColor: '#21262d',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#30363d',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    paddingHorizontal: 6,
  },
  accessoryKeyText: {
    fontFamily: fontFamilies.mono,
    fontSize: 14,
    color: '#f0f6fc',
    fontWeight: '600',
  },
});

export default CodeEditor;
