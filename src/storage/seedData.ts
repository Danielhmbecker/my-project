import {
  Project,
  ProjectFile,
  Agent,
  Skill,
  Integration,
  Workflow,
  BuildJob,
  DesignAsset,
} from '../models';

// ============================================================================
// 1. Demonstration Projects
// ============================================================================

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-nexa-finance',
    name: 'NEXA Finance',
    description: 'Next-generation algorithmic mobile banking, biometric wallet & DeFi portfolio tracker built with Expo & React Native.',
    framework: 'expo',
    category: 'Finance & Fintech',
    lastModified: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    buildStatus: 'success',
    previewUrl: 'exp://u.expo.dev/nexa-finance',
    isDemo: true,
    gitBranch: 'main',
    filesCount: 10,
    assignedAgentIds: ['agent-architect', 'agent-developer', 'agent-qa'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    linesOfCode: 3420,
    gitRemote: 'https://github.com/arena-studio/nexa-finance.git',
  },
  {
    id: 'proj-arena-browser',
    name: 'Arena Browser',
    description: 'High-performance privacy-focused mobile browser shell with tab isolation, ad-blocking sandbox & native gesture navigation.',
    framework: 'ios',
    category: 'Utilities & Browser',
    lastModified: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    buildStatus: 'building',
    previewUrl: 'exp://u.expo.dev/arena-browser',
    isDemo: true,
    gitBranch: 'feat/tab-isolation',
    filesCount: 8,
    assignedAgentIds: ['agent-developer', 'agent-design', 'agent-3d'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    linesOfCode: 5180,
    gitRemote: 'https://github.com/arena-studio/arena-browser.git',
  },
  {
    id: 'proj-botworks',
    name: 'BOTWORKS',
    description: 'Autonomous IoT robotics telemetry dashboard, command bus, and live sensor stream with WebSockets.',
    framework: 'react',
    category: 'Robotics & AI',
    lastModified: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    buildStatus: 'idle',
    previewUrl: 'https://botworks-telemetry.arena.dev',
    isDemo: true,
    gitBranch: 'develop',
    filesCount: 6,
    assignedAgentIds: ['agent-research', 'agent-release', 'agent-docs'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    linesOfCode: 2890,
    gitRemote: 'https://github.com/arena-studio/botworks.git',
  },
];

// ============================================================================
// 2. Demonstration Project Files
// ============================================================================

export const INITIAL_FILES: ProjectFile[] = [
  // --- NEXA Finance Files ---
  {
    id: 'file-nexa-pkg',
    projectId: 'proj-nexa-finance',
    path: 'package.json',
    name: 'package.json',
    isDirectory: false,
    parentId: null,
    language: 'json',
    size: 684,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    content: `{
  "name": "nexa-finance",
  "version": "2.1.0",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "expo-local-authentication": "~14.0.1",
    "expo-haptics": "~14.0.1"
  }
}`,
  },
  {
    id: 'file-nexa-app',
    projectId: 'proj-nexa-finance',
    path: 'App.tsx',
    name: 'App.tsx',
    isDirectory: false,
    parentId: null,
    language: 'typescript',
    size: 1420,
    lastModified: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    content: `import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PortfolioScreen } from './src/screens/PortfolioScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'portfolio'>('home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {activeTab === 'home' ? (
        <DashboardScreen onOpenPortfolio={() => setActiveTab('portfolio')} />
      ) : (
        <PortfolioScreen onBack={() => setActiveTab('home')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f12',
  },
});`,
  },
  {
    id: 'file-nexa-dir-src',
    projectId: 'proj-nexa-finance',
    path: 'src',
    name: 'src',
    isDirectory: true,
    parentId: null,
    language: 'directory',
    size: 0,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'file-nexa-dir-screens',
    projectId: 'proj-nexa-finance',
    path: 'src/screens',
    name: 'screens',
    isDirectory: true,
    parentId: 'file-nexa-dir-src',
    language: 'directory',
    size: 0,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'file-nexa-dir-components',
    projectId: 'proj-nexa-finance',
    path: 'src/components',
    name: 'components',
    isDirectory: true,
    parentId: 'file-nexa-dir-src',
    language: 'directory',
    size: 0,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'file-nexa-dir-theme',
    projectId: 'proj-nexa-finance',
    path: 'src/theme',
    name: 'theme',
    isDirectory: true,
    parentId: 'file-nexa-dir-src',
    language: 'directory',
    size: 0,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'file-nexa-tokens',
    projectId: 'proj-nexa-finance',
    path: 'src/theme/tokens.ts',
    name: 'tokens.ts',
    isDirectory: false,
    parentId: 'file-nexa-dir-theme',
    language: 'typescript',
    size: 890,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    content: `export const NEXA_THEME = {
  colors: {
    background: '#0d0f12',
    card: '#16191f',
    cardBorder: '#30363d',
    primary: '#388bfd',
    accent: '#39c5cf',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    textPrimary: '#f0f6fc',
    textSecondary: '#8b949e',
  },
  radius: {
    card: 12,
    button: 8,
  },
};`,
  },
  {
    id: 'file-nexa-dashboard',
    projectId: 'proj-nexa-finance',
    path: 'src/screens/DashboardScreen.tsx',
    name: 'DashboardScreen.tsx',
    isDirectory: false,
    parentId: 'file-nexa-dir-screens',
    language: 'typescript',
    size: 2450,
    lastModified: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    content: `import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NEXA_THEME } from '../theme/tokens';
import { AssetCard } from '../components/AssetCard';

interface Props {
  onOpenPortfolio: () => void;
}

export const DashboardScreen: React.FC<Props> = ({ onOpenPortfolio }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>Alex Morgan</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Net Worth</Text>
        <Text style={styles.balanceValue}>$128,490.52</Text>
        <Text style={styles.changeText}>+$4,821.10 (3.9%) this week</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assets Portfolio</Text>
        <TouchableOpacity onPress={onOpenPortfolio}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <AssetCard symbol="BTC" name="Bitcoin" value="$64,280.00" change="+2.4%" />
      <AssetCard symbol="ETH" name="Ethereum" value="$3,450.12" change="+4.1%" />
      <AssetCard symbol="SOL" name="Solana" value="$182.90" change="-0.8%" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEXA_THEME.colors.background },
  content: { padding: 16 },
  header: { marginBottom: 20 },
  greeting: { color: NEXA_THEME.colors.textSecondary, fontSize: 14 },
  userName: { color: NEXA_THEME.colors.textPrimary, fontSize: 22, fontWeight: '700' },
  balanceCard: {
    backgroundColor: NEXA_THEME.colors.card,
    borderRadius: NEXA_THEME.radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: NEXA_THEME.colors.cardBorder,
    marginBottom: 24,
  },
  balanceLabel: { color: NEXA_THEME.colors.textSecondary, fontSize: 13 },
  balanceValue: { color: NEXA_THEME.colors.textPrimary, fontSize: 32, fontWeight: '800', marginVertical: 6 },
  changeText: { color: NEXA_THEME.colors.success, fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: NEXA_THEME.colors.textPrimary, fontSize: 18, fontWeight: '600' },
  seeAll: { color: NEXA_THEME.colors.primary, fontSize: 14, fontWeight: '500' },
});`,
  },
  {
    id: 'file-nexa-asset-card',
    projectId: 'proj-nexa-finance',
    path: 'src/components/AssetCard.tsx',
    name: 'AssetCard.tsx',
    isDirectory: false,
    parentId: 'file-nexa-dir-components',
    language: 'typescript',
    size: 1100,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    content: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NEXA_THEME } from '../theme/tokens';

interface Props {
  symbol: string;
  name: string;
  value: string;
  change: string;
}

export const AssetCard: React.FC<Props> = ({ symbol, name, value, change }) => {
  const isPositive = change.startsWith('+');
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.symbol}>{symbol}</Text>
        </View>
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.sub}>{symbol} / USD</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>{value}</Text>
        <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
          {change}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEXA_THEME.colors.card,
    borderRadius: NEXA_THEME.radius.card,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NEXA_THEME.colors.cardBorder,
    marginBottom: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symbol: { color: '#f0f6fc', fontWeight: '700', fontSize: 13 },
  name: { color: '#f0f6fc', fontWeight: '600', fontSize: 15 },
  sub: { color: '#8b949e', fontSize: 12 },
  right: { alignItems: 'flex-end' },
  value: { color: '#f0f6fc', fontWeight: '600', fontSize: 15 },
  change: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  positive: { color: NEXA_THEME.colors.success },
  negative: { color: NEXA_THEME.colors.danger },
});`,
  },
  {
    id: 'file-nexa-transfer',
    projectId: 'proj-nexa-finance',
    path: 'src/screens/TransferModal.tsx',
    name: 'TransferModal.tsx',
    isDirectory: false,
    parentId: 'file-nexa-dir-screens',
    language: 'typescript',
    size: 1560,
    lastModified: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    content: `import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { NEXA_THEME } from '../theme/tokens';

