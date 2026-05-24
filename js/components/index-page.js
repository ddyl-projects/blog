/**
 * Index Page Component
 *
 * Renders a listing of all articles sorted by date descending,
 * showing title (linked), author, date, and description for each entry.
 */

import { getAllArticlesSorted } from '../manifest.js';

/**
 * Formats an ISO 8601 date string (YYYY-MM-DD) into a human-readable format.
 * Example: "2024-01-15" → "January 15, 2024"
 *
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} Human-readable date string
 */
export function formatDate(dateStr) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [year, month, day] = dateStr.split('-').map(Number);
  const monthName = months[month - 1];
  return `${monthName} ${day}, ${year}`;
}

/**
 * Renders the article index page into the content area.
 * Lists all articles sorted by date descending with title, author, date, and description.
 * Includes a tag bar above the article list when articles have tags.
 */
export function renderIndexPage() {
  const contentEl = document.getElementById('content');
  if (!contentEl) {
    return;
  }

  const articles = getAllArticlesSorted();

  if (articles.length === 0) {
    contentEl.innerHTML = `
      <div class="index-page">
        <h2>All Articles</h2>
        <p>No articles available yet.</p>
      </div>
    `;
    return;
  }

  const popularTags = getPopularTags(articles);
  const tagBarHtml = popularTags.length > 0 ? renderTagBar(popularTags, activeTagFilter) : '';
  const articleListHtml = renderArticleList(articles);

  contentEl.innerHTML = `
    <div class="index-page">
      <h2>All Articles</h2>
      ${tagBarHtml}
      ${articleListHtml}
    </div>
  `;

  attachTagBarHandlers(contentEl);
}

/**
 * Computes the most popular tags from a list of articles.
 * Tags are compared case-insensitively and stored as lowercase.
 * Results are sorted by count descending, with alphabetical tiebreaker.
 *
 * @param {Array<{tags?: string[]}>} articles - List of article entries
 * @param {number} [maxCount=20] - Maximum number of tags to return
 * @returns {{tag: string, count: number}[]} Top N tags with their counts
 */
export function getPopularTags(articles, maxCount = 20) {
  const tagCounts = new Map();

  for (const article of articles) {
    if (!article.tags || !Array.isArray(article.tags)) {
      continue;
    }
    for (const tag of article.tags) {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    }
  }

  const sorted = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.tag.localeCompare(b.tag);
    });

  return sorted.slice(0, maxCount);
}

/**
 * Filters articles by a given tag (case-insensitive comparison).
 * Preserves the descending date sort order of the input.
 *
 * @param {Array<{tags?: string[], date: string}>} articles - List of article entries (assumed sorted by date descending)
 * @param {string} tag - The tag to filter by
 * @returns {Array} Articles that contain the specified tag
 */
export function filterByTag(articles, tag) {
  const normalizedTag = tag.toLowerCase();
  return articles.filter((article) => {
    if (!article.tags || !Array.isArray(article.tags)) {
      return false;
    }
    return article.tags.some((t) => t.toLowerCase() === normalizedTag);
  });
}

/** @type {string | null} */
let activeTagFilter = null;

/**
 * Renders the tag bar HTML with tags displayed inline, each showing the tag name
 * and count in parentheses. The active tag receives the `active` CSS class.
 * A "Clear filter" button appears only when a filter is active.
 *
 * If the tags array is empty, returns an empty string (tag bar should not be rendered).
 *
 * @param {{tag: string, count: number}[]} tags - Array of tag objects with name and count
 * @param {string | null} activeTag - The currently active tag filter, or null if none
 * @returns {string} HTML string for the tag bar
 */
export function renderTagBar(tags, activeTag) {
  if (!tags || tags.length === 0) {
    return '';
  }

  const tagItems = tags.map((t) => {
    const isActive = activeTag && t.tag === activeTag.toLowerCase();
    const activeClass = isActive ? ' active' : '';
    return `<span class="tag-item${activeClass}" data-tag="${t.tag}">${t.tag} (${t.count})</span>`;
  }).join('\n  ');

  const clearButton = activeTag
    ? '\n  <button class="tag-clear-filter">Clear filter</button>'
    : '';

  return `<div class="tag-bar">\n  ${tagItems}${clearButton}\n</div>`;
}

/**
 * Sets the active tag filter and re-renders the article list.
 * Pass null to clear the filter and restore the full article list.
 *
 * @param {string | null} tag - The tag to filter by, or null to clear the filter
 */
export function setTagFilter(tag) {
  activeTagFilter = tag;

  const contentEl = document.getElementById('content');
  if (!contentEl) {
    return;
  }

  const articles = getAllArticlesSorted();
  const popularTags = getPopularTags(articles);

  // If no articles have tags, don't render the tag bar
  const tagBarHtml = renderTagBar(popularTags, activeTagFilter);

  let articleListHtml;

  if (activeTagFilter) {
    const filtered = filterByTag(articles, activeTagFilter);
    if (filtered.length === 0) {
      articleListHtml = `<p class="no-articles-message">No articles found for tag: ${activeTagFilter}</p>`;
    } else {
      articleListHtml = renderArticleList(filtered);
    }
  } else {
    articleListHtml = renderArticleList(articles);
  }

  contentEl.innerHTML = `
    <div class="index-page">
      <h2>All Articles</h2>
      ${tagBarHtml}
      ${articleListHtml}
    </div>
  `;

  attachTagBarHandlers(contentEl);
}

/**
 * Renders the article list HTML for the given articles.
 *
 * @param {Array} articles - List of article entries to render
 * @returns {string} HTML string for the article list
 */
function renderArticleList(articles) {
  if (articles.length === 0) {
    return '<p>No articles available yet.</p>';
  }

  const articleItems = articles.map((article) => {
    const formattedDate = formatDate(article.date);
    return `
      <li class="index-article-item">
        <h3 class="index-article-title">
          <a href="#/article/${article.slug}">${article.title}</a>
        </h3>
        <div class="index-article-meta">
          <span class="index-article-author">${article.author}</span>
          <span class="index-article-date">${formattedDate}</span>
        </div>
        ${article.description ? `<p class="index-article-description">${article.description}</p>` : ''}
      </li>
    `;
  }).join('');

  return `<ul class="index-article-list">\n        ${articleItems}\n      </ul>`;
}

/**
 * Attaches click event listeners to the tag bar using event delegation.
 * Clicking a `.tag-item` calls setTagFilter with the tag's data-tag attribute.
 * Clicking `.tag-clear-filter` calls setTagFilter(null) to clear the filter.
 *
 * @param {HTMLElement} contentEl - The content container element
 */
function attachTagBarHandlers(contentEl) {
  const tagBar = contentEl.querySelector('.tag-bar');
  if (tagBar) {
    tagBar.addEventListener('click', (e) => {
      const tagItem = e.target.closest('.tag-item');
      if (tagItem) {
        setTagFilter(tagItem.dataset.tag);
        return;
      }
      if (e.target.closest('.tag-clear-filter')) {
        setTagFilter(null);
      }
    });
  }
}
