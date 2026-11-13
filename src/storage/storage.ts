import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Project,
  ProjectFile,
  Agent,
  Skill,
  Integration,
  Workflow,
  Task,
  BuildJob,
  DesignAsset,
  AgentStatus,
  AgentActivity,
} from '../models';
import {
  INITIAL_PROJECTS,
  INITIAL_FILES,
  INITIAL_AGENTS,
  INITIAL_SKILLS,
  INITIAL_INTEGRATIONS,
  INITIAL_WORKFLOWS,
  INITIAL_BUILD_JOBS,
  INITIAL_DESIGN_ASSETS,
} from './seedData';

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  INITIALIZED: '@arena_studio:initialized_v2',
  PROJECTS: '@arena_studio:projects',
  FILES: '@arena_studio:files',
  AGENTS: '@arena_studio:agents',
  SKILLS: '@arena_studio:skills',
  WORKFLOWS: '@arena_studio:workflows',
  INTEGRATIONS: '@arena_studio:integrations',
  BUILD_JOBS: '@arena_studio:build_jobs',
  DESIGN_ASSETS: '@arena_studio:design_assets',
};

// ============================================================================
// Safe AsyncStorage Wrapper (with In-Memory Fallback for Node/SSR)
// ============================================================================

const inMemoryStore: Record<string, string> = {};

export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) {
        inMemoryStore[key] = val;
        return val;
      }
      return inMemoryStore[key] ?? null;
    } catch {
      return inMemoryStore[key] ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    inMemoryStore[key] = value;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // In-memory store already updated
    }
  },

  async removeItem(key: string): Promise<void> {
    delete inMemoryStore[key];
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // In-memory store already updated
    }
  },

  async clear(): Promise<void> {
    for (const key of Object.keys(inMemoryStore)) {
      delete inMemoryStore[key];
    }
    try {
      await AsyncStorage.clear();
    } catch {
      // In-memory store already cleared
    }
  },
};

// ============================================================================
// Helper Serialization
// ============================================================================

