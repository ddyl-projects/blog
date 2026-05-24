# Implementation Plan: Technical Blog

## Overview

Implement a client-side technical blog hosted on GitHub Pages. The blog uses vanilla JavaScript with ES modules, fetches markdown articles from a GitHub repository at runtime, and renders them with syntax highlighting. A GitHub Actions workflow generates an article manifest for content discovery. The implementation follows an incremental approach: core utilities first, then components, then integration and wiring. Tag filtering on the Article Index page allows readers to filter articles by popular tags.

## Tasks

- [x] 1. Set up project structure and core configuration
  - [x] 1.1 Create project directory structure, HTML entry point, and package.json
    - Create `index.html` with the four-section page layout (header, content area, side menu, footer), `<noscript>` fallback message, and cache-control meta tags (Cache-Control: no-cache, no-store, must-revalidate; Pragma: no-cache; Expires: 0)
    - Create `package.json` with dependencies (marked, highlight.js, js-yaml) and dev dependencies (fast-check, vitest, jsdom, vite), npm scripts (dev, test, test:properties, test:unit, test:coverage, build-manifest)
    - Create `vitest.config.js` with jsdom environment for DOM testing
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 12.1, 13.1_

  - [x] 1.2 Create CSS styles with responsive layout and visual design
    - Create `css/styles.css` with grey/white color palette, responsive layout (breakpoint at 768px), typography (sans-serif stack, 16-20px base font, 1.5-1.8 line height), max content width 640-780px
    - Implement forced vertical scrollbar (`overflow-y: scroll` on html element) for layout stability
    - Implement code block horizontal scrolling on narrow screens
    - Implement single-column reflow below 768px with side menu repositioned
    - Ensure minimum 44x44px touch targets for interactive elements on narrow screens
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 9.1, 9.2, 9.3, 9.4, 15.1_

- [x] 2. Implement core utilities and parsers
  - [x] 2.1 Implement slug generation utility (`js/utils/slug.js`)
    - Implement `generateSlug(filePath)` function: remove `.md` extension, convert to lowercase, replace spaces and consecutive special characters with single hyphen, remove non-alphanumeric characters (except hyphens and forward slashes), collapse consecutive hyphens, trim leading/trailing hyphens from each path segment
    - _Requirements: 2.3_

  - [x]* 2.2 Write property test for slug generation
    - **Property 3: Slug generation invariants**
    - **Validates: Requirements 2.3**

  - [x] 2.3 Implement front matter parser (`js/frontmatter.js`)
    - Implement `parseFrontMatter(rawMarkdown)` that extracts YAML between `---` delimiters using js-yaml and returns `{ frontMatter, content }`
    - Implement `validateFrontMatter(fm)` that checks required fields (title 1-200 chars, date ISO 8601 YYYY-MM-DD, author 1-100 chars), optional fields (description 1-500 chars, tags 1-10 items each 1-50 chars), and returns `{ valid, errors }`
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x]* 2.4 Write property test for front matter round-trip parsing
    - **Property 1: Front matter round-trip parsing**
    - **Validates: Requirements 1.1**

  - [x]* 2.5 Write property test for front matter validation
    - **Property 2: Front matter validation rejects invalid metadata**
    - **Validates: Requirements 1.3, 1.5, 11.5**

  - [x] 2.6 Implement markdown renderer (`js/renderer.js`)
    - Implement `renderMarkdown(markdown)` using marked.js with a custom renderer that integrates highlight.js for fenced code blocks with language identifiers
    - Implement `configureHighlighting(languages)` to register supported languages (JavaScript, Python, TypeScript, HTML, CSS, Bash)
    - Render unsupported or missing language identifiers as plain preformatted text preserving whitespace, indentation, and line breaks
    - _Requirements: 1.2, 10.1, 10.2, 10.3, 10.4_

  - [x]* 2.7 Write property test for syntax highlighting
    - **Property 10: Syntax highlighting produces styled elements**
    - **Validates: Requirements 10.1**

- [x] 3. Checkpoint - Core utilities
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement manifest loader and routing
  - [x] 4.1 Implement manifest loader (`js/manifest.js`)
    - Implement `loadManifest()` that fetches `article-manifest.json` with retry logic (exponential backoff, max 3 attempts)
    - Implement `getLatestArticles(count)`, `getArticleBySlug(slug)`, `getAllArticlesSorted()`, and `sortByDateDescending(articles)` functions
    - Sort articles by date descending in all listing functions
    - Display error message "Unable to load articles" if manifest fetch fails after retries
    - _Requirements: 3.1, 4.3, 5.2, 5.5_

  - [x]* 4.2 Write property test for article sorting
    - **Property 4: Article sorting is descending by date**
    - **Validates: Requirements 4.3**

  - [x]* 4.3 Write property test for side menu selection
    - **Property 5: Side menu selects correct top-N articles**
    - **Validates: Requirements 5.2**

  - [x] 4.4 Implement hash-based router (`js/router.js`)
    - Implement `initRouter(routes)` that listens to `hashchange` events and matches routes (`#/`, `#/article/:slug`, `#/index`)
    - Implement `navigate(path)` for programmatic navigation and `getCurrentRoute()` for state inspection
    - Redirect unknown routes to root (`#/`) to display the introduction page
    - Generate all internal navigation links as relative hash-based routes
    - _Requirements: 3.5_

  - [x]* 4.5 Write property test for navigation links
    - **Property 8: Navigation links are valid hash routes**
    - **Validates: Requirements 3.5**

