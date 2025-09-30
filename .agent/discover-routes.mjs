import fs from 'fs';
import { glob } from 'glob';

async function discoverRoutes() {
  console.log('🔍 PHASE 1.1: Discovering all routes...');

  const routes = new Set();

  // Strategy 1: Parse route definitions
  const routeFiles = await glob('../frontend/src/**/*{Route,route,Router,router}*.{js,jsx,ts,tsx}');

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Match <Route path="..." patterns
    const routeMatches = content.matchAll(/<Route\s+[^>]*path\s*=\s*["'`]([^"'`]+)["'`]/g);
    for (const match of routeMatches) {
      routes.add(match[1]);
    }

    // Match path: "..." patterns
    const pathMatches = content.matchAll(/path\s*:\s*["'`]([^"'`]+)["'`]/g);
    for (const match of pathMatches) {
      routes.add(match[1]);
    }
  }

  // Strategy 2: Read manifest
  if (fs.existsSync('../AUDIT/manifest.json')) {
    const manifest = JSON.parse(fs.readFileSync('../AUDIT/manifest.json', 'utf8'));
    manifest.routes?.forEach(r => routes.add(r.path));
    console.log(`   Found ${manifest.routes?.length || 0} routes in manifest`);
  }

  // Strategy 3: Check App.jsx for route definitions
  if (fs.existsSync('../frontend/src/App.jsx')) {
    const content = fs.readFileSync('../frontend/src/App.jsx', 'utf8');
    const routeMatches = content.matchAll(/<Route\s+[^>]*path\s*=\s*["'`]([^"'`]+)["'`]/g);
    for (const match of routeMatches) {
      routes.add(match[1]);
    }
  }

  // Strategy 4: Check for navigation files
  const navFiles = await glob('../frontend/src/**/*nav*.{js,jsx}');
  for (const file of navFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Look for href patterns
    const hrefMatches = content.matchAll(/href\s*:\s*["'`]([^"'`]+)["'`]/g);
    for (const match of hrefMatches) {
      if (match[1].startsWith('/')) {
        routes.add(match[1]);
      }
    }
  }

  // Strategy 5: Common patterns
  const commonRoutes = ['/', '/login', '/dashboard', '/settings', '/profile'];
  commonRoutes.forEach(r => routes.add(r));

  const discovered = Array.from(routes).sort();
  console.log(`✓ Discovered ${discovered.length} routes:`, discovered);

  return discovered;
}

const routes = await discoverRoutes();
fs.writeFileSync('discovered-routes.json', JSON.stringify(routes, null, 2));