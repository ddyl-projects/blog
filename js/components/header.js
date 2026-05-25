/**
 * Header component — renders the site header with blog title.
 * Targets the existing .site-header element in index.html.
 */

/**
 * Renders the header content into the site header element.
 * Displays the blog title in a fixed-position header.
 */
export function renderHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  header.innerHTML = `
    <div class="header-content">
      <picture>
        <source media="(max-width: 768px)" srcset="assets/images/logo-mobile.png">
        <img src="assets/images/logo.png" alt="Blog Logo" class="header-logo">
      </picture>
    </div>
  `;
}
