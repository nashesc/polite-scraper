import { politeFetch } from '../http/politeClient.js';
import { parseBookPage } from './bookParser.js';

const url = 'http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html';
const response = await politeFetch(url);
const html = await response.text();

console.log(parseBookPage(html, url));