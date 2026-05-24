/**
 * Side Menu component — renders a navigation panel with the latest articles
 * and an "All Articles" index link.
 * Targets the existing .side-menu element (#side-menu) in index.html.
 */

/**
 * Renders the side menu with a "Home" link at top, up to 10 most recent articles
 * as clickable links sorted by date descending, and an "All Articles" index link.
 *
 * @param {Array<{title: string, slug: string, date: string}>} articles - Article entries
 * @returns {HTMLElement|null} The side menu element, or null if the container is not found
 */
export function renderSideMenu(articles) {
  const menu = document.getElementById('side-menu');
  if (!menu) return null;

  // Sort by date descending and take up to 10 most recent
  const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentArticles = sorted.slice(0, 10);

  menu.innerHTML = buildMenuHTML(recentArticles);

  return menu;
}

/**
 * Updates the side menu content with a new set of articles.
 * Replaces the existing menu content while preserving the container element.
 *
 * @param {Array<{title: string, slug: string, date: string}>} articles - Article entries sorted by date descending
 */
export function updateSideMenu(articles) {
  renderSideMenu(articles);
}

/**
 * Builds the inner HTML for the side menu.
 *
 * @param {Array<{title: string, slug: string, date: string}>} articles - Up to 10 recent articles
 * @returns {string} HTML string for the menu content
 */
function buildMenuHTML(articles) {
  const articleLinks = articles
    .map(
      (article) =>
        `<li><a href="#/article/${escapeHTML(article.slug)}">${escapeHTML(article.title)}</a></li>`
    )
    .join('\n      ');

  return `
    <div class="home-link">
      <a href="#/">Home</a>
    </div>
    <h3>Recent Articles</h3>
    <ul>
      ${articleLinks}
    </ul>
    <div class="index-link">
      <a href="#/index">All Articles</a>
    </div>
  `;
}

/**
 * Escapes HTML special characters to prevent XSS.
 *
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
