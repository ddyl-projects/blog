# Requirements Document

## Introduction

A simple technical web blog designed to be hosted on GitHub Pages. The blog uses markdown files stored in a GitHub repository as the content source for all articles. Articles are discovered and rendered dynamically at runtime using client-side JavaScript, meaning no rebuild or redeployment is needed when adding new content — the author simply pushes a new markdown file to the repository. The site features a modern, clean layout with a right-hand side menu for navigation, a main content area, and an introduction page. The framework provides a fresh reading experience for technical content including code snippets, uses a grey and white color palette, and requires minimal configuration to get started.

## Glossary

- **Blog_Application**: The client-side web application that dynamically discovers, fetches, and renders markdown articles from the GitHub repository at runtime
- **Article**: A single blog post written as a markdown file containing front matter metadata and content, stored in the GitHub repository
- **Front_Matter**: YAML metadata at the top of each markdown file defining properties such as title, date, author, tags, and description
- **Content_Directory**: The directory (posts/) in the repository where article markdown files are stored, including all nested subdirectories
- **Article_Index**: A dedicated page listing all discovered articles in reverse chronological order, accessible via the menu index link
- **Side_Menu**: The right-hand side navigation panel displaying the 10 latest articles and an index link
- **Introduction_Page**: The main landing page of the blog, rendered from an intro.md file stored in the repository root
- **Code_Block**: A fenced code section within an article that receives syntax highlighting in the rendered output
- **Article_Manifest**: A JSON file listing all available articles and their metadata, generated via a GitHub Actions workflow whenever content changes, enabling the client to discover articles without crawling the repository
- **Client_Renderer**: The client-side JavaScript module responsible for fetching markdown files from the repository and converting them to formatted HTML in the browser
- **Page_Layout**: The four-section structure of the website consisting of a header, right-side menu bar, footer, and content area

## Requirements

### Requirement 1: Article Authoring

**User Story:** As a blog author, I want to write articles in markdown files with structured metadata, so that I can focus on content without dealing with HTML.

#### Acceptance Criteria

1. WHEN an article markdown file contains valid Front_Matter delimited by `---` lines with title (string, 1-200 characters), date (ISO 8601 format: YYYY-MM-DD), author (string, 1-100 characters), and description (string, 1-500 characters) fields, THE Client_Renderer SHALL parse the Front_Matter into metadata fields used for rendering
2. WHEN an article markdown file contains markdown content below the front matter, THE Client_Renderer SHALL convert the markdown content into formatted HTML displayed in the browser
3. IF an article markdown file is missing required front matter fields (title, date, or author), THEN THE Blog_Application SHALL exclude that article from the Article_Index and display a console warning identifying the file path and listing each missing field by name
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

1. WHEN a reader navigates to the blog, THE Client_Renderer SHALL fetch the Article_Manifest and display the Introduction_Page as the main landing page
2. WHEN a reader navigates to an article page, THE Client_Renderer SHALL fetch the corresponding markdown file from the GitHub repository and render it as formatted HTML in the content area
3. THE Blog_Application SHALL serve a single set of static HTML, CSS, and JavaScript files that do not change when articles are added or modified
4. THE Client_Renderer SHALL parse Front_Matter from fetched markdown files and use the metadata to render article titles, author names, dates, and descriptions
5. THE Blog_Application SHALL generate all internal navigation links as relative paths or client-side routes so the site is servable from any directory root without configuration

### Requirement 4: Article Display

**User Story:** As a blog reader, I want each article to show the author and date, so that I know who wrote it and when.

#### Acceptance Criteria

1. WHEN an article is rendered, THE Client_Renderer SHALL display the author name extracted from the Front_Matter in a visible position above or below the article title
2. WHEN an article is rendered, THE Client_Renderer SHALL display the date extracted from the Front_Matter in a human-readable format (e.g., "January 15, 2024") in a visible position near the article title
3. THE Client_Renderer SHALL sort articles by date in descending order (newest first) in all listing views including the Side_Menu and the Article_Index

### Requirement 5: Side Menu Navigation

**User Story:** As a blog reader, I want a right-hand side menu showing the latest articles and an index link, so that I can quickly navigate to recent content or browse all articles.

#### Acceptance Criteria

1. THE Blog_Application SHALL display a Side_Menu on the right-hand side of the Page_Layout on all pages
2. THE Side_Menu SHALL display the 10 most recent articles sorted by date in descending order, showing each article title as a clickable link that navigates to the corresponding article page
3. THE Side_Menu SHALL display an index link that navigates to the Article_Index page containing a list of all articles sorted by date in descending order
4. WHEN a new article is added to the Article_Manifest, THE Side_Menu SHALL include the new article in the list on the next page load if it is among the 10 most recent articles by date
5. WHEN the screen width is less than 768px, THE Side_Menu SHALL collapse or reposition to maintain usability on smaller screens

### Requirement 6: Introduction Page

**User Story:** As a blog author, I want a main introduction page rendered from a markdown file, so that I can welcome visitors and describe the blog's purpose.

#### Acceptance Criteria

1. THE Blog_Application SHALL render the Introduction_Page from a file named intro.md located in the repository root directory
2. WHEN a reader navigates to the blog root URL, THE Client_Renderer SHALL fetch and render the intro.md file as formatted HTML in the content area
3. IF the intro.md file is missing from the repository root, THEN THE Blog_Application SHALL display a default message indicating no introduction content is available
4. WHEN the intro.md file is updated in the repository, THE Blog_Application SHALL display the updated content on the next page load without requiring a site rebuild

