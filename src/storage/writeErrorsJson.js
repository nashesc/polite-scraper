import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

function errorsFile() {
   return path.join(config.outputDir, 'errors.json');
}

export function loadExistingErrors() {
   const file = errorsFile();
   if (!fs.existsSync(file)) return [];
   try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
   } catch {
      console.warn('[storage] errors.json is malformed, starting fresh');
      return [];
   }
}

export function writeErrorsJson(errors) {
   fs.writeFileSync(errorsFile(), JSON.stringify(errors, null, 2));
}