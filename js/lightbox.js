/**
 * Lightbox module for displaying full-size images in a modal overlay.
 * Manages DOM creation, event handling, and teardown for the lightbox component.
 */

let escapeHandler = null;

/**
 * Opens the lightbox overlay displaying the given image at full size.
 * Creates the overlay DOM, appends it to document.body, and sets up
 * close handlers (button click, overlay click, Escape key).
 *
 * @param {string} src - The image URL to display
 */
export function openLightbox(src) {
  if (!src) return;
  if (isLightboxOpen()) return;

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close lightbox');
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', closeLightbox);

  // Create full-size image
  const img = document.createElement('img');
  img.className = 'lightbox-image';
  img.src = src;
  img.alt = '';

  // Assemble DOM
  overlay.appendChild(closeBtn);
  overlay.appendChild(img);

  // Overlay click closes lightbox (only when clicking the overlay itself)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  // Append to body and lock scroll
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Add Escape key listener
  escapeHandler = (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

/**
 * Closes the lightbox overlay and cleans up event listeners.
 * Removes the overlay element from the DOM and restores body scroll.
 */
export function closeLightbox() {
  const overlay = document.querySelector('.lightbox-overlay');
  if (!overlay) return;

  overlay.remove();

  // Remove Escape key listener
  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }

  // Restore body scroll
  document.body.style.overflow = '';
}

/**
 * Returns whether the lightbox is currently open.
 *
 * @returns {boolean} True if the lightbox overlay is present in the DOM
 */
export function isLightboxOpen() {
  return document.querySelector('.lightbox-overlay') !== null;
}
