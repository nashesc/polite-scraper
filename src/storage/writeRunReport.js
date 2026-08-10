import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export function writeRunReport(report) {
   fs.writeFileSync(path.join(config.outputDir, 'run-report.json'), JSON.stringify(report, null, 2));
}