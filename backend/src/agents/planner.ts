import { z } from 'zod';
import { LLMClient } from '../llm/client.js';
import { PromptRegistry } from '../registry/loader.js';
import { RunStore } from '../orchestrator/runStore.js';

export const ApproachSchema = z.object({
  id: z.enum(['A', 'B', 'C']),
  name: z.string(),
  methodology: z.string(),
  source_types: z.array(z.string()),
  sub_questions: z.array(z.string()),
  seed_queries: z.array(z.string())
});

export const PlanOutputSchema = z.object({
  query: z.string(),
  approaches: z.array(ApproachSchema).length(3)
});

export type PlanOutput = z.infer<typeof PlanOutputSchema>;

export class PlannerAgent {
  static async run(runId: string, query: string): Promise<PlanOutput> {
    await PromptRegistry.loadAll();
    const systemPrompt = await PromptRegistry.getStagePrompt('planning');

    if (!systemPrompt) {
      throw new Error('Planner system prompt not found in registry');
    }

    const result = await LLMClient.chatStructured(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User Query: ${query}` }
      ],
      PlanOutputSchema
    );

    // TODO: Add diversity check via embeddings (B3.2 task, but can be stubbed here)
    
    await RunStore.writeArtifact(runId, 'plan.json', result);
    return result;
  }
}