export const TransferModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Send Funds</Text>
        <Text style={styles.sub}>Biometric authentication required before dispatch</Text>

        <TextInput
          placeholder="Recipient Address or ENS"
          placeholderTextColor="#8b949e"
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
        />
        <TextInput
          placeholder="Amount (USD)"
          keyboardType="numeric"
          placeholderTextColor="#8b949e"
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity style={styles.sendButton} onPress={onClose}>
          <Text style={styles.sendText}>Authenticate & Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: NEXA_THEME.colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    borderTopWidth: 1,
    borderColor: NEXA_THEME.colors.cardBorder,
  },
  title: { color: '#f0f6fc', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sub: { color: '#8b949e', fontSize: 13, marginBottom: 16 },
  input: {
    backgroundColor: '#0d0f12',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    padding: 12,
    color: '#f0f6fc',
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: NEXA_THEME.colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  sendText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});`,
  },

  // --- Arena Browser Files ---
  {
    id: 'file-browser-pkg',
    projectId: 'proj-arena-browser',
    path: 'package.json',
    name: 'package.json',
    isDirectory: false,
    parentId: null,
    language: 'json',
    size: 590,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    content: `{
  "name": "arena-browser",
  "version": "1.0.4",
  "dependencies": {
    "react-native-webview": "13.12.5",
    "expo-haptics": "~14.0.1"
  }
}`,
  },
  {
    id: 'file-browser-dir-src',
    projectId: 'proj-arena-browser',
    path: 'src',
    name: 'src',
    isDirectory: true,
    parentId: null,
    language: 'directory',
    size: 0,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: 'file-browser-dir-components',
    projectId: 'proj-arena-browser',
    path: 'src/components',
    name: 'components',
    isDirectory: true,
    parentId: 'file-browser-dir-src',
    language: 'directory',
    size: 0,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: 'file-browser-screen',
    projectId: 'proj-arena-browser',
    path: 'src/BrowserScreen.tsx',
    name: 'BrowserScreen.tsx',
    isDirectory: false,
    parentId: 'file-browser-dir-src',
    language: 'typescript',
    size: 1980,
    lastModified: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    content: `import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { AddressBar } from './components/AddressBar';

