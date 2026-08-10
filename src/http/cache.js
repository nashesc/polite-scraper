import fs from 'fs';
import path from 'path';

const CACHE_DIR = 'cache';

function cacheFilePath(url) {
   const { pathname } = new URL(url);
   const slug = pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
   return path.join(CACHE_DIR, `${slug}.html`);
}

export function ensureCacheDir() {
   fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function readCache(url) {
   const file = cacheFilePath(url);
   return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
}

export function writeCache(url, html) {
   fs.writeFileSync(cacheFilePath(url), html);
}