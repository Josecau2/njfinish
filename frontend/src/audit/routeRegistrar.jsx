import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route Registrar for Development
 *
 * Tracks visited routes during development to help identify routes
 * missing from the audit manifest. Only active in DEV builds.
 */
export function UseRouteRegistrar() {
  const location = useLocation();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    // Initialize global audit log once
    if (!window.__AUDIT__) {
      window.__AUDIT__ = [];
    }

    // Skip logging audit tooling routes to avoid noise
    if (location.pathname.includes('__audit__')) {
      return;
    }

    window.__AUDIT__.push({
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      ts: Date.now(),
    });

    // Helpful dev log for quick awareness
    console.log('[Route Registrar]', location.pathname);

    if (!window.__AUDIT_EXPORT__) {
      window.__AUDIT_EXPORT__ = () => {
        const uniquePaths = [...new Set(window.__AUDIT__.map((entry) => entry.path))];
        console.log('=== Visited Routes ===');
        console.log(JSON.stringify(uniquePaths, null, 2));
        return uniquePaths;
      };
      console.log('[Route Registrar] Call window.__AUDIT_EXPORT__() in devtools to export visited routes');
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
}

export default UseRouteRegistrar;