import axios from 'axios';

export class EmbeddingClient {
  private static baseUrl = process.env['LLM_BASE_URL'] || 'http://localhost:3001/v1';
  private static apiKey = process.env['LLM_API_KEY'] || '';

  static async getEmbeddings(text: string): Promise<number[]> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(`${this.baseUrl}/embeddings`, {
        input: text,
        model: 'auto'
      }, { headers });
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error fetching embeddings:', error);
      throw error;
    }
  }

  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i]! * vecB[i]!;
      normA += vecA[i]! * vecA[i]!;
      normB += vecB[i]! * vecB[i]!;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static async clusterTexts(texts: string[], threshold: number = 0.85): Promise<number[][]> {
    const embeddings = await Promise.all(texts.map(t => this.getEmbeddings(t)));
    const clusters: number[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < texts.length; i++) {
      if (assigned.has(i)) continue;
      const currentCluster = [i];
      assigned.add(i);

      for (let j = i + 1; j < texts.length; j++) {
        if (assigned.has(j)) continue;
        const similarity = this.cosineSimilarity(embeddings[i]!, embeddings[j]!);
        if (similarity >= threshold) {
          currentCluster.push(j);
          assigned.add(j);
        }
      }
      clusters.push(currentCluster);
    }
    return clusters;
  }
}
