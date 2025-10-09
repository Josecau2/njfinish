import { readFileSync } from 'fs';

const rootPkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const frontendPkg = JSON.parse(readFileSync('./frontend/package.json', 'utf8'));

const rootDeps = new Set([
  ...Object.keys(rootPkg.dependencies || {}),
  ...Object.keys(rootPkg.devDependencies || {})
]);

const frontendDeps = {
  ...frontendPkg.dependencies,
  ...frontendPkg.devDependencies
};

console.log('Missing from root package.json:\n');
const missing = [];
Object.keys(frontendDeps).forEach(dep => {
  if (!rootDeps.has(dep)) {
    missing.push({ name: dep, version: frontendDeps[dep] });
  }
});

missing.sort((a, b) => a.name.localeCompare(b.name));
missing.forEach(({ name, version }) => {
  console.log(`    "${name}": "${version}",`);
});
