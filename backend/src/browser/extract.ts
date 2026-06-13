import { PlaywrightPool } from './playwrightPool.js';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface PageContent {
  title: string;
  content: string;
  textContent: string;
  url: string;
}

export class ContentExtractor {
  static async extract(url: string): Promise<PageContent | null> {
    const context = await PlaywrightPool.getContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const html = await page.content();
      
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) return null;

      return {
        title: article.title || '',
        content: article.content || '',
        textContent: article.textContent || '',
        url
      };
    } catch (error) {
      console.error(`Extraction failed for URL "${url}":`, error);
      return null;
    } finally {
      await PlaywrightPool.releaseContext(context);
    }
  }
}
