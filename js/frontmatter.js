import yaml from 'js-yaml';

/**
 * Parses YAML front matter from a raw markdown string.
 * Front matter is delimited by `---` lines at the start of the file.
 *
 * @param {string} rawMarkdown - The raw markdown string containing front matter
 * @returns {{ frontMatter: object | null, content: string }} Parsed front matter and remaining content
 */
export function parseFrontMatter(rawMarkdown) {
  if (typeof rawMarkdown !== 'string') {
    return { frontMatter: null, content: '' };
  }

  const trimmed = rawMarkdown.trimStart();

  if (!trimmed.startsWith('---')) {
    return { frontMatter: null, content: rawMarkdown };
  }

  // Find the closing `---` delimiter (must be on its own line after the opening)
  const closingIndex = trimmed.indexOf('\n---', 3);

  if (closingIndex === -1) {
    return { frontMatter: null, content: rawMarkdown };
  }

  const yamlBlock = trimmed.slice(3, closingIndex).trim();
  // Content starts after the closing `---` and its newline
  const contentStart = closingIndex + 4; // length of '\n---'
  let content = trimmed.slice(contentStart);

  // Remove leading newline from content if present
  if (content.startsWith('\n')) {
    content = content.slice(1);
  } else if (content.startsWith('\r\n')) {
    content = content.slice(2);
  }

  try {
    const frontMatter = yaml.load(yamlBlock);

    if (frontMatter === null || typeof frontMatter !== 'object') {
      return { frontMatter: null, content: rawMarkdown };
    }

    return { frontMatter, content };
  } catch (e) {
    // Malformed YAML — return null frontMatter
    return { frontMatter: null, content: rawMarkdown };
  }
}

/**
 * Validates a front matter object against the required schema.
 *
 * Required fields:
 * - title: string, 1-200 characters
 * - date: string, ISO 8601 format (YYYY-MM-DD)
 * - author: string, 1-100 characters
 *
 * Optional fields:
 * - description: string, 1-500 characters
 * - tags: array of 1-10 strings, each 1-50 characters
 *
 * @param {Record<string, unknown>} fm - The front matter object to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateFrontMatter(fm) {
  const errors = [];

  if (!fm || typeof fm !== 'object') {
    return { valid: false, errors: ['Front matter must be a non-null object'] };
  }

  // Validate title (required, string, 1-200 chars)
  if (fm.title === undefined || fm.title === null) {
    errors.push('Missing required field: title');
  } else if (typeof fm.title !== 'string') {
    errors.push('Field "title" must be a string');
  } else if (fm.title.length < 1 || fm.title.length > 200) {
    errors.push('Field "title" must be between 1 and 200 characters');
  }

  // Validate date (required, ISO 8601 YYYY-MM-DD)
  if (fm.date === undefined || fm.date === null) {
    errors.push('Missing required field: date');
  } else if (typeof fm.date !== 'string') {
    errors.push('Field "date" must be a string');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) {
    errors.push('Field "date" must be in ISO 8601 format (YYYY-MM-DD)');
  } else {
    // Validate that the date is actually a valid calendar date
    const [year, month, day] = fm.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      errors.push('Field "date" must be a valid calendar date');
    }
  }

  // Validate author (required, string, 1-100 chars)
  if (fm.author === undefined || fm.author === null) {
    errors.push('Missing required field: author');
  } else if (typeof fm.author !== 'string') {
    errors.push('Field "author" must be a string');
  } else if (fm.author.length < 1 || fm.author.length > 100) {
    errors.push('Field "author" must be between 1 and 100 characters');
  }

  // Validate description (optional, string, 1-500 chars)
  if (fm.description !== undefined && fm.description !== null) {
    if (typeof fm.description !== 'string') {
      errors.push('Field "description" must be a string');
    } else if (fm.description.length < 1 || fm.description.length > 500) {
      errors.push('Field "description" must be between 1 and 500 characters');
    }
  }

  // Validate tags (optional, array of 1-10 strings, each 1-50 chars)
  if (fm.tags !== undefined && fm.tags !== null) {
    if (!Array.isArray(fm.tags)) {
      errors.push('Field "tags" must be an array');
    } else if (fm.tags.length < 1 || fm.tags.length > 10) {
      errors.push('Field "tags" must contain between 1 and 10 items');
    } else {
      for (let i = 0; i < fm.tags.length; i++) {
        if (typeof fm.tags[i] !== 'string') {
          errors.push(`Tag at index ${i} must be a string`);
        } else if (fm.tags[i].length < 1 || fm.tags[i].length > 50) {
          errors.push(`Tag at index ${i} must be between 1 and 50 characters`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
