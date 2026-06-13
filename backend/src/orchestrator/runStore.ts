import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const RUNS_DIR = process.env.RUN_STORE_PATH || './runs';

export interface RunMetadata {
  id: string;
  query: string;
  constraints?: any;
  status: 'pending' | 'running' | 'done' | 'error';
  createdAt: string;
  updatedAt: string;
}

export class RunStore {
  private static async ensureDir(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  static async createRun(query: string, constraints?: any): Promise<string> {
    const runId = `run_${Date.now()}`;
    const runPath = path.join(RUNS_DIR, runId);
    await this.ensureDir(runPath);
    await this.ensureDir(path.join(runPath, 'drafts'));
    await this.ensureDir(path.join(runPath, 'factchecks'));
    await this.ensureDir(path.join(runPath, 'evidence'));

    const meta: RunMetadata = {
      id: runId,
      query,
      constraints,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.writeArtifact(runId, 'meta.json', meta);
    return runId;
  }

  static async writeArtifact(runId: string, filename: string, data: any): Promise<void> {
    const filePath = path.join(RUNS_DIR, runId, filename);
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    // Update updatedAt in meta.json if it's not the meta file itself
    if (filename !== 'meta.json') {
      await this.updateMetadata(runId, { updatedAt: new Date().toISOString() });
    }
  }

  static async readArtifact<T>(runId: string, filename: string): Promise<T | null> {
    const filePath = path.join(RUNS_DIR, runId, filename);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  static async updateMetadata(runId: string, updates: Partial<RunMetadata>): Promise<void> {
    const meta = await this.readArtifact<RunMetadata>(runId, 'meta.json');
    if (meta) {
      const updatedMeta = { ...meta, ...updates, updatedAt: new Date().toISOString() };
      await this.writeArtifact(runId, 'meta.json', updatedMeta);
    }
  }

  static async listRuns(): Promise<RunMetadata[]> {
    try {
      const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
      const runs: RunMetadata[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const meta = await this.readArtifact<RunMetadata>(entry.name, 'meta.json');
          if (meta) runs.push(meta);
        }
      }
      return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }
}
