import { politeFetch } from './politeClient.js';
import { readCache, writeCache } from './cache.js';

let cacheHits = 0;
let cacheMisses = 0;

export function getFetchStats() {
   return { cacheHits, cacheMisses };
}

export async function fetchHtml(url) {
   const cached = readCache(url);
   if (cached !== null) {
      cacheHits++;
      console.log(`[cache] CACHE HIT ${url} (${cached.length} bytes)`);
      return cached;
   }

   const response = await politeFetch(url);
   const html = await response.text();
   writeCache(url, html);
   cacheMisses++;
   console.log(`[cache] FETCH ${url} (${html.length} bytes)`);
   return html;
}