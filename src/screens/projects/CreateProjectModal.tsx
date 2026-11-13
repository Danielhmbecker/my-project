import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { Button, Input, Badge, Modal } from '../../components/ui';
import { Project, ProjectFramework, ProjectFile } from '../../models';
import { saveProject, saveFile } from '../../storage';

export interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  existingProjects?: Project[];
  initialMode?: 'create' | 'import';
}

interface FrameworkOption {
  id: ProjectFramework;
  name: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  color: string;
}

const FRAMEWORK_OPTIONS: FrameworkOption[] = [
  {
    id: 'expo',
    name: 'Expo / React Native',
    badge: 'Mobile / Cross-platform',
    icon: 'phone-portrait-outline',
    description: 'Expo SDK 52, TypeScript, Expo Router & Native Modules',
    color: colors.accentPrimary,
  },
  {
    id: 'ios',
    name: 'iOS Native',
    badge: 'Native Swift / Bare RN',
    icon: 'logo-apple',
    description: 'Swift bridge, native view controllers & iOS toolchain',
    color: colors.accentCyan,
  },
  {
    id: 'web',
    name: 'Universal Web',
    badge: 'Vite / HTML5',
    icon: 'globe-outline',
    description: 'Universal responsive web bundle with modern tooling',
    color: colors.accentGreen,
  },
  {
    id: 'react',
    name: 'React SPA',
    badge: 'React 18',
    icon: 'code-slash-outline',
    description: 'Component architecture with React 18 & state management',
    color: colors.accentCyan,
  },
  {
    id: 'nextjs',
    name: 'Next.js 14',
    badge: 'App Router / SSR',
    icon: 'server-outline',
    description: 'Fullstack Next.js with Server Actions & API endpoints',
    color: colors.accentPurple,
  },
  {
    id: 'game',
    name: 'Game Dev / 3D',
    badge: 'Three.js & Canvas',
    icon: 'game-controller-outline',
    description: 'Interactive canvas, OpenGL / Three.js game loop & physics',
    color: colors.accentOrange,
  },
];

const CATEGORY_OPTIONS = [
  'Mobile & Cross-Platform',
  'Web & Fullstack',
  'Finance & Fintech',
  'Utilities & Tools',
  'Robotics & AI',
  'Game & 3D',
  'Design System',
];

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  recommendedFramework: ProjectFramework;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'blank',
    name: 'Blank Starter',
    description: 'Minimal structure with package.json and entry file',
    recommendedFramework: 'expo',
    category: 'Mobile & Cross-Platform',
    icon: 'document-outline',
  },
  {
    id: 'expo-router',
    name: 'Expo Router + TypeScript',
    description: 'File-based navigation tabs, dark theme & vector icons',
    recommendedFramework: 'expo',
    category: 'Mobile & Cross-Platform',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'nextjs-saas',
    name: 'Next.js App Router SaaS',
    description: 'Fullstack dashboard with Tailwind, auth layout & REST API',
    recommendedFramework: 'nextjs',
    category: 'Web & Fullstack',
    icon: 'layers-outline',
  },
  {
    id: 'ios-native-app',
    name: 'React Native iOS Bare',
    description: 'Native iOS workspace with bridge configurations',
    recommendedFramework: 'ios',
    category: 'Mobile & Cross-Platform',
    icon: 'logo-apple',
  },
  {
    id: 'game-engine',
    name: 'Three.js / 3D Canvas Game',
    description: 'Shader pipeline, particle system and responsive touch controls',
    recommendedFramework: 'game',
    category: 'Game & 3D',
    icon: 'cube-outline',
  },
  {
    id: 'ai-agents',
    name: 'AI Agent Playground',
    description: 'Autonomous agent workspace, telemetry and streaming logs',
    recommendedFramework: 'react',
    category: 'Robotics & AI',
    icon: 'hardware-chip-outline',
  },
];

