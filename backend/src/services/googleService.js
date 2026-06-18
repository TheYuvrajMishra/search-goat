const browserService = require('./browserService');
const cacheService = require('./cacheService');

class GoogleService {
  /**
   * Search query on Google using Puppeteer.
   * @param {string} query
   * @param {Object} options
   * @returns {Promise<Array<{title: string, url: string, snippet: string}>>}
   */
  async search(query, options = {}) {
    const { signal } = options;
    const cacheKey = cacheService.getCacheKey('google', query);
    const cachedResults = cacheService.get(cacheKey);

    if (cachedResults) {
      console.log(`[Cache Hit] Google results found in cache for: "${query}"`);
      return cachedResults;
    }

    let page;
    try {
      if (signal?.aborted) {
        throw new Error('Search aborted by user');
      }

      // Block stylesheets on Google search to save memory and CPU
      page = await browserService.createPage({ blockStylesheets: true });
      
      if (signal) {
        signal.addEventListener('abort', () => {
          if (page) {
            console.log('Aborting Google scraper page due to client signal...');
            page.close().catch(err => console.error('Error aborting page:', err.message));
          }
        });
        if (signal.aborted) {
          throw new Error('Search aborted by user');
        }
      }
      
      // Force English results to ensure predictable selector structure
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
      console.log(`Navigating Google to: ${url}`);
      
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Check for rate limit status code
      if (response && response.status() === 429) {
        throw new Error('Google rate-limit (429) detected. The search request was blocked. Try using DuckDuckGo or configure proxies.');
      }

      if (signal?.aborted) throw new Error('Search aborted by user');

      // Check for CAPTCHA pages which might be returned under 200/302 redirects
      const isCaptcha = await page.evaluate(() => {
        return document.body.innerHTML.includes('g-recaptcha') || 
               document.body.innerHTML.includes('unusual traffic');
      });
      if (isCaptcha) {
        throw new Error('Google anti-bot challenge (CAPTCHA / Unusual Traffic page) was detected. Request blocked.');
      }
      
      // Wait for standard search result card (div.g)
      await page.waitForSelector('div.g', { timeout: 10000 }).catch(() => {
        console.warn('Google results container div.g not found within timeout.');
      });

      if (signal?.aborted) throw new Error('Search aborted by user');
      
      // Extract results
      const results = await page.evaluate(() => {
        const items = [];
        const resultElements = document.querySelectorAll('div.g');
        
        resultElements.forEach((el) => {
          // Find title element (usually h3)
          const titleEl = el.querySelector('h3');
          if (!titleEl) return;
          
          // Find the link (closest parent anchor or first anchor inside the result container)
          const linkEl = titleEl.closest('a') || el.querySelector('a');
          if (!linkEl) return;
          
          const title = titleEl.textContent.trim();
          const link = linkEl.getAttribute('href');
          
          // Extract description/snippet
          // Google snippets frequently use .VwiC3b, .yDsk7d, or lines-clamp styles.
          let snippet = '';
          const snippetEl = el.querySelector('.VwiC3b, .yDsk7d, .MUFcru, div[style*="-webkit-line-clamp"]');
          if (snippetEl) {
            snippet = snippetEl.textContent.trim();
          } else {
            // Fallback: scan for any nested text nodes that contain descriptive snippet blocks
            const textContainers = el.querySelectorAll('span, div');
            for (const textEl of textContainers) {
              const text = textEl.textContent.trim();
              // A good snippet is usually longer text and doesn't just duplicate the title
              if (text.length > 50 && !text.includes(title) && text.length < 300) {
                snippet = text;
                break;
              }
            }
          }
          
          // Ensure we have a valid external URL
          if (title && link && link.startsWith('http')) {
            items.push({
              title,
              url: link,
              snippet
            });
          }
        });
        
        return items;
      });

      if (results.length > 0) {
        cacheService.set(cacheKey, results);
      }
      return results;
    } catch (error) {
      console.error('Error in Google search service:', error);
      throw error;
    } finally {
      if (page) {
        await page.close().catch(err => console.error('Error closing page in Google service:', err));
      }
    }
  }
}

module.exports = new GoogleService();
