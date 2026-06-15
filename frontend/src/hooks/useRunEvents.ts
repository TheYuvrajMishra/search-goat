import { useState, useEffect } from 'react';

export interface PipelineEvent {
  runId: string;
  stage: string;
  status: 'pending' | 'running' | 'done' | 'error';
  progress: number;
  message: string;
  timestamp: string;
}

export const useRunEvents = (runId: string | null) => {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [stageStatus, setStageStatus] = useState<Record<string, 'pending' | 'running' | 'done' | 'error'>>({});
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`http://localhost:3001/api/runs/${runId}/events`);

    eventSource.onmessage = (event) => {
      const data: PipelineEvent = JSON.parse(event.data);
      
      setEvents((prev) => [...prev, data]);
      setStageStatus((prev) => ({
        ...prev,
        [data.stage]: data.status
      }));
      setCurrentStage(data.stage);
      setProgress(data.progress);

      if (data.stage === 'done' && data.status === 'done') {
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      console.error('SSE Error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [runId]);

  return { events, stageStatus, currentStage, progress };
};
