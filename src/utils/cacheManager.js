const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Caches data to localStorage with a timestamp.
 * @param {string} key The key to store the data under.
 * @param {any} data The data to be stored.
 */
export const cacheData = (key, data) => {
  try {
    const item = {
      payload: data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error caching data for key "${key}":`, error);
  }
};

/**
 * Retrieves cached data from localStorage if it's not expired.
 * @param {string} key The key to retrieve data from.
 * @returns {any|null} The cached data payload or null if not found or expired.
 */
export const getCachedData = (key) => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr);
    const isExpired = (Date.now() - item.timestamp) > CACHE_EXPIRY_MS;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return item.payload;
  } catch (error) {
    console.error(`Error retrieving cached data for key "${key}":`, error);
    return null;
  }
};

/**
 * Checks if the browser is currently online.
 * @returns {boolean} True if the browser is online.
 */
export const isOnline = () => {
    return navigator.onLine;
}
