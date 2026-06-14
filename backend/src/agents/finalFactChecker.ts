import { z } from 'zod';
import { LLMClient } from '../llm/client.js';
import { PromptRegistry } from '../registry/loader.js';
import { RunStore } from '../orchestrator/runStore.js';
import { FactCheckReport, FactCheckReportSchema } from './factChecker.js';
import { SynthesizedReport } from './synthesizer.js';
import { DraftReport } from './researcher.js';

export class FinalFactCheckerAgent {
  static async run(runId: string): Promise<FactCheckReport> {
    console.log(`[Final Fact-Checker] Starting final verification...`);

    const synthesis = await RunStore.readArtifact<SynthesizedReport>(runId, 'synthesis.json');
    if (!synthesis) throw new Error('Synthesized report not found');

    // Pool all sources from drafts
    const approaches = ['A', 'B', 'C'];
    const allSources = [];
    for (const id of approaches) {
      const draft = await RunStore.readArtifact<DraftReport>(runId, `drafts/${id}.json`);
      if (draft) allSources.push(...draft.sources);
    }

    const systemPrompt = await PromptRegistry.getStagePrompt('final_fact_check');
    if (!systemPrompt) throw new Error('Final fact-checker system prompt not found');

    const userMessage = `
Synthesized Report:
${synthesis.markdown}

Available Sources/Evidence:
${allSources.map(s => `[${s.id}] ${s.title} (${s.url})\nSnippet: ${s.snippet}`).join('\n\n')}

Please perform the final fact-check and provide the Report.
`;

    const factCheckReport = await LLMClient.chatStructured(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      FactCheckReportSchema
    );

    await RunStore.writeArtifact(runId, 'final_factcheck.json', factCheckReport);
    return factCheckReport;
  }
}
