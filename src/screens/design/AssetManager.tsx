import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

export interface IconItem {
  name: keyof typeof Ionicons.glyphMap;
  category: 'code' | 'nav' | 'actions' | 'media' | 'status' | 'device';
  tags: string[];
}

export interface ImageAssetItem {
  id: string;
  name: string;
  path: string;
  format: 'png' | 'svg' | 'jpg' | 'webp';
  dimensions: string;
  size: string;
  density: '@1x' | '@2x' | '@3x' | 'vector';
  category: string;
}

export interface DesignNote {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  tags: string[];
}

// Curated comprehensive developer iconography from Ionicons
const ICON_DATA: IconItem[] = [
  // Code & Developer
  { name: 'code-slash', category: 'code', tags: ['code', 'html', 'syntax', 'dev'] },
  { name: 'terminal-outline', category: 'code', tags: ['terminal', 'bash', 'cli', 'console'] },
  { name: 'git-branch-outline', category: 'code', tags: ['git', 'branch', 'vcs', 'commit'] },
  { name: 'git-commit-outline', category: 'code', tags: ['git', 'commit', 'hash', 'tree'] },
  { name: 'git-pull-request-outline', category: 'code', tags: ['git', 'pr', 'merge', 'github'] },
  { name: 'git-merge-outline', category: 'code', tags: ['git', 'merge', 'combine'] },
  { name: 'cube-outline', category: 'code', tags: ['package', 'module', 'bundle', 'box'] },
  { name: 'layers-outline', category: 'code', tags: ['layers', 'stack', 'architecture'] },
  { name: 'bug-outline', category: 'code', tags: ['bug', 'debug', 'error', 'fix'] },
  { name: 'hardware-chip-outline', category: 'code', tags: ['chip', 'cpu', 'agent', 'core'] },
  { name: 'server-outline', category: 'code', tags: ['server', 'backend', 'database'] },
  { name: 'key-outline', category: 'code', tags: ['key', 'secret', 'token', 'auth'] },
  { name: 'cloud-upload-outline', category: 'code', tags: ['cloud', 'upload', 'deploy', 'eas'] },
  { name: 'sparkles-outline', category: 'code', tags: ['ai', 'agent', 'magic', 'generate'] },

  // Navigation
  { name: 'home-outline', category: 'nav', tags: ['home', 'main', 'root'] },
  { name: 'apps-outline', category: 'nav', tags: ['grid', 'apps', 'projects', 'menu'] },
  { name: 'folder-outline', category: 'nav', tags: ['folder', 'files', 'directory'] },
  { name: 'folder-open-outline', category: 'nav', tags: ['open', 'files', 'directory'] },
  { name: 'albums-outline', category: 'nav', tags: ['tabs', 'screens', 'modals'] },
  { name: 'compass-outline', category: 'nav', tags: ['explore', 'navigation', 'direction'] },
  { name: 'chevron-forward', category: 'nav', tags: ['arrow', 'next', 'forward'] },
  { name: 'chevron-back', category: 'nav', tags: ['arrow', 'back', 'previous'] },
  { name: 'arrow-forward', category: 'nav', tags: ['arrow', 'right'] },
  { name: 'arrow-back', category: 'nav', tags: ['arrow', 'left'] },
  { name: 'menu-outline', category: 'nav', tags: ['hamburger', 'menu', 'sidebar'] },

  // Actions
  { name: 'add', category: 'actions', tags: ['plus', 'create', 'new'] },
  { name: 'create-outline', category: 'actions', tags: ['edit', 'write', 'pencil'] },
  { name: 'trash-outline', category: 'actions', tags: ['delete', 'remove', 'trash'] },
  { name: 'copy-outline', category: 'actions', tags: ['copy', 'duplicate', 'clipboard'] },
  { name: 'save-outline', category: 'actions', tags: ['save', 'disk', 'persist'] },
  { name: 'refresh-outline', category: 'actions', tags: ['reload', 'refresh', 'sync'] },
  { name: 'search-outline', category: 'actions', tags: ['search', 'find', 'query'] },
  { name: 'filter-outline', category: 'actions', tags: ['filter', 'sort', 'refine'] },
  { name: 'share-social-outline', category: 'actions', tags: ['share', 'export', 'link'] },
  { name: 'download-outline', category: 'actions', tags: ['download', 'save', 'get'] },
  { name: 'play', category: 'actions', tags: ['play', 'run', 'start', 'preview'] },
  { name: 'pause', category: 'actions', tags: ['pause', 'stop', 'halt'] },
  { name: 'cog-outline', category: 'actions', tags: ['settings', 'config', 'gear'] },

  // Status & Alerts
  { name: 'checkmark-circle-outline', category: 'status', tags: ['success', 'check', 'done'] },
  { name: 'alert-circle-outline', category: 'status', tags: ['error', 'alert', 'failed'] },
  { name: 'warning-outline', category: 'status', tags: ['warning', 'caution'] },
  { name: 'information-circle-outline', category: 'status', tags: ['info', 'details', 'help'] },
  { name: 'shield-checkmark-outline', category: 'status', tags: ['security', 'ssl', 'safe'] },
  { name: 'lock-closed-outline', category: 'status', tags: ['lock', 'private', 'secure'] },
  { name: 'flash-outline', category: 'status', tags: ['fast', 'speed', 'zap'] },

  // Devices & Platform
  { name: 'phone-portrait-outline', category: 'device', tags: ['iphone', 'mobile', 'ios'] },
  { name: 'tablet-portrait-outline', category: 'device', tags: ['ipad', 'tablet'] },
  { name: 'laptop-outline', category: 'device', tags: ['macbook', 'laptop', 'desktop'] },
  { name: 'globe-outline', category: 'device', tags: ['web', 'browser', 'internet'] },
  { name: 'wifi-outline', category: 'device', tags: ['network', 'online', 'connection'] },
  { name: 'color-palette-outline', category: 'device', tags: ['design', 'colors', 'art'] },
];