export const BrowserScreen: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState('https://chat.arena.ai');
  const [inputUrl, setInputUrl] = useState('https://chat.arena.ai');

  const handleNavigate = () => {
    let target = inputUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    setCurrentUrl(target);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AddressBar
        url={inputUrl}
        onChangeUrl={setInputUrl}
        onSubmit={handleNavigate}
      />
      <View style={styles.webviewWrapper}>
        <WebView
          source={{ uri: currentUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0f12' },
  webviewWrapper: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#16191f' },
});`,
  },
  {
    id: 'file-browser-addr',
    projectId: 'proj-arena-browser',
    path: 'src/components/AddressBar.tsx',
    name: 'AddressBar.tsx',
    isDirectory: false,
    parentId: 'file-browser-dir-components',
    language: 'typescript',
    size: 1120,
    lastModified: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    content: `import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface Props {
  url: string;
  onChangeUrl: (val: string) => void;
  onSubmit: () => void;
}

export const AddressBar: React.FC<Props> = ({ url, onChangeUrl, onSubmit }) => {
  return (
    <View style={styles.bar}>
      <TextInput
        value={url}
        onChangeText={onChangeUrl}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.input}
        placeholderTextColor="#8b949e"
      />
      <TouchableOpacity style={styles.goBtn} onPress={onSubmit}>
        <Text style={styles.goText}>Go</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#16191f',
    borderBottomWidth: 1,
    borderColor: '#30363d',
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#0d0f12',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#f0f6fc',
    fontSize: 13,
  },
  goBtn: {
    marginLeft: 8,
    backgroundColor: '#388bfd',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  goText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
});`,
  },
  {
    id: 'file-browser-sandbox',
    projectId: 'proj-arena-browser',
    path: 'src/securitySandbox.ts',
    name: 'securitySandbox.ts',
    isDirectory: false,
    parentId: 'file-browser-dir-src',
    language: 'typescript',
    size: 840,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    content: `export interface DomainPolicy {
  domain: string;
  allowCookies: boolean;
  blockTrackers: boolean;
  isolatedStorage: boolean;
}

export const DEFAULT_SANDBOX_POLICY: DomainPolicy = {
  domain: '*',
  allowCookies: true,
  blockTrackers: true,
  isolatedStorage: true,
};`,
  },

  // --- BOTWORKS Files ---
  {
    id: 'file-bot-pkg',
    projectId: 'proj-botworks',
    path: 'package.json',
    name: 'package.json',
    isDirectory: false,
    parentId: null,
    language: 'json',
    size: 480,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
    content: `{
  "name": "botworks-telemetry",
  "version": "0.9.1",
  "private": true,
  "dependencies": {
    "react": "18.3.1",
    "ws": "^8.18.0"
  }
}`,
  },
  {
    id: 'file-bot-dir-src',
    projectId: 'proj-botworks',
    path: 'src',
    name: 'src',
    isDirectory: true,
    parentId: null,
    language: 'directory',
    size: 0,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
  },
  {
    id: 'file-bot-telemetry',
    projectId: 'proj-botworks',
    path: 'src/TelemetrySocket.ts',
    name: 'TelemetrySocket.ts',
    isDirectory: false,
    parentId: 'file-bot-dir-src',
    language: 'typescript',
    size: 1350,
    lastModified: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    content: `export interface TelemetryFrame {
  robotId: string;
  batteryPct: number;
  motorTempC: number;
  lidarStatus: 'active' | 'warning' | 'error';
  coordinates: { x: number; y: number; z: number };
  timestamp: string;
}

export class TelemetrySocket {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public connect(onFrame: (frame: TelemetryFrame) => void) {
    console.log('[BOTWORKS] Telemetry socket initialized to', this.endpoint);
  }
}`,
  },
  {
    id: 'file-bot-robots-json',
    projectId: 'proj-botworks',
    path: 'src/robots.json',
    name: 'robots.json',
    isDirectory: false,
    parentId: 'file-bot-dir-src',
    language: 'json',
    size: 610,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    content: `[
  { "id": "unit-alpha-01", "model": "ScoutRover-X4", "zone": "Warehouse Bay A", "battery": 94 },
  { "id": "unit-beta-09", "model": "ArmManipulator-Pro", "zone": "Assembly Line 2", "battery": 78 },
  { "id": "unit-gamma-03", "model": "Hexapod-Surveyor", "zone": "Perimeter B", "battery": 52 }
]`,
  },
];

// ============================================================================
// 3. 8 Specialist AI Agents
// ============================================================================

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-architect',
    name: 'Architect Agent',
    role: 'System Architect & Engine Design',
    description: 'Designs scalable system architectures, state machines, API contracts, and modular software topologies.',
    avatar: 'hardware-chip-outline',
    status: 'ready',
    assignedSkillIds: ['skill-dev-ts', 'skill-dev-rn', 'skill-dev-api', 'skill-ops-cicd'],
    currentTaskId: 'task-1',
    permissions: ['read', 'write', 'refactor', 'execute'],
    model: 'Gemini 1.5 Pro',
    color: '#388bfd',
    instructions: `You are the Principal Architect Agent of ARENA STUDIO.
Your core mission is to design clean, scalable, and modular architectures for mobile and full-stack software.
- Enforce strict TypeScript typing and domain-driven module separation.
- Maintain decoupled state management and explicit lifecycle contracts.
- Optimize component re-render boundaries and verify offline-first resilience.
- Review API schemas and verify data integrity across service boundaries.`,
    activityHistory: [
      {
        id: 'act-arch-1',
        agentId: 'agent-architect',
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        message: 'Completed system architecture specification for NEXA Finance biometric enclave.',
        type: 'success',
        taskId: 'task-1',
        projectId: 'proj-nexa-finance',
      },
      {
        id: 'act-arch-2',
        agentId: 'agent-architect',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        message: 'Audited module boundaries in Arena Browser tab isolation engine.',
        type: 'info',
        projectId: 'proj-arena-browser',
      },
    ],
  },
  {
    id: 'agent-developer',
    name: 'Developer Agent',
    role: 'Full-Stack Mobile Engineer',
    description: 'Implements production-grade React Native, TypeScript components, hooks, business logic, and UI bindings.',
    avatar: 'code-slash-outline',
    status: 'working',
    assignedSkillIds: ['skill-dev-rn', 'skill-dev-ts', 'skill-dev-js', 'skill-dev-git', 'skill-dev-db'],
    currentTaskId: 'task-2',
    permissions: ['read', 'write', 'execute'],
    model: 'Gemini 1.5 Pro',
    color: '#39c5cf',
    instructions: `You are the Lead Developer Agent of ARENA STUDIO.
