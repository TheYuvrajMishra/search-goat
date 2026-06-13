import { PlaywrightPool } from './playwrightPool.js';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class SearchManager {
  static async search(query: string): Promise<SearchResult[]> {
    const context = await PlaywrightPool.getContext();
    const page = await context.newPage();
    
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for at least one result or a "no results" indicator
      await page.waitForSelector('.result__body', { timeout: 10000 }).catch(() => {});

      const results = await page.$$eval('.result__body', (elements) => {
        return elements.slice(0, 5).map(el => {
          const titleEl = el.querySelector('.result__a') as HTMLAnchorElement;
          const snippetEl = el.querySelector('.result__snippet');
          return {
            title: titleEl?.innerText || '',
            url: titleEl?.href || '',
            snippet: snippetEl?.textContent || ''
          };
        });
      });

      return results.filter(r => r.url && r.title);
    } catch (error) {
      console.error(`Search failed for query "${query}":`, error);
      return [];
    } finally {
      await PlaywrightPool.releaseContext(context);
    }
  }
}
