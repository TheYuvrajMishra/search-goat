const llmService = require('./llmService');

class RankingService {
  /**
   * Uses an LLM to rank search results based on relevance to the user's query
   * and filters out irrelevant results, returning at most the top 10.
   * @param {string} query The user's original query
   * @param {Array<Object>} results The list of results to rank
   * @param {Object} options
   * @returns {Promise<Array<Object>>} The top 10 ranked and filtered results
   */
  async rankResults(query, results, options = {}) {
    const { signal } = options;
    if (!results || results.length === 0) {
      return [];
    }

    // Prepare a list for the LLM to analyze. We send title and snippet for context.
    // We use indices to allow the LLM to refer back to the original objects easily.
    const resultsContext = results.slice(0, 20).map((r, i) => {
      return `[ID: ${i}] Title: ${r.title}\nSnippet: ${r.snippet}`;
    }).join('\n\n');

    const prompt = `You are an expert information retriever. Analyze the following user search query and the list of search results. 
Your task:
1. Evaluate each result for relevance to the query.
2. Filter out any results that are irrelevant, low-quality, or off-topic.
3. Rank the remaining results from most relevant to least relevant.
4. Return ONLY a comma-separated list of the original IDs (e.g., 5, 2, 8, 1) for the top 10 most relevant results.
5. If there are fewer than 10 relevant results, return only those.
6. Do not include any explanations, introduction, or other text.

User Query: "${query}"

Search Results:
${resultsContext}

Top Relevant IDs:`;

    try {
      const modelId = await llmService.getModelId();
      console.log(`Ranking ${results.length} results for query "${query}" using model: "${modelId}"...`);

      const response = await fetch(`${llmService.baseUrl}/chat/completions`, {
        method: 'POST',
        signal, // Connect abort signal to fetch call
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmService.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { 
              role: 'system', 
              content: 'You are a search result ranking assistant. You only output a comma-separated list of IDs.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        throw new Error(`LLM ranking failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        console.warn('LLM returned empty ranking content. Falling back to original order.');
        return results.slice(0, 10);
      }

      // Parse the comma-separated IDs
      const rankedIds = content
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id) && id >= 0 && id < results.length);

      // Map back to the original result objects
      const rankedResults = rankedIds
        .slice(0, 10) // Ensure max 10
        .map(id => results[id]);

      console.log(`LLM successfully ranked and filtered results. Returning ${rankedResults.length} items.`);
      return rankedResults;
    } catch (error) {
      if (error.name === 'AbortError' || signal?.aborted) {
        console.log('Ranking aborted by user.');
        throw error;
      }
      console.error('Ranking Service Error:', error);
      // Fallback: Return first 10 organic results if ranking fails
      return results.slice(0, 10);
    }
  }
}

module.exports = new RankingService();
