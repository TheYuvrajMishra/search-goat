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
      console.log('Launching Puppeteer Chrome browser with conservative flags...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,800', // Sized down to save buffer memory
          '--mute-audio',
          
          // Resource & Backgrounding Optimization Flags:
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-extensions',
          '--disable-features=AudioServiceOutOfProcess,Translate,BackForwardCache,AcceptCHFrame,AvoidUnnecessaryTemplates',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-notifications',
          '--disable-offer-store-unmasked-wallet-cards',
          '--disable-popup-blocking',
          '--disable-print-preview',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-speech-api',
          '--disable-sync',
          '--hide-scrollbars',
          '--ignore-gpu-blacklist',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-first-run',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          
          // V8 Engine Limits:
          '--js-flags=--max-old-space-size=256' // Limits tab RAM to 256MB
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
   * and selectively blocks non-essential resources to conserve system capacity.
   */
  async createPage(options = {}) {
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

    // Dynamic resource blocking options
    const {
      blockImages = true,
      blockMedia = true,
      blockFonts = true,
      blockStylesheets = false // Defaults to false; search can set it to true
    } = options;

    if (blockImages || blockMedia || blockFonts || blockStylesheets) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const type = req.resourceType();
        const url = req.url();

        const shouldBlock = 
          (blockImages && type === 'image') ||
          (blockMedia && type === 'media') ||
          (blockFonts && type === 'font') ||
          (blockStylesheets && type === 'stylesheet') ||
          url.includes('analytics') ||
          url.includes('doubleclick') ||
          url.includes('google-analytics.com');

        if (shouldBlock) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

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
