import { RunStore, RunMetadata } from './runStore.js';
import { EventEmitter } from 'events';

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
    // Placeholder for actual agent calls
    // In later phases, this will call Planner, Researcher, etc.
    console.log(`[Orchestrator] Processing ${stage} for ${runId}`);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 500));

    if (stage === 'done') return;

    // Persist a dummy artifact for the stage
    await RunStore.writeArtifact(runId, `${stage}.json`, { 
      status: 'completed',
      timestamp: new Date().toISOString()
    });
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
