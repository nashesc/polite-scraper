import { politeFetch } from './politeClient.js';
import { config } from '../config.js';

const start = Date.now();
const res1 = await politeFetch(new URL('/catalogue/page-1.html', config.baseUrl).href);
console.log('Request 1:', res1.status, `(+${Date.now() - start}ms)`);

const res2 = await politeFetch(new URL('/catalogue/page-2.html', config.baseUrl).href);
console.log('Request 2:', res2.status, `(+${Date.now() - start}ms)`);