// Resolves Playwright from the project, a global install, or this container's
// preinstalled copy. Install it with `npm i -D playwright` if none is found.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function load() {
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright']) {
    try { return require(spec); } catch { /* try next */ }
  }
  throw new Error('Playwright not found. Run: npm i -D playwright && npx playwright install chromium');
}
export const { chromium } = load();
