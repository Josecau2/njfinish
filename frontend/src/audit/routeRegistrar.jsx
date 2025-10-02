import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route Registrar for Development
 *
 * Tracks all visited routes during development to help identify
 * routes that may be missing from the audit manifest.
 *
 * Usage: Mount once near Router root in App.jsx
 */
export function UseRouteRegistrar() {
  const loc = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      // Initialize audit tracking array if it doesn't exist
      if (!window.__AUDIT__) {
        window.__AUDIT__ = [];
      }

      // Don't track audit routes themselves
      if (loc.pathname.includes('__audit__')) {
        return;
      }

      // Record the route visit
      window.__AUDIT__.push({
        path: loc.pathname,
        ts: Date.now(),
        search: loc.search,
        hash: loc.hash
      });

      // Log to console for visibility
      console.log('[Route Registrar]', loc.pathname);

      // Provide utility to export visited routes
      if (!window.__AUDIT_EXPORT__) {
        window.__AUDIT_EXPORT__ = () => {
          const uniquePaths = [...new Set(window.__AUDIT__.map(r => r.path))];
          console.log('=== Visited Routes ===');
          console.log(JSON.stringify(uniquePaths, null, 2));
          return uniquePaths;
        };
        console.log('[Route Registrar] Call window.__AUDIT_EXPORT__() to export visited routes');
      }
    }
  }, [loc.pathname, loc.search, loc.hash]);

  return null;
}

export default UseRouteRegistrar;
