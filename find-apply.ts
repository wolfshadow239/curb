// find-apply.ts — run once, then delete
import { readFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{ts,tsx}');
let found = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  if (content.includes('router({') && content.includes('apply:')) {
    console.error(`❌ FOUND "apply:" in router at: ${file}`);
    found = true;
  }
}

if (!found) console.log('✅ No "apply:" found in routers');