async function fetchJson<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await safeStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] Failed to parse key ${key}:`, error);
    return defaultValue;
  }
}

async function writeJson<T>(key: string, data: T): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    await safeStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`[storage] Failed to write key ${key}:`, error);
    throw error;
  }
}

// ============================================================================
// Storage Initialization
// ============================================================================

/**
 * Initializes persistent storage on application startup.
 * If storage has not been initialized before or is empty, populates seed data.
 */
export async function initializeStorage(): Promise<void> {
  try {
    const initialized = await safeStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const existingProjects = await fetchJson<Project[]>(STORAGE_KEYS.PROJECTS, []);

    if (!initialized || existingProjects.length === 0) {
      console.log('[ARENA STUDIO Storage] Seeding initial demo data...');
      await writeJson(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
      await writeJson(STORAGE_KEYS.FILES, INITIAL_FILES);
      await writeJson(STORAGE_KEYS.AGENTS, INITIAL_AGENTS);
      await writeJson(STORAGE_KEYS.SKILLS, INITIAL_SKILLS);
      await writeJson(STORAGE_KEYS.WORKFLOWS, INITIAL_WORKFLOWS);
      await writeJson(STORAGE_KEYS.INTEGRATIONS, INITIAL_INTEGRATIONS);
      await writeJson(STORAGE_KEYS.BUILD_JOBS, INITIAL_BUILD_JOBS);
      await writeJson(STORAGE_KEYS.DESIGN_ASSETS, INITIAL_DESIGN_ASSETS);
      await safeStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      console.log('[ARENA STUDIO Storage] Initial seeding complete.');
    } else {
      console.log('[ARENA STUDIO Storage] Storage already initialized. Ready.');
    }
  } catch (error) {
    console.error('[ARENA STUDIO Storage] Initialization error:', error);
  }
}

/**
 * Force reset storage to initial demonstration seed data.
 */
export async function resetToSeedData(): Promise<void> {
  console.log('[ARENA STUDIO Storage] Resetting to seed data...');
  await writeJson(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  await writeJson(STORAGE_KEYS.FILES, INITIAL_FILES);
  await writeJson(STORAGE_KEYS.AGENTS, INITIAL_AGENTS);
  await writeJson(STORAGE_KEYS.SKILLS, INITIAL_SKILLS);
  await writeJson(STORAGE_KEYS.WORKFLOWS, INITIAL_WORKFLOWS);
  await writeJson(STORAGE_KEYS.INTEGRATIONS, INITIAL_INTEGRATIONS);
  await writeJson(STORAGE_KEYS.BUILD_JOBS, INITIAL_BUILD_JOBS);
  await writeJson(STORAGE_KEYS.DESIGN_ASSETS, INITIAL_DESIGN_ASSETS);
  await safeStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

/**
 * Clear all persistent storage keys.
 */
export async function clearAllStorage(): Promise<void> {
  await safeStorage.clear();
}

// ============================================================================
// Projects CRUD
// ============================================================================

/**
 * Retrieve all projects.
 */
export async function getProjects(): Promise<Project[]> {
  const projects = await fetchJson<Project[]>(STORAGE_KEYS.PROJECTS, []);
  if (projects.length === 0) {
    // Self-healing: if empty, seed projects
    await writeJson(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    return INITIAL_PROJECTS;
  }
  return projects;
}

/**
 * Retrieve a project by its unique ID.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * Create or update a project.
 */
export async function saveProject(project: Project): Promise<Project> {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.id === project.id);

  const updatedProject: Project = {
    ...project,
    lastModified: new Date().toISOString(),
  };

  let updatedList: Project[];
  if (index >= 0) {
    updatedList = [...projects];
    updatedList[index] = updatedProject;
  } else {
    updatedList = [updatedProject, ...projects];
  }

  await writeJson(STORAGE_KEYS.PROJECTS, updatedList);
  return updatedProject;
}

/**
 * Delete a project and all associated files.
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== projectId);
  if (filtered.length === projects.length) return false;

  await writeJson(STORAGE_KEYS.PROJECTS, filtered);

  // Clean up project files
  const allFiles = await fetchJson<ProjectFile[]>(STORAGE_KEYS.FILES, []);
  const remainingFiles = allFiles.filter((f) => f.projectId !== projectId);
  await writeJson(STORAGE_KEYS.FILES, remainingFiles);

  return true;
}

/**
 * Duplicate an existing project and its files, generating new unique IDs.
 */
export async function duplicateProject(projectId: string): Promise<Project | null> {
  const source = await getProjectById(projectId);
  if (!source) return null;

  const newProjectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const duplicatedProject: Project = {
    ...source,
    id: newProjectId,
    name: `${source.name} (Copy)`,
    isDemo: false,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };

  // Duplicate files
  const allFiles = await fetchJson<ProjectFile[]>(STORAGE_KEYS.FILES, []);
  const sourceFiles = allFiles.filter((f) => f.projectId === projectId);

  const fileIdMap = new Map<string, string>();
  sourceFiles.forEach((file) => {
    fileIdMap.set(file.id, `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  });

  const duplicatedFiles: ProjectFile[] = sourceFiles.map((file) => ({
    ...file,
    id: fileIdMap.get(file.id) || `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    projectId: newProjectId,
    parentId: file.parentId ? (fileIdMap.get(file.parentId) ?? null) : null,
    lastModified: new Date().toISOString(),
  }));

  duplicatedProject.filesCount = duplicatedFiles.length;

  await saveProject(duplicatedProject);
  await writeJson(STORAGE_KEYS.FILES, [...allFiles, ...duplicatedFiles]);

  return duplicatedProject;
}

// ============================================================================
// Project Files CRUD
// ============================================================================

/**
 * Get all files belonging to a specific project.
 */
export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const allFiles = await fetchJson<ProjectFile[]>(STORAGE_KEYS.FILES, []);
  return allFiles.filter((f) => f.projectId === projectId);
}

/**
 * Get a specific file by ID.
 */
export async function getFileById(fileId: string): Promise<ProjectFile | null> {
  const allFiles = await fetchJson<ProjectFile[]>(STORAGE_KEYS.FILES, []);
  return allFiles.find((f) => f.id === fileId) || null;
}

/**
 * Create or save an updated project file.
 */
export async function saveFile(file: ProjectFile): Promise<ProjectFile> {
  const allFiles = await fetchJson<ProjectFile[]>(STORAGE_KEYS.FILES, []);
  const index = allFiles.findIndex((f) => f.id === file.id);

  const updatedFile: ProjectFile = {
    ...file,
    lastModified: new Date().toISOString(),
  };

  let updatedList: ProjectFile[];
  if (index >= 0) {
    updatedList = [...allFiles];
    updatedList[index] = updatedFile;
  } else {
    updatedList = [...allFiles, updatedFile];
  }

  await writeJson(STORAGE_KEYS.FILES, updatedList);

  // Sync project file count and lastModified
  const project = await getProjectById(file.projectId);
  if (project) {
    const projectFilesCount = updatedList.filter((f) => f.projectId === file.projectId).length;
    await saveProject({
      ...project,
      filesCount: projectFilesCount,
    });
  }

  return updatedFile;
}

/**
 * Delete a file or directory by ID.
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  const allFiles = await fetchJson<ProjectFile[]>(STORAGE_KEYS.FILES, []);
  const target = allFiles.find((f) => f.id === fileId);
  if (!target) return false;

  // Filter out target file and any children if it was a directory
  const filtered = allFiles.filter(
    (f) => f.id !== fileId && f.parentId !== fileId && !f.path.startsWith(`${target.path}/`)
  );

  await writeJson(STORAGE_KEYS.FILES, filtered);

  // Sync project file count
  const project = await getProjectById(target.projectId);
  if (project) {
    const projectFilesCount = filtered.filter((f) => f.projectId === target.projectId).length;
    await saveProject({
      ...project,
      filesCount: projectFilesCount,
    });
  }

  return true;
}

// ============================================================================
// Specialist Agents CRUD
// ============================================================================

/**
 * Retrieve all specialist agents.
 */
export async function getAgents(): Promise<Agent[]> {
  const agents = await fetchJson<Agent[]>(STORAGE_KEYS.AGENTS, []);
  if (agents.length === 0) {
    await writeJson(STORAGE_KEYS.AGENTS, INITIAL_AGENTS);
    return INITIAL_AGENTS;
  }
  return agents;
}

/**
 * Retrieve an agent by ID.
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) || null;
}

/**
 * Create or save an agent.
 */
export async function saveAgent(agent: Agent): Promise<Agent> {
  const agents = await getAgents();
  const index = agents.findIndex((a) => a.id === agent.id);

  let updatedList: Agent[];
  if (index >= 0) {
    updatedList = [...agents];
    updatedList[index] = agent;
  } else {
    updatedList = [...agents, agent];
  }

  await writeJson(STORAGE_KEYS.AGENTS, updatedList);
  return agent;
}

/**
 * Update the execution status of an agent.
 */
export async function updateAgentStatus(agentId: string, status: AgentStatus): Promise<Agent | null> {
  const agent = await getAgentById(agentId);
  if (!agent) return null;

  const newActivity: AgentActivity = {
    id: `act-${Date.now()}`,
    agentId,
    timestamp: new Date().toISOString(),
    message: `Status updated to ${status.toUpperCase()}`,
    type: status === 'failed' ? 'error' : status === 'working' ? 'info' : 'success',
  };

  const updatedAgent: Agent = {
    ...agent,
    status,
    activityHistory: [newActivity, ...(agent.activityHistory || [])].slice(0, 30),
  };

  return await saveAgent(updatedAgent);
}

/**
 * Add an activity log entry to an agent.
 */
export async function addAgentActivity(
  agentId: string,
  activity: Omit<AgentActivity, 'id' | 'agentId' | 'timestamp'>
): Promise<Agent | null> {
  const agent = await getAgentById(agentId);
  if (!agent) return null;

  const fullActivity: AgentActivity = {
    id: `act-${Date.now()}`,
    agentId,
    timestamp: new Date().toISOString(),
    ...activity,
  };

  const updatedAgent: Agent = {
    ...agent,
    activityHistory: [fullActivity, ...(agent.activityHistory || [])].slice(0, 50),
  };

  return await saveAgent(updatedAgent);
}

// ============================================================================
// Skills Library CRUD
// ============================================================================

/**
 * Retrieve all skills.
 */
export async function getSkills(): Promise<Skill[]> {
  const skills = await fetchJson<Skill[]>(STORAGE_KEYS.SKILLS, []);
  if (skills.length === 0) {
    await writeJson(STORAGE_KEYS.SKILLS, INITIAL_SKILLS);
    return INITIAL_SKILLS;
  }
  return skills;
}

/**
 * Retrieve a skill by ID.
 */
export async function getSkillById(id: string): Promise<Skill | null> {
  const skills = await getSkills();
  return skills.find((s) => s.id === id) || null;
}

/**
 * Create or update a skill.
 */
export async function saveSkill(skill: Skill): Promise<Skill> {
  const skills = await getSkills();
  const index = skills.findIndex((s) => s.id === skill.id);

  let updatedList: Skill[];
  if (index >= 0) {
    updatedList = [...skills];
    updatedList[index] = skill;
  } else {
    updatedList = [...skills, skill];
  }

  await writeJson(STORAGE_KEYS.SKILLS, updatedList);
  return skill;
}

/**
 * Delete a skill and unassign it from all agents.
 */
export async function deleteSkill(skillId: string): Promise<boolean> {
  const skills = await getSkills();
  const filtered = skills.filter((s) => s.id !== skillId);
  if (filtered.length === skills.length) return false;

  await writeJson(STORAGE_KEYS.SKILLS, filtered);

  // Unassign from agents
  const agents = await getAgents();
  const updatedAgents = agents.map((agent) => ({
    ...agent,
    assignedSkillIds: agent.assignedSkillIds.filter((id) => id !== skillId),
  }));
  await writeJson(STORAGE_KEYS.AGENTS, updatedAgents);

  return true;
}

/**
 * Assign a skill to an agent.
 */
export async function assignSkillToAgent(agentId: string, skillId: string): Promise<boolean> {
  const agent = await getAgentById(agentId);
  const skill = await getSkillById(skillId);
  if (!agent || !skill) return false;

  if (!agent.assignedSkillIds.includes(skillId)) {
    agent.assignedSkillIds = [...agent.assignedSkillIds, skillId];
    await saveAgent(agent);
  }

  if (!skill.assignedAgentIds.includes(agentId)) {
    skill.assignedAgentIds = [...skill.assignedAgentIds, agentId];
    await saveSkill(skill);
  }

  return true;
}

/**
 * Remove a skill from an agent.
 */
export async function removeSkillFromAgent(agentId: string, skillId: string): Promise<boolean> {
  const agent = await getAgentById(agentId);
  const skill = await getSkillById(skillId);
  if (!agent || !skill) return false;

  agent.assignedSkillIds = agent.assignedSkillIds.filter((id) => id !== skillId);
  await saveAgent(agent);

  skill.assignedAgentIds = skill.assignedAgentIds.filter((id) => id !== agentId);
  await saveSkill(skill);

  return true;
}

// ============================================================================
// Multi-Agent Workflows CRUD
// ============================================================================

/**
 * Retrieve all workflows.
 */
export async function getWorkflows(): Promise<Workflow[]> {
  const workflows = await fetchJson<Workflow[]>(STORAGE_KEYS.WORKFLOWS, []);
  if (workflows.length === 0) {
    await writeJson(STORAGE_KEYS.WORKFLOWS, INITIAL_WORKFLOWS);
    return INITIAL_WORKFLOWS;
  }
  return workflows;
}

/**
 * Retrieve a workflow by ID.
 */
export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const workflows = await getWorkflows();
  return workflows.find((w) => w.id === id) || null;
}

/**
 * Save or update a workflow.
 */
export async function saveWorkflow(workflow: Workflow): Promise<Workflow> {
  const workflows = await getWorkflows();
  const index = workflows.findIndex((w) => w.id === workflow.id);

  let updatedList: Workflow[];
  if (index >= 0) {
    updatedList = [...workflows];
    updatedList[index] = workflow;
  } else {
    updatedList = [workflow, ...workflows];
  }

  await writeJson(STORAGE_KEYS.WORKFLOWS, updatedList);
  return workflow;
}

/**
 * Update an individual task within a workflow.
 */
export async function updateWorkflowTask(
  workflowId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<Workflow | null> {
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) return null;

  const taskIndex = workflow.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex < 0) return null;

  const updatedTasks = [...workflow.tasks];
  updatedTasks[taskIndex] = {
    ...updatedTasks[taskIndex],
    ...updates,
    ...(updates.status === 'completed' && !updatedTasks[taskIndex].completedAt
      ? { completedAt: new Date().toISOString(), progress: 100 }
      : {}),
  };

  const allCompleted = updatedTasks.every((t) => t.status === 'completed');
  const hasFailure = updatedTasks.some((t) => t.status === 'failed');

  const updatedWorkflow: Workflow = {
    ...workflow,
    tasks: updatedTasks,
    status: allCompleted ? 'completed' : hasFailure ? 'failed' : workflow.status,
    completedAt: allCompleted ? new Date().toISOString() : workflow.completedAt,
  };

  return await saveWorkflow(updatedWorkflow);
}

// ============================================================================
// Cloud Integrations CRUD
// ============================================================================

/**
 * Retrieve all cloud integrations.
 */
export async function getIntegrations(): Promise<Integration[]> {
  const integrations = await fetchJson<Integration[]>(STORAGE_KEYS.INTEGRATIONS, []);
  if (integrations.length === 0) {
    await writeJson(STORAGE_KEYS.INTEGRATIONS, INITIAL_INTEGRATIONS);
    return INITIAL_INTEGRATIONS;
  }
  return integrations;
}

/**
 * Update an integration's configuration or connection status.
 */
export async function updateIntegration(
  id: string,
  updates: Partial<Integration>
): Promise<Integration | null> {
  const integrations = await getIntegrations();
  const index = integrations.findIndex((i) => i.id === id);
  if (index < 0) return null;

  const updatedList = [...integrations];
  updatedList[index] = {
    ...updatedList[index],
    ...updates,
    lastSync: updates.isConnected ? 'Just now' : updatedList[index].lastSync,
  };

  await writeJson(STORAGE_KEYS.INTEGRATIONS, updatedList);
  return updatedList[index];
}

// ============================================================================
// Build Jobs CRUD
// ============================================================================

/**
 * Retrieve all build jobs, optionally filtered by project ID.
 */
export async function getBuildJobs(projectId?: string): Promise<BuildJob[]> {
  const jobs = await fetchJson<BuildJob[]>(STORAGE_KEYS.BUILD_JOBS, []);
  const list = jobs.length === 0 ? INITIAL_BUILD_JOBS : jobs;
  if (projectId) {
    return list.filter((j) => j.projectId === projectId);
  }
  return list;
}

/**
 * Save or record a new build job.
 */
export async function saveBuildJob(buildJob: BuildJob): Promise<BuildJob> {
  const jobs = await getBuildJobs();
  const index = jobs.findIndex((j) => j.id === buildJob.id);

  let updatedList: BuildJob[];
  if (index >= 0) {
    updatedList = [...jobs];
    updatedList[index] = buildJob;
  } else {
    updatedList = [buildJob, ...jobs];
  }

  await writeJson(STORAGE_KEYS.BUILD_JOBS, updatedList);

  // Sync project buildStatus
  const project = await getProjectById(buildJob.projectId);
  if (project) {
    const newBuildStatus =
      buildJob.status === 'in_progress'
        ? 'building'
        : buildJob.status === 'success'
        ? 'success'
        : buildJob.status === 'failed'
        ? 'failed'
        : project.buildStatus;

    await saveProject({
      ...project,
      buildStatus: newBuildStatus,
      ...(buildJob.artifactUrl ? { previewUrl: buildJob.artifactUrl } : {}),
    });
  }

  return buildJob;
}

// ============================================================================
// Design Assets CRUD
// ============================================================================

/**
 * Retrieve all design assets, optionally filtered by project ID.
 */
export async function getDesignAssets(projectId?: string): Promise<DesignAsset[]> {
  const assets = await fetchJson<DesignAsset[]>(STORAGE_KEYS.DESIGN_ASSETS, []);
  const list = assets.length === 0 ? INITIAL_DESIGN_ASSETS : assets;
  if (projectId) {
    return list.filter((a) => a.projectId === projectId);
  }
  return list;
}

/**
 * Save or update a design asset.
 */
export async function saveDesignAsset(asset: DesignAsset): Promise<DesignAsset> {
  const assets = await getDesignAssets();
  const index = assets.findIndex((a) => a.id === asset.id);

  let updatedList: DesignAsset[];
  if (index >= 0) {
    updatedList = [...assets];
    updatedList[index] = asset;
  } else {
    updatedList = [...assets, asset];
  }

  await writeJson(STORAGE_KEYS.DESIGN_ASSETS, updatedList);
  return asset;
}

/**
 * Delete a design asset.
 */
export async function deleteDesignAsset(assetId: string): Promise<boolean> {
  const assets = await getDesignAssets();
  const filtered = assets.filter((a) => a.id !== assetId);
  if (filtered.length === assets.length) return false;

  await writeJson(STORAGE_KEYS.DESIGN_ASSETS, filtered);
  return true;
}
