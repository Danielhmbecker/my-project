/**
 * ARENA STUDIO Multi-Agent Task Orchestration Engine
 * 
 * Core engine responsible for:
 * 1. Project objective intake & automated 5-stage pipeline generation.
 * 2. Task dependency DAG resolution & parallel execution wave dispatching.
 * 3. Human approval checkpoint gating & interactive sign-off.
 * 4. Resilient execution state machine (pending -> in_progress -> needs_approval -> completed / failed).
 * 5. Lifecycle controls (start, pause, resume, cancel, retry).
 * 6. Authentic execution logging, agent status synchronization, and storage persistence.
 */

import { Task, Workflow, Agent, AgentStatus, TaskStatus, WorkflowStatus } from '../models';
import {
  saveWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflowTask,
  getAgents,
  updateAgentStatus,
  addAgentActivity,
} from '../storage';
import {
  DAGSolver,
  TaskRunner,
  taskRunner,
  ExecutionLogEntry,
  TaskApprovalRequest,
  TaskExecutionResult,
} from './taskRunner';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type OrchestratorEventType =
  | 'workflow:created'
  | 'workflow:started'
  | 'workflow:paused'
  | 'workflow:resumed'
  | 'workflow:completed'
  | 'workflow:failed'
  | 'workflow:cancelled'
  | 'task:started'
  | 'task:progress'
  | 'task:needs_approval'
  | 'task:approved'
  | 'task:rejected'
  | 'task:completed'
  | 'task:failed'
  | 'task:retried'
  | 'log:new';

export interface OrchestratorEvent {
  type: OrchestratorEventType;
  workflowId: string;
  workflow?: Workflow;
  taskId?: string;
  task?: Task;
  agentId?: string | null;
  agentName?: string;
  progress?: number;
  message?: string;
  log?: ExecutionLogEntry;
  approvalRequest?: TaskApprovalRequest;
  timestamp: string;
}

export type OrchestratorListener = (event: OrchestratorEvent) => void;

export interface WorkflowGenerationOptions {
  projectId?: string;
  autoStart?: boolean;
  stepDelayMs?: number;
  requireHumanApprovalForQA?: boolean;
}

export interface TaskStageDefinition {
  stage: 'architect' | 'designer' | 'developer' | 'qa' | 'release';
  title: string;
  description: (objective: string) => string;
  agentId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: number[]; // index of preceding stages
  requiresApproval?: boolean;
}

// ============================================================================
// 5-Stage Task Pipeline Blueprint
// ============================================================================

const PIPELINE_STAGES: TaskStageDefinition[] = [
  {
    stage: 'architect',
    title: 'Architecture & Technical Specifications',
    description: (obj) => `Define system architecture, TypeScript contracts, storage schema, and file structure for "${obj}".`,
    agentId: 'agent-architect',
    priority: 'high',
    dependencies: [],
    requiresApproval: false,
  },
  {
    stage: 'designer',
    title: 'UI Component Kit & Design Tokens',
    description: (obj) => `Prepare dark-mode developer design tokens, color scales, and UI component kit specifications for "${obj}".`,
    agentId: 'agent-design',
    priority: 'high',
    dependencies: [0], // depends on Architect
    requiresApproval: false,
  },
  {
    stage: 'developer',
    title: 'Screen Implementation & State Storage',
    description: (obj) => `Implement screens, navigation hierarchy, and persistent storage store for "${obj}".`,
    agentId: 'agent-developer',
    priority: 'critical',
    dependencies: [0, 1], // depends on Architect & Designer
    requiresApproval: false,
  },
  {
    stage: 'qa',
    title: 'Quality Assurance & Diagnostics',
    description: (obj) => `Run automated test suites, verify navigation responsiveness, test offline bounds, and report edge cases for "${obj}".`,
    agentId: 'agent-qa',
    priority: 'high',
    dependencies: [2], // depends on Developer
    requiresApproval: true, // Human approval checkpoint before Release!
  },
  {
    stage: 'release',
    title: 'EAS Build & Release Packaging',
    description: (obj) => `Configure EAS build profiles, bundle native Hermes bytecode, and prepare release notes for "${obj}".`,
    agentId: 'agent-release',
    priority: 'medium',
    dependencies: [3], // depends on QA approval
    requiresApproval: false,
  },
];

