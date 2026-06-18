const browserService = require('./browserService');

class MapsScraperService {
  /**
   * Crawl a website URL and look for email addresses.
   * @param {string} websiteUrl 
   * @returns {Promise<string[]>} List of unique emails found
   */
  async crawlWebsiteForEmails(websiteUrl) {
    if (!websiteUrl) return [];
    
    // Ignore big social media sites to save time and API rate limits
    const ignoredDomains = [
      'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
      'youtube.com', 'google.com', 'pinterest.com', 'yelp.com'
    ];
    
    try {
      let targetUrl = websiteUrl.trim();
      // Resolve redirect and cleaning
      if (targetUrl.startsWith('https://www.google.com/url?q=')) {
        const urlObj = new URL(targetUrl);
        targetUrl = urlObj.searchParams.get('q') || targetUrl;
      }
      
      const parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
      const domain = parsedUrl.hostname.toLowerCase();
      
      if (ignoredDomains.some(d => domain.includes(d))) {
        return [];
      }

      console.log(`[EmailCrawler] Fetching homepage: ${parsedUrl.href}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(parsedUrl.href, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[EmailCrawler] Failed to fetch homepage ${parsedUrl.href}: Status ${response.status}`);
        return [];
      }

      const html = await response.text();
      
      // Regular expression to find email addresses
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/g;
      const matches = html.match(emailRegex) || [];
      
      // Clean, filter and deduplicate
      const cleanEmails = matches
        .map(e => e.trim().toLowerCase())
        .filter(e => {
          // Filter out typical false positives
          const isImageOrAsset = /\.(png|jpg|jpeg|gif|webp|svg|css|js|woff|woff2|pdf)$/i.test(e);
          const isPlaceholder = e.includes('example.com') || e.includes('domain.com') || e.includes('email.com');
          return !isImageOrAsset && !isPlaceholder;
        });

      const uniqueEmails = Array.from(new Set(cleanEmails));
      if (uniqueEmails.length > 0) {
        console.log(`[EmailCrawler] Found emails for ${domain}:`, uniqueEmails);
      }
      return uniqueEmails;
    } catch (err) {
      console.warn(`[EmailCrawler] Error crawling website ${websiteUrl}:`, err.message);
      return [];
    }
  }

  /**
   * Scrapes Google Maps data for a given bounding box and search query.
   * @param {string} query Search query (e.g. 'Software Companies')
   * @param {number} minLat Minimum Latitude
   * @param {number} minLng Minimum Longitude
   * @param {number} maxLat Maximum Latitude
   * @param {number} maxLng Maximum Longitude
   * @param {number} limit Maximum business listings to scrape (defaults to 15)
   * @returns {Promise<Array<Object>>} Scraped business listings
   */
  async scrapeMaps(query, minLat, minLng, maxLat, maxLng, limit = 15, options = {}) {
    const { signal } = options;
    let page;
    try {
      if (signal?.aborted) {
        throw new Error('Maps scraping aborted by user');
      }

      // Block images, media, and fonts to avoid loading map tiles, saving massive network and CPU load
      page = await browserService.createPage({
        blockImages: true,
        blockMedia: true,
        blockFonts: true,
        blockStylesheets: false // Maps requires stylesheets to render layouts correctly
      });

      if (signal) {
        signal.addEventListener('abort', () => {
          if (page) {
            console.log('[MapsScraper] Aborting scraper page due to client signal...');
            page.close().catch(err => console.error('[MapsScraper] Error aborting page:', err.message));
          }
        });
        if (signal.aborted) {
          throw new Error('Maps scraping aborted by user');
        }
      }
      
      // Calculate map center coordinate
      const centerLat = (parseFloat(minLat) + parseFloat(maxLat)) / 2;
      const centerLng = (parseFloat(minLng) + parseFloat(maxLng)) / 2;
      const zoom = 15; // standard detail zoom level
      
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${centerLat},${centerLng},${zoom}z?hl=en`;
      console.log(`[MapsScraper] Navigating to Google Maps search: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

      if (signal?.aborted) throw new Error('Maps scraping aborted by user');

      // Check if page redirected straight to a single business page (maps/place/)
      const currentUrl = page.url();
      let placeUrls = [];
      
      if (currentUrl.includes('/maps/place/')) {
        console.log(`[MapsScraper] Query redirected directly to a single business page.`);
        placeUrls = [currentUrl];
      } else {
        // We are on a search results page.
        // Scroll the results sidebar to load listings.
        const feedSelector = 'div[role="feed"]';
        
        console.log(`[MapsScraper] Waiting for sidebar feed to load...`);
        let hasFeed = true;
        try {
          await page.waitForSelector(feedSelector, { timeout: 10000 });
        } catch (err) {
          console.warn(`[MapsScraper] Sidebar selector ${feedSelector} not found. Searching for place elements directly.`);
          hasFeed = false;
        }

        if (hasFeed) {
          let prevHeight = 0;
          let scrollAttempts = 0;
          let currentCount = 0;

          // Scroll feed until we reach the limit or the end of the list
          while (scrollAttempts < 10) {
            if (signal?.aborted) throw new Error('Maps scraping aborted by user');

            currentCount = await page.evaluate((sel) => {
              return document.querySelectorAll(`${sel} a[href*="/maps/place/"]`).length;
            }, feedSelector);

            console.log(`[MapsScraper] Found ${currentCount} listings in sidebar scroll...`);
            if (currentCount >= limit) {
              break;
            }

            const { reachedEnd, currentHeight } = await page.evaluate((sel) => {
              const feed = document.querySelector(sel);
              if (!feed) return { reachedEnd: true, currentHeight: 0 };
              
              feed.scrollTop = feed.scrollHeight;
              
              const html = feed.innerHTML;
              // Detect end of list marker in Google Maps side panel
              const reachedEnd = html.includes("You've reached the end of the list") || 
                                 html.includes("No more results") ||
                                 feed.querySelector('.HlvSq') !== null;
              
              return { reachedEnd, currentHeight: feed.scrollHeight };
            }, feedSelector);

            if (reachedEnd) {
              console.log(`[MapsScraper] Reached the end of the Google Maps results feed.`);
              break;
            }

            if (currentHeight === prevHeight) {
              scrollAttempts++;
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, 1500);
                if (signal) {
                  signal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    reject(new Error('Scraping aborted'));
                  });
                }
              });
            } else {
              scrollAttempts = 0;
              prevHeight = currentHeight;
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, 1000);
                if (signal) {
                  signal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    reject(new Error('Scraping aborted'));
                  });
                }
              });
            }
          }
        }

        if (signal?.aborted) throw new Error('Maps scraping aborted by user');

        // Collect all matching place detail URLs
        placeUrls = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
          return anchors.map(a => a.href);
        });

        // Deduplicate links
        placeUrls = Array.from(new Set(placeUrls));
      }

      console.log(`[MapsScraper] Found a total of ${placeUrls.length} business links. Limiting to first ${limit}.`);
      const selectedUrls = placeUrls.slice(0, limit);
      const businesses = [];

      // Iterate through each business page to scrape individual details
      for (const placeUrl of selectedUrls) {
        if (signal?.aborted) throw new Error('Maps scraping aborted by user');
        console.log(`[MapsScraper] Navigating to place details: ${placeUrl}`);
        try {
          await page.goto(placeUrl, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('h1.DUwDvf', { timeout: 10000 });

          if (signal?.aborted) throw new Error('Maps scraping aborted by user');

          const details = await page.evaluate(() => {
            const nameEl = document.querySelector('h1.DUwDvf');
            const name = nameEl ? nameEl.textContent.trim() : '';

            // Category / Industry
            let category = '';
            // Often inside button with class class*="D7m2Ci" or near subtitle header
            const categoryEl = document.querySelector('button[class*="D7m2Ci"]');
            if (categoryEl) {
              category = categoryEl.textContent.trim();
            } else {
              const altCategoryEl = document.querySelector('.fontBodyMedium span button');
              if (altCategoryEl) category = altCategoryEl.textContent.trim();
            }

            // Address
            let address = '';
            const addressEl = document.querySelector('button[data-item-id="address"]');
            if (addressEl) {
              address = addressEl.textContent.trim();
            }
            // Strip the pin character icon E0C8
            address = address.replace(/^\uE0C8/, '').replace(/^/, '').trim();

            // Website
            let website = '';
            const websiteEl = document.querySelector('a[data-item-id="authority"]');
            if (websiteEl) {
              website = websiteEl.getAttribute('href');
            }

            // Phone
            let phone = '';
            const phoneEl = document.querySelector('button[data-item-id^="phone:tel:"]');
            if (phoneEl) {
              phone = phoneEl.getAttribute('data-item-id').replace('phone:tel:', '').replace(/\s+/g, ' ').trim();
            }

            // Rating & Review Count
            let rating = '';
            let reviewsCount = '';
            const ratingEl = document.querySelector('div.F7nice');
            if (ratingEl) {
              const spans = ratingEl.querySelectorAll('span');
              if (spans.length > 0) {
                rating = spans[0].textContent.trim();
              }
              if (spans.length > 1) {
                reviewsCount = spans[1].textContent.trim();
              }
            }

            // Helper to parse review counts like 4.1K reviews or (4,321)
            let parsedReviews = 0;
            if (reviewsCount) {
              const cleanStr = reviewsCount.replace(/[(),]/g, '').trim().toLowerCase();
              if (cleanStr.endsWith('k')) {
                parsedReviews = Math.round(parseFloat(cleanStr) * 1000);
              } else if (cleanStr.endsWith('m')) {
                parsedReviews = Math.round(parseFloat(cleanStr) * 1000000);
              } else {
                parsedReviews = parseInt(cleanStr) || 0;
              }
            }

            return {
              name,
              category,
              address,
              website,
              phone,
              rating: rating ? parseFloat(rating) : null,
              reviewsCount: parsedReviews
            };
          });

          // Parse coordinates from the final detail page URL (checks !3d...!4d... first, then @lat,lng)
          let latitude = null;
          let longitude = null;
          const currentUrl = page.url();
          
          const dataCoordsMatch = currentUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          if (dataCoordsMatch) {
            latitude = parseFloat(dataCoordsMatch[1]);
            longitude = parseFloat(dataCoordsMatch[2]);
          } else {
            const urlCoordsMatch = currentUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (urlCoordsMatch) {
              latitude = parseFloat(urlCoordsMatch[1]);
              longitude = parseFloat(urlCoordsMatch[2]);
            }
          }

          businesses.push({
            ...details,
            latitude,
            longitude,
            url: placeUrl,
            emails: [] // To be filled by the email crawler
          });

        } catch (err) {
          if (signal?.aborted) throw new Error('Maps scraping aborted by user');
          console.error(`[MapsScraper] Error scraping details for ${placeUrl}:`, err.message);
        }
      }

      if (signal?.aborted) throw new Error('Maps scraping aborted by user');
      console.log(`[MapsScraper] Finished details scraping. Crawling website emails in parallel...`);
      
      // Concurrently crawl websites for email contacts, respecting the signal
      const emailCrawls = businesses.map(async (biz) => {
        if (biz.website) {
          try {
            if (signal?.aborted) return;
            const emails = await this.crawlWebsiteForEmails(biz.website);
            biz.emails = emails;
          } catch (e) {
            console.error(`[MapsScraper] Email crawl failed for ${biz.website}:`, e.message);
          }
        }
      });

      await Promise.all(emailCrawls);
      console.log(`[MapsScraper] Google Maps scrape complete. Collected ${businesses.length} businesses.`);
      return businesses;

    } catch (error) {
      console.error(`[MapsScraper] Fatal error in maps scraper service:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close().catch(err => console.error('[MapsScraper] Error closing Puppeteer page:', err.message));
      }
    }
  }
}

module.exports = new MapsScraperService();
