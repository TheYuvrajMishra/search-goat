const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

class BrowserService {
  constructor() {
    this.browser = null;
    this.isLaunching = false;
  }

  /**
   * Initializes and returns the headless browser instance.
   * Reuses the existing instance if it's already running and connected.
   */
  async getBrowser() {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.isLaunching) {
      // Wait a short time and try again if another request is launching the browser
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.getBrowser();
    }

    this.isLaunching = true;
    try {
      console.log('Launching Puppeteer Chrome browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--mute-audio'
        ]
      });

      // Handle unexpected disconnects
      this.browser.on('disconnected', () => {
        console.warn('Puppeteer browser disconnected.');
        this.browser = null;
      });

      console.log('Puppeteer Browser launched successfully.');
      return this.browser;
    } catch (error) {
      console.error('Error launching browser:', error);
      throw error;
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Creates a new page with pre-configured settings (custom user agent, viewport, headers)
   * to avoid detection.
   */
  async createPage() {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    // Set a realistic User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Configure default timeout (30 seconds)
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);

    // Commented out request interception to prevent detection.
    // Blocking resources like images/fonts is a high-signal footprint that Google detects as an automated scraper.
    /*
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    */

    return page;
  }

  /**
   * Gracefully closes the browser instance.
   */
  async closeBrowser() {
    if (this.browser) {
      console.log('Closing Puppeteer browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new BrowserService();