### Requirement 7: Page Layout Structure

**User Story:** As a blog reader, I want a well-structured page layout with distinct sections, so that I can easily identify navigation, content, and supplementary information.

#### Acceptance Criteria

1. THE Blog_Application SHALL structure the Page_Layout with four distinct sections: a header at the top, a content area as the main section, a Side_Menu on the right side, and a footer at the bottom
2. THE header section SHALL display the blog title and remain fixed at the top of the page across all views
3. THE content area SHALL occupy the primary space of the page and display the Introduction_Page, individual articles, or the Article_Index depending on the current route
4. THE footer section SHALL remain at the bottom of the page and display basic site information

### Requirement 8: Visual Styling

**User Story:** As a blog reader, I want a modern, fresh visual design with a clean color palette, so that the reading experience is pleasant and professional.

#### Acceptance Criteria

1. THE Blog_Application SHALL use a color palette consisting of different tones of grey and white for the page sections, with the content area using a white or near-white background and the header, Side_Menu, and footer using distinct grey tones to create visual separation
2. THE Blog_Application SHALL use a font family suitable for a technical blog (such as a sans-serif system font stack or a monospace-accented combination) with a base font size between 16px and 20px and a line height between 1.5 and 1.8
3. THE Blog_Application SHALL apply a maximum content width between 640px and 780px for article text to support readability of long-form technical content
4. THE Blog_Application SHALL style the Article_Index page with article titles, author names, dates, and descriptions for each entry
5. THE Blog_Application SHALL present a modern, clean aesthetic with adequate whitespace, clear typographic hierarchy, and minimal visual clutter

### Requirement 9: Responsive Design

**User Story:** As a blog reader, I want the blog to be readable on any device, so that I can read articles on desktop, tablet, or mobile.

#### Acceptance Criteria

1. THE Blog_Application SHALL provide a responsive layout adapting to screen widths from 320px to 1920px, ensuring content is displayed without horizontal scrolling and without text or images being clipped at any width within that range
2. WHEN the screen width is less than 768px, THE Blog_Application SHALL reflow the Page_Layout to a single-column view where the Side_Menu is repositioned above or below the content area
3. WHEN a Code_Block is rendered on a screen narrower than 768px, THE Blog_Application SHALL allow horizontal scrolling within the code block rather than overflowing the page layout
4. THE Blog_Application SHALL ensure all interactive elements (links, navigation items) have a minimum touch target size of 44x44 pixels on screens narrower than 768px

### Requirement 10: Code Syntax Highlighting

**User Story:** As a technical blog author, I want code blocks in my articles to have syntax highlighting, so that code examples are readable and professional.

#### Acceptance Criteria

1. WHEN an article contains a fenced code block with a language identifier, THE Client_Renderer SHALL apply syntax highlighting by wrapping distinct token types (keywords, strings, comments, numbers, and operators) in styled elements that render in visually distinguishable colors
2. WHEN an article contains a fenced code block without a language identifier, THE Client_Renderer SHALL render the code block as plain preformatted text preserving all original whitespace, indentation, and line breaks
3. THE Client_Renderer SHALL support syntax highlighting for at minimum the following languages: JavaScript, Python, TypeScript, HTML, CSS, and Bash
4. IF an article contains a fenced code block with a language identifier that is not supported, THEN THE Client_Renderer SHALL render the code block as plain preformatted text

### Requirement 11: GitHub Pages Deployment and Article Discovery

**User Story:** As a blog author, I want articles to appear automatically after pushing markdown files to GitHub, so that publishing requires no manual build or deploy step.

#### Acceptance Criteria

1. THE Blog_Application SHALL include a GitHub Actions workflow file in the .github/workflows/ directory that triggers on push events to the main branch when files in the Content_Directory are added, modified, or removed
2. WHEN the GitHub Actions workflow is triggered, THE workflow SHALL scan the Content_Directory recursively, extract Front_Matter metadata from all valid .md files, and generate an updated Article_Manifest JSON file committed to the repository
3. THE Article_Manifest SHALL contain for each article: the file path relative to the repository root, title, date, author, description, and tags extracted from Front_Matter
4. THE Blog_Application static files (HTML, CSS, JavaScript) SHALL be deployed to GitHub Pages and remain unchanged when new articles are added — only the Article_Manifest is regenerated
5. IF the GitHub Actions workflow encounters a markdown file with invalid or missing Front_Matter, THEN THE workflow SHALL exclude that file from the Article_Manifest and log a warning identifying the file path

### Requirement 12: Development and Local Preview

**User Story:** As a blog author, I want a simple way to preview my blog locally, so that I can verify articles render correctly before pushing.

#### Acceptance Criteria

1. THE Blog_Application SHALL provide a development mode (via npm script named "dev") that serves the site locally with a local development server
2. WHEN the development server starts, THE Blog_Application SHALL serve the site on a local port and log the local URL to the console
3. THE Blog_Application SHALL provide an npm script named "build-manifest" that generates the Article_Manifest locally for testing purposes
4. WHEN the "build-manifest" script is executed, THE Blog_Application SHALL scan the Content_Directory recursively and output the Article_Manifest JSON file to the project root
