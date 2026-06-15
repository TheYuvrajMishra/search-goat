class LlmService {
  constructor() {
    this.baseUrl = process.env.FREE_LLM_API_BASE || 'http://localhost:3001/v1';
    this.apiKey = process.env.FREE_LLM_API_KEY;
  }

  /**
   * Fetches available models from the local endpoint and returns the first loaded model ID.
   * Falls back to 'auto' if endpoint is unreachable or empty (supported by FreeLLM API for auto-routing).
   * @returns {Promise<string>}
   */
  async getModelId() {
    try {
      console.log(`Fetching available models from ${this.baseUrl}/models...`);
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const detectedModel = data.data[0].id;
          console.log(`Auto-selected active model: "${detectedModel}"`);
          return detectedModel;
        }
      }
      console.warn('Models list returned empty from endpoint. Defaulting to "auto".');
    } catch (error) {
      console.warn(`Could not auto-detect model: ${error.message}. Defaulting to "auto".`);
    }
    return 'auto';
  }

  /**
   * Generates a concise summary answer given a search query and a list of organic results.
   * @param {string} query The search terms
   * @param {Array<{title: string, url: string, snippet: string}>} results List of organic results
   * @returns {Promise<string>} The generated summary or error message
   */
  async generateSummary(query, results) {
    if (!results || results.length === 0) {
      return 'No search results available to summarize.';
    }

    // Standardize and select the top 5 organic results for the context window
    const formattedResults = results
      .slice(0, 5)
      .map((r, i) => `[Result ${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`)
      .join('\n\n');

    const prompt = `You are an expert AI search assistant. Synthesize a concise, accurate, and comprehensive answer to the user's query based solely on the provided search results. Refer to the sources [Result X] when relevant.

User Query: "${query}"

Organic Search Results:
${formattedResults}

Answer:`;

    try {
      // Auto-detect loaded model name
      const modelId = await this.getModelId();
      
      console.log(`Sending synthesis query to LLM at ${this.baseUrl}/chat/completions using model: "${modelId}"...`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful search assistant that synthesizes web search results into a concise response.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`LLM endpoint returned status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      
      return answer || 'Error: LLM returned an empty response body.';
    } catch (error) {
      console.error('LLM Service Error:', error);
      return `Failed to compile AI summary: ${error.message}`;
    }
  }

  /**
   * Generates a concise, descriptive title (2-4 words) in Title Case from the user's initial search query.
   * @param {string} query The user's first search query in the session
   * @returns {Promise<string>} Clean session title
   */
  async generateTitle(query) {
    const prompt = `You are a professional editorial title writer. Create a clean, elegant, and descriptive title for a search session based on the user's search query.
The title must be between 2 to 4 words. Use Title Case. Do not include any quotation marks, punctuation, or generic filler words (like "Search for", "Inquiry about").

User Search Query: "${query}"

Title:`;

    try {
      const modelId = await this.getModelId();
      console.log(`Generating session title for query: "${query}" using model: "${modelId}"...`);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { 
              role: 'system', 
              content: 'You generate short, clean Title Case titles (2-4 words) from queries.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.5,
          max_tokens: 30
        })
      });

      if (!response.ok) {
        throw new Error(`LLM endpoint returned status ${response.status}`);
      }

      const data = await response.json();
      let title = data.choices?.[0]?.message?.content?.trim();
      
      // Clean up quotation marks or trailing punctuation
      if (title) {
        title = title.replace(/["']/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
      }

      return title || query.split(' ').slice(0, 3).join(' ');
    } catch (error) {
      console.error('LLM Title Generation Error:', error);
      return query.split(' ').slice(0, 3).join(' ') || 'New Session';
    }
  }
}

module.exports = new LlmService();
