import { chromium, Browser, BrowserContext } from 'playwright';

export class PlaywrightPool {
  private static browser: Browser | null = null;
  private static contexts: BrowserContext[] = [];
  private static MAX_CONTEXTS = 3;

  private static async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  static async getContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    this.contexts.push(context);
    return context;
  }

  static async releaseContext(context: BrowserContext): Promise<void> {
    await context.close();
    this.contexts = this.contexts.filter(c => c !== context);
  }

  static async closeAll(): Promise<void> {
    for (const context of this.contexts) {
      await context.close();
    }
    this.contexts = [];
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