Write idiomatic React Native code with responsive styling, error boundaries, high frame-rate performance, and safe-area compatibility.
- Ensure all screens handle iPhone notch, dynamic island, and gesture bars gracefully.
- Follow functional component best practices with custom hooks for business logic.
- Implement realistic loading indicators, empty states, and error handling.
- Verify zero syntax errors and maintain clean imports.`,
    activityHistory: [
      {
        id: 'act-dev-1',
        agentId: 'agent-developer',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        message: 'Implemented useBiometrics hook with LocalAuthentication and Keychain fallback.',
        type: 'info',
        taskId: 'task-2',
        projectId: 'proj-nexa-finance',
      },
      {
        id: 'act-dev-2',
        agentId: 'agent-developer',
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        message: 'Optimized WebView navigation throttle in Arena Browser.',
        type: 'success',
        projectId: 'proj-arena-browser',
      },
    ],
  },
  {
    id: 'agent-design',
    name: 'Design Agent',
    role: 'Design Systems & UI/UX',
    description: 'Crafts design tokens, typography scales, responsive layouts, motion interactions, and developer UI polish.',
    avatar: 'color-palette-outline',
    status: 'working',
    assignedSkillIds: ['skill-des-ui', 'skill-des-systems', 'skill-des-ux', 'skill-des-graphic'],
    currentTaskId: 'task-3',
    permissions: ['read', 'write', 'design'],
    model: 'Gemini 1.5 Flash',
    color: '#8957e5',
    instructions: `You are the Design Systems Agent of ARENA STUDIO.
