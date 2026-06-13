import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export interface PromptMetadata {
  name: string;
  role?: string;
  version: number;
  applicable_stage: string;
  output_schema?: string;
}

export interface PromptFile {
  path: string;
  metadata: PromptMetadata;
  content: string;
}

export class PromptRegistry {
  private static prompts: Map<string, PromptFile> = new Map();
  private static PROMPTS_DIR = path.resolve(process.cwd(), '..', 'prompts');

  static async loadAll() {
    this.prompts.clear();
    await this.scanDir(this.PROMPTS_DIR);
  }

  private static async scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.scanDir(fullPath);
      } else if (entry.name.endsWith('.md')) {
        await this.loadPrompt(fullPath);
      }
    }
  }

  private static async loadPrompt(filePath: string) {
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    
    if (match) {
      const metadata = yaml.load(match[1]) as PromptMetadata;
      const content = match[2]!.trim();
      const relativePath = path.relative(this.PROMPTS_DIR, filePath).replace(/\\/g, '/');
      this.prompts.set(relativePath, { path: relativePath, metadata, content });
    }
  }

  static getPrompt(name: string): PromptFile | undefined {
    // Search by metadata name or relative path
    for (const prompt of this.prompts.values()) {
      if (prompt.metadata.name === name || prompt.path === name) {
        return prompt;
      }
    }
    return undefined;
  }

  static getPromptsForStage(stage: string): PromptFile[] {
    return Array.from(this.prompts.values()).filter(p => p.metadata.applicable_stage === stage);
  }

  static async getStagePrompt(stage: string): Promise<string> {
    const roles = Array.from(this.prompts.values()).filter(p => p.metadata.applicable_stage === stage && p.path.startsWith('roles/'));
    const skills = Array.from(this.prompts.values()).filter(p => p.metadata.applicable_stage === stage && p.path.startsWith('skills/'));
    
    let combined = roles[0]?.content || '';
    if (skills.length > 0) {
      combined += '\n\n## Skills & Protocols\n' + skills.map(s => s.content).join('\n\n');
    }
    return combined;
  }
}
