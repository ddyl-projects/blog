# Requirements Document

## Introduction

A simple technical web blog designed to be hosted on GitHub Pages. The blog uses markdown files stored in a GitHub repository as the content source for all articles. Articles are discovered and rendered dynamically at runtime using client-side JavaScript, meaning no rebuild or redeployment is needed when adding new content — the author simply pushes a new markdown file to the repository. The framework provides a clean reading experience for technical content including code snippets, and requires minimal configuration to get started.

## Glossary

- **Blog_Application**: The client-side web application that dynamically discovers, fetches, and renders markdown articles from the GitHub repository at runtime
- **Article**: A single blog post written as a markdown file containing front matter metadata and content, stored in the GitHub repository
- **Front_Matter**: YAML metadata at the top of each markdown file defining properties such as title, date, tags, and description
- **Content_Directory**: The directory (posts/) in the repository where article markdown files are stored, including all nested subdirectories
- **Article_Index**: The main page listing all discovered articles in reverse chronological order
- **Tag**: A categorization label assigned to articles via front matter to enable content grouping
- **Code_Block**: A fenced code section within an article that receives syntax highlighting in the rendered output
- **Article_Manifest**: A JSON file listing all available articles and their metadata, generated via a GitHub Actions workflow whenever content changes, enabling the client to discover articles without crawling the repository
- **Client_Renderer**: The client-side JavaScript module responsible for fetching markdown files from the repository and converting them to formatted HTML in the browser

## Requirements

### Requirement 1: Article Authoring

**User Story:** As a blog author, I want to write articles in markdown files with structured metadata, so that I can focus on content without dealing with HTML.

#### Acceptance Criteria

1. WHEN an article markdown file contains valid Front_Matter delimited by `---` lines with title (string, 1-200 characters), date (ISO 8601 format: YYYY-MM-DD), and description (string, 1-500 characters) fields, THE Client_Renderer SHALL parse the Front_Matter into metadata fields used for rendering
2. WHEN an article markdown file contains markdown content below the front matter, THE Client_Renderer SHALL convert the markdown content into formatted HTML displayed in the browser
3. IF an article markdown file is missing required front matter fields (title or date), THEN THE Blog_Application SHALL exclude that article from the Article_Index and display a console warning identifying the file path and listing each missing field by name
4. IF an article markdown file contains malformed YAML in the Front_Matter block, THEN THE Blog_Application SHALL exclude that article from the Article_Index and display a console warning identifying the file path and indicating the YAML is unparseable
5. THE Blog_Application SHALL support an optional tags field in the Front_Matter as a list of 1 to 10 strings (each tag 1-50 characters) and an optional description field as a string (1-500 characters)

### Requirement 2: Article Storage Structure

**User Story:** As a blog author, I want a clear directory structure for storing articles with support for subdirectories, so that I can organize my content by topic or category.

#### Acceptance Criteria

1. THE Blog_Application SHALL discover article files with the .md extension from the Content_Directory (posts/) at the root of the repository
2. WHEN a new .md file is pushed to the Content_Directory in the repository, THE Blog_Application SHALL include the new article on the next page load without requiring a site rebuild or redeployment
3. THE Blog_Application SHALL generate URL slugs from article file paths by converting to lowercase, replacing spaces and consecutive special characters with a single hyphen, removing non-alphanumeric characters (except hyphens and forward slashes), and stripping the .md extension
4. IF the Content_Directory contains files without a .md extension, THEN THE Blog_Application SHALL ignore those files without producing an error
5. THE Blog_Application SHALL recursively discover and process .md files in all nested subdirectories within the Content_Directory (posts/)

### Requirement 3: Dynamic Client-Side Rendering

**User Story:** As a blog author, I want my articles rendered dynamically in the browser, so that I can publish new content by simply pushing a markdown file to GitHub without triggering a rebuild.

#### Acceptance Criteria

1. WHEN a reader navigates to the blog, THE Client_Renderer SHALL fetch the Article_Manifest and display the Article_Index page listing all available articles
2. WHEN a reader navigates to an article page, THE Client_Renderer SHALL fetch the corresponding markdown file from the GitHub repository and render it as formatted HTML in the browser
3. THE Blog_Application SHALL serve a single set of static HTML, CSS, and JavaScript files that do not change when articles are added or modified
4. THE Client_Renderer SHALL parse Front_Matter from fetched markdown files and use the metadata to render article titles, dates, tags, and descriptions
5. THE Blog_Application SHALL include a base HTML layout with navigation containing at minimum a link to the Article_Index page
6. THE Blog_Application SHALL generate all internal navigation links as relative paths or client-side routes so the site is servable from any directory root without configuration

