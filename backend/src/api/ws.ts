import { Request, Response } from 'express';
import { PipelineOrchestrator, PipelineEvent } from '../orchestrator/pipeline.js';

export const handleEvents = (req: Request, res: Response) => {
  const { runId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const orchestrator = PipelineOrchestrator.getInstance();

  const onEvent = (event: PipelineEvent) => {
    if (event.runId === runId) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };

  orchestrator.on('event', onEvent);

  req.on('close', () => {
    orchestrator.off('event', onEvent);
  });
};
