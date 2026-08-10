import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

function recordsFile() {
   return path.join(config.outputDir, 'books.json');
}

export function loadExistingRecords() {
   const file = recordsFile();
   if (!fs.existsSync(file)) return [];
   try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
   } catch {
      console.warn('[storage] books.json is malformed, starting fresh');
      return [];
   }
}

export function loadExistingUrlsJson() {
   return new Set(loadExistingRecords().map((r) => r.sourceUrl));
}

export function writeRecordsJson(records) {
   fs.writeFileSync(recordsFile(), JSON.stringify(records, null, 2));
}