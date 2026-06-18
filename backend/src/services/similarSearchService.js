const llmService = require('./llmService');
const duckduckgoService = require('./duckduckgoService');
const googleService = require('./googleService');

class SimilarSearchService {
  /**
   * Generates 5 similar search queries based on the user's query.
   * @param {string} query The user's input query
   * @param {Object} options
   * @returns {Promise<string[]>} Array of 5 similar queries
   */
  async generateSimilarQueries(query, options = {}) {
    const { signal } = options;
    const prompt = `You are a search query optimizer. Given the user's query, generate exactly 5 similar, related, or alternative search queries that would help gather comprehensive information about this topic. Return ONLY a single line of 5 comma-separated queries. Do not include quotes, numbering, or explanations.

User Query: "${query}"

Alternative Queries:`;

    try {
      const modelId = await llmService.getModelId();
      console.log(`Generating 5 similar queries for "${query}" using model: "${modelId}"...`);
      
      const response = await fetch(`${llmService.baseUrl}/chat/completions`, {
        method: 'POST',
        signal, // Connect abort signal to fetch request
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
      if (error.name === 'AbortError' || signal?.aborted) {
        console.log('Query generation aborted by user.');
        throw error;
      }
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
   * Generates 5 similar queries, queries the engine for all of them in parallel (concurrency limited),
   * merges the results, and deduplicates them by URL.
   * @param {string} query The user's input query
   * @param {string} engine The search engine ('google' or 'duckduckgo')
   * @param {Object} options
   * @returns {Promise<{similarQueries: string[], results: Array<Object>}>}
   */
  async searchSimilar(query, engine = 'duckduckgo', options = {}) {
    const { signal } = options;

    // 1. Generate 5 similar queries
    const similarQueries = await this.generateSimilarQueries(query, options);
    console.log(`Similar queries generated:`, similarQueries);

    if (signal?.aborted) {
      throw new Error('Search aborted by user');
    }

    // 2. Perform concurrent searches with staggered launch and concurrency limit
    const searchService = engine === 'google' ? googleService : duckduckgoService;
    
    // Default to a conservative concurrency limit of 2 to avoid lagging the host machine
    const concurrencyLimit = parseInt(process.env.PUPPETEER_CONCURRENCY_LIMIT) || 2;
    console.log(`Executing ${similarQueries.length} searches using "${engine}" with concurrency limit: ${concurrencyLimit}...`);
    
    const searchResultsList = new Array(similarQueries.length).fill(null).map(() => []);
    const queue = similarQueries.map((q, index) => ({ q, index }));

    const worker = async () => {
      while (queue.length > 0) {
        if (signal?.aborted) break;
        const item = queue.shift();
        if (!item) break;
        const { q, index } = item;

        try {
          // Add a short delay based on the query order to avoid rate limits
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, index * 200);
            if (signal) {
              signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('Search aborted'));
              });
            }
          });

          if (signal?.aborted) break;
          console.log(`Launching search for: "${q}" (Worker pool index ${index})...`);
          const results = await searchService.search(q, { signal });
          searchResultsList[index] = results;
          console.log(`Search for "${q}" returned ${results.length} results.`);
        } catch (error) {
          console.warn(`Search failed for alternative query "${q}":`, error.message);
          searchResultsList[index] = [];
        }
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrencyLimit, similarQueries.length); i++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    if (signal?.aborted) {
      throw new Error('Search aborted by user');
    }

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
