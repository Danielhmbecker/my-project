/**
 * ARENA STUDIO Core Models & Data Contracts
 * Defines all shared TypeScript interfaces and types across the application.
 */

// ============================================================================
// Enums and Literal Types
// ============================================================================

export type ProjectFramework = 'expo' | 'ios' | 'web' | 'react' | 'nextjs' | 'game';
export type Framework = ProjectFramework;

export type BuildStatus = 'idle' | 'building' | 'success' | 'failed';

export type AgentStatus = 'idle' | 'ready' | 'working' | 'paused' | 'failed' | 'completed';

export type SkillCategory = 'DEVELOPMENT' | 'DESIGN' | 'TESTING' | 'OPERATIONS';

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'failed' | 'needs_approval';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export type AgentActivityType = 'info' | 'warning' | 'error' | 'success';

export type IntegrationProvider = 'github' | 'vercel' | 'supabase' | 'expo' | 'googledrive';

export type BuildPlatform = 'ios' | 'android' | 'web';

export type BuildTarget = 'development' | 'preview' | 'production';

export type BuildJobStatus = 'queued' | 'in_progress' | 'success' | 'failed';

export type DesignAssetType = 'token' | 'palette' | 'component' | 'icon' | 'image';

export type TabType = 'home' | 'projects' | 'ide' | 'agents' | 'tools';

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Project represents a user workspace or application project in ARENA STUDIO.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  framework: ProjectFramework;
  category: string;
  lastModified: string;
  buildStatus: BuildStatus;
  previewUrl?: string;
  isDemo: boolean;
  gitBranch: string;
  filesCount: number;
  assignedAgentIds: string[];
  createdAt?: string;
  linesOfCode?: number;
  gitRemote?: string;
}

/**
 * ProjectFile represents a file or directory within a project hierarchy.
 */
export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  name: string;
  isDirectory: boolean;
  parentId: string | null;
  content?: string;
  language: string;
  size: number;
  lastModified: string;
}

/**
 * AgentActivity tracks audit logs and actions taken by agents.
 */
export interface AgentActivity {
  id: string;
  agentId: string;
  timestamp: string;
  message: string;
  type: AgentActivityType;
  taskId?: string;
  projectId?: string;
}

/**
 * Agent represents an autonomous or assisted AI agent specialist in ARENA STUDIO.
 */
export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  instructions: string;
  avatar: string;
  status: AgentStatus;
  assignedSkillIds: string[];
  currentTaskId?: string | null;
  activityHistory: AgentActivity[];
  permissions: string[];
  model?: string;
  color?: string;
  temperature?: number;
  autoApprove?: boolean;
}

/**
 * Skill represents a specialized capability, prompt guide, or tool bundle
 * that can be assigned to agents.
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  instructions: string;
  requiredTools: string[];
  version: string;
  assignedAgentIds: string[];
}

/**
 * Task represents an individual unit of work within a workflow.
 */
export interface Task {
  id: string;
  objectiveId?: string;
  title: string;
  description: string;
  assignedAgentId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dependsOn: string[];
  progress: number; // 0 to 100
  result?: string;
  createdAt?: string;
  completedAt?: string;
}

/**
 * Workflow represents an orchestrated multi-agent plan with sequenced tasks.
 */
export interface Workflow {
  id: string;
  title: string;
  objective: string;
  status: WorkflowStatus;
  tasks: Task[];
  createdAt: string;
  completedAt?: string;
  projectId?: string;
}

/**
 * Integration represents an external cloud service connection.
 */
export interface Integration {
  id: string;
  name: string;
  provider: IntegrationProvider;
  isConnected: boolean;
  status: string;
  accountName?: string;
  lastSync?: string;
  icon?: string;
  config?: Record<string, any>;
}

/**
 * BuildJob represents a cloud compilation or preview deployment task.
 */
export interface BuildJob {
  id: string;
  projectId: string;
  platform: BuildPlatform;
  target: BuildTarget;
  status: BuildJobStatus;
  logs: string[];
  startedAt: string;
  completedAt?: string;
  artifactUrl?: string;
}

/**
 * DesignAsset represents an extracted or created design artifact (token, palette, component, icon).
 */
export interface DesignAsset {
  id: string;
  projectId: string;
  name: string;
  type: DesignAssetType;
  value: string;
  previewUrl?: string;
  category?: string;
}

// ============================================================================
// DTOs & Helper Types
// ============================================================================

export interface CreateProjectInput {
  name: string;
  description: string;
  framework: ProjectFramework;
  category: string;
  gitBranch?: string;
  isDemo?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  framework?: ProjectFramework;
  category?: string;
  gitBranch?: string;
  gitRemote?: string;
  buildStatus?: BuildStatus;
  previewUrl?: string;
  filesCount?: number;
  assignedAgentIds?: string[];
}

export interface CreateFileInput {
  projectId: string;
  path: string;
  name: string;
  isDirectory: boolean;
  parentId?: string | null;
  content?: string;
  language?: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  agentName: string;
  avatar: string;
  message: string;
  timestamp: string;
  type?: 'text' | 'code' | 'command' | 'status';
  codeSnippet?: string;
  language?: string;
}
