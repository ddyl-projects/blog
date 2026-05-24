/**
 * Generates a URL slug from a markdown file path.
 *
 * Algorithm:
 * 1. Remove `.md` extension
 * 2. Convert to lowercase
 * 3. Replace spaces and consecutive special characters with a single hyphen
 * 4. Remove non-alphanumeric characters (except hyphens and forward slashes)
 * 5. Collapse consecutive hyphens into one
 * 6. Trim leading/trailing hyphens from each path segment
 *
 * @param {string} filePath - The file path to convert (e.g., "posts/My First Article.md")
 * @returns {string} The generated slug (e.g., "posts/my-first-article")
 */
export function generateSlug(filePath) {
  return filePath
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^a-z0-9\-\/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .split('/')
    .map(segment => segment.replace(/^-+|-+$/g, ''))
    .join('/');
}
