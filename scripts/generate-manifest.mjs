import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Scan for routes
const routeFiles = await fg(['frontend/src/routes.js', 'frontend/src/App.jsx'], { cwd: root });
const routes = new Set();

for (const f of routeFiles) {
  const txt = fs.readFileSync(path.join(root, f), 'utf8');

  // Match various route patterns
  const patterns = [
    /path:\s*['"`]([^'"`]+)['"`]/g,
    /<Route[^>]+path\s*=\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(txt))) {
      const routePath = m[1];
      if (!routePath.includes('__audit__') && !routePath.includes(':') && routePath.startsWith('/')) {
        routes.add(routePath);
      }
    }
  }
}

// Scan for modals (files ending in Modal.tsx/jsx)
const modalFiles = await fg(['frontend/src/**/*Modal.{tsx,jsx}'], { cwd: root });
const modals = modalFiles
  .map(f => path.basename(f).replace(/\.(tsx|jsx)$/, ''))
  .filter(name => !name.includes('_backup'));

// Scan for shared components
const componentFiles = await fg(['frontend/src/components/**/*.{tsx,jsx}'], { cwd: root });
const components = componentFiles
  .filter(f => !f.includes('.test.') && !f.includes('.spec.') && !f.includes('.stories.'))
  .map(f => path.basename(f).replace(/\.(tsx|jsx)$/, ''))
  .filter(name => !name.includes('Modal') && !name.includes('Page'));

// Button types - manual curation based on common patterns
const buttons = ['Primary', 'Secondary', 'Tertiary', 'Destructive', 'IconOnly'];

const manifest = {
  generated: new Date().toISOString(),
  routes: Array.from(routes).sort().map(routePath => ({
    path: routePath,
    title: routePath === '/' ? 'Dashboard' :
           routePath.slice(1).split('/')[0]
             .split('-')
             .map(w => w.charAt(0).toUpperCase() + w.slice(1))
             .join(' ')
  })),
  modals: Array.from(new Set(modals)).sort(),
  components: Array.from(new Set(components)).sort(),
  buttons
};

const manifestPath = path.join(root, 'AUDIT/manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`✅ Generated manifest:`);
console.log(`   ${routes.size} routes`);
console.log(`   ${modals.length} modals`);
console.log(`   ${components.length} components`);
console.log(`   ${buttons.length} button types`);