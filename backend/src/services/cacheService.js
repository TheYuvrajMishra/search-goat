class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 15 * 60 * 1000; // Cache search results for 15 minutes
  }

  /**
   * Generates a unique key for the cache based on the search engine and query.
   * @param {string} engine 
   * @param {string} query 
   * @returns {string}
   */
  getCacheKey(engine, query) {
    return `${engine.toLowerCase()}:${query.toLowerCase().trim()}`;
  }

  /**
   * Retrieves a cached value if it exists and has not expired.
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Stores a value in the cache with the configured TTL.
   * @param {string} key 
   * @param {any} value 
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = new CacheService();