// ============================================================================
// Orchestrator Engine Class
// ============================================================================

export class Orchestrator {
  private listeners: Set<OrchestratorListener> = new Set();
  private workflowLogs: Map<string, ExecutionLogEntry[]> = new Map();
  private executionLocks: Set<string> = new Set();
  private approvalRequests: Map<string, TaskApprovalRequest> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private runner: TaskRunner;
  private agentCache: Map<string, Agent> = new Map();

  constructor(customRunner?: TaskRunner) {
    this.runner = customRunner || taskRunner;
  }

  // ==========================================================================
  // Subscriptions & Event Dispatching
  // ==========================================================================

  /**
   * Subscribe to real-time events emitted by the orchestrator engine.
   * Returns an unsubscribe function.
   */
  public subscribe(listener: OrchestratorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit an orchestrator event to all active subscribers.
   */
  private emit(event: OrchestratorEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[Orchestrator] Error in listener callback:', err);
      }
    });
  }

  // ==========================================================================
  // Agent Resolution Helpers
  // ==========================================================================

  private async getAgentName(agentId?: string | null): Promise<string> {
    if (!agentId) return 'Specialist Agent';
    if (this.agentCache.has(agentId)) {
      return this.agentCache.get(agentId)!.name;
    }
    try {
      const agents = await getAgents();
      for (const a of agents) {
        this.agentCache.set(a.id, a);
      }
      return this.agentCache.get(agentId)?.name || agentId;
    } catch {
      return agentId;
    }
  }

  // ==========================================================================
  // Objective Intake & Pipeline Generation
  // ==========================================================================

  /**
   * Generates a 5-step task breakdown pipeline from a project objective.
   */
  public generatePipelineTasks(objective: string, workflowId: string, requireQAApproval: boolean = true): Task[] {
    const taskIds = PIPELINE_STAGES.map((_, index) => `${workflowId}-step-${index + 1}`);

    return PIPELINE_STAGES.map((stageDef, index) => {
      const taskId = taskIds[index];
      const dependsOn = stageDef.dependencies.map((depIndex) => taskIds[depIndex]);
      const requiresApproval = stageDef.stage === 'qa' ? requireQAApproval : !!stageDef.requiresApproval;

      const task: Task = {
        id: taskId,
        objectiveId: workflowId,
        title: stageDef.title,
        description: stageDef.description(objective),
        assignedAgentId: stageDef.agentId,
        status: 'pending',
        priority: stageDef.priority,
        dependsOn,
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      // Store flag in extended metadata
      (task as any).requiresApproval = requiresApproval;
      (task as any).stage = stageDef.stage;

      return task;
    });
  }

  /**
   * Objective Intake: Takes a high-level project objective and builds an executable workflow.
   */
  public async createWorkflowFromObjective(
    objective: string,
    options: WorkflowGenerationOptions = {}
  ): Promise<Workflow> {
    const timestamp = Date.now();
    const workflowId = `wf-${timestamp}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Create clean title from objective
    const cleanObjective = objective.trim();
    const title = cleanObjective.length > 50
      ? `${cleanObjective.substring(0, 47)}...`
      : cleanObjective;

    const tasks = this.generatePipelineTasks(
      cleanObjective,
      workflowId,
      options.requireHumanApprovalForQA !== false
    );

    // Validate generated DAG
    const validation = DAGSolver.validateDAG(tasks);
    if (!validation.isValid) {
      throw new Error(`Generated pipeline DAG is invalid: ${validation.error}`);
    }

    const workflow: Workflow = {
      id: workflowId,
      title,
      objective: cleanObjective,
      status: 'idle',
      tasks,
      createdAt: new Date().toISOString(),
      projectId: options.projectId,
    };

    // Persist to storage
    await saveWorkflow(workflow);

    // Initialize logs
    this.workflowLogs.set(workflowId, []);

    this.emit({
      type: 'workflow:created',
      workflowId,
      workflow,
      timestamp: new Date().toISOString(),
      message: `Workflow created for objective: "${cleanObjective}"`,
    });

    // Auto-start if requested
    if (options.autoStart) {
      // Run asynchronously so caller gets created workflow immediately
      setTimeout(() => {
        this.startWorkflow(workflowId, options.stepDelayMs).catch((err) => {
          console.error('[Orchestrator] Failed to auto-start workflow:', err);
        });
      }, 50);
    }

    return workflow;
  }

  // ==========================================================================
  // Execution State Machine & Lifecycle
  // ==========================================================================

  /**
   * Starts or resumes execution of a workflow.
   */
  public async startWorkflow(workflowId: string, stepDelayMs: number = 300): Promise<Workflow> {
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID "${workflowId}" not found.`);
    }

    if (workflow.status === 'running') {
      return workflow;
    }

    // Set status to running
    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'running',
    };
    await saveWorkflow(updatedWorkflow);

    // Set up cancellation controller
    const abortController = new AbortController();
    this.abortControllers.set(workflowId, abortController);

    this.emit({
      type: 'workflow:started',
      workflowId,
      workflow: updatedWorkflow,
      timestamp: new Date().toISOString(),
      message: `Workflow "${workflow.title}" started.`,
    });

    // Launch execution loop
    this.runWorkflowLoop(workflowId, stepDelayMs).catch((err) => {
      console.error(`[Orchestrator] Execution loop error on ${workflowId}:`, err);
    });

    return updatedWorkflow;
  }

  /**
   * Pauses an actively running workflow.
   */
  public async pauseWorkflow(workflowId: string): Promise<Workflow> {
    // Abort active execution loop
    const controller = this.abortControllers.get(workflowId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(workflowId);
    }

    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found.`);
    }

    // Cancel currently running task runners
    for (const task of workflow.tasks) {
      if (task.status === 'in_progress') {
        this.runner.cancelTask(task.id);
      }
    }

    // Reset in_progress tasks back to pending so they can resume cleanly
    const updatedTasks = workflow.tasks.map((task) => {
      if (task.status === 'in_progress') {
        return {
          ...task,
          status: 'pending' as TaskStatus,
        };
      }
      return task;
    });

    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'paused',
      tasks: updatedTasks,
    };
    await saveWorkflow(updatedWorkflow);

    this.emit({
      type: 'workflow:paused',
      workflowId,
      workflow: updatedWorkflow,
      timestamp: new Date().toISOString(),
      message: `Workflow "${workflow.title}" paused by user.`,
    });

    return updatedWorkflow;
  }

  /**
   * Resumes a paused workflow.
   */
  public async resumeWorkflow(workflowId: string, stepDelayMs: number = 300): Promise<Workflow> {
    return this.startWorkflow(workflowId, stepDelayMs);
  }

  /**
   * Cancels a workflow permanently.
   */
  public async cancelWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found.`);
    }

    const controller = this.abortControllers.get(workflowId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(workflowId);
    }

    // Cancel all running tasks
    for (const task of workflow.tasks) {
      this.runner.cancelTask(task.id);
    }

    const updatedTasks: Task[] = workflow.tasks.map((task) => {
      if (task.status === 'in_progress' || task.status === 'needs_approval') {
        return {
          ...task,
          status: 'failed',
          result: 'Cancelled by user.',
        };
      }
      return task;
    });

    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'failed',
      tasks: updatedTasks,
    };
    await saveWorkflow(updatedWorkflow);

    this.emit({
      type: 'workflow:cancelled',
      workflowId,
      workflow: updatedWorkflow,
      timestamp: new Date().toISOString(),
      message: `Workflow "${workflow.title}" cancelled.`,
    });

    return updatedWorkflow;
  }

  /**
   * Retries an individual failed task and unblocks dependent tasks.
   */
  public async retryTask(workflowId: string, taskId: string, stepDelayMs: number = 300): Promise<Workflow> {
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found.`);
    }

    const taskIndex = workflow.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex < 0) {
      throw new Error(`Task "${taskId}" not found in workflow.`);
    }

    // Reset task
    const updatedTasks = [...workflow.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      status: 'pending',
      progress: 0,
      result: undefined,
      completedAt: undefined,
    };

    // Reset downstream tasks that were blocked/failed
    const downstreamIds = DAGSolver.getAllDownstreamTaskIds(taskId, workflow.tasks);
    for (let i = 0; i < updatedTasks.length; i++) {
      if (downstreamIds.includes(updatedTasks[i].id)) {
        updatedTasks[i] = {
          ...updatedTasks[i],
          status: 'pending',
          progress: 0,
          result: undefined,
          completedAt: undefined,
        };
      }
    }

    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'running',
      tasks: updatedTasks,
    };
    await saveWorkflow(updatedWorkflow);

    this.emit({
      type: 'task:retried',
      workflowId,
      taskId,
      workflow: updatedWorkflow,
      timestamp: new Date().toISOString(),
      message: `Task "${workflow.tasks[taskIndex].title}" retried. Resuming workflow.`,
    });

    // Start execution
    return this.startWorkflow(workflowId, stepDelayMs);
  }

  /**
   * Retries the entire workflow starting from the first failed/pending step.
   */
  public async retryWorkflow(workflowId: string, stepDelayMs: number = 300): Promise<Workflow> {
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found.`);
    }

    const updatedTasks = workflow.tasks.map((task) => {
      if (task.status === 'failed' || task.status === 'blocked') {
        return {
          ...task,
          status: 'pending' as TaskStatus,
          progress: 0,
          result: undefined,
          completedAt: undefined,
        };
      }
      return task;
    });

    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'running',
      tasks: updatedTasks,
    };
    await saveWorkflow(updatedWorkflow);

    return this.startWorkflow(workflowId, stepDelayMs);
  }

  // ==========================================================================
  // Human Approval Checkpoint
  // ==========================================================================

  /**
   * Approves a task currently waiting at a human approval checkpoint.
   */
  public async approveTask(
    workflowId: string,
    taskId: string,
    feedback?: string,
    stepDelayMs: number = 300
  ): Promise<Workflow> {
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found.`);
    }

    const task = workflow.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found in workflow.`);
    }

    if (task.status !== 'needs_approval') {
      throw new Error(`Task "${taskId}" is in status "${task.status}", not "needs_approval".`);
    }

    // Update task to completed
    const resultMessage = feedback
      ? `${task.result || 'Task verified.'}\n\n[Human Operator Feedback]: ${feedback}`
      : task.result || 'Approved by human operator.';

    const updatedWorkflow = await updateWorkflowTask(workflowId, taskId, {
      status: 'completed',
      progress: 100,
      result: resultMessage,
      completedAt: new Date().toISOString(),
    });

    if (!updatedWorkflow) {
      throw new Error('Failed to update workflow task in storage.');
    }

    // Clear approval request
    this.approvalRequests.delete(taskId);

    // Update agent status back to ready
    if (task.assignedAgentId) {
      await updateAgentStatus(task.assignedAgentId, 'ready');
      await addAgentActivity(task.assignedAgentId, {
        message: `Task "${task.title}" approved by human operator. Completed.`,
        type: 'success',
        taskId: task.id,
      });
    }

    this.emit({
      type: 'task:approved',
      workflowId,
      taskId,
      workflow: updatedWorkflow,
      timestamp: new Date().toISOString(),
      message: `Task "${task.title}" approved. Resuming pipeline.`,
    });

    // Auto-resume workflow to dispatch next stage (e.g. Release Agent)
    return this.startWorkflow(workflowId, stepDelayMs);
  }

  /**
   * Rejects a task at the human approval checkpoint.
   */
  public async rejectTask(workflowId: string, taskId: string, reason?: string): Promise<Workflow> {
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found.`);
    }

    const task = workflow.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found in workflow.`);
    }

    const rejectionMessage = reason
      ? `Rejected by human operator: ${reason}`
      : 'Rejected by human operator.';

    const updatedWorkflow = await updateWorkflowTask(workflowId, taskId, {
      status: 'failed',
      result: rejectionMessage,
    });

    if (!updatedWorkflow) {
      throw new Error('Failed to update workflow task in storage.');
    }

    this.approvalRequests.delete(taskId);

    // Update agent status back to ready
    if (task.assignedAgentId) {
      await updateAgentStatus(task.assignedAgentId, 'ready');
      await addAgentActivity(task.assignedAgentId, {
        message: `Task "${task.title}" rejected: ${rejectionMessage}`,
        type: 'error',
        taskId: task.id,
      });
    }

    this.emit({
      type: 'task:rejected',
      workflowId,
      taskId,
      workflow: updatedWorkflow,
      timestamp: new Date().toISOString(),
      message: `Task "${task.title}" rejected.`,
    });

    return updatedWorkflow;
  }

  // ==========================================================================
  // Core Execution Loop & DAG Dispatcher
  // ==========================================================================

  /**
   * Main reactive loop that executes DAG-ready tasks until workflow completes,
   * pauses at human checkpoint, or halts on error.
   */
  private async runWorkflowLoop(workflowId: string, stepDelayMs: number): Promise<void> {
    // Prevent duplicate loops on the same workflow
    if (this.executionLocks.has(workflowId)) {
      return;
    }
    this.executionLocks.add(workflowId);

    try {
      while (true) {
        const workflow = await getWorkflowById(workflowId);
        if (!workflow || workflow.status !== 'running') {
          break;
        }

        const tasks = workflow.tasks;

        // Check if all tasks are completed
        const allCompleted = tasks.every((t) => t.status === 'completed');
        if (allCompleted) {
          const completedWorkflow: Workflow = {
            ...workflow,
            status: 'completed',
            completedAt: new Date().toISOString(),
          };
          await saveWorkflow(completedWorkflow);

          this.emit({
            type: 'workflow:completed',
            workflowId,
            workflow: completedWorkflow,
            timestamp: new Date().toISOString(),
            message: `Workflow "${workflow.title}" completed all 5 pipeline stages successfully!`,
          });
          break;
        }

        // Check if any task is awaiting human approval
        const awaitingApproval = tasks.some((t) => t.status === 'needs_approval');
        if (awaitingApproval) {
          // Pause workflow while waiting for user approval
          const pausedWorkflow: Workflow = {
            ...workflow,
            status: 'paused',
          };
          await saveWorkflow(pausedWorkflow);

          this.emit({
            type: 'workflow:paused',
            workflowId,
            workflow: pausedWorkflow,
            timestamp: new Date().toISOString(),
            message: `Workflow paused awaiting human approval checkpoint.`,
          });
          break;
        }

        // Check if any task failed
        const hasFailed = tasks.some((t) => t.status === 'failed');
        if (hasFailed) {
          const failedWorkflow: Workflow = {
            ...workflow,
            status: 'failed',
          };
          await saveWorkflow(failedWorkflow);

          this.emit({
            type: 'workflow:failed',
            workflowId,
            workflow: failedWorkflow,
            timestamp: new Date().toISOString(),
            message: `Workflow execution halted due to failed task.`,
          });
          break;
        }

        // Find tasks ready to run according to DAG dependencies
        const readyTasks = DAGSolver.getReadyTasks(tasks);

        if (readyTasks.length === 0) {
          // No tasks ready. Check if tasks are in progress or if we're deadlocked.
          const inProgress = tasks.filter((t) => t.status === 'in_progress');
          if (inProgress.length === 0) {
            // Nothing running and nothing ready: blocked dependency state
            console.warn(`[Orchestrator] No ready tasks found for workflow ${workflowId}. Stopping loop.`);
            break;
          }
          // Some tasks are in progress, wait briefly for them
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }

        // Run ready tasks in parallel
        await Promise.all(
          readyTasks.map((task) => this.dispatchTask(workflowId, task, workflow.objective, stepDelayMs))
        );
      }
    } finally {
      this.executionLocks.delete(workflowId);
    }
  }

  /**
   * Dispatches and monitors an individual task.
   */
  private async dispatchTask(
    workflowId: string,
    task: Task,
    objective: string,
    stepDelayMs: number
  ): Promise<void> {
    const agentName = await this.getAgentName(task.assignedAgentId);

    // Update agent status to working
    if (task.assignedAgentId) {
      await updateAgentStatus(task.assignedAgentId, 'working');
      await addAgentActivity(task.assignedAgentId, {
        message: `Began executing task: "${task.title}"`,
        type: 'info',
        taskId: task.id,
      });
    }

    // Set task to in_progress
    await updateWorkflowTask(workflowId, task.id, {
      status: 'in_progress',
      progress: 5,
    });

    this.emit({
      type: 'task:started',
      workflowId,
      taskId: task.id,
      agentId: task.assignedAgentId,
      agentName,
      timestamp: new Date().toISOString(),
      message: `Agent ${agentName} started task: "${task.title}"`,
    });

    const requiresApproval = !!(task as any).requiresApproval;

    // Execute task via TaskRunner
    const result: TaskExecutionResult = await this.runner.executeTask(
      task,
      workflowId,
      objective,
      {
        stepDelayMs,
        agentNameResolver: () => agentName,
        onLog: (log) => {
          // Record to workflow logs
          const existingLogs = this.workflowLogs.get(workflowId) || [];
          existingLogs.push(log);
          this.workflowLogs.set(workflowId, existingLogs.slice(-200));

          this.emit({
            type: 'log:new',
            workflowId,
            taskId: task.id,
            log,
            timestamp: log.timestamp,
          });
        },
        onProgress: async (taskId, progress, stepMessage) => {
          await updateWorkflowTask(workflowId, taskId, { progress });

          this.emit({
            type: 'task:progress',
            workflowId,
            taskId,
            progress,
            message: stepMessage,
            timestamp: new Date().toISOString(),
          });
        },
        onStatusChange: async (taskId, status) => {
          await updateWorkflowTask(workflowId, taskId, { status });
        },
        onRequestApproval: (request) => {
          this.approvalRequests.set(request.taskId, request);

          this.emit({
            type: 'task:needs_approval',
            workflowId,
            taskId: request.taskId,
            approvalRequest: request,
            timestamp: new Date().toISOString(),
            message: `Task "${request.taskTitle}" reached approval checkpoint.`,
          });
        },
      },
      requiresApproval
    );

    // Handle completion
    if (result.pausedForApproval) {
      // Task is waiting for approval checkpoint
      await updateWorkflowTask(workflowId, task.id, {
        status: 'needs_approval',
        progress: 100,
        result: result.output,
      });
      return;
    }

    // If workflow was paused while this task was running, do not update as failed in storage
    const currentWf = await getWorkflowById(workflowId);
    if (currentWf && currentWf.status === 'paused') {
      return;
    }

    if (result.success) {
      await updateWorkflowTask(workflowId, task.id, {
        status: 'completed',
        progress: 100,
        result: result.output,
        completedAt: result.completedAt,
      });

      if (task.assignedAgentId) {
        await updateAgentStatus(task.assignedAgentId, 'ready');
        await addAgentActivity(task.assignedAgentId, {
          message: `Completed task: "${task.title}"`,
          type: 'success',
          taskId: task.id,
        });
      }

      this.emit({
        type: 'task:completed',
        workflowId,
        taskId: task.id,
        agentId: task.assignedAgentId,
        agentName,
        timestamp: new Date().toISOString(),
        message: `Task "${task.title}" completed.`,
      });
    } else {
      await updateWorkflowTask(workflowId, task.id, {
        status: 'failed',
        result: result.error || 'Execution failed.',
      });

      if (task.assignedAgentId) {
        await updateAgentStatus(task.assignedAgentId, 'ready');
        await addAgentActivity(task.assignedAgentId, {
          message: `Failed executing task: "${task.title}" - ${result.error}`,
          type: 'error',
          taskId: task.id,
        });
      }

      this.emit({
        type: 'task:failed',
        workflowId,
        taskId: task.id,
        agentId: task.assignedAgentId,
        agentName,
        timestamp: new Date().toISOString(),
        message: `Task "${task.title}" failed: ${result.error}`,
      });
    }
  }

  // ==========================================================================
  // Query & Inspection Methods
  // ==========================================================================

  /**
   * Retrieves all workflows from storage.
   */
  public async getWorkflows(): Promise<Workflow[]> {
    return await getWorkflows();
  }

  /**
   * Retrieves a specific workflow by ID.
   */
  public async getWorkflow(workflowId: string): Promise<Workflow | null> {
    return await getWorkflowById(workflowId);
  }

  /**
   * Returns recent execution logs for a workflow.
   */
  public getWorkflowLogs(workflowId: string): ExecutionLogEntry[] {
    return this.workflowLogs.get(workflowId) || [];
  }

  /**
   * Retrieves any pending approval request for a task.
   */
  public getPendingApprovalRequest(taskId: string): TaskApprovalRequest | undefined {
    return this.approvalRequests.get(taskId);
  }

  /**
   * Checks if an approval request is pending for a task.
   */
  public hasPendingApproval(taskId: string): boolean {
    return this.approvalRequests.has(taskId);
  }

  /**
   * Solves execution waves for a workflow's tasks.
   */
  public getWorkflowWaves(workflow: Workflow): Task[][] {
    return DAGSolver.getExecutionWaves(workflow.tasks);
  }
}

// Export singleton instance for app-wide use
export const orchestrator = new Orchestrator();