const DEFAULT_IMAGE_ASSETS: ImageAssetItem[] = [
  {
    id: 'asset-1',
    name: 'icon.png',
    path: 'assets/icon.png',
    format: 'png',
    dimensions: '1024 × 1024',
    size: '142 KB',
    density: '@3x',
    category: 'App Icons',
  },
  {
    id: 'asset-2',
    name: 'adaptive-icon.png',
    path: 'assets/adaptive-icon.png',
    format: 'png',
    dimensions: '1024 × 1024',
    size: '98 KB',
    density: '@3x',
    category: 'App Icons',
  },
  {
    id: 'asset-3',
    name: 'splash.png',
    path: 'assets/splash.png',
    format: 'png',
    dimensions: '1242 × 2436',
    size: '380 KB',
    density: '@3x',
    category: 'Splash Screens',
  },
  {
    id: 'asset-4',
    name: 'favicon.png',
    path: 'assets/favicon.png',
    format: 'png',
    dimensions: '48 × 48',
    size: '4 KB',
    density: '@1x',
    category: 'Web',
  },
  {
    id: 'asset-5',
    name: 'agent-avatar-grid.png',
    path: 'assets/agents/sprites.png',
    format: 'png',
    dimensions: '512 × 512',
    size: '86 KB',
    density: '@2x',
    category: 'Avatars',
  },
  {
    id: 'asset-6',
    name: 'architecture-dag.svg',
    path: 'assets/diagrams/pipeline.svg',
    format: 'svg',
    dimensions: '800 × 600',
    size: '24 KB',
    density: 'vector',
    category: 'Diagrams',
  },
];

const DEFAULT_DESIGN_NOTES: DesignNote[] = [
  {
    id: 'note-1',
    title: 'Spatial Grid & Layout Hierarchy',
    content:
      'All ARENA STUDIO layout paddings, margins, and gaps follow a 4px baseline grid (xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32). Card containers must always use radius.lg (12px) with 1px border (#30363d) and subtle shadow elevation.',
    author: 'Design Agent',
    timestamp: '2026-11-13 18:00',
    tags: ['Grid', 'Spacing', 'Cards'],
  },
  {
    id: 'note-2',
    title: 'Color Contrast & Dark Surface Semantics',
    content:
      'Background levels: Canvas uses bgPrimary (#0d0f12), Cards use bgSecondary (#16191f), Popovers and inputs use bgTertiary (#21262d). Text colors must adhere to WCAG 2.1 AA (4.5:1 ratio) against their target background.',
    author: 'Design Agent',
    timestamp: '2026-11-13 18:05',
    tags: ['Color', 'WCAG', 'Accessibility'],
  },
  {
    id: 'note-3',
    title: 'Monospace Typography Rules',
    content:
      'Use Menlo (iOS) / monospace for all code identifiers, hex codes, branch names, token labels, and terminal outputs. Body copy should use standard system sans-serif font.',
    author: 'Architect Agent',
    timestamp: '2026-11-13 18:08',
    tags: ['Typography', 'Monospace', 'Tokens'],
  },
];

