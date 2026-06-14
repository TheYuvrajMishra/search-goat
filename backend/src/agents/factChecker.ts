import { z } from 'zod';
import { LLMClient } from '../llm/client.js';
import { PromptRegistry } from '../registry/loader.js';
import { RunStore } from '../orchestrator/runStore.js';
import { SearchManager } from '../browser/search.js';
import { ContentExtractor } from '../browser/extract.js';
import { DraftReport } from './researcher.js';

export const FactCheckReportSchema = z.object({
  approach_id: z.string(),
  results: z.array(z.object({
    claim_id: z.string(),
    verdict: z.enum(['Verified', 'Partially Verified', 'Unverified', 'Contradicted', 'Outdated']),
    confidence: z.number().min(0).max(1),
    evidence: z.array(z.object({
      url: z.string(),
      note: z.string(),
      stance: z.enum(['supports', 'contradicts'])
    }))
  }))
});

export type FactCheckReport = z.infer<typeof FactCheckReportSchema>;

export class FactCheckerAgent {
  static async run(runId: string, approachId: string): Promise<FactCheckReport> {
    console.log(`[Fact-Checker ${approachId}] Starting verification...`);
    
    const draft = await RunStore.readArtifact<DraftReport>(runId, `drafts/${approachId}.json`);
    if (!draft) throw new Error(`Draft not found for approach ${approachId}`);

    const results = [];
    
    // For each claim, perform a quick verification search
    for (const claim of draft.claims) {
      console.log(`[Fact-Checker ${approachId}] Verifying claim: ${claim.text.substring(0, 50)}...`);
      
      const searchResults = await SearchManager.search(claim.text);
      const extracts = [];
      
      // Extract top 1 result for verification context
      if (searchResults.length > 0) {
        const content = await ContentExtractor.extract(searchResults[0]!.url);
        if (content) extracts.push(content);
      }

      results.push({
        claim,
        searchResults,
        extracts
      });
    }

    const systemPrompt = await PromptRegistry.getStagePrompt('fact_checking');
    if (!systemPrompt) throw new Error('Fact-checker system prompt not found');

    const userMessage = `
Approach: ${approachId}
Claims to Verify:
${results.map(r => `
ID: ${r.claim.id}
Claim: ${r.claim.text}
Existing Sources: ${r.claim.source_ids.join(', ')}
New Search Results: ${r.searchResults.map(sr => sr.url).join(', ')}
New Extracts: ${r.extracts.map(e => e.textContent.substring(0, 1000)).join('\n---\n')}
`).join('\n\n')}

Please provide the Fact-Check Report.
`;

    const factCheckReport = await LLMClient.chatStructured(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      FactCheckReportSchema
    );

    await RunStore.writeArtifact(runId, `factchecks/${approachId}.json`, factCheckReport);
    return factCheckReport;
  }
}