const SAMPLE_IMPORT_JSON = JSON.stringify(
  {
    name: 'CloudSync Studio',
    description: 'Real-time multi-device cloud synchronization client with offline caching.',
    framework: 'expo',
    category: 'Utilities & Tools',
    gitBranch: 'main',
    gitRemote: 'https://github.com/arena-studio/cloudsync-studio.git',
  },
  null,
  2
);

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onClose,
  onProjectCreated,
  existingProjects = [],
  initialMode = 'create',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'import'>(initialMode);

  // Form State - Create
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState<ProjectFramework>('expo');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [selectedTemplate, setSelectedTemplate] = useState('expo-router');
  const [gitBranch, setGitBranch] = useState('main');

  // Form State - Import
  const [importType, setImportType] = useState<'json' | 'git'>('git');
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranchImport, setGitBranchImport] = useState('main');
  const [jsonMetadata, setJsonMetadata] = useState('');

  // UI & Validation State
  const [nameError, setNameError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialMode);
      resetForm();
    }
  }, [visible, initialMode]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFramework('expo');
    setCategory(CATEGORY_OPTIONS[0]);
    setSelectedTemplate('expo-router');
    setGitBranch('main');
    setGitUrl('');
    setGitBranchImport('main');
    setJsonMetadata('');
    setNameError(null);
    setImportError(null);
    setIsSubmitting(false);
  };

  const validateName = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError('Project name is required');
      return false;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    const isDuplicate = existingProjects.some(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setNameError(`A project named "${trimmed}" already exists`);
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleTemplateSelect = (template: TemplateOption) => {
    Haptics.selectionAsync();
    setSelectedTemplate(template.id);
    setFramework(template.recommendedFramework);
    setCategory(template.category);
    if (!description || description.trim() === '') {
      setDescription(template.description);
    }
  };

  const generateStarterFiles = async (projectId: string, projName: string, selectedFw: ProjectFramework) => {
    const timestamp = new Date().toISOString();
    const filesToCreate: Array<Omit<ProjectFile, 'id'>> = [];

    // Base package.json
    filesToCreate.push({
      projectId,
      path: 'package.json',
      name: 'package.json',
      isDirectory: false,
      parentId: null,
      language: 'json',
      size: 420,
      lastModified: timestamp,
      content: JSON.stringify(
        {
          name: projName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
          version: '1.0.0',
          private: true,
          dependencies:
            selectedFw === 'expo'
              ? { expo: '~52.0.0', react: '18.3.1', 'react-native': '0.76.7' }
              : selectedFw === 'nextjs'
              ? { next: '14.2.0', react: '18.3.1', 'react-dom': '18.3.1' }
              : { react: '18.3.1', 'react-native': '0.76.7' },
        },
        null,
        2
      ),
    });

    // README.md
    filesToCreate.push({
      projectId,
      path: 'README.md',
      name: 'README.md',
      isDirectory: false,
      parentId: null,
      language: 'markdown',
      size: 280,
      lastModified: timestamp,
      content: `# ${projName}\n\n${description || 'Created with ARENA STUDIO.'}\n\n- Framework: ${selectedFw}\n- Branch: ${gitBranch}\n- Created: ${new Date().toLocaleDateString()}\n`,
    });

    // App entry file
    if (selectedFw === 'expo' || selectedFw === 'ios' || selectedFw === 'react') {
      filesToCreate.push({
        projectId,
        path: 'App.tsx',
        name: 'App.tsx',
        isDirectory: false,
        parentId: null,
        language: 'typescript',
        size: 580,
        lastModified: timestamp,
        content: `import React from 'react';\nimport { StyleSheet, Text, View, SafeAreaView } from 'react-native';\n\nexport default function App() {\n  return (\n    <SafeAreaView style={styles.container}>\n      <View style={styles.card}>\n        <Text style={styles.title}>Welcome to ${projName}</Text>\n        <Text style={styles.subtitle}>Built on ARENA STUDIO</Text>\n      </View>\n    </SafeAreaView>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#0d0f12', justifyContent: 'center', alignItems: 'center' },\n  card: { padding: 24, borderRadius: 12, backgroundColor: '#16191f', borderWidth: 1, borderColor: '#30363d' },\n  title: { fontSize: 20, fontWeight: '700', color: '#f0f6fc', marginBottom: 8 },\n  subtitle: { fontSize: 14, color: '#8b949e' },\n});\n`,
      });
    } else if (selectedFw === 'nextjs') {
      filesToCreate.push({
        projectId,
        path: 'app/page.tsx',
        name: 'page.tsx',
        isDirectory: false,
        parentId: null,
        language: 'typescript',
        size: 420,
        lastModified: timestamp,
        content: `export default function Home() {\n  return (\n    <main className="min-h-screen p-8 bg-[#0d0f12] text-[#f0f6fc]">\n      <h1 className="text-3xl font-bold">${projName}</h1>\n      <p className="text-[#8b949e] mt-2">${description || 'Next.js App'}</p>\n    </main>\n  );\n}\n`,
      });
    } else if (selectedFw === 'game') {
      filesToCreate.push({
        projectId,
        path: 'game/engine.ts',
        name: 'engine.ts',
        isDirectory: false,
        parentId: null,
        language: 'typescript',
        size: 610,
        lastModified: timestamp,
        content: `export class GameEngine {\n  private isRunning = false;\n  init() {\n    console.log('[GameEngine] Initialized for ${projName}');\n  }\n  start() {\n    this.isRunning = true;\n    console.log('[GameEngine] Loop started');\n  }\n  stop() {\n    this.isRunning = false;\n  }\n}\n`,
      });
    }

    for (const f of filesToCreate) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await saveFile({ ...f, id: fileId });
    }
  };

  const handleCreate = async () => {
    if (!validateName(name)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = new Date().toISOString();

      const newProject: Project = {
        id: projectId,
        name: name.trim(),
        description: description.trim() || `${framework.toUpperCase()} application created in ARENA STUDIO`,
        framework,
        category,
        lastModified: timestamp,
        buildStatus: 'idle',
        isDemo: false,
        gitBranch: gitBranch.trim() || 'main',
        filesCount: 3,
        assignedAgentIds: ['agent-architect', 'agent-developer'],
        createdAt: timestamp,
        linesOfCode: 150,
      };

      // Persist project
      const saved = await saveProject(newProject);

      // Seed starter files
      await generateStarterFiles(projectId, name.trim(), framework);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onProjectCreated(saved);
      onClose();
    } catch (error: any) {
      console.error('[CreateProjectModal] Creation failed:', error);
      Alert.alert('Creation Failed', error?.message || 'Could not create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async () => {
    setImportError(null);

    if (importType === 'git') {
      const trimmedUrl = gitUrl.trim();
      if (!trimmedUrl) {
        setImportError('Please enter a Git repository URL');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Extract repository name from URL (e.g., https://github.com/user/my-repo.git -> my-repo)
      const cleanUrl = trimmedUrl.replace(/\.git\/?$/, '');
      const parts = cleanUrl.split('/');
      const repoNameRaw = parts[parts.length - 1] || 'Imported Repo';
      const repoName = repoNameRaw.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      // Validate uniqueness
      const isDuplicate = existingProjects.some(
        (p) => p.name.trim().toLowerCase() === repoName.trim().toLowerCase()
      );
      const finalName = isDuplicate ? `${repoName} (${Math.floor(Math.random() * 900 + 100)})` : repoName;

      try {
        setIsSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const timestamp = new Date().toISOString();

        const importedProject: Project = {
          id: projectId,
          name: finalName,
          description: `Imported from remote repository: ${trimmedUrl}`,
          framework: 'expo',
          category: 'Mobile & Cross-Platform',
          lastModified: timestamp,
          buildStatus: 'idle',
          isDemo: false,
          gitBranch: gitBranchImport.trim() || 'main',
          gitRemote: trimmedUrl,
          filesCount: 4,
          assignedAgentIds: ['agent-developer'],
          createdAt: timestamp,
          linesOfCode: 520,
        };

        const saved = await saveProject(importedProject);
        await generateStarterFiles(projectId, finalName, 'expo');

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onProjectCreated(saved);
        onClose();
      } catch (err: any) {
        setImportError(err?.message || 'Failed to import repository');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // JSON Metadata Import
      if (!jsonMetadata.trim()) {
        setImportError('Please enter project metadata JSON');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      try {
        const parsed = JSON.parse(jsonMetadata);
        if (!parsed.name || typeof parsed.name !== 'string') {
          setImportError('JSON must contain a valid "name" field');
          return;
        }

        const trimmedName = parsed.name.trim();
        const isDuplicate = existingProjects.some(
          (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        const finalName = isDuplicate ? `${trimmedName} (Imported)` : trimmedName;

        const validFrameworks: ProjectFramework[] = ['expo', 'ios', 'web', 'react', 'nextjs', 'game'];
        const fw: ProjectFramework = validFrameworks.includes(parsed.framework) ? parsed.framework : 'expo';

        setIsSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const timestamp = new Date().toISOString();

        const importedProject: Project = {
          id: projectId,
          name: finalName,
          description: parsed.description || 'Imported via Project Metadata JSON',
          framework: fw,
          category: parsed.category || 'Utilities & Tools',
          lastModified: timestamp,
          buildStatus: 'idle',
          isDemo: false,
          gitBranch: parsed.gitBranch || 'main',
          gitRemote: parsed.gitRemote,
          filesCount: 3,
          assignedAgentIds: ['agent-architect', 'agent-developer'],
          createdAt: timestamp,
          linesOfCode: 240,
        };

        const saved = await saveProject(importedProject);
        await generateStarterFiles(projectId, finalName, fw);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onProjectCreated(saved);
        onClose();
      } catch (err: any) {
        setImportError('Invalid JSON format. Check syntax and commas.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="fullscreen"
      animationType="slide"
      style={styles.modalRoot}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Header Bar */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={activeTab === 'create' ? 'add-circle-outline' : 'cloud-download-outline'}
                size={22}
                color={colors.accentPrimary}
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {activeTab === 'create' ? 'Create New Project' : 'Import Project'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {activeTab === 'create'
                  ? 'Configure framework, metadata, and starter blueprint'
                  : 'Import repository or metadata blueprint'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.selectionAsync();
              onClose();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('create');
            }}
          >
            <Ionicons
              name="sparkles-outline"
              size={15}
              color={activeTab === 'create' ? colors.accentPrimary : colors.textMuted}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'create' && styles.tabButtonTextActive]}
            >
              New Project
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'import' && styles.tabButtonActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('import');
            }}
          >
            <Ionicons
              name="cloud-download-outline"
              size={15}
              color={activeTab === 'import' ? colors.accentPrimary : colors.textMuted}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'import' && styles.tabButtonTextActive]}
            >
              Import Metadata / Git
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'create' ? (
            /* CREATE TAB CONTENT */
            <View style={styles.sectionContainer}>
              {/* Project Name */}
              <View style={styles.fieldGroup}>
                <Input
                  label="Project Name *"
                  placeholder="e.g., Quantum Wallet, Orbit Browser"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (nameError) validateName(val);
                  }}
                  onBlur={() => validateName(name)}
                  error={nameError || undefined}
                  leftIconName="folder-outline"
                  clearable
                  onClear={() => setName('')}
                  autoCapitalize="words"
                />
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Input
                  label="Description"
                  placeholder="Brief summary of the application architecture and purpose"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                  leftIconName="reader-outline"
                  inputStyle={{ minHeight: 64, textAlignVertical: 'top' }}
                />
              </View>

              {/* Framework Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Target Framework & Runtime *</Text>
                <Text style={styles.fieldHint}>Select the primary compilation & runtime engine</Text>
                <View style={styles.frameworkGrid}>
                  {FRAMEWORK_OPTIONS.map((opt) => {
                    const isSelected = framework === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.frameworkCard,
                          isSelected && styles.frameworkCardActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setFramework(opt.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.frameworkCardTop}>
                          <View
                            style={[
                              styles.frameworkIconCircle,
                              { backgroundColor: `${opt.color}20` },
                            ]}
                          >
                            <Ionicons name={opt.icon} size={20} color={opt.color} />
                          </View>
                          {isSelected && (
                            <View style={styles.checkmarkPill}>
                              <Ionicons name="checkmark-sharp" size={14} color={colors.white} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.frameworkName}>{opt.name}</Text>
                        <Text style={styles.frameworkDesc} numberOfLines={2}>
                          {opt.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Starter Template Choice */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Starter Template</Text>
                <Text style={styles.fieldHint}>
                  Pre-configured directory tree, package dependencies & entrypoints
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.templateScroll}
                >
                  {TEMPLATE_OPTIONS.map((tmpl) => {
                    const isSelected = selectedTemplate === tmpl.id;
                    return (
                      <TouchableOpacity
                        key={tmpl.id}
                        style={[
                          styles.templateCard,
                          isSelected && styles.templateCardActive,
                        ]}
                        onPress={() => handleTemplateSelect(tmpl)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.templateHeader}>
                          <Ionicons
                            name={tmpl.icon}
                            size={18}
                            color={isSelected ? colors.accentPrimary : colors.textSecondary}
                          />
                          <Badge
                            label={tmpl.recommendedFramework.toUpperCase()}
                            size="xs"
                            status={isSelected ? 'accent' : 'default'}
                          />
                        </View>
                        <Text style={styles.templateName}>{tmpl.name}</Text>
                        <Text style={styles.templateDesc} numberOfLines={2}>
                          {tmpl.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Category Picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category & Tagging</Text>
                <View style={styles.categoryWrap}>
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCategory(cat);
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Git Branch */}
              <View style={styles.fieldGroup}>
                <Input
                  label="Default Git Branch"
                  placeholder="main"
                  value={gitBranch}
                  onChangeText={setGitBranch}
                  leftIconName="git-branch-outline"
                  variant="monospace"
                />
              </View>
            </View>
          ) : (
            /* IMPORT TAB CONTENT */
            <View style={styles.sectionContainer}>
              {/* Import Mode Radio */}
              <View style={styles.importSubTabs}>
                <TouchableOpacity
                  style={[
                    styles.importSubTab,
                    importType === 'git' && styles.importSubTabActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setImportType('git');
                    setImportError(null);
                  }}
                >
                  <Ionicons
                    name="logo-github"
                    size={16}
                    color={importType === 'git' ? colors.accentPrimary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.importSubTabText,
                      importType === 'git' && styles.importSubTabTextActive,
                    ]}
                  >
                    Git Repository URL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.importSubTab,
                    importType === 'json' && styles.importSubTabActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setImportType('json');
                    setImportError(null);
                  }}
                >
                  <Ionicons
                    name="code-working-outline"
                    size={16}
                    color={importType === 'json' ? colors.accentPrimary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.importSubTabText,
                      importType === 'json' && styles.importSubTabTextActive,
                    ]}
                  >
                    JSON Metadata
                  </Text>
                </TouchableOpacity>
              </View>

              {importError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorBannerText}>{importError}</Text>
                </View>
              )}

              {importType === 'git' ? (
                <View style={styles.fieldGroup}>
                  <Input
                    label="Git Repository Clone URL *"
                    placeholder="https://github.com/organization/my-repo.git"
                    value={gitUrl}
                    onChangeText={(val) => {
                      setGitUrl(val);
                      if (importError) setImportError(null);
                    }}
                    leftIconName="git-network-outline"
                    autoCapitalize="none"
                    autoCorrect={false}
                    variant="monospace"
                    helperText="Supports public HTTPS Git remotes or internal ARENA repos"
                  />

                  <View style={{ marginTop: spacing.md }}>
                    <Input
                      label="Initial Branch"
                      placeholder="main"
                      value={gitBranchImport}
                      onChangeText={setGitBranchImport}
                      leftIconName="git-branch-outline"
                      variant="monospace"
                    />
                  </View>

                  <View style={styles.quickPresetBox}>
                    <Text style={styles.quickPresetTitle}>Quick Fill Samples:</Text>
                    <View style={styles.quickPresetButtons}>
                      <TouchableOpacity
                        style={styles.quickPresetBtn}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setGitUrl('https://github.com/arena-studio/react-native-starter.git');
                          setGitBranchImport('main');
                        }}
                      >
                        <Text style={styles.quickPresetBtnText}>React Native Starter</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickPresetBtn}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setGitUrl('https://github.com/arena-studio/mobile-defi-vault.git');
                          setGitBranchImport('develop');
                        }}
                      >
                        <Text style={styles.quickPresetBtnText}>Mobile DeFi Vault</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <View style={styles.jsonHeaderRow}>
                    <Text style={styles.fieldLabel}>Project Metadata JSON *</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setJsonMetadata(SAMPLE_IMPORT_JSON);
                        setImportError(null);
                      }}
                    >
                      <Text style={styles.prefillLink}>Load Sample JSON</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fieldHint}>
                    Paste a JSON object with name, framework, category and remote url
                  </Text>
                  <Input
                    placeholder="{\n  &quot;name&quot;: &quot;My Project&quot;,\n  &quot;framework&quot;: &quot;expo&quot;,\n  &quot;category&quot;: &quot;Mobile&quot;\n}"
                    value={jsonMetadata}
                    onChangeText={(val) => {
                      setJsonMetadata(val);
                      if (importError) setImportError(null);
                    }}
                    multiline
                    numberOfLines={8}
                    variant="code"
                    inputStyle={{ minHeight: 180, textAlignVertical: 'top' }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.modalFooter}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => {
              Haptics.selectionAsync();
              onClose();
            }}
            disabled={isSubmitting}
            style={styles.cancelBtn}
          />
          <Button
            title={
              activeTab === 'create'
                ? isSubmitting
                  ? 'Creating Project...'
                  : 'Create Project'
                : isSubmitting
                ? 'Importing...'
                : 'Import Project'
            }
            variant="primary"
            loading={isSubmitting}
            iconName={activeTab === 'create' ? 'rocket-outline' : 'download-outline'}
            onPress={activeTab === 'create' ? handleCreate : handleImport}
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    padding: 0,
    backgroundColor: colors.bgPrimary,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
    gap: spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  tabButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  sectionContainer: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  fieldHint: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  frameworkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  frameworkCard: {
    width: '48%',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  frameworkCardActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  frameworkCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  frameworkIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkPill: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameworkName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  frameworkDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  templateScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  templateCard: {
    width: 170,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  templateCardActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  templateName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  templateDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.accentPrimaryAlphaMedium,
    borderColor: colors.accentPrimary,
  },
  categoryChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  categoryChipTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  importSubTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: spacing.md,
  },
  importSubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  importSubTabActive: {
    backgroundColor: colors.bgElevated,
  },
  importSubTabText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  importSubTabTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusBgError,
    borderWidth: 1,
    borderColor: colors.statusBorderError,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.error,
    flex: 1,
  },
  quickPresetBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPresetTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.xs,
  },
  quickPresetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickPresetBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickPresetBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.accentPrimary,
  },
  jsonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefillLink: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgSecondary,
    gap: spacing.md,
  },
  cancelBtn: {
    minWidth: 90,
  },
  submitBtn: {
    minWidth: 150,
  },
});
