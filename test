// scripts/check-router.js
import { readFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{ts,tsx}');
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  if (content.includes('router({') && content.includes('apply:')) {
    console.error(`FOUND "apply:" in router at: ${file}`);
    process.exit(1);
  }
}
