import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PipelineOrchestrator } from './orchestrator/pipeline.js';
import { handleEvents } from './api/ws.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'search-goat backend is running' });
});

app.post('/api/runs', async (req, res) => {
  const { query, constraints } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const orchestrator = PipelineOrchestrator.getInstance();
  const runId = await orchestrator.startRun(query, constraints);
  res.json({ runId });
});

app.get('/api/runs/:runId/events', handleEvents);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
