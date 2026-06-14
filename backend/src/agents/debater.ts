import { z } from 'zod';
import { LLMClient } from '../llm/client.js';
import { PromptRegistry } from '../registry/loader.js';
import { RunStore } from '../orchestrator/runStore.js';
import { DraftReport } from './researcher.js';
import { FactCheckReport } from './factChecker.js';

export const DebateTranscriptSchema = z.object({
  rounds: z.array(z.object({
    round: z.number(),
    critiques: z.array(z.object({
      id: z.string(),
      from: z.string(),
      against: z.string(),
      claim_id: z.string(),
      issue_type: z.enum(['contradiction', 'gap', 'weak_source', 'overstatement', 'missing_context']),
      detail: z.string(),
      counter_evidence: z.array(z.object({
        url: z.string(),
        note: z.string()
      })),
      severity: z.enum(['low', 'medium', 'high'])
    })),
    rebuttals: z.array(z.object({
      from: z.string(),
      to_critique: z.string(),
      response: z.string(),
      concession: z.boolean()
    }))
  })),
  unresolved: z.array(z.string())
});

export type DebateTranscript = z.infer<typeof DebateTranscriptSchema>;

export class DebaterAgent {
  static async run(runId: string): Promise<DebateTranscript> {
    console.log(`[Debater] Starting debate...`);

    const approaches = ['A', 'B', 'C'];
    const drafts: Record<string, DraftReport> = {};
    const factchecks: Record<string, FactCheckReport> = {};

    for (const id of approaches) {
      const draft = await RunStore.readArtifact<DraftReport>(runId, `drafts/${id}.json`);
      const factcheck = await RunStore.readArtifact<FactCheckReport>(runId, `factchecks/${id}.json`);
      if (draft) drafts[id] = draft;
      if (factcheck) factchecks[id] = factcheck;
    }

    const systemPrompt = await PromptRegistry.getStagePrompt('debating');
    if (!systemPrompt) throw new Error('Debater system prompt not found');

    const userMessage = `
Draft Reports and Fact-Checks:
${approaches.map(id => `
--- APPROACH ${id} ---
Draft: ${drafts[id]?.markdown.substring(0, 2000)}
Fact-Check: ${JSON.stringify(factchecks[id]?.results, null, 2)}
`).join('\n')}

Please execute the debate protocol and provide the Debate Transcript.
`;

    const debateTranscript = await LLMClient.chatStructured(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      DebateTranscriptSchema
    );

    await RunStore.writeArtifact(runId, 'debate.json', debateTranscript);
    return debateTranscript;
  }
}
