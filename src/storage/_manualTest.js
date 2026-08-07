import { ensureOutputDir, loadExistingUpcs, appendRecord } from './writeRecords.js';

ensureOutputDir();

const before = loadExistingUpcs();
console.log('UPCs before:', before.size);

appendRecord({ upc: 'TEST-UPC-001', title: 'Test Book One' });
appendRecord({ upc: 'TEST-UPC-002', title: 'Test Book Two' });

const after = loadExistingUpcs();
console.log('UPCs after:', after.size);
console.log('Contains TEST-UPC-001:', after.has('TEST-UPC-001'));