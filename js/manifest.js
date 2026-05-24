/**
 * Manifest Loader
 *
 * Fetches and caches the article manifest, providing query functions
 * for retrieving articles sorted by date descending.
 */

/** @type {import('./manifest').ArticleEntry[] | null} */
let cachedManifest = null;

/**
 * Fetches `article-manifest.json` with retry logic (exponential backoff, max 3 attempts).
 * Caches the result in memory for subsequent calls.
 *
 * @returns {Promise<import('./manifest').ArticleEntry[]>} The list of article entries
 */
export async function loadManifest() {
  if (cachedManifest) {
    return cachedManifest;
  }

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch('article-manifest.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      cachedManifest = sortByDateDescending(data.articles || []);
      return cachedManifest;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await wait(delay);
      }
    }
  }

  throw new Error(
    `Failed to load article manifest after ${maxAttempts} attempts: ${lastError?.message}`
  );
}

/**
 * Returns the N most recent articles sorted by date descending.
 *
 * @param {number} count - Number of articles to return
 * @returns {import('./manifest').ArticleEntry[]} The latest articles
 */
export function getLatestArticles(count) {
  if (!cachedManifest) {
    return [];
  }
  return cachedManifest.slice(0, count);
}

/**
 * Finds an article by its slug.
 *
 * @param {string} slug - The URL slug to search for
 * @returns {import('./manifest').ArticleEntry | null} The matching article or null
 */
export function getArticleBySlug(slug) {
  if (!cachedManifest) {
    return null;
  }
  return cachedManifest.find((article) => article.slug === slug) || null;
}

/**
 * Returns all articles sorted by date descending.
 *
 * @returns {import('./manifest').ArticleEntry[]} All articles sorted newest first
 */
export function getAllArticlesSorted() {
  if (!cachedManifest) {
    return [];
  }
  return [...cachedManifest];
}

/**
 * Sorts articles by date in descending order (newest first).
 *
 * @param {import('./manifest').ArticleEntry[]} articles
 * @returns {import('./manifest').ArticleEntry[]}
 */
export function sortByDateDescending(articles) {
  return [...articles].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
}

/**
 * Resets the cached manifest (useful for testing).
 */
export function resetManifest() {
  cachedManifest = null;
}

/**
 * Waits for the specified number of milliseconds.
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
