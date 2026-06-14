import { z } from 'zod';
import { LLMClient } from '../llm/client.js';
import { PromptRegistry } from '../registry/loader.js';
import { RunStore } from '../orchestrator/runStore.js';
import { EmbeddingClient } from '../llm/embeddings.js';

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

    // Diversity check via embeddings
    try {
      const methodologies = result.approaches.map(a => `${a.name}: ${a.methodology}`);
      const embeddings = await Promise.all(methodologies.map(m => EmbeddingClient.getEmbeddings(m)));
      
      const simAB = EmbeddingClient.cosineSimilarity(embeddings[0]!, embeddings[1]!);
      const simAC = EmbeddingClient.cosineSimilarity(embeddings[0]!, embeddings[2]!);
      const simBC = EmbeddingClient.cosineSimilarity(embeddings[1]!, embeddings[2]!);

      console.log(`[Planner] Approach Similarities: A-B: ${simAB.toFixed(3)}, A-C: ${simAC.toFixed(3)}, B-C: ${simBC.toFixed(3)}`);
      
      if (simAB > 0.9 || simAC > 0.9 || simBC > 0.9) {
        console.warn('[Planner] Detected low diversity in approaches. FR-3 requires meaningful diversity.');
      }
    } catch (err) {
      console.error('[Planner] Diversity check failed:', err);
    }
    
    await RunStore.writeArtifact(runId, 'plan.json', result);
    return result;
  }
}