### Requirement 4: Code Syntax Highlighting

**User Story:** As a technical blog author, I want code blocks in my articles to have syntax highlighting, so that code examples are readable and professional.

#### Acceptance Criteria

1. WHEN an article contains a fenced code block with a language identifier, THE Client_Renderer SHALL apply syntax highlighting by wrapping distinct token types (keywords, strings, comments, numbers, and operators) in styled elements that render in visually distinguishable colors
2. WHEN an article contains a fenced code block without a language identifier, THE Client_Renderer SHALL render the code block as plain preformatted text preserving all original whitespace, indentation, and line breaks
3. THE Client_Renderer SHALL support syntax highlighting for at minimum the following languages: JavaScript, Python, TypeScript, HTML, CSS, and Bash
4. IF an article contains a fenced code block with a language identifier that is not supported, THEN THE Client_Renderer SHALL render the code block as plain preformatted text

### Requirement 5: GitHub Pages Deployment and Article Discovery

**User Story:** As a blog author, I want articles to appear automatically after pushing markdown files to GitHub, so that publishing requires no manual build or deploy step.

#### Acceptance Criteria

1. THE Blog_Application SHALL include a GitHub Actions workflow file in the .github/workflows/ directory that triggers on push events to the main branch when files in the Content_Directory are added, modified, or removed
2. WHEN the GitHub Actions workflow is triggered, THE workflow SHALL scan the Content_Directory recursively, extract Front_Matter metadata from all valid .md files, and generate an updated Article_Manifest JSON file committed to the repository
3. THE Article_Manifest SHALL contain for each article: the file path relative to the repository root, title, date, description, and tags extracted from Front_Matter
4. THE Blog_Application static files (HTML, CSS, JavaScript) SHALL be deployed to GitHub Pages and remain unchanged when new articles are added — only the Article_Manifest is regenerated
5. IF the GitHub Actions workflow encounters a markdown file with invalid or missing Front_Matter, THEN THE workflow SHALL exclude that file from the Article_Manifest and log a warning identifying the file path

### Requirement 6: Responsive Design and Styling

**User Story:** As a blog reader, I want the blog to be readable on any device, so that I can read articles on desktop or mobile.

#### Acceptance Criteria

1. THE Blog_Application SHALL include a CSS stylesheet that provides responsive layout adapting to screen widths from 320px to 1920px, ensuring content is displayed without horizontal scrolling and without text or images being clipped at any width within that range
2. THE Blog_Application SHALL apply typography with a base font size between 16px and 20px, a line height between 1.5 and 1.8, and a maximum content width between 640px and 780px to support readability of long-form technical content
3. THE Blog_Application SHALL style the Article_Index page with article titles, dates, and descriptions for each entry
4. WHEN a Code_Block is rendered on a screen narrower than 768px, THE Blog_Application SHALL allow horizontal scrolling within the code block rather than overflowing the page layout

### Requirement 7: Tag-Based Navigation

**User Story:** As a blog reader, I want to browse articles by tag, so that I can find related content on topics I'm interested in.

#### Acceptance Criteria

1. WHEN an article has tags defined in its Front_Matter, THE Blog_Application SHALL display each tag as a clickable link that navigates to the corresponding tag view
2. THE Blog_Application SHALL provide a tag view for each unique tag listing all articles with that tag
3. WHEN a reader navigates to a tag view, THE Blog_Application SHALL display all articles associated with that tag sorted by date in descending order, showing each article's title, date, and description
4. THE Blog_Application SHALL provide a tag index view listing all unique tags that link to their respective tag views

### Requirement 8: Development and Local Preview

**User Story:** As a blog author, I want a simple way to preview my blog locally, so that I can verify articles render correctly before pushing.

#### Acceptance Criteria

1. THE Blog_Application SHALL provide a development mode (via npm script named "dev") that serves the site locally with a local development server
2. WHEN the development server starts, THE Blog_Application SHALL serve the site on a local port and log the local URL to the console
3. THE Blog_Application SHALL provide an npm script named "build-manifest" that generates the Article_Manifest locally for testing purposes
4. WHEN the "build-manifest" script is executed, THE Blog_Application SHALL scan the Content_Directory recursively and output the Article_Manifest JSON file to the project root
