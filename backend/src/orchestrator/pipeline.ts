import { RunStore, RunMetadata } from './runStore.js';
import { EventEmitter } from 'events';
import { PlannerAgent, PlanOutput } from '../agents/planner.js';
import { ResearcherAgent } from '../agents/researcher.js';
import { FactCheckerAgent } from '../agents/factChecker.js';
import { DebaterAgent } from '../agents/debater.js';
import { SynthesizerAgent } from '../agents/synthesizer.js';
import { FinalFactCheckerAgent } from '../agents/finalFactChecker.js';
import { ReportFinalizer } from '../agents/finalizer.js';

export type PipelineStage = 
  | 'planning' 
  | 'researching' 
  | 'fact_checking' 
  | 'debating' 
  | 'synthesizing' 
  | 'final_fact_check' 
  | 'finalizing' 
  | 'done';

export type PipelineStatus = 'pending' | 'running' | 'done' | 'error';

export interface PipelineEvent {
  runId: string;
  stage: PipelineStage;
  status: PipelineStatus;
  progress: number;
  message: string;
  timestamp: string;
}

export class PipelineOrchestrator extends EventEmitter {
  private static instance: PipelineOrchestrator;
  
  private constructor() {
    super();
  }

  static getInstance(): PipelineOrchestrator {
    if (!PipelineOrchestrator.instance) {
      PipelineOrchestrator.instance = new PipelineOrchestrator();
    }
    return PipelineOrchestrator.instance;
  }

  async startRun(query: string, constraints?: any): Promise<string> {
    const runId = await RunStore.createRun(query, constraints);
    this.executeRun(runId).catch(err => {
      console.error(`Run ${runId} failed:`, err);
      this.emitEvent(runId, 'planning', 'error', 0, err.message);
    });
    return runId;
  }

  private async executeRun(runId: string) {
    await RunStore.updateMetadata(runId, { status: 'running' });

    const stages: PipelineStage[] = [
      'planning',
      'researching',
      'fact_checking',
      'debating',
      'synthesizing',
      'final_fact_check',
      'finalizing',
      'done'
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]!;
      const progress = Math.round((i / (stages.length - 1)) * 100);
      
      this.emitEvent(runId, stage, 'running', progress, `Starting ${stage}...`);
      
      try {
        await this.processStage(runId, stage);
        this.emitEvent(runId, stage, 'done', progress, `Completed ${stage}`);
      } catch (error: any) {
        this.emitEvent(runId, stage, 'error', progress, error.message);
        await RunStore.updateMetadata(runId, { status: 'error' });
        return;
      }
    }

    await RunStore.updateMetadata(runId, { status: 'done' });
  }

  private async processStage(runId: string, stage: PipelineStage) {
    const meta = await RunStore.readArtifact<RunMetadata>(runId, 'meta.json');
    if (!meta) throw new Error(`Metadata not found for run ${runId}`);

    console.log(`[Orchestrator] Processing ${stage} for ${runId}`);

    switch (stage) {
      case 'planning':
        await PlannerAgent.run(runId, meta.query);
        break;
      
      case 'researching':
        const plan = await RunStore.readArtifact<PlanOutput>(runId, 'plan.json');
        if (!plan) throw new Error(`Plan not found for run ${runId}`);
        
        // Run all 3 researchers in parallel
        await Promise.all(plan.approaches.map(approach => 
          ResearcherAgent.run(runId, approach)
        ));
        break;

      case 'fact_checking':
        const factPlan = await RunStore.readArtifact<PlanOutput>(runId, 'plan.json');
        if (!factPlan) throw new Error(`Plan not found for run ${runId}`);

        // Run all 3 fact-checkers in parallel
        await Promise.all(factPlan.approaches.map(approach => 
          FactCheckerAgent.run(runId, approach.id)
        ));
        break;

      case 'debating':
        await DebaterAgent.run(runId);
        break;

      case 'synthesizing':
        await SynthesizerAgent.run(runId);
        break;

      case 'final_fact_check':
        await FinalFactCheckerAgent.run(runId);
        break;

      case 'finalizing':
        await ReportFinalizer.run(runId);
        break;

      default:
        // Simulate other stages
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
    }

    if (stage === 'done') return;

    // Persist a dummy artifact if not already persisted by the agent
    const artifactExists = await RunStore.readArtifact(runId, `${stage}.json`);
    if (!artifactExists) {
      await RunStore.writeArtifact(runId, `${stage}.json`, { 
        status: 'completed',
        timestamp: new Date().toISOString()
      });
    }
  }

  private emitEvent(runId: string, stage: PipelineStage, status: PipelineStatus, progress: number, message: string) {
    const event: PipelineEvent = {
      runId,
      stage,
      status,
      progress,
      message,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Event] ${runId} | ${stage} | ${status} | ${progress}% | ${message}`);
    this.emit('event', event);
  }
}
