const googleService = require('./googleService');
const duckduckgoService = require('./duckduckgoService');
const browserService = require('./browserService');

class ReportService {
  /**
   * Helper to compute reputation score for a domain.
   * Higher score means more reputable.
   * @param {string} urlStr
   * @returns {number}
   */
  getReputationScore(urlStr) {
    try {
      const url = new URL(urlStr);
      const hostname = url.hostname.toLowerCase();
      
      // High reputation domains and their weight boost
      const highReputationDomains = {
        'wikipedia.org': 10,
        'en.wikipedia.org': 10,
        'github.com': 8,
        'stackoverflow.com': 8,
        'mozilla.org': 8,
        'mdn.mozilla.org': 8,
        'w3schools.com': 6,
        'medium.com': 5,
        'dev.to': 6,
        'reddit.com': 4,
        'nytimes.com': 7,
        'bbc.com': 7,
        'bbc.co.uk': 7,
        'reuters.com': 8,
        'nature.com': 9,
        'sciencedirect.com': 9,
        'wired.com': 6,
        'techcrunch.com': 6,
        'microsoft.com': 6,
        'google.com': 6,
        'apple.com': 6,
        'ibm.com': 6
      };

      // Check direct matches
      if (highReputationDomains[hostname]) {
        return highReputationDomains[hostname];
      }

      // Check subdomains or partial matches
      for (const domain of Object.keys(highReputationDomains)) {
        if (hostname.endsWith('.' + domain)) {
          return highReputationDomains[domain];
        }
      }

      // Check TLDs
      if (hostname.endsWith('.gov')) return 8;
      if (hostname.endsWith('.edu')) return 8;
      if (hostname.endsWith('.org')) return 4;

      return 0; // Default score for unknown domains
    } catch (e) {
      return 0;
    }
  }

  /**
   * Helper to compute Jaccard-like or token matching relevancy score.
   * @param {string} query
   * @param {string} title
   * @param {string} snippet
   * @param {string} urlStr
   * @returns {number}
   */
  getRelevancyScore(query, title = '', snippet = '', urlStr = '') {
    const stopWords = new Set([
      'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
      'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
      'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down',
      'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent',
      'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'herself', 'him', 'himself',
      'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its',
      'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off',
      'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
      'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than',
      'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these',
      'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under',
      'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats',
      'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with',
      'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself',
      'yourselves'
    ]);

    // Tokenize query
    const queryTokens = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 1 && !stopWords.has(token));

    if (queryTokens.length === 0) {
      // Fallback: use query as a whole if tokenization returns empty
      const queryLower = query.toLowerCase();
      let matchCount = 0;
      if (title.toLowerCase().includes(queryLower)) matchCount += 3;
      if (snippet.toLowerCase().includes(queryLower)) matchCount += 1.5;
      if (urlStr.toLowerCase().includes(queryLower)) matchCount += 1;
      return matchCount;
    }

    let matchCount = 0;
    const titleLower = title.toLowerCase();
    const snippetLower = snippet.toLowerCase();
    const urlLower = urlStr.toLowerCase();

    queryTokens.forEach(token => {
      // Title matches (weight 3)
      if (titleLower.includes(token)) {
        matchCount += 3;
      }
      // Snippet matches (weight 1.5)
      if (snippetLower.includes(token)) {
        matchCount += 1.5;
      }
      // URL matches (weight 1)
      if (urlLower.includes(token)) {
        matchCount += 1.0;
      }
    });

