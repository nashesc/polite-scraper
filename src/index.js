import { discoverBookUrls } from './crawler/discoverBooks.js';
import { fetchHtml } from './http/fetchHtml.js';
import { ensureCacheDir } from './http/cache.js';
import { parseBookPage } from './parser/bookParser.js';
import { cleanBook } from './clean/cleanBook.js';
import { ensureOutputDir, loadExistingUrls, appendRecord } from './storage/writeRecords.js';
import { bookRecordSchema } from './schema/bookRecord.js';
import { appendError } from './storage/writeErrors.js';

const DEFAULT_MAX_PAGES = 3;

function parseLimit() {
   const arg = process.argv.find((a) => a.startsWith('--limit='));
   if (!arg) return null;
   const n = Number(arg.split('=')[1]);
   return Number.isFinite(n) && n > 0 ? n : null;
}

function parseFull() {
   return process.argv.includes('--full');
}

async function run() {
   const limit = parseLimit();
   const full = parseFull();
   const maxPages = full ? null : DEFAULT_MAX_PAGES;

   ensureOutputDir();
   ensureCacheDir();

   const alreadyScraped = loadExistingUrls();
   console.log(`[orchestrator] resuming — ${alreadyScraped.size} book(s) already on disk`);

   const allUrls = await discoverBookUrls({ maxPages });
   let pending = allUrls.filter((item) => !alreadyScraped.has(item.url));

   if (limit) {
      pending = pending.slice(0, limit);
      console.log(`[orchestrator] --limit=${limit} applied — smoke-test run`);
   }

   console.log(`[orchestrator] ${allUrls.length} discovered, ${alreadyScraped.size} skipped (resume), ${pending.length} to fetch${limit ? ` (limited from ${allUrls.length - alreadyScraped.size})` : ''}`);

   const stats = { fetched: 0, failed: 0, failures: [], invalid: 0 };

   for (let i = 0; i < pending.length; i++) {
      const { url, sourcePage } = pending[i];
      const progress = `${i + 1}/${pending.length}`;

      try {
         const html = await fetchHtml(url);
         const fetchedAt = new Date().toISOString();
         const raw = parseBookPage(html, url, { sourcePage, fetchedAt });
         const cleaned = cleanBook(raw);

         const validation = bookRecordSchema.safeParse(cleaned);
         if (!validation.success) {
            stats.invalid++;
            appendError({ url, issues: validation.error.issues });
            console.warn(`[orchestrator] ${progress} INVALID — ${url} — ${validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
            continue;
         }

         appendRecord(validation.data);
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
   console.log(`  invalid: ${stats.invalid}`);
   if (stats.failures.length) {
      console.log('  failure detail:', stats.failures);
   }
}

run();