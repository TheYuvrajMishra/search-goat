import { z } from 'zod';
import { LLMClient } from '../llm/client.js';
import { PromptRegistry } from '../registry/loader.js';
import { RunStore } from '../orchestrator/runStore.js';
import { SearchManager, SearchResult } from '../browser/search.js';
import { ContentExtractor, PageContent } from '../browser/extract.js';
import { ApproachSchema } from './planner.js';

export const DraftReportSchema = z.object({
  approach_id: z.string(),
  title: z.string(),
  markdown: z.string(),
  sources: z.array(z.object({
    id: z.number(),
    url: z.string(),
    title: z.string(),
    accessed_at: z.string(),
    snippet: z.string()
  })),
  claims: z.array(z.object({
    id: z.string(),
    text: z.string(),
    source_ids: z.array(z.number()),
    location: z.string()
  }))
});

export type DraftReport = z.infer<typeof DraftReportSchema>;

export class ResearcherAgent {
  static async run(runId: string, approach: z.infer<typeof ApproachSchema>): Promise<DraftReport> {
    console.log(`[Researcher ${approach.id}] Starting research...`);
    
    // 1. Search for each seed query
    const allResults: SearchResult[] = [];
    for (const query of approach.seed_queries) {
      const results = await SearchManager.search(query);
      allResults.push(...results);
    }

    // Deduplicate results by URL
    const uniqueResults = Array.from(new Map(allResults.map(r => [r.url, r])).values());

    // 2. Extract content from top results (limit to 3 for now)
    const extracts: PageContent[] = [];
    for (const res of uniqueResults.slice(0, 3)) {
      const content = await ContentExtractor.extract(res.url);
      if (content) extracts.push(content);
    }

    // 3. Draft the report
    const systemPrompt = await PromptRegistry.getStagePrompt('researching');
    const approachBrief = JSON.stringify(approach, null, 2);
    const contextPrompt = systemPrompt.replace('{{approach_brief}}', approachBrief);

    const userMessage = `
Web Extracts:
${extracts.map((e, i) => `[Source ${i+1}] ${e.title}\nURL: ${e.url}\nContent: ${e.textContent.substring(0, 2000)}`).join('\n\n')}

Search Snippets:
${uniqueResults.map((r, i) => `[Snippet ${i+1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join('\n\n')}

Please synthesize the above into your Draft Report for Approach ${approach.id}.
`;

    const result = await LLMClient.chatStructured(
      [
        { role: 'system', content: contextPrompt },
        { role: 'user', content: userMessage }
      ],
      DraftReportSchema
    );

    await RunStore.writeArtifact(runId, `drafts/${approach.id}.json`, result);
    return result;
  }
}
