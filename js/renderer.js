import { Marked } from 'marked';
import hljs from 'highlight.js';

/**
 * Set of currently registered language identifiers (lowercase).
 * @type {Set<string>}
 */
let registeredLanguages = new Set();

/**
 * Configure which languages are available for syntax highlighting.
 * Registers the specified languages so they can be used for
 * highlighting fenced code blocks.
 *
 * @param {string[]} languages - Array of language names to register
 *   (e.g., ['javascript', 'python', 'typescript', 'html', 'css', 'bash'])
 */
export function configureHighlighting(languages) {
  registeredLanguages = new Set(languages.map(lang => lang.toLowerCase()));
}

/**
 * Parses image alt text for pipe syntax.
 * If alt text ends with "|thumbnail", returns the text before the suffix
 * and indicates thumbnail mode. Otherwise returns the full alt text.
 *
 * @param {string} altText - The raw alt text from markdown
 * @returns {{ alt: string, isThumbnail: boolean }}
 */
export function parseImageAlt(altText) {
  const suffix = '|thumbnail';

  if (!altText) {
    return { alt: '', isThumbnail: false };
  }

  if (altText.endsWith(suffix)) {
    const alt = altText.slice(0, altText.length - suffix.length);
    return { alt, isThumbnail: true };
  }

  return { alt: altText, isThumbnail: false };
}

/**
 * Render a markdown string to HTML using marked.js with syntax highlighting
 * for fenced code blocks via highlight.js.
 *
 * - If a code block has a supported language identifier, highlight.js is used.
 * - If the language identifier is missing or unsupported, the code is rendered
 *   as plain preformatted text with no highlighting.
 * - All whitespace, indentation, and line breaks are preserved in code blocks.
 *
 * @param {string} markdown - The markdown string to render
 * @returns {string} The rendered HTML string
 */
export function renderMarkdown(markdown) {
  const instance = new Marked();

  instance.use({
    renderer: {
      table(token) {
        // Wrap tables in a scrollable container for mobile
        const header = token.header.map(cell => {
          const align = cell.align ? ` style="text-align:${cell.align}"` : '';
          return `<th${align}>${this.parser.parseInline(cell.tokens)}</th>`;
        }).join('');

        const body = token.rows.map(row => {
          const cells = row.map(cell => {
            const align = cell.align ? ` style="text-align:${cell.align}"` : '';
            return `<td${align}>${this.parser.parseInline(cell.tokens)}</td>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('');

        return `<div class="table-wrapper"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>\n`;
      },
      code({ text, lang }) {
        const language = lang ? lang.toLowerCase() : '';
        const isSupported = language && registeredLanguages.has(language);

        if (isSupported) {
          try {
            const highlighted = hljs.highlight(text, { language }).value;
            return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>\n`;
          } catch (e) {
            // If highlighting fails, fall through to plain text rendering
          }
        }

        // Render as plain preformatted text (no highlighting)
        const escaped = escapeHtml(text);
        return `<pre><code>${escaped}</code></pre>\n`;
      },
      image(token) {
        const { alt, isThumbnail } = parseImageAlt(token.text || '');
        const escapedAlt = escapeHtml(alt);
        const src = token.href || '';
        const titleAttr = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        const classAttr = isThumbnail ? ' class="lightbox-thumbnail"' : '';

        return `<img src="${src}" alt="${escapedAlt}"${classAttr}${titleAttr}>`;
      }
    }
  });

  return instance.parse(markdown);
}

/**
 * Escape HTML special characters to prevent XSS and ensure
 * code content displays correctly.
 *
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