- [x] 5. Implement page components
  - [x] 5.1 Implement header and footer components (`js/components/header.js`, `js/components/footer.js`)
    - Header displays logo image from `assets/images/logo.png` aligned left, header height 150px with logo scaled to fit
    - Footer displays "© [current year] Damian Dyl. All rights reserved." positioned at bottom
    - _Requirements: 7.2, 7.4_

  - [x] 5.2 Implement side menu component (`js/components/sidemenu.js`)
    - Implement `renderSideMenu(articles)` that displays "Home" link at top, up to 10 most recent articles as clickable links sorted by date descending, and an "Index" link navigating to the Article_Index
    - Implement `updateSideMenu(articles)` for refreshing the menu when manifest updates
    - Ensure responsive behavior: collapse/reposition below 768px
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.3 Implement introduction page component (`js/components/intro.js`)
    - Fetch and render `intro.md` from repository root using the markdown renderer
    - Display default welcome message ("No introduction content is available") if `intro.md` is missing or fetch fails
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.4 Implement article view component (`js/components/article.js`)
    - Fetch raw markdown from repository, parse front matter, render content with syntax highlighting
    - Display title, author, date (human-readable format like "January 15, 2024"), and description
    - Implement `formatDate(isoDateString)` to convert ISO dates to human-readable format with full month name, day, and four-digit year
    - Display error message with link back to index if article fetch fails
    - _Requirements: 3.2, 3.4, 4.1, 4.2_

  - [x] 5.5 Implement linked document handling in article component
    - Implement `attachMdLinkHandlers(container, currentHash)` to intercept clicks on relative `.md` links within rendered articles
    - Implement `renderLinkedMd(mdPath, backHash)` to fetch and render linked markdown inline with a "← Back" button
    - Do NOT intercept external links (those starting with `http://` or `https://`)
    - Display error message with "← Back" button if linked document fetch fails or returns HTML
    - _Requirements: 14.1, 14.2, 14.3_

  - [x]* 5.6 Write property test for date formatting
    - **Property 6: Date formatting produces human-readable output**
    - **Validates: Requirements 4.2**

  - [x]* 5.7 Write property test for rendered article metadata
    - **Property 7: Rendered article metadata is present in output**
    - **Validates: Requirements 3.4, 8.4**

  - [x] 5.8 Implement article index page component (`js/components/index-page.js`)
    - List all articles sorted by date descending with title, author, formatted date, and description
    - Each article title links to the article page via hash route
    - _Requirements: 4.3, 8.4_

- [x] 6. Checkpoint - Components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement manifest builder and GitHub Actions
  - [x] 7.1 Implement manifest build script (`scripts/build-manifest.js`)
    - Node.js script that recursively scans `posts/` for `.md` files
    - Extract front matter, validate required fields (title, date, author), generate slugs using the slug utility
    - Write `article-manifest.json` with `generatedAt` timestamp and articles array (path, title, date, author, description, tags, slug)
    - Skip files with invalid/missing front matter and log warnings with file paths and missing field names
    - Ignore non-.md files without error
    - Exit with non-zero code if manifest file cannot be written
    - _Requirements: 2.1, 2.4, 2.5, 11.2, 11.3, 11.5, 12.3, 12.4_

  - [x]* 7.2 Write property test for manifest builder
    - **Property 9: Manifest builder produces correct entries for valid files**
    - **Validates: Requirements 11.2, 11.3**

  - [x] 7.3 Create GitHub Actions workflow (`.github/workflows/build-manifest.yml`)
    - Trigger on push to main branch when files in `posts/` are added, modified, or removed
    - Run the build-manifest script and commit the updated `article-manifest.json` to the repository
    - _Requirements: 11.1, 11.2, 11.4_

