import { discoverBookUrls } from './crawler/discoverBooks.js';
import { politeFetch } from './http/politeClient.js';
import { parseBookPage } from './parser/bookParser.js';
import { cleanBook } from './clean/cleanBook.js';
import { ensureOutputDir, loadExistingUrls, appendRecord } from './storage/writeRecords.js';

function parseLimit() {
   const arg = process.argv.find((a) => a.startsWith('--limit='));
   if (!arg) return null;
   const n = Number(arg.split('=')[1]);
   return Number.isFinite(n) && n > 0 ? n : null;
}

async function run() {
   const limit = parseLimit();

   ensureOutputDir();

   const alreadyScraped = loadExistingUrls();
   console.log(`[orchestrator] resuming — ${alreadyScraped.size} book(s) already on disk`);

   const allUrls = await discoverBookUrls();
   let pending = allUrls.filter((url) => !alreadyScraped.has(url));

   if (limit) {
      pending = pending.slice(0, limit);
      console.log(`[orchestrator] --limit=${limit} applied — smoke-test run`);
   }

   console.log(`[orchestrator] ${allUrls.length} discovered, ${alreadyScraped.size} skipped (resume), ${pending.length} to fetch${limit ? ` (limited from ${allUrls.length - alreadyScraped.size})` : ''}`);

   const stats = { fetched: 0, failed: 0, failures: [] };

   for (let i = 0; i < pending.length; i++) {
      const url = pending[i];
      const progress = `${i + 1}/${pending.length}`;

      try {
         const response = await politeFetch(url);
         const html = await response.text();
         const raw = parseBookPage(html, url);
         const cleaned = cleanBook(raw);

         appendRecord(cleaned);
         stats.fetched++;
         console.log(`[orchestrator] ${progress} OK — ${cleaned.title}`);
      } catch (err) {
         stats.failed++;
         stats.failures.push({ url, message: err.message });
         console.error(`[orchestrator] ${progress} FAILED — ${url} — ${err.message}`);
      }
   }

   console.log('[orchestrator] done');
   console.log(`  discovered: ${allUrls.length}`);
   console.log(`  skipped (resume): ${alreadyScraped.size}`);
   console.log(`  fetched OK: ${stats.fetched}`);
   console.log(`  failed: ${stats.failed}`);
   if (stats.failures.length) {
      console.log('  failure detail:', stats.failures);
   }
}

run();