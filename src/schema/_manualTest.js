import { bookRecordSchema } from './bookRecord.js';

const bad = { sourceUrl: 'not-a-url', title: '', price: -5 };
const result = bookRecordSchema.safeParse(bad);

console.log(result.success ? 'FAIL: bad record passed validation' : 'OK: rejected as expected');
if (!result.success) {
   console.log(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
}