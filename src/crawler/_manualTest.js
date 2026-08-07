import { discoverBookUrls } from './discoverBooks.js';

const urls = await discoverBookUrls();
console.log('First 3:', urls.slice(0, 3));
console.log('Last 3:', urls.slice(-3));
console.log('Total:', urls.length);