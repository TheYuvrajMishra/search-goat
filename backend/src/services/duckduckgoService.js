const browserService = require('./browserService');
const cacheService = require('./cacheService');

class DuckDuckGoService {
  /**
   * Search query on DuckDuckGo using Puppeteer.
   * Uses fast HTML version as primary and standard version as fallback.
   * @param {string} query
   * @param {Object} options
   * @returns {Promise<Array<{title: string, url: string, snippet: string}>>}
   */
  async search(query, options = {}) {
    const { signal } = options;
    const cacheKey = cacheService.getCacheKey('duckduckgo', query);
    const cachedResults = cacheService.get(cacheKey);
    
    if (cachedResults) {
      console.log(`[Cache Hit] DuckDuckGo results found in cache for: "${query}"`);
      return cachedResults;
    }

    let page;
    try {
      if (signal?.aborted) {
        throw new Error('Search aborted by user');
      }

      // Block stylesheets on DuckDuckGo search to save CPU and loading bandwidth
      page = await browserService.createPage({ blockStylesheets: true });
      
      if (signal) {
        signal.addEventListener('abort', () => {
          if (page) {
            console.log('Aborting DuckDuckGo scraper page due to client signal...');
            page.close().catch(err => console.error('Error aborting page:', err.message));
          }
        });
        if (signal.aborted) {
          throw new Error('Search aborted by user');
        }
      }
      
      // DuckDuckGo HTML version is lightweight and less prone to bot detection
      const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      console.log(`Navigating DuckDuckGo to: ${htmlUrl}`);
      
      await page.goto(htmlUrl, { waitUntil: 'domcontentloaded' });

      // Scrape results from HTML version
      const results = await page.evaluate(() => {
        const items = [];
        const resultElements = document.querySelectorAll('.result');
        
        resultElements.forEach((el) => {
          const titleEl = el.querySelector('.result__title a');
          const snippetEl = el.querySelector('.result__snippet');
          
          if (titleEl) {
            const title = titleEl.textContent.trim();
            const link = titleEl.getAttribute('href');
            const snippet = snippetEl ? snippetEl.textContent.trim() : '';
            
            // Clean DuckDuckGo redirect URLs if necessary
            // e.g. //duckduckgo.com/l/?uddg=https%3A%2F%2F...
            let cleanLink = link;
            if (link && link.includes('uddg=')) {
              try {
                const urlObj = new URL(link, 'https://duckduckgo.com');
                const uddg = urlObj.searchParams.get('uddg');
                if (uddg) cleanLink = decodeURIComponent(uddg);
              } catch (e) {
                // Ignore parsing errors and use raw link
              }
            } else if (link && link.startsWith('//')) {
              cleanLink = 'https:' + link;
            }

            if (title && cleanLink) {
              items.push({
                title,
                url: cleanLink,
                snippet
              });
            }
          }
        });
        
        return items;
      });

      // If HTML version is blocked or returns empty, try the interactive AJAX version
      if (results.length === 0) {
        if (signal?.aborted) throw new Error('Search aborted by user');
        console.log('DuckDuckGo HTML version returned 0 results. Trying AJAX version...');
        const ajaxUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        await page.goto(ajaxUrl, { waitUntil: 'networkidle2' });
        
        // Wait for results selector to be loaded (gracefully timeout)
        await page.waitForSelector('article[data-testid="result"]', { timeout: 10000 }).catch(() => {});
        
        if (signal?.aborted) throw new Error('Search aborted by user');
        const ajaxResults = await page.evaluate(() => {
          const items = [];
          const resultElements = document.querySelectorAll('article[data-testid="result"]');
          
          resultElements.forEach((el) => {
            const titleEl = el.querySelector('h2 a');
            const snippetEl = el.querySelector('div[data-testid="result-snippet"]');
            
            if (titleEl) {
              const title = titleEl.textContent.trim();
              const link = titleEl.getAttribute('href');
              const snippet = snippetEl ? snippetEl.textContent.trim() : '';
              
              if (title && link) {
                items.push({
                  title,
                  url: link,
                  snippet
                });
              }
            }
          });
          
          return items;
        });
        
        if (ajaxResults.length > 0) {
          cacheService.set(cacheKey, ajaxResults);
        }
        return ajaxResults;
      }

      if (results.length > 0) {
        cacheService.set(cacheKey, results);
      }
      return results;
    } catch (error) {
      console.error('Error in DuckDuckGo search service:', error);
      throw error;
    } finally {
      if (page) {
        await page.close().catch(err => console.error('Error closing page in DDG service:', err));
      }
    }
  }
}

module.exports = new DuckDuckGoService();
