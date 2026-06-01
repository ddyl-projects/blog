/**
 * Application Entry Point
 *
 * Initializes the router, loads the article manifest, renders layout components,
 * and sets up route handlers for the blog application.
 */

import { initRouter } from './router.js';
import { loadManifest, getLatestArticles } from './manifest.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderSideMenu } from './components/sidemenu.js';
import 'highlight.js/styles/github.css';
import { renderIntro } from './components/intro.js';
import { renderArticle } from './components/article.js';
import { renderIndexPage } from './components/index-page.js';
import { configureHighlighting } from './renderer.js';

/**
 * Shows a loading indicator in the content area.
 */
function showLoading() {
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = '<p class="loading">Loading...</p>';
  }
}

/**
 * Shows an error message in the content area.
 *
 * @param {string} message - The error message to display
 */
function showError(message) {
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Configure syntax highlighting for supported languages
  configureHighlighting(['javascript', 'python', 'typescript', 'html', 'css', 'bash', 'java']);

  // 2. Render header and footer
  renderHeader();
  renderFooter();

  // 3. Load the manifest (show loading state while fetching)
  showLoading();

  try {
    await loadManifest();

    // 4. Once manifest is loaded, render the side menu with latest 10 articles
    renderSideMenu(getLatestArticles(10));
  } catch (error) {
    // 6. If manifest loading fails, show error but still allow navigation
    showError('Unable to load articles. Please try again later.');
  }

  // 5. Initialize the router with routes
  initRouter([
    {
      pattern: '/',
      handler: () => renderIntro()
    },
    {
      pattern: '/article/:slug',
      handler: (params) => renderArticle(params.slug)
    },
    {
      pattern: '/index',
      handler: () => renderIndexPage()
    }
  ]);
});
