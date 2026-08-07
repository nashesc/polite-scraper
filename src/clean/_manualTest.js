import { politeFetch } from '../http/politeClient.js';
import { parseBookPage } from '../parser/bookParser.js';
import { cleanBook } from './cleanBook.js';

const url = 'http://books.toscrape.com/catalogue/tipping-the-velvet_999/index.html';
const response = await politeFetch(url);
const html = await response.text();

const raw = parseBookPage(html, url);
console.log('RAW description:', raw.descriptionRaw);
const cleaned = cleanBook(raw);

console.log(cleaned);