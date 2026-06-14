import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { PipelineOrchestrator } from './orchestrator/pipeline.js';
import { handleEvents } from './api/ws.js';
import { PromptRegistry } from './registry/loader.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Registry
await PromptRegistry.loadAll();

app.use(cors());
app.use(express.json());

// Expose runs directory for artifacts
const RUNS_DIR = process.env.RUN_STORE_PATH || './runs';
app.use('/runs', express.static(path.resolve(RUNS_DIR)));

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

// Prompt Registry APIs
app.get('/api/prompts', async (req, res) => {
  try {
    await PromptRegistry.loadAll(); // Ensure latest
    const prompts = Array.from((PromptRegistry as any).prompts.values());
    res.json(prompts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get(/^\/api\/prompts\/(.+)$/, async (req, res) => {
  try {
    const filePath = req.params[0];
    const prompt = PromptRegistry.getPrompt(filePath!);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    res.json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put(/^\/api\/prompts\/(.+)$/, async (req, res) => {
  try {
    const filePath = req.params[0];
    const { content } = req.body;
    if (content === undefined) return res.status(400).json({ error: 'Content is required' });

    const PROMPTS_DIR = path.resolve(process.cwd(), '..', 'prompts');
    const fullPath = path.join(PROMPTS_DIR, filePath!);
    
    // Safety check to ensure we stay within prompts dir
    if (!fullPath.startsWith(PROMPTS_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.writeFile(fullPath, content, 'utf-8');
    await PromptRegistry.loadAll(); // Hot reload
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
