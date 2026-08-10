import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

function errorsFile() {
   return path.join(config.outputDir, 'errors.jsonl');
}

export function appendError(record) {
   fs.appendFileSync(errorsFile(), JSON.stringify(record) + '\n');
}