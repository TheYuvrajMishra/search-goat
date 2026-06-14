import { z } from 'zod';
import { LLMClient } from '../llm/client.js';
import { PromptRegistry } from '../registry/loader.js';
import { RunStore } from '../orchestrator/runStore.js';
import { DraftReport } from './researcher.js';
import { FactCheckReport } from './factChecker.js';
import { DebateTranscript } from './debater.js';

export const SynthesizedReportSchema = z.object({
  title: z.string(),
  markdown: z.string(),
  sources: z.array(z.object({
    id: z.number(),
    url: z.string(),
    title: z.string(),
    snippet: z.string()
  })),
  open_questions: z.array(z.string()),
  methodology_summary: z.string()
});

export type SynthesizedReport = z.infer<typeof SynthesizedReportSchema>;

export class SynthesizerAgent {
  static async run(runId: string): Promise<SynthesizedReport> {
    console.log(`[Synthesizer] Starting synthesis...`);

    const approaches = ['A', 'B', 'C'];
    const drafts: Record<string, DraftReport> = {};
    const factchecks: Record<string, FactCheckReport> = {};

    for (const id of approaches) {
      const draft = await RunStore.readArtifact<DraftReport>(runId, `drafts/${id}.json`);
      const factcheck = await RunStore.readArtifact<FactCheckReport>(runId, `factchecks/${id}.json`);
      if (draft) drafts[id] = draft;
      if (factcheck) factchecks[id] = factcheck;
    }

    const debate = await RunStore.readArtifact<DebateTranscript>(runId, 'debate.json');
    if (!debate) throw new Error('Debate transcript not found');

    const systemPrompt = await PromptRegistry.getStagePrompt('synthesizing');
    if (!systemPrompt) throw new Error('Synthesizer system prompt not found');

    const userMessage = `
Draft Reports:
${approaches.map(id => `--- APPROACH ${id} ---\n${drafts[id]?.markdown.substring(0, 2000)}`).join('\n\n')}

Fact-Check Results:
${JSON.stringify(factchecks, null, 2)}

Debate Transcript:
${JSON.stringify(debate, null, 2)}

Please synthesize the final report.
`;

    const synthesizedReport = await LLMClient.chatStructured(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      SynthesizedReportSchema
    );

    await RunStore.writeArtifact(runId, 'synthesis.json', synthesizedReport);
    return synthesizedReport;
  }
}
