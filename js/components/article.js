import { getArticleBySlug } from '../manifest.js';
import { parseFrontMatter } from '../frontmatter.js';
import { renderMarkdown } from '../renderer.js';
import { openLightbox } from '../lightbox.js';

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable format.
 * Example: "2024-01-15" → "January 15, 2024"
 *
 * @param {string} isoDateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns {string} Human-readable date string (e.g., "January 15, 2024")
 */
export function formatDate(isoDateString) {
  const [year, month, day] = isoDateString.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

/**
 * Renders a linked markdown file in the content area with a back button
 * that returns to the referring article.
 *
 * @param {string} mdPath - Path to the .md file to render
 * @param {string} backHash - The hash route to return to
 */
async function renderLinkedMd(mdPath, backHash) {
  const contentArea = document.getElementById('content');

  try {
    const response = await fetch(mdPath);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('File not found');
    }

    const rawMarkdown = await response.text();
    const { frontMatter, content } = parseFrontMatter(rawMarkdown);
    const renderedContent = renderMarkdown(content || rawMarkdown);

    const title = frontMatter?.title || '';

    contentArea.innerHTML = `
      <div class="linked-document">
        <button class="back-button" data-back-hash="${backHash}">← Back</button>
        ${title ? `<h1>${title}</h1>` : ''}
        <div class="linked-content">
          ${renderedContent}
        </div>
      </div>
    `;

    // Attach back button handler
    const backBtn = contentArea.querySelector('.back-button');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const targetHash = backBtn.dataset.backHash;
        if (window.location.hash === targetHash) {
          // Hash is already the same — hashchange won't fire, so re-render manually
          const slug = targetHash.replace(/^#\/article\//, '');
          renderArticle(slug);
        } else {
          window.location.hash = targetHash;
        }
      });
    }

    // Attach md link handlers to the newly rendered content
    attachMdLinkHandlers(contentArea, backHash);

    // Attach image lightbox handlers
    const linkedContent = contentArea.querySelector('.linked-content');
    if (linkedContent) {
      attachImageHandlers(linkedContent);
    }
  } catch (error) {
    contentArea.innerHTML = `
      <div class="error-message">
        <button class="back-button" data-back-hash="${backHash}">← Back</button>
        <h2>Error Loading Document</h2>
        <p>Could not load the linked document.</p>
      </div>
    `;

    const backBtn = contentArea.querySelector('.back-button');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const targetHash = backBtn.dataset.backHash;
        if (window.location.hash === targetHash) {
          const slug = targetHash.replace(/^#\/article\//, '');
          renderArticle(slug);
        } else {
          window.location.hash = targetHash;
        }
      });
    }
  }
}

/**
 * Attaches click handlers to any links ending in .md within a container.
 * These links will render the target markdown inline with a back button.
 *
 * @param {HTMLElement} container - The container to search for .md links
 * @param {string} currentHash - The current hash route (for the back button)
 */
function attachMdLinkHandlers(container, currentHash) {
  const links = container.querySelectorAll('a[href$=".md"]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    // Only intercept relative .md links (not external URLs)
    if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo(0, 0);
        renderLinkedMd(href, currentHash);
      });
    }
  });
}

/**
 * Attaches click event listeners to all <img> elements within the
 * given container. Each listener opens the lightbox with the image's src.
 *
 * @param {HTMLElement} container - The container to search for images
 */
export function attachImageHandlers(container) {
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('click', () => {
      openLightbox(img.src);
    });
  });
}

/**
 * Renders a single article view by slug.
 *
 * Fetches the article's raw markdown from the repository, parses front matter,
 * renders the content with syntax highlighting, and displays metadata
 * (title, author, date, description).
 *
 * If the article is not found or the fetch fails, displays an error message
 * with a link back to the index page.
 *
 * @param {string} slug - The article's URL slug
 */
export async function renderArticle(slug) {
  const contentArea = document.getElementById('content');

  const article = getArticleBySlug(slug);

  if (!article) {
    contentArea.innerHTML = `
      <div class="error-message">
        <h2>Article Not Found</h2>
        <p>The article you are looking for could not be found.</p>
        <a href="#/index">← Back to article index</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(article.path);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Guard against SPA fallback returning HTML instead of markdown
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Received HTML instead of markdown — file may not exist');
    }

    const rawMarkdown = await response.text();
    const { frontMatter, content } = parseFrontMatter(rawMarkdown);

    const title = frontMatter?.title || article.title;
    const author = frontMatter?.author || article.author;
    const date = frontMatter?.date || article.date;
    const description = frontMatter?.description || article.description || '';

    const renderedContent = renderMarkdown(content);

    contentArea.innerHTML = `
      <article class="article-view">
        <header class="article-header">
          <h1 class="article-title">${title}</h1>
          <div class="article-meta">
            <span class="article-author">${author}</span>
            <span class="article-date">${formatDate(date)}</span>
          </div>
          ${description ? `<p class="article-description">${description}</p>` : ''}
        </header>
        <div class="article-content">
          ${renderedContent}
        </div>
      </article>
    `;

    // Attach handlers for any .md links within the article
    attachMdLinkHandlers(contentArea, window.location.hash);

    // Attach image lightbox handlers
    const articleContent = contentArea.querySelector('.article-content');
    if (articleContent) {
      attachImageHandlers(articleContent);
    }
  } catch (error) {
    contentArea.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Article</h2>
        <p>There was a problem loading this article. Please try again later.</p>
        <a href="#/index">← Back to article index</a>
      </div>
    `;
  }
}