Maintain dark mode fidelity, adhere to a strict 4px grid, ensure high contrast ratios, and provide intuitive micro-interactions.
- Dark theme backgrounds: charcoal/graphite (#0d0f12, #16191f, #21262d, #2d333b).
- Accent colors: Primary Blue (#388bfd), Violet (#8957e5), Cyan (#39c5cf).
- Provide visual hierarchy with clear typography scales (fontSizes, weights, lineHeights).
- Polish interactive states with subtle opacity feedback and haptic triggers.`,
    activityHistory: [
      {
        id: 'act-des-1',
        agentId: 'agent-design',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        message: 'Finalized dark developer theme tokens and exported to src/theme/tokens.ts.',
        type: 'success',
        taskId: 'task-3',
        projectId: 'proj-nexa-finance',
      },
    ],
  },
  {
    id: 'agent-research',
    name: 'Research Agent',
    role: 'Technical Intelligence & Library Analysis',
    description: 'Evaluates native SDKs, benchmark libraries, analyzes security vulnerabilities, and optimizes algorithms.',
    avatar: 'search-outline',
    status: 'idle',
    assignedSkillIds: ['skill-dev-python', 'skill-test-perf', 'skill-des-ux'],
    currentTaskId: null,
    permissions: ['read', 'network'],
    model: 'Gemini 1.5 Flash',
    color: '#d29922',
    instructions: `You are the Technical Research Agent of ARENA STUDIO.
Benchmark dependencies, inspect native bridge performance, audit security risks, and produce actionable engineering briefs.
- Compare third-party Expo plugins and community packages for stability.
- Verify license compliance and memory footprints.
- Formulate benchmarking pipelines for bundle size reduction.`,
    activityHistory: [
      {
        id: 'act-res-1',
        agentId: 'agent-research',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        message: 'Completed comparative audit of WebSocket vs MQTT for BOTWORKS telemetry stream.',
        type: 'info',
        projectId: 'proj-botworks',
      },
    ],
  },
  {
    id: 'agent-qa',
    name: 'QA Agent',
    role: 'Test Automation & Quality Assurance',
    description: 'Executes automated unit tests, component integration checks, gesture regression audits, and crash prevention.',
    avatar: 'shield-checkmark-outline',
    status: 'ready',
    assignedSkillIds: ['skill-test-unit', 'skill-test-integration', 'skill-test-debug', 'skill-test-a11y'],
    currentTaskId: 'task-4',
    permissions: ['read', 'test', 'execute'],
    model: 'Gemini 1.5 Flash',
    color: '#3fb950',
    instructions: `You are the QA Specialist Agent of ARENA STUDIO.
Write comprehensive test suites, verify edge cases, inspect null safety, and ensure accessibility standards compliance.
- Test error recovery and graceful fallbacks for all network or storage operations.
- Ensure screen readers have appropriate accessibility labels and roles.
- Run continuous smoke tests on every committed change.`,
    activityHistory: [
      {
        id: 'act-qa-1',
        agentId: 'agent-qa',
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        message: 'Executed automated storage persistence tests. 100% assertions passed.',
        type: 'success',
        taskId: 'task-4',
        projectId: 'proj-nexa-finance',
      },
    ],
  },
  {
    id: 'agent-release',
    name: 'Release Agent',
    role: 'CI/CD, Build & App Store Deployment',
    description: 'Orchestrates Expo Application Services (EAS) builds, TestFlight distribution, OTA updates, and release tags.',
    avatar: 'rocket-outline',
    status: 'idle',
    assignedSkillIds: ['skill-ops-deploy', 'skill-ops-eas', 'skill-ops-cicd', 'skill-ops-release'],
    currentTaskId: 'task-5',
    permissions: ['read', 'build', 'deploy'],
    model: 'Gemini 1.5 Pro',
    color: '#f85149',
    instructions: `You are the Release & DevOps Agent of ARENA STUDIO.
Manage semantic versioning, trigger EAS builds, configure app credentials, and monitor live release rollouts.
- Supervise build job pipelines across iOS, Android, and Web.
- Guarantee that build credentials and certificates remain safe and verified.
- Draft crisp release notes and changelog entries.`,
    activityHistory: [
      {
        id: 'act-rel-1',
        agentId: 'agent-release',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        message: 'EAS preview build #104 completed successfully for iOS target.',
        type: 'success',
        taskId: 'task-5',
        projectId: 'proj-nexa-finance',
      },
    ],
  },
  {
    id: 'agent-docs',
    name: 'Documentation Agent',
    role: 'Technical Writer & API Documentation',
    description: 'Maintains codebase documentation, architecture decision records (ADRs), API references, and release notes.',
    avatar: 'document-text-outline',
    status: 'ready',
    assignedSkillIds: ['skill-dev-git', 'skill-ops-release', 'skill-des-systems'],
    currentTaskId: null,
    permissions: ['read', 'write'],
    model: 'Gemini 1.5 Flash',
    color: '#58a6ff',
    instructions: `You are the Technical Documentation Agent of ARENA STUDIO.
Keep READMEs, API specifications, component props docs, and architectural diagrams accurate and synchronized.
- Generate interactive API examples and prop documentation.
- Maintain architectural decision records (ADR) for major engineering shifts.
- Keep quickstart guides simple and verified.`,
    activityHistory: [
      {
        id: 'act-doc-1',
        agentId: 'agent-docs',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        message: 'Generated markdown architecture documentation for BOTWORKS telemetry protocol.',
        type: 'info',
        projectId: 'proj-botworks',
      },
    ],
  },
  {
    id: 'agent-3d',
    name: '3D Design Agent',
    role: 'Spatial UI & 3D Asset Creation',
    description: 'Develops interactive 3D viewports, Three.js/Fiber shaders, procedural mesh assets, and spatial HUD models.',
    avatar: 'cube-outline',
    status: 'idle',
    assignedSkillIds: ['skill-des-3d', 'skill-des-blender', 'skill-des-image'],
    currentTaskId: null,
    permissions: ['read', 'write', 'render'],
    model: 'Gemini 1.5 Pro',
    color: '#e36209',
    instructions: `You are the Spatial & 3D Design Agent of ARENA STUDIO.
Optimize polygon budgets for mobile GPU rendering, manage texture atlases, and author interactive 3D assets.
- Generate compact GLTF/GLB models suitable for mobile devices.
- Design spatial HUD overlays and futuristic developer dashboards.
- Profile mobile WebGL/Three.js frame rates.`,
    activityHistory: [
      {
        id: 'act-3d-1',
        agentId: 'agent-3d',
        timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
        message: 'Optimized polygon count for 3D holographic card asset to 4,200 triangles.',
        type: 'info',
        projectId: 'proj-arena-browser',
      },
    ],
  },
];

// ============================================================================
// 4. Initial Skills Library
// ============================================================================

export const INITIAL_SKILLS: Skill[] = [
  // --- DEVELOPMENT ---
  {
    id: 'skill-dev-rn',
    name: 'React Native & Expo Core',
    description: 'Deep understanding of React Native architecture, TurboModules, Expo SDK 52, gesture handlers, and native layout engines.',
    category: 'DEVELOPMENT',
    instructions: 'Follow standard Expo guidelines. Use react-native-safe-area-context for insets. Leverage expo-haptics for touch feedback.',
    requiredTools: ['expo-cli', 'metro', 'react-native-debugger'],
    version: '2.4.0',
    assignedAgentIds: ['agent-developer', 'agent-architect'],
  },
  {
    id: 'skill-dev-ts',
    name: 'TypeScript & Static Analysis',
    description: 'Advanced TypeScript patterns, generic constraints, discriminant unions, and strict null safety checking.',
    category: 'DEVELOPMENT',
    instructions: 'Zero any types allowed. Explicitly define return types on public functions and exported interfaces.',
    requiredTools: ['tsc', 'eslint', 'typescript-language-server'],
    version: '5.3.3',
    assignedAgentIds: ['agent-architect', 'agent-developer'],
  },
  {
    id: 'skill-dev-js',
    name: 'Modern JavaScript (ESNext)',
    description: 'Async/await pipelines, iterators, structured cloning, modules, and event loop optimization.',
    category: 'DEVELOPMENT',
    instructions: 'Write idiomatic ES2024 code. Avoid blocking main thread; defer heavy computations to worker threads or microtasks.',
    requiredTools: ['node', 'v8-profiler'],
    version: '1.8.0',
    assignedAgentIds: ['agent-developer'],
  },
  {
    id: 'skill-dev-python',
    name: 'Python & AI Tooling',
    description: 'Python scripting for data transformation, model inference endpoints, and automated pipeline scripting.',
    category: 'DEVELOPMENT',
    instructions: 'Use type hints and pyproject.toml standards. Adhere to PEP 8 standards.',
    requiredTools: ['python3', 'pip', 'ruff'],
    version: '3.11.0',
    assignedAgentIds: ['agent-research'],
  },
  {
    id: 'skill-dev-api',
    name: 'API Integration & GraphQL/REST',
    description: 'Resilient networking, caching strategies, token refresh flows, and optimistic UI updates.',
    category: 'DEVELOPMENT',
    instructions: 'Implement exponential backoff on network failures. Store tokens in secure enclave storage only.',
    requiredTools: ['fetch', 'axios', 'graphql-tools'],
    version: '2.1.0',
    assignedAgentIds: ['agent-architect'],
  },
  {
    id: 'skill-dev-git',
    name: 'Git & GitHub Version Control',
    description: 'Branch management, interactive rebase, pull request automation, semantic commit formatting, and merge conflict resolution.',
    category: 'DEVELOPMENT',
    instructions: 'Write conventional commit messages (feat:, fix:, chore:). Never force push to main branches.',
    requiredTools: ['git', 'gh-cli'],
    version: '2.43.0',
    assignedAgentIds: ['agent-developer', 'agent-docs'],
  },
  {
    id: 'skill-dev-db',
    name: 'Database & Offline Storage',
    description: 'AsyncStorage, SQLite, schema migrations, and reactive local storage synchronization.',
    category: 'DEVELOPMENT',
    instructions: 'Serialize data safely with JSON error handling. Maintain indexed lookup keys for fast multi-key queries.',
    requiredTools: ['async-storage', 'sqlite3'],
    version: '1.2.0',
    assignedAgentIds: ['agent-developer'],
  },

  // --- DESIGN ---
  {
    id: 'skill-des-ui',
    name: 'Mobile UI Design & Typography',
    description: 'Dark-mode developer styling, strict 4px grid spacing, responsive font scales, and accessible color contrast.',
    category: 'DESIGN',
    instructions: 'Always use semantic tokens rather than hardcoded hex values. Provide minimum 44x44pt touch targets.',
    requiredTools: ['figma', 'design-tokens-cli'],
    version: '3.0.1',
    assignedAgentIds: ['agent-design'],
  },
  {
    id: 'skill-des-ux',
    name: 'UX Research & Interaction Design',
    description: 'User flow mapping, information architecture, cognitive load minimization, and intuitive error recovery paths.',
    category: 'DESIGN',
    instructions: 'Prioritize single-tap actions for common tasks. Ensure undo/redo capabilities exist for destructive user actions.',
    requiredTools: ['miro', 'usability-metrics'],
    version: '1.5.0',
    assignedAgentIds: ['agent-design', 'agent-research'],
  },
  {
    id: 'skill-des-systems',
    name: 'Design Systems & Token Architecture',
    description: 'Token hierarchy (Global, Semantic, Component tokens), style dictionary transformation, and cross-platform syncing.',
    category: 'DESIGN',
    instructions: 'Group tokens into colors, typography, spacing, radius, and shadows. Export as both JSON and TypeScript.',
    requiredTools: ['style-dictionary', 'token-studio'],
    version: '2.2.0',
    assignedAgentIds: ['agent-design', 'agent-docs'],
  },
  {
    id: 'skill-des-graphic',
    name: 'Vector Graphic & Iconography',
    description: 'SVG optimization, iconography suites (@expo/vector-icons), visual hierarchy, and brand asset generation.',
    category: 'DESIGN',
    instructions: 'Keep vector paths minimal. Standardize icon viewboxes to 24x24.',
    requiredTools: ['svgo', 'vector-icons'],
    version: '1.3.0',
    assignedAgentIds: ['agent-design'],
  },
  {
    id: 'skill-des-image',
    name: 'AI Image & Asset Generation',
    description: 'Generative prompt crafting for developer thumbnails, app icons, splash screens, and dark-mode concept art.',
    category: 'DESIGN',
    instructions: 'Ensure exported images are compressed as WebP/PNG with Retina 2x/3x densities.',
    requiredTools: ['imagen-3', 'sharp'],
    version: '1.1.0',
    assignedAgentIds: ['agent-design', 'agent-3d'],
  },
  {
    id: 'skill-des-blender',
    name: 'Blender & 3D Modeling',
    description: 'Polygon mesh reduction, UV unwrapping, baking ambient occlusion maps, and mobile GLTF compression.',
    category: 'DESIGN',
    instructions: 'Enforce target polygon limits: < 10k vertices for mobile real-time viewport items.',
    requiredTools: ['blender-headless', 'gltf-pipeline'],
    version: '4.1.0',
    assignedAgentIds: ['agent-3d'],
  },
  {
    id: 'skill-des-3d',
    name: '3D Scene & Spatial HUD Modeling',
    description: 'Interactive Three.js/Fiber shaders, spatial camera control, and futuristic HUD components.',
    category: 'DESIGN',
    instructions: 'Use lightweight unlit or PBR shaders. Enable frustum culling and dispose unused geometries.',
    requiredTools: ['three', '@react-three/fiber'],
    version: '1.0.0',
    assignedAgentIds: ['agent-3d'],
  },

  // --- TESTING ---
  {
    id: 'skill-test-unit',
    name: 'Unit Testing (Jest & RTL)',
    description: 'Fast, deterministic unit tests for business logic, reducer state machines, and isolated component rendering.',
    category: 'TESTING',
    instructions: 'Aim for > 85% coverage on pure utility modules. Mock external hardware and network calls cleanly.',
    requiredTools: ['jest', '@testing-library/react-native'],
    version: '29.7.0',
    assignedAgentIds: ['agent-qa'],
  },
  {
    id: 'skill-test-integration',
    name: 'Integration & End-to-End Testing',
    description: 'Full workflow verification, multi-screen navigation flows, persistence roundtrips, and deep link testing.',
    category: 'TESTING',
    instructions: 'Simulate user journeys from app launch to final action. Check for unhandled promise rejections.',
    requiredTools: ['maestro', 'detox'],
    version: '1.8.0',
    assignedAgentIds: ['agent-qa'],
  },
  {
    id: 'skill-test-debug',
    name: 'Debugging & Memory Profiling',
    description: 'Diagnosing memory leaks, unmounted component updates, bridge serialization latency, and native stack traces.',
    category: 'TESTING',
    instructions: 'Analyze Hermes heap snapshots. Check for zombie event listeners in useEffect cleanups.',
    requiredTools: ['hermes-profile', 'flipper-headless'],
    version: '2.0.0',
    assignedAgentIds: ['agent-qa'],
  },
  {
    id: 'skill-test-perf',
    name: 'Frame-Rate & Performance',
    description: '60fps mobile execution, scroll list optimization (FlatList/FlashList), image caching, and cold start reduction.',
    category: 'TESTING',
    instructions: 'Avoid inline anonymous functions in list renderItem props. Use React.memo and useMemo for costly trees.',
    requiredTools: ['react-devtools-profiler', 'systrace'],
    version: '1.4.0',
    assignedAgentIds: ['agent-qa', 'agent-research'],
  },
  {
    id: 'skill-test-a11y',
    name: 'Accessibility & Screen Readers',
    description: 'WCAG 2.1 AA compliance, accessibleLabels, VoiceOver & TalkBack navigation sequences, and dynamic font scale support.',
    category: 'TESTING',
    instructions: 'Ensure all touchable components declare accessibilityRole and accessibilityLabel.',
    requiredTools: ['axe-core', 'accessibility-inspector'],
    version: '1.2.0',
    assignedAgentIds: ['agent-qa'],
  },

  // --- OPERATIONS ---
  {
    id: 'skill-ops-deploy',
    name: 'Cloud Deployment & OTA Updates',
    description: 'Expo Updates (OTA), EAS Update channels, rollback strategies, and zero-downtime client releases.',
    category: 'OPERATIONS',
    instructions: 'Tag all OTA updates with git commit hash. Always test update bundles on staging channels first.',
    requiredTools: ['eas-cli', 'expo-updates'],
    version: '2.5.0',
    assignedAgentIds: ['agent-release'],
  },
  {
    id: 'skill-ops-cicd',
    name: 'Continuous Integration (CI/CD)',
    description: 'GitHub Actions workflows, automated lint/typecheck runs, automated test matrices, and build caching.',
    category: 'OPERATIONS',
    instructions: 'Keep workflow runs under 6 minutes. Use npm cache actions and parallel test splits.',
    requiredTools: ['github-actions', 'act'],
    version: '3.1.0',
    assignedAgentIds: ['agent-release', 'agent-architect'],
  },
  {
    id: 'skill-ops-vercel',
    name: 'Vercel Edge Deployment',
    description: 'Next.js hosting, Serverless & Edge functions, instant preview deployments, and custom domain SSL management.',
    category: 'OPERATIONS',
    instructions: 'Configure vercel.json headers for security. Enable edge runtime on high-throughput API endpoints.',
    requiredTools: ['vercel-cli'],
    version: '34.0.0',
    assignedAgentIds: ['agent-release'],
  },
  {
    id: 'skill-ops-eas',
    name: 'EAS Build & Credentials',
    description: 'Remote cloud builds for iOS (.ipa) and Android (.aab/.apk), provisioning profiles, and keystore management.',
    category: 'OPERATIONS',
    instructions: 'Keep eas.json profiles cleanly separated (development, preview, production). Never commit keystore secrets.',
    requiredTools: ['eas-cli', 'fastlane'],
    version: '12.4.0',
    assignedAgentIds: ['agent-release'],
  },
  {
    id: 'skill-ops-release',
    name: 'Release Management & Versioning',
    description: 'Semantic version tagging, changelog generation, App Store metadata management, and staging rollouts.',
    category: 'OPERATIONS',
    instructions: 'Enforce semver rules strictly. Tag git releases with signed commits and include compiled artifact checksums.',
    requiredTools: ['standard-version', 'app-store-connect-api'],
    version: '2.0.0',
    assignedAgentIds: ['agent-release', 'agent-docs'],
  },
];

// ============================================================================
// 5. Sample Cloud Integrations
// ============================================================================

export const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int-github',
    name: 'GitHub',
    provider: 'github',
    isConnected: true,
    status: 'Connected as @arena-developer',
    accountName: 'arena-developer',
    lastSync: '10m ago',
    icon: 'logo-github',
  },
  {
    id: 'int-eas',
    name: 'Expo Application Services (EAS)',
    provider: 'expo',
    isConnected: true,
    status: 'Active (Org: arena-studio)',
    accountName: 'arena-studio',
    lastSync: '25m ago',
    icon: 'cube-outline',
  },
  {
    id: 'int-vercel',
    name: 'Vercel',
    provider: 'vercel',
    isConnected: true,
    status: 'Connected (Project: arena-edge)',
    accountName: 'arena-team',
    lastSync: '1h ago',
    icon: 'cloud-outline',
  },
  {
    id: 'int-supabase',
    name: 'Supabase',
    provider: 'supabase',
    isConnected: false,
    status: 'Not connected',
    accountName: undefined,
    lastSync: undefined,
    icon: 'server-outline',
  },
  {
    id: 'int-gdrive',
    name: 'Google Drive Backup',
    provider: 'googledrive',
    isConnected: false,
    status: 'Not connected',
    accountName: undefined,
    lastSync: undefined,
    icon: 'cloud-upload-outline',
  },
];

// ============================================================================
// 6. Demonstration Multi-Agent Workflows
// ============================================================================

export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-mobile-v2',
    title: 'NEXA Finance Biometric Security & Wallet',
    objective: 'Architect, implement, and verify biometric transfer authentication & wallet view',
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    projectId: 'proj-nexa-finance',
    tasks: [
      {
        id: 'task-1',
        objectiveId: 'wf-mobile-v2',
        title: 'System Architecture Specification',
        description: 'Review biometric enclave APIs and design state machine for transfer authorization.',
        assignedAgentId: 'agent-architect',
        status: 'completed',
        priority: 'high',
        dependsOn: [],
        progress: 100,
        result: 'Architecture specification completed. Keychain enclave protocol approved.',
        completedAt: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
      },
      {
        id: 'task-2',
        objectiveId: 'wf-mobile-v2',
        title: 'Implement Biometric Authentication Hook',
        description: 'Write useBiometrics hook with expo-local-authentication and hardware fallback.',
        assignedAgentId: 'agent-developer',
        status: 'in_progress',
        priority: 'critical',
        dependsOn: ['task-1'],
        progress: 65,
      },
      {
        id: 'task-3',
        objectiveId: 'wf-mobile-v2',
        title: 'Design Transfer Security Modal UI',
        description: 'Refine dark-mode security prompt with haptic response and accessible labels.',
        assignedAgentId: 'agent-design',
        status: 'completed',
        priority: 'medium',
        dependsOn: ['task-1'],
        progress: 100,
        result: 'UI component and tokens committed to src/theme/tokens.ts.',
        completedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'task-4',
        objectiveId: 'wf-mobile-v2',
        title: 'Automated Security Regression Suite',
        description: 'Verify fallback pin and lock state persistence under offline conditions.',
        assignedAgentId: 'agent-qa',
        status: 'pending',
        priority: 'high',
        dependsOn: ['task-2'],
        progress: 0,
      },
      {
        id: 'task-5',
        objectiveId: 'wf-mobile-v2',
        title: 'EAS Preview Build Trigger',
        description: 'Produce internal development preview artifact for iOS device testing.',
        assignedAgentId: 'agent-release',
        status: 'pending',
        priority: 'low',
        dependsOn: ['task-4'],
        progress: 0,
      },
    ],
  },
  {
    id: 'wf-browser-tabs',
    title: 'Arena Browser Tab Isolation Engine',
    objective: 'Implement sandboxed WebKit instances with memory management and gesture tabs.',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    projectId: 'proj-arena-browser',
    tasks: [
      {
        id: 'task-b1',
        title: 'Tab Architecture & Memory Budgeting',
        description: 'Design tab pooling mechanism to limit active webviews.',
        assignedAgentId: 'agent-architect',
        status: 'completed',
        priority: 'high',
        dependsOn: [],
        progress: 100,
        result: 'Maximum 6 concurrent active tabs with hibernation for idle tabs.',
      },
      {
        id: 'task-b2',
        title: 'Gesture Navigation Implementation',
        description: 'Add swipe left/right between active tabs.',
        assignedAgentId: 'agent-developer',
        status: 'completed',
        priority: 'medium',
        dependsOn: ['task-b1'],
        progress: 100,
        result: 'PanResponder gesture handler verified at 60fps.',
      },
    ],
  },
];

// ============================================================================
// 7. Demonstration Build Jobs
// ============================================================================

export const INITIAL_BUILD_JOBS: BuildJob[] = [
  {
    id: 'build-nexa-104',
    projectId: 'proj-nexa-finance',
    platform: 'ios',
    target: 'preview',
    status: 'success',
    logs: [
      '[18:00:12] [EAS] Fastlane iOS runner initialized on macOS arm64.',
      '[18:00:45] [EAS] Resolving dependencies with npm (Expo SDK 52.0.0)...',
      '[18:01:20] [EAS] Compiling Hermes bytecode bundle...',
      '[18:02:10] [EAS] Code signing with ad-hoc certificate for team ARENA.',
      '[18:03:00] [EAS] Archive generated successfully: nexa-finance-v2.1.0-preview.ipa (38.4MB)',
      '[18:03:15] [EAS] Build complete. Artifact deployed to preview channel.',
    ],
    startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
    artifactUrl: 'exp://u.expo.dev/nexa-finance?release-channel=preview',
  },
  {
    id: 'build-browser-12',
    projectId: 'proj-arena-browser',
    platform: 'ios',
    target: 'development',
    status: 'in_progress',
    logs: [
      '[18:02:00] [Metro] Connecting to bundler at localhost:8081...',
      '[18:02:15] [Xcode] Compiling Swift Native Modules (WebKitBridge.swift)...',
      '[18:02:30] [Xcode] Linking WebKit.framework...',
      '[18:02:50] [Xcode] 74% completed. Linking static libraries...',
    ],
    startedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'build-bot-44',
    projectId: 'proj-botworks',
    platform: 'web',
    target: 'production',
    status: 'success',
    logs: [
      '[17:30:00] [Vercel] Edge bundle compilation started.',
      '[17:30:14] [Vercel] Optimized 12 static pages and WebSocket router.',
      '[17:30:25] [Vercel] Deployed to 24 global edge locations.',
      '[17:30:30] [Vercel] Production URL: https://botworks-telemetry.arena.dev',
    ],
    startedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 89).toISOString(),
    artifactUrl: 'https://botworks-telemetry.arena.dev',
  },
];

// ============================================================================
// 8. Demonstration Design Assets
// ============================================================================

export const INITIAL_DESIGN_ASSETS: DesignAsset[] = [
  {
    id: 'asset-nexa-primary',
    projectId: 'proj-nexa-finance',
    name: 'NEXA Brand Blue',
    type: 'token',
    value: '#388bfd',
    category: 'colors',
  },
  {
    id: 'asset-nexa-accent',
    projectId: 'proj-nexa-finance',
    name: 'NEXA Accent Cyan',
    type: 'token',
    value: '#39c5cf',
    category: 'colors',
  },
  {
    id: 'asset-nexa-palette',
    projectId: 'proj-nexa-finance',
    name: 'Dark Graphite Palette',
    type: 'palette',
    value: '["#0d0f12","#16191f","#21262d","#2d333b","#388bfd"]',
    category: 'palettes',
  },
  {
    id: 'asset-card-comp',
    projectId: 'proj-nexa-finance',
    name: 'AssetCard Component',
    type: 'component',
    value: 'AssetCard (with crypto badge, price & 24h percentage)',
    category: 'components',
  },
];