export const AssetManager: React.FC = () => {
  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'icons' | 'images' | 'notes'>('icons');

  // Icon browser states
  const [iconQuery, setIconQuery] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('all');
  const [iconSize, setIconSize] = useState<number>(24);
  const [iconColor, setIconColor] = useState<string>('#388bfd');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Images state
  const [imageAssets, setImageAssets] = useState<ImageAssetItem[]>(DEFAULT_IMAGE_ASSETS);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [newImageCategory, setNewImageCategory] = useState('App Icons');

  // Notes state
  const [notes, setNotes] = useState<DesignNote[]>(DEFAULT_DESIGN_NOTES);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Icon search & filter
  const filteredIcons = useMemo(() => {
    return ICON_DATA.filter((icon) => {
      const matchesCategory =
        selectedIconCategory === 'all' || icon.category === selectedIconCategory;
      const q = iconQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        icon.name.toLowerCase().includes(q) ||
        icon.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [iconQuery, selectedIconCategory]);

  const copyToClipboardSnippet = (iconName: string) => {
    const snippet = `<Ionicons name="${iconName}" size={${iconSize}} color="${iconColor}" />`;
    setCopiedCode(snippet);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleAddImageAsset = () => {
    if (!newImageName.trim()) {
      Alert.alert('Required', 'Please enter an asset file name (e.g. logo.png).');
      return;
    }
    const newAsset: ImageAssetItem = {
      id: `img-${Date.now()}`,
      name: newImageName.trim(),
      path: `assets/${newImageName.trim()}`,
      format: newImageName.endsWith('.svg') ? 'svg' : 'png',
      dimensions: '512 × 512',
      size: '64 KB',
      density: '@2x',
      category: newImageCategory,
    };
    setImageAssets((prev) => [newAsset, ...prev]);
    setNewImageName('');
    setShowAddImageModal(false);
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      Alert.alert('Incomplete', 'Please provide both title and note content.');
      return;
    }
    const note: DesignNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      author: 'Design Studio User',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      tags: ['Custom', 'Handoff'],
    };
    setNotes((prev) => [note, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddNote(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Sub-tab Navigation */}
      <View style={styles.tabNavWrapper}>
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'icons' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('icons')}
          >
            <Ionicons
              name="sparkles"
              size={14}
              color={activeSubTab === 'icons' ? '#388bfd' : '#8b949e'}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'icons' && styles.subTabTextActive,
              ]}
            >
              Iconography ({ICON_DATA.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'images' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('images')}
          >
            <Ionicons
              name="images-outline"
              size={14}
              color={activeSubTab === 'images' ? '#388bfd' : '#8b949e'}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'images' && styles.subTabTextActive,
              ]}
            >
              Image Assets ({imageAssets.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'notes' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('notes')}
          >
            <Ionicons
              name="document-text-outline"
              size={14}
              color={activeSubTab === 'notes' ? '#388bfd' : '#8b949e'}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'notes' && styles.subTabTextActive,
              ]}
            >
              Design Notes ({notes.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Copied Feedback Toast */}
      {copiedCode && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#3fb950" />
          <Text style={styles.toastText} numberOfLines={1}>
            Copied snippet: {copiedCode}
          </Text>
        </View>
      )}

      {/* 1. ICONOGRAPHY SUB-TAB */}
      {activeSubTab === 'icons' && (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Search & Customizer Bar */}
          <View style={styles.iconControlsCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color="#8b949e" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search @expo/vector-icons (e.g. code, git, terminal, play)..."
                placeholderTextColor="#484f58"
                value={iconQuery}
                onChangeText={setIconQuery}
              />
              {iconQuery.length > 0 && (
                <TouchableOpacity onPress={() => setIconQuery('')} style={styles.searchClearBtn}>
                  <Ionicons name="close-circle" size={16} color="#8b949e" />
                </TouchableOpacity>
              )}
            </View>

            {/* Icon Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'code', label: 'Developer / Code' },
                { id: 'nav', label: 'Navigation' },
                { id: 'actions', label: 'Actions' },
                { id: 'status', label: 'Status & Alerts' },
                { id: 'device', label: 'Devices' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catPill,
                    selectedIconCategory === c.id && styles.catPillActive,
                  ]}
                  onPress={() => setSelectedIconCategory(c.id)}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      selectedIconCategory === c.id && styles.catPillTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Size & Color Picker for Preview */}
            <View style={styles.customizerRow}>
              <View style={styles.customizerItem}>
                <Text style={styles.customizerLabel}>SIZE: {iconSize}px</Text>
                <View style={styles.sizeOptions}>
                  {[18, 24, 32, 40].map((sz) => (
                    <TouchableOpacity
                      key={sz}
                      style={[
                        styles.sizeBtn,
                        iconSize === sz && styles.sizeBtnActive,
                      ]}
                      onPress={() => setIconSize(sz)}
                    >
                      <Text
                        style={[
                          styles.sizeBtnText,
                          iconSize === sz && styles.sizeBtnTextActive,
                        ]}
                      >
                        {sz}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.customizerItem}>
                <Text style={styles.customizerLabel}>COLOR</Text>
                <View style={styles.colorOptions}>
                  {['#f0f6fc', '#388bfd', '#3fb950', '#d29922', '#f85149', '#8957e5', '#39c5cf'].map(
                    (hex) => (
                      <TouchableOpacity
                        key={hex}
                        style={[
                          styles.colorDot,
                          { backgroundColor: hex },
                          iconColor === hex && styles.colorDotActive,
                        ]}
                        onPress={() => setIconColor(hex)}
                      />
                    )
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Icon Grid */}
          <View style={styles.iconGrid}>
            {filteredIcons.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.iconCard}
                onPress={() => copyToClipboardSnippet(item.name)}
                activeOpacity={0.7}
              >
                <View style={styles.iconPreviewBox}>
                  <Ionicons name={item.name} size={iconSize} color={iconColor} />
                </View>
                <Text style={styles.iconCardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.iconCategoryTag}>{item.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* 2. IMAGE ASSETS SUB-TAB */}
      {activeSubTab === 'images' && (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Project Image Manifest</Text>
              <Text style={styles.sectionSubtitle}>
                Standard Expo assets, resolution densities, and vector icons.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => setShowAddImageModal(!showAddImageModal)}
            >
              <Ionicons name={showAddImageModal ? 'close' : 'add'} size={15} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>
                {showAddImageModal ? 'Cancel' : 'Register Asset'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Image Form */}
          {showAddImageModal && (
            <View style={styles.addModalCard}>
              <Text style={styles.addModalTitle}>Register Project Asset</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="File name (e.g. brand-logo.png, diagram.svg)"
                placeholderTextColor="#484f58"
                value={newImageName}
                onChangeText={setNewImageName}
              />
              <View style={styles.categoryPickerRow}>
                {['App Icons', 'Splash Screens', 'Diagrams', 'Avatars', 'Media'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catOption,
                      newImageCategory === cat && styles.catOptionActive,
                    ]}
                    onPress={() => setNewImageCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catOptionText,
                        newImageCategory === cat && styles.catOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveAssetBtn} onPress={handleAddImageAsset}>
                <Ionicons name="checkmark" size={15} color="#fff" />
                <Text style={styles.saveAssetBtnText}>Save Asset</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Image Asset Cards */}
          <View style={styles.imagesList}>
            {imageAssets.map((asset) => (
              <View key={asset.id} style={styles.imageCard}>
                <View style={styles.imageThumbnail}>
                  <Ionicons
                    name={asset.format === 'svg' ? 'shapes-outline' : 'image-outline'}
                    size={28}
                    color="#388bfd"
                  />
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatBadgeText}>{asset.format.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.imageDetails}>
                  <View style={styles.imageTitleRow}>
                    <Text style={styles.imageName}>{asset.name}</Text>
                    <View style={styles.densityPill}>
                      <Text style={styles.densityPillText}>{asset.density}</Text>
                    </View>
                  </View>
                  <Text style={styles.imagePath}>{asset.path}</Text>
                  <View style={styles.imageMetaRow}>
                    <Text style={styles.imageMetaText}>{asset.dimensions}</Text>
                    <Text style={styles.imageMetaDot}>•</Text>
                    <Text style={styles.imageMetaText}>{asset.size}</Text>
                    <Text style={styles.imageMetaDot}>•</Text>
                    <Text style={styles.imageCategoryBadge}>{asset.category}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.copyAssetBtn}
                  onPress={() => {
                    setCopiedCode(`require('../${asset.path}')`);
                    setTimeout(() => setCopiedCode(null), 2500);
                  }}
                >
                  <Ionicons name="copy-outline" size={14} color="#8b949e" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* 3. DESIGN NOTES SUB-TAB */}
      {activeSubTab === 'notes' && (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Project Design Specifications</Text>
              <Text style={styles.sectionSubtitle}>
                Synchronized architectural design tokens and UI handoff specs.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => setShowAddNote(!showAddNote)}
            >
              <Ionicons name={showAddNote ? 'close' : 'add'} size={15} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>
                {showAddNote ? 'Cancel' : 'New Note'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Note Form */}
          {showAddNote && (
            <View style={styles.addModalCard}>
              <Text style={styles.addModalTitle}>Create Design Specification Note</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Title (e.g. Component Elevation Hierarchy)"
                placeholderTextColor="#484f58"
                value={newNoteTitle}
                onChangeText={setNewNoteTitle}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Describe rules, specifications, or handoff conventions..."
                placeholderTextColor="#484f58"
                multiline
                numberOfLines={4}
                value={newNoteContent}
                onChangeText={setNewNoteContent}
              />
              <TouchableOpacity style={styles.saveAssetBtn} onPress={handleAddNote}>
                <Ionicons name="checkmark" size={15} color="#fff" />
                <Text style={styles.saveAssetBtnText}>Save Specification Note</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notes List */}
          <View style={styles.notesList}>
            {notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteTitleArea}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <View style={styles.noteMetaRow}>
                      <Ionicons name="person-circle-outline" size={12} color="#8b949e" />
                      <Text style={styles.noteAuthor}>{note.author}</Text>
                      <Text style={styles.noteMetaDot}>•</Text>
                      <Text style={styles.noteTimestamp}>{note.timestamp}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteNote(note.id)}
                    style={styles.deleteNoteBtn}
                  >
                    <Ionicons name="trash-outline" size={14} color="#f85149" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.noteContent}>{note.content}</Text>

                <View style={styles.noteTagsRow}>
                  {note.tags.map((tag, tIdx) => (
                    <View key={tIdx} style={styles.noteTag}>
                      <Text style={styles.noteTagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  tabNavWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgPrimary,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  subTabItemActive: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  subTabText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  subTabTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  toastBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  toastText: {
    color: '#f0f6fc',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  iconControlsCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    paddingVertical: 8,
  },
  searchClearBtn: {
    padding: 4,
  },
  categoryScroll: {
    marginBottom: spacing.sm,
  },
  categoryScrollContent: {
    gap: 6,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  catPillText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  catPillTextActive: {
    color: '#ffffff',
    fontWeight: fontWeights.semibold,
  },
  customizerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  customizerItem: {
    flex: 1,
  },
  customizerLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    marginBottom: 4,
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  sizeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeBtnActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  sizeBtnText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
  },
  sizeBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorDotActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconCard: {
    width: '31%',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    alignItems: 'center',
  },
  iconPreviewBox: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCardName: {
    color: colors.textPrimary,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    textAlign: 'center',
    marginTop: 4,
  },
  iconCategoryTag: {
    color: colors.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  addModalCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  addModalTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  catOption: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
  },
  catOptionActive: {
    backgroundColor: colors.accentPrimary,
  },
  catOptionText: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  catOptionTextActive: {
    color: '#ffffff',
    fontWeight: fontWeights.bold,
  },
  saveAssetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentPrimary,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  saveAssetBtnText: {
    color: '#ffffff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  imagesList: {
    gap: spacing.sm,
  },
  imageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  imageThumbnail: {
    width: 52,
    height: 52,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formatBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formatBadgeText: {
    color: colors.textPrimary,
    fontSize: 8,
    fontFamily: fontFamilies.mono,
    fontWeight: '700',
  },
  imageDetails: {
    flex: 1,
  },
  imageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageName: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  densityPill: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  densityPillText: {
    color: colors.accentPrimary,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: 'bold',
  },
  imagePath: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    marginTop: 2,
  },
  imageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  imageMetaText: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  imageMetaDot: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: 10,
  },
  imageCategoryBadge: {
    color: '#39c5cf',
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
  copyAssetBtn: {
    padding: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.sm,
  },
  notesList: {
    gap: spacing.md,
  },
  noteCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  noteTitleArea: {
    flex: 1,
  },
  noteTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  noteAuthor: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  noteMetaDot: {
    color: colors.textMuted,
    fontSize: 10,
  },
  noteTimestamp: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
  },
  deleteNoteBtn: {
    padding: 4,
  },
  noteContent: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  noteTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  noteTag: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  noteTagText: {
    color: '#58a6ff',
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
});
