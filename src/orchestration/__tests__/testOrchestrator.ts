/**
 * Comprehensive Automated Test Suite for ARENA STUDIO Orchestrator Engine & DAG Solver
 */

import { orchestrator, Orchestrator } from '../orchestrator';
import { DAGSolver, TaskRunner } from '../taskRunner';
import { Task, Workflow } from '../../models';
import { initializeStorage, getWorkflows, getWorkflowById, getAgents } from '../../storage';

async function runTests() {
  console.log('=== ARENA STUDIO Orchestrator Engine Verification ===\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      if (detail) console.error(`    Detail: ${detail}`);
      process.exitCode = 1;
    }
  }

  // 1. Initialize Storage
  console.log('--- 1. Storage Initialization ---');
  await initializeStorage();
  const initialAgents = await getAgents();
  assert(initialAgents.length >= 8, 'Storage initialized with 8+ specialist agents', `Found: ${initialAgents.length}`);

  // 2. Objective Intake & 5-Step Pipeline Generation
  console.log('\n--- 2. Project Objective Intake & 5-Step Pipeline ---');
  const objective = 'Build a personal finance application with biometric authentication';
  const workflow = await orchestrator.createWorkflowFromObjective(objective, {
    projectId: 'proj-nexa-finance',
    autoStart: false,
  });

  assert(!!workflow.id, 'Workflow generated with unique ID', workflow.id);
  assert(workflow.objective === objective, 'Workflow retains objective', workflow.objective);
  assert(workflow.status === 'idle', 'Initial workflow status is "idle"', workflow.status);
  assert(workflow.tasks.length === 5, 'Workflow generated exact 5-step pipeline', `Task count: ${workflow.tasks.length}`);

  // Inspect 5 Pipeline Stages
  const [task1, task2, task3, task4, task5] = workflow.tasks;

  assert(
    task1.assignedAgentId === 'agent-architect' && task1.dependsOn.length === 0,
    'Step 1: Architect Agent, 0 dependencies',
    `Agent: ${task1.assignedAgentId}, Deps: ${task1.dependsOn.length}`
  );

  assert(
    task2.assignedAgentId === 'agent-design' && task2.dependsOn.includes(task1.id),
    'Step 2: Design Agent, depends on Architect',
    `Agent: ${task2.assignedAgentId}, Deps: ${task2.dependsOn.join(', ')}`
  );

  assert(
    task3.assignedAgentId === 'agent-developer' &&
    task3.dependsOn.includes(task1.id) &&
    task3.dependsOn.includes(task2.id),
    'Step 3: Developer Agent, depends on Architect & Designer',
    `Agent: ${task3.assignedAgentId}, Deps: ${task3.dependsOn.join(', ')}`
  );

  assert(
    task4.assignedAgentId === 'agent-qa' && task4.dependsOn.includes(task3.id),
    'Step 4: QA Agent, depends on Developer',
    `Agent: ${task4.assignedAgentId}, Deps: ${task4.dependsOn.join(', ')}`
  );

  assert(
    (task4 as any).requiresApproval === true,
    'Step 4: QA has Human Approval Checkpoint configured',
    `requiresApproval: ${(task4 as any).requiresApproval}`
  );

  assert(
    task5.assignedAgentId === 'agent-release' && task5.dependsOn.includes(task4.id),
    'Step 5: Release Agent, depends on QA approval',
    `Agent: ${task5.assignedAgentId}, Deps: ${task5.dependsOn.join(', ')}`
  );

  // 3. DAG Solver Verification
  console.log('\n--- 3. Task Dependency DAG Solver ---');
  const dagValidation = DAGSolver.validateDAG(workflow.tasks);
  assert(dagValidation.isValid, 'DAGSolver validates valid pipeline graph');

  // Test cycle detection
  const cyclicTasks: Task[] = [
    { ...task1, id: 'c1', dependsOn: ['c3'] },
    { ...task2, id: 'c2', dependsOn: ['c1'] },
    { ...task3, id: 'c3', dependsOn: ['c2'] },
  ];
  const cycleResult = DAGSolver.validateDAG(cyclicTasks);
  assert(!cycleResult.isValid && !!cycleResult.cycles, 'DAGSolver detects cyclic dependencies');

  // Test execution waves
  const waves = DAGSolver.getExecutionWaves(workflow.tasks);
  assert(waves.length === 5, 'DAGSolver produces 5 execution waves for the linear/parallel stages', `Waves: ${waves.length}`);
  assert(waves[0][0].id === task1.id, 'Wave 0 contains Architect task');
  assert(waves[1][0].id === task2.id, 'Wave 1 contains Designer task');
  assert(waves[2][0].id === task3.id, 'Wave 2 contains Developer task');

  // Ready tasks query
  const readyInitial = DAGSolver.getReadyTasks(workflow.tasks);
  assert(
    readyInitial.length === 1 && readyInitial[0].id === task1.id,
    'DAGSolver determines only Step 1 (Architect) is initially ready'
  );

  const blockedInitial = DAGSolver.getBlockedTasks(workflow.tasks);
  assert(blockedInitial.length === 4, 'DAGSolver determines Steps 2-5 are blocked waiting for dependencies');

  // Transitive downstream query
  const downstreamOfArchitect = DAGSolver.getAllDownstreamTaskIds(task1.id, workflow.tasks);
  assert(downstreamOfArchitect.length === 4, 'Downstream of Architect includes all remaining 4 tasks');

  // 4. Execution State Machine & Lifecycle (Fast Execution)
  console.log('\n--- 4. Execution State Machine & Human Approval Checkpoint ---');
  
  // Track events emitted
  const eventsCaptured: string[] = [];
  const unsubscribe = orchestrator.subscribe((event) => {
    eventsCaptured.push(event.type);
  });

  // Start workflow with ultra-fast step delay (10ms)
  console.log('  -> Starting workflow execution...');
  await orchestrator.startWorkflow(workflow.id, 10);

  // Wait for execution to reach human approval checkpoint at Task 4 (QA)
  console.log('  -> Waiting for QA Human Approval checkpoint...');
  let attempts = 0;
  let currentWf: Workflow | null = null;
  while (attempts < 50) {
    await new Promise((r) => setTimeout(r, 100));
    currentWf = await getWorkflowById(workflow.id);
    if (currentWf && currentWf.tasks[3].status === 'needs_approval') {
      break;
    }
    attempts++;
  }

  assert(
    currentWf !== null && currentWf.tasks[3].status === 'needs_approval',
    'Task 4 (QA) transitioned to "needs_approval"',
    `Task 4 status: ${currentWf?.tasks[3].status}`
  );

  assert(
    currentWf?.tasks[0].status === 'completed' &&
    currentWf?.tasks[1].status === 'completed' &&
    currentWf?.tasks[2].status === 'completed',
    'Preceding stages (Architect, Designer, Developer) are all completed',
    `Task statuses: ${currentWf?.tasks.map(t => `${t.id}=${t.status}`).join(', ')}`
  );

  assert(
    currentWf?.status === 'paused',
    'Workflow paused execution at Human Approval Checkpoint',
    `Workflow status: ${currentWf?.status}`
  );

  assert(
    currentWf?.tasks[4].status === 'pending',
    'Step 5 (Release) remains pending while QA is awaiting approval',
    `Step 5 status: ${currentWf?.tasks[4].status}`
  );

  // Verify approval request was recorded
  const approvalReq = orchestrator.getPendingApprovalRequest(currentWf!.tasks[3].id);
  assert(!!approvalReq, 'Approval request recorded in orchestrator cache');

  // 5. Human Approves & Pipeline Completes
  console.log('\n--- 5. Human Approval & Pipeline Completion ---');
  console.log('  -> Human operator approves QA task...');
  await orchestrator.approveTask(
    workflow.id,
    currentWf!.tasks[3].id,
    'All automated test suites verified by QA Lead. Cleared for EAS production build.',
    10
  );

  // Wait for workflow to finish Release step
  attempts = 0;
  while (attempts < 50) {
    await new Promise((r) => setTimeout(r, 100));
    currentWf = await getWorkflowById(workflow.id);
    if (currentWf && currentWf.status === 'completed') {
      break;
    }
    attempts++;
  }

  assert(
    currentWf?.status === 'completed',
    'Workflow completed successfully after human approval',
    `Workflow status: ${currentWf?.status}`
  );

  assert(
    currentWf?.tasks.every((t) => t.status === 'completed') === true,
    'All 5 tasks transitioned to "completed"',
    `Statuses: ${currentWf?.tasks.map(t => `${t.title.split(' ')[0]}:${t.status}`).join(', ')}`
  );

  // 6. Execution Logs & Agent Feedback
  console.log('\n--- 6. Execution Logs & Feedback ---');
  const logs = orchestrator.getWorkflowLogs(workflow.id);
  assert(logs.length > 10, 'Streaming execution logs collected for workflow', `Log count: ${logs.length}`);

  const hasArchitectLog = logs.some((l) => l.message.includes('Architect Agent'));
  const hasDesignerLog = logs.some((l) => l.message.includes('Design Agent'));
  const hasDeveloperLog = logs.some((l) => l.message.includes('Developer Agent'));
  const hasQALog = logs.some((l) => l.message.includes('QA Agent'));
  const hasReleaseLog = logs.some((l) => l.message.includes('Release Agent'));

  assert(
    hasArchitectLog && hasDesignerLog && hasDeveloperLog && hasQALog && hasReleaseLog,
    'Authentic logs emitted for all 5 specialist agents'
  );

  // 7. Cancellation & Retry Machine
  console.log('\n--- 7. Cancellation, Pause, Resume & Retry State Machine ---');
  const cancelTestWf = await orchestrator.createWorkflowFromObjective('Test cancellation workflow', {
    autoStart: false,
  });

  await orchestrator.startWorkflow(cancelTestWf.id, 200);
  await new Promise((r) => setTimeout(r, 100));
  await orchestrator.pauseWorkflow(cancelTestWf.id);

  let pausedCheck = await getWorkflowById(cancelTestWf.id);
  assert(pausedCheck?.status === 'paused', 'Pause workflow sets status to "paused"');

  await orchestrator.resumeWorkflow(cancelTestWf.id, 10);
  let resumeCheck = await getWorkflowById(cancelTestWf.id);
  assert(resumeCheck?.status === 'running', 'Resume workflow sets status back to "running"');

  await orchestrator.cancelWorkflow(cancelTestWf.id);
  let cancelledCheck = await getWorkflowById(cancelTestWf.id);
  assert(cancelledCheck?.status === 'failed', 'Cancel workflow transitions status to "failed"');

  // Test retry
  await orchestrator.retryWorkflow(cancelTestWf.id, 10);
  let retriedCheck = await getWorkflowById(cancelTestWf.id);
  assert(retriedCheck?.status === 'running', 'Retry workflow resets tasks to pending and resumes');

  // Cleanup cancelTestWf
  await orchestrator.cancelWorkflow(cancelTestWf.id);

  unsubscribe();

  console.log(`\n======================================================`);
  console.log(`RESULTS: ${passedTests} / ${totalTests} assertions passed.`);
  if (passedTests === totalTests) {
    console.log(`ALL ORCHESTRATION ENGINE TESTS PASSED!`);
  } else {
    console.error(`SOME TESTS FAILED!`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
