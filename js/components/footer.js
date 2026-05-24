/**
 * Footer component — renders the site footer with basic site information.
 * Targets the existing .site-footer element in index.html.
 */

/**
 * Renders the footer content into the site footer element.
 * Displays copyright and site information.
 */
export function renderFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-content">
      <p>&copy; ${year} Damian Dyl. All rights reserved.</p>
    </div>
  `;
}