- [x] 8. Wire everything together
  - [x] 8.1 Implement app entry point (`js/app.js`)
    - Initialize router with route definitions (`#/` → intro, `#/article/:slug` → article, `#/index` → index page)
    - Load manifest on startup, render header, footer, and side menu
    - Handle loading states and error display
    - _Requirements: 3.1, 3.3, 3.5_

  - [x] 8.2 Set up Vite development server configuration
    - Configure Vite as the local dev server via the "dev" npm script
    - Ensure the server logs the local URL to the console on startup
    - _Requirements: 12.1, 12.2_

  - [x]* 8.3 Write integration tests for rendering pipeline
    - Test full flow: markdown input → front matter extraction → HTML output with syntax highlighting
    - Test router + component integration: route changes trigger correct renders
    - Test linked document flow: click interception → fetch → inline render → back button navigation
    - _Requirements: 1.2, 3.2, 3.4, 14.1, 14.2_

- [x] 9. Make logo non-clickable
  - [x] 9.1 Remove anchor tag wrapping the logo in header component
    - Update `js/components/header.js` to render the logo as a plain `<img>` element without an `<a>` wrapper
    - Update `index.html` to remove the anchor tag around the logo in the static HTML
    - _Requirements: 16.1_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement tag filtering on Article Index
  - [x] 11.1 Implement `getPopularTags()` and `filterByTag()` functions in `js/components/index-page.js`
    - Implement `getPopularTags(articles, maxCount)` that iterates all articles, accumulates tag counts (case-insensitive), sorts by count descending with alphabetical tiebreaker, and returns the top N tags as `TagCount[]` objects (`{ tag, count }`)
    - Implement `filterByTag(articles, tag)` that returns only articles whose `tags` array contains the selected tag (case-insensitive comparison), preserving descending date sort order
    - If `maxCount` is not provided, default to 20
    - _Requirements: 17.1, 17.2, 17.3_

  - [x]* 11.2 Write property test for tag popularity selection
    - **Property 11: Tag popularity selection returns correct top-N tags with counts**
    - **Validates: Requirements 17.1, 17.2**

  - [x]* 11.3 Write property test for tag filtering
    - **Property 12: Tag filtering returns exactly matching articles**
    - **Validates: Requirements 17.3**

  - [x] 11.4 Implement tag bar rendering and interaction in `js/components/index-page.js`
    - Implement `renderTagBar(tags, activeTag)` that returns HTML for the tag bar with tags displayed inline, each showing the tag name and count in parentheses
    - Implement `setTagFilter(tag)` that sets the active tag filter and re-renders the article list
    - Add a "Clear filter" button that appears only when a filter is active
    - Visually distinguish the active tag (e.g., highlighted background, bold text) using an `active` CSS class
    - If no articles have tags, do not render the tag bar
    - If no articles match the active tag, display "No articles found for tag: {tag}" in place of the article list
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [x] 11.5 Update `renderIndexPage()` to integrate tag bar and filtering
    - Modify the existing `renderIndexPage()` function to call `getPopularTags()` and render the tag bar above the article list
    - Wire click handlers on tag items to call `setTagFilter(tag)` and re-render the filtered article list
    - Wire the "Clear filter" button to call `setTagFilter(null)` and restore the full article list
    - Ensure the tag bar uses the `data-tag` attribute on each tag element for event delegation
    - _Requirements: 17.1, 17.3, 17.4, 17.5_

  - [x] 11.6 Add tag bar CSS styles to `css/styles.css`
    - Add styles for `.tag-bar` container (horizontal wrapping layout, spacing, positioned above article list)
    - Add styles for `.tag-item` elements (inline display, padding, border-radius, cursor pointer)
    - Add styles for `.tag-item.active` (highlighted background, bold text for visual distinction)
    - Add styles for `.tag-clear-filter` button (visible only when filter is active)
    - Ensure tag bar is responsive and wraps properly on narrow screens
    - _Requirements: 17.2, 17.4, 17.5_

  - [x]* 11.7 Write unit tests for tag filtering in index page
    - Test tag bar rendering with correct tag counts and order
    - Test active tag visual distinction (active class applied)
    - Test "Clear filter" button presence only when filter is active
    - Test empty results message when no articles match the selected tag
    - Test that tag bar is not rendered when no articles have tags
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses vanilla JavaScript with ES modules — no build step required for content changes
- Libraries (marked.js, highlight.js, js-yaml) are loaded via npm and served by Vite in development
- Tasks 1-10 are completed; tasks 11-12 implement the new tag filtering feature (Requirement 17)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.6"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5", "2.7"] },
    { "id": 3, "tasks": ["4.1", "4.4"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.5", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.8"] },
    { "id": 6, "tasks": ["5.5", "5.6", "5.7", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["8.1", "8.2"] },
    { "id": 9, "tasks": ["8.3", "9.1"] },
    { "id": 10, "tasks": ["11.1", "11.6"] },
    { "id": 11, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 12, "tasks": ["11.5"] },
    { "id": 13, "tasks": ["11.7"] }
  ]
}
```
