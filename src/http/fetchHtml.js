import { politeFetch } from './politeClient.js';
import { readCache, writeCache } from './cache.js';

export async function fetchHtml(url) {
   const cached = readCache(url);
   if (cached !== null) {
      console.log(`[cache] CACHE HIT ${url} (${cached.length} bytes)`);
      return cached;
   }

   const response = await politeFetch(url);
   const html = await response.text();
   writeCache(url, html);
   console.log(`[cache] FETCH ${url} (${html.length} bytes)`);
   return html;
}