/**
 * Hash-based client-side router.
 * Uses window.location.hash for navigation without server-side URL rewriting.
 */

let registeredRoutes = [];
let currentRoute = { path: '', params: {} };

/**
 * Parse a route pattern into a regex and extract parameter names.
 * e.g., "/article/:slug" → { regex: /^\/article\/([^/]+)$/, paramNames: ["slug"] }
 */
function parsePattern(pattern) {
  const paramNames = [];
  const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    // Use (.+) for the last param to support slugs with forward slashes
    return '(.+)';
  });
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

/**
 * Match a path against registered routes.
 * Returns { route, params } if matched, or null if no match.
 */
function matchRoute(path) {
  for (const route of registeredRoutes) {
    const { regex, paramNames } = parsePattern(route.pattern);
    const match = path.match(regex);
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { route, params };
    }
  }
  return null;
}

/**
 * Handle a hash change by resolving the current route and calling its handler.
 */
function handleRouteChange() {
  const hash = window.location.hash || '#/';
  // Strip the leading '#' to get the path
  const path = hash.slice(1) || '/';

  const result = matchRoute(path);

  if (result) {
    currentRoute = { path, params: result.params };
    result.route.handler(result.params);
  } else {
    // Unknown route: redirect to root
    navigate('/');
  }
}

/**
 * Initialize the router with a set of route definitions.
 * Listens to hashchange events and resolves the initial route.
 *
 * @param {Array<{pattern: string, handler: function}>} routes
 */
export function initRouter(routes) {
  registeredRoutes = routes;
  window.addEventListener('hashchange', handleRouteChange);
  // Resolve the initial route
  handleRouteChange();
}

/**
 * Programmatically navigate to a path.
 * Updates the hash which triggers the hashchange listener.
 *
 * @param {string} path - The path to navigate to (without the # prefix)
 */
export function navigate(path) {
  window.location.hash = `#${path}`;
}

/**
 * Get the current route state.
 *
 * @returns {{ path: string, params: Record<string, string> }}
 */
export function getCurrentRoute() {
  return { ...currentRoute, params: { ...currentRoute.params } };
}