    return matchCount;
  }

  /**
   * Main service handler to perform search, filter top sources by relevancy/reputation,
   * scrape their contents, and return the report.
   * @param {string} query The search query
   * @param {Object} options Configuration options (engine, limit)
   * @returns {Promise<Object>} Detailed scraped reports JSON
   */
  async generateReport(query, options = {}) {
    const engine = (options.engine || 'duckduckgo').toLowerCase();
    const limit = Math.max(3, Math.min(5, options.limit || 3)); // defaults to 3, allowed 3-5

    console.log(`ReportService: Generating report for "${query}" using ${engine} (limit: ${limit})`);

    // 1. Fetch search results
    let results = [];
    if (engine === 'google') {
      try {
        results = await googleService.search(query);
      } catch (err) {
        console.warn('ReportService: Google search failed, falling back to DuckDuckGo:', err.message);
        results = await duckduckgoService.search(query);
      }
    } else {
      try {
        results = await duckduckgoService.search(query);
      } catch (err) {
        console.warn('ReportService: DuckDuckGo search failed, trying Google:', err.message);
        try {
          results = await googleService.search(query);
        } catch (googleErr) {
          console.error('ReportService: Both DuckDuckGo and Google search failed');
          throw new Error('Failed to retrieve search results from any search engine.');
        }
      }
    }

    if (!results || results.length === 0) {
      throw new Error(`No search results found for query: "${query}"`);
    }

    // 2. Score and rank search results
    const scoredResults = results.map(item => {
      const reputation = this.getReputationScore(item.url);
      const relevancy = this.getRelevancyScore(query, item.title, item.snippet, item.url);
      const totalScore = reputation + relevancy;

      return {
        ...item,
        scores: {
          reputation,
          relevancy,
          totalScore
        }
      };
    });

    // Sort descending by totalScore
    scoredResults.sort((a, b) => b.scores.totalScore - a.scores.totalScore);

    // Pick top 3-5 sources
    const topSources = scoredResults.slice(0, limit);

    console.log(`ReportService: Selected top ${topSources.length} sources for scraping:`);
    topSources.forEach((s, idx) => {
      console.log(`  [#${idx + 1}] ${s.url} (Relevancy: ${s.scores.relevancy}, Reputation: ${s.scores.reputation}, Total: ${s.scores.totalScore})`);
    });

    // 3. Go to exact domains one by one and scrape text contents through Puppeteer
    const scrapedReports = [];

    for (const source of topSources) {
      console.log(`ReportService: Scraping text content from: ${source.url}`);
      let page;
      try {
        page = await browserService.createPage();
        
        // Navigate to the URL
        // Using domcontentloaded to speed up loading and handle heavy client-side sites gracefully
        await page.goto(source.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });

        // Extract text content
        const extracted = await page.evaluate(() => {
          // Remove scripts, styles, iframe, images, nav, footer, headers to isolate core content
          const selectorsToRemove = [
            'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
            'header', 'footer', 'nav', 'aside',
            '.ad', '.ads', '[class*="ad-"]', '[id*="ad-"]',
            '.footer', '.header', '.nav', '.menu', '.sidebar'
          ];
          
          selectorsToRemove.forEach(sel => {
            try {
              document.querySelectorAll(sel).forEach(el => el.remove());
            } catch (e) {
              // Ignore selector errors
            }
          });

          // Check if there is an <article> tag or a main element, extract from it if possible
          const article = document.querySelector('article') || document.querySelector('main');
          let text = '';
          if (article) {
            text = article.innerText;
          } else {
            text = document.body ? document.body.innerText : '';
          }

          // Return cleaned text (reduce multiple whitespace/newlines)
          return text
            .replace(/\s+/g, ' ')
            .trim();
        });

        scrapedReports.push({
          title: source.title,
          url: source.url,
          snippet: source.snippet,
          scores: source.scores,
          status: 'success',
          content: extracted
        });
      } catch (err) {
        console.error(`ReportService: Error scraping ${source.url}:`, err.message);
        scrapedReports.push({
          title: source.title,
          url: source.url,
          snippet: source.snippet,
          scores: source.scores,
          status: 'failed',
          error: err.message,
          content: ''
        });
      } finally {
        if (page) {
          await page.close().catch(closeErr => 
            console.error(`ReportService: Error closing page for ${source.url}:`, closeErr.message)
          );
        }
      }
    }

    return {
      query,
      engine,
      timestamp: new Date().toISOString(),
      sourcesScraped: scrapedReports.length,
      reports: scrapedReports
    };
  }

  /**
   * Scrapes content from a specific list of sources instead of performing a fresh search.
   * @param {Array<{title: string, url: string, snippet: string}>} sources List of sources to scrape
   * @returns {Promise<Array<Object>>} Scraped contents reports
   */
  async scrapeSources(sources) {
    const scrapedReports = [];

    for (const source of sources) {
      console.log(`ReportService: Scraping text content from exact source: ${source.url}`);
      let page;
      try {
        page = await browserService.createPage();
        
        await page.goto(source.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });

        const extracted = await page.evaluate(() => {
          const selectorsToRemove = [
            'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
            'header', 'footer', 'nav', 'aside',
            '.ad', '.ads', '[class*="ad-"]', '[id*="ad-"]',
            '.footer', '.header', '.nav', '.menu', '.sidebar'
          ];
          
          selectorsToRemove.forEach(sel => {
            try {
              document.querySelectorAll(sel).forEach(el => el.remove());
            } catch (e) {}
          });

          const article = document.querySelector('article') || document.querySelector('main');
          let text = '';
          if (article) {
            text = article.innerText;
          } else {
            text = document.body ? document.body.innerText : '';
          }

          return text
            .replace(/\s+/g, ' ')
            .trim();
        });

        scrapedReports.push({
          title: source.title,
          url: source.url,
          snippet: source.snippet,
          status: 'success',
          content: extracted
        });
      } catch (err) {
        console.error(`ReportService: Error scraping exact source ${source.url}:`, err.message);
        scrapedReports.push({
          title: source.title,
          url: source.url,
          snippet: source.snippet,
          status: 'failed',
          error: err.message,
          content: ''
        });
      } finally {
        if (page) {
          await page.close().catch(closeErr => 
            console.error(`ReportService: Error closing page for exact source ${source.url}:`, closeErr.message)
          );
        }
      }
    }

    return scrapedReports;
  }
}

module.exports = new ReportService();
