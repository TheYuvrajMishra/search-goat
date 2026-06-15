const llmService = require('./llmService');
const duckduckgoService = require('./duckduckgoService');
const googleService = require('./googleService');

class SimilarSearchService {
  /**
   * Generates 5 similar search queries based on the user's query.
   * @param {string} query The user's input query
   * @returns {Promise<string[]>} Array of 5 similar queries
   */
  async generateSimilarQueries(query) {
    const prompt = `You are a search query optimizer. Given the user's query, generate exactly 5 similar, related, or alternative search queries that would help gather comprehensive information about this topic. Return ONLY a single line of 5 comma-separated queries. Do not include quotes, numbering, or explanations.

User Query: "${query}"

Alternative Queries:`;

    try {
      const modelId = await llmService.getModelId();
      console.log(`Generating 5 similar queries for "${query}" using model: "${modelId}"...`);
      
      const response = await fetch(`${llmService.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmService.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { 
              role: 'system', 
              content: 'You are a search assistant that outputs exactly 5 comma-separated alternative queries.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.4,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`LLM endpoint returned status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('Empty content returned from LLM.');
      }

      const queries = content
        .split(',')
        .map(q => q.replace(/^["'\s]+|["'\s]+$/g, '').trim())
        .filter(q => q.length > 0);

      return queries.slice(0, 5);
    } catch (error) {
      console.error('Similar queries generation failed:', error);
      // Fallback: standard variations
      return [
        `${query} tutorial`,
        `${query} comparison`,
        `best ${query}`,
        `how to use ${query}`,
        `${query} examples`
      ];
    }
  }

  /**
   * Generates 5 similar queries, queries the engine for all of them in parallel (staggered),
   * merges the results, and deduplicates them by URL.
   * @param {string} query The user's input query
   * @param {string} engine The search engine ('google' or 'duckduckgo')
   * @returns {Promise<{similarQueries: string[], results: Array<Object>}>}
   */
  async searchSimilar(query, engine = 'duckduckgo') {
    // 1. Generate 5 similar queries
    const similarQueries = await this.generateSimilarQueries(query);
    console.log(`Similar queries generated:`, similarQueries);

    // 2. Perform parallel searches with staggered launch
    const searchService = engine === 'google' ? googleService : duckduckgoService;
    
    console.log(`Executing 5 searches in parallel (staggered) using "${engine}"...`);
    const searchPromises = similarQueries.map((q, index) => {
      return (async () => {
        // Stagger the launch of each query by index * 400ms to avoid concurrent bot-rate limits
        await new Promise(resolve => setTimeout(resolve, index * 400));
        
        console.log(`Launching search for: "${q}"...`);
        const results = await searchService.search(q);
        console.log(`Search for "${q}" returned ${results.length} results.`);
        return results;
      })().catch(error => {
        console.warn(`Search failed for alternative query "${q}":`, error.message);
        return [];
      });
    });

    const searchResultsList = await Promise.all(searchPromises);

    // 3. Interleave and deduplicate results by URL
    const seenUrls = new Set();
    const mergedResults = [];
    const maxLen = Math.max(...searchResultsList.map(list => list.length));

    for (let i = 0; i < maxLen; i++) {
      for (let j = 0; j < searchResultsList.length; j++) {
        const results = searchResultsList[j];
        if (i < results.length) {
          const item = results[i];
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            mergedResults.push({
              title: item.title,
              url: item.url,
              snippet: item.snippet,
              matchedQuery: similarQueries[j] // Tracks which query returned it
            });
          }
        }
      }
    }

    console.log(`Finished merging similar searches. Total unique results: ${mergedResults.length}`);
    return {
      similarQueries,
      results: mergedResults
    };
  }
}

module.exports = new SimilarSearchService();
