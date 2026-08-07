// src/storage/writeRecords.js
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

function outputFile() {
  return path.join(config.outputDir, 'books.jsonl');
}

export function ensureOutputDir() {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Reads whatever's already on disk and returns the set of UPCs already
// scraped, so a rerun can skip books it already has instead of re-fetching
// all 1000 from a partial crawl.
export function loadExistingUpcs() {
  const file = outputFile();
  if (!fs.existsSync(file)) return new Set();

  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
  const upcs = new Set();
  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record.upc) upcs.add(record.upc);
    } catch {
      console.warn('[storage] skipping malformed line in books.jsonl');
    }
  }
  return upcs;
}

// Same idea as loadExistingUpcs, but keyed on sourceUrl instead of upc.
// UPC only exists after you've fetched and parsed a book page, so it can't
// be used to decide whether to fetch in the first place. sourceUrl comes
// straight from discoverBookUrls(), before any request is made — it's the
// only field that can actually gate a skip-vs-fetch decision.
export function loadExistingUrls() {
  const file = outputFile();
  if (!fs.existsSync(file)) return new Set();

  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
  const urls = new Set();
  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record.sourceUrl) urls.add(record.sourceUrl);
    } catch {
      console.warn('[storage] skipping malformed line in books.jsonl');
    }
  }
  return urls;
}

// Appends one record at a time rather than holding all 1000 in memory and
// writing once at the end — a crash at book 999 still leaves the first 998
// safely on disk instead of losing the whole run.
export function appendRecord(record) {
  fs.appendFileSync(outputFile(), JSON.stringify(record) + '\n');
}