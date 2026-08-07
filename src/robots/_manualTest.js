import { checkRobots, isAllowed } from './robotsCheck.js';
import { config } from '../config.js';

const result = await checkRobots(config.baseUrl, config.userAgent);
console.log(result);
console.log('Can we fetch /catalogue/page-1.html?', isAllowed('/catalogue/page-1.html', result));