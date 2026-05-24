import { renderMarkdown } from '../renderer.js';

/**
 * Render the introduction page by fetching and displaying intro.md.
 * If intro.md is not available, displays a default welcome message.
 *
 * @returns {Promise<void>}
 */
export async function renderIntro() {
  const contentArea = document.getElementById('content');

  try {
    const response = await fetch('intro.md');

    if (!response.ok) {
      showDefaultMessage(contentArea);
      return;
    }

    const markdown = await response.text();
    contentArea.innerHTML = renderMarkdown(markdown);
  } catch (error) {
    showDefaultMessage(contentArea);
  }
}

/**
 * Display a default welcome message when intro.md is unavailable.
 *
 * @param {HTMLElement} container - The content area element
 */
function showDefaultMessage(container) {
  container.innerHTML = '<p>Welcome to the Technical Blog. No introduction content is available yet.</p>';
}
