const llmService = require('./llmService');

class KeywordService {
  /**
   * Converts a user query into 5 relevant search keywords/phrases using the LLM.
   * @param {string} query The raw user query
   * @param {Object} options
   * @returns {Promise<string[]>} An array of exactly 5 keywords
   */
  async generateKeywords(query, options = {}) {
    const { signal } = options;
    if (!query || query.trim().length === 0) {
      return [];
    }

    const prompt = `You are a search engine optimization helper. Convert the following search query into exactly 5 highly relevant keywords or short phrases that are optimal for querying a search engine. Return ONLY a single line of 5 comma-separated keywords. Do not include numbering, explanations, introduction, or quotes.

Search Query: "${query}"

Keywords:`;

    try {
      const modelId = await llmService.getModelId();
      console.log(`Generating keywords for query "${query}" using model: "${modelId}"...`);

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
              content: 'You are a search keyword generator. You only output 5 comma-separated words/phrases.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.1, // Low temperature for high consistency
          max_tokens: 100
        })
      });

      if (!response.ok) {
        throw new Error(`LLM completions endpoint returned status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('Empty completions content returned from LLM.');
      }

      // Split the comma-separated response
      let keywords = content
        .split(',')
        .map(kw => kw.replace(/^["'\s]+|["'\s]+$/g, '').trim()) // Strip whitespace and quotes
        .filter(kw => kw.length > 0);

      // If parsing fails to yield exactly 5 items, pad or slice
      if (keywords.length < 5) {
        const fallbacks = query.split(/\s+/).filter(w => w.length > 2);
        while (keywords.length < 5 && fallbacks.length > 0) {
          const word = fallbacks.shift();
          if (!keywords.includes(word)) {
            keywords.push(word);
          }
        }
      }

      return keywords.slice(0, 5);
    } catch (error) {
      if (error.name === 'AbortError' || signal?.aborted) {
        console.log('Keyword generation aborted by user.');
        throw error;
      }
      console.error('Keyword Service Error:', error);
      // Clean fallback: split the query into words, removing short/stop words
      return query
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
        .slice(0, 5);
    }
  }
}

module.exports = new KeywordService();
