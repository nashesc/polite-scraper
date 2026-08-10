import { config } from '../config.js';
import { checkRobots, isAllowed } from '../robots/robotsCheck.js';

let robotsResult = null;
let lastRequestTime = 0;

async function ensureRobotsChecked() {
   if (!robotsResult) {
      robotsResult = await checkRobots(config.baseUrl, config.userAgent);
   }
   return robotsResult;
}

function sleep(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRateLimit() {
  const elapsed = Date.now() - lastRequestTime;
  const waitTime = config.requestDelayMs - elapsed;
  console.log(`[ratelimit] elapsed=${elapsed}ms, waiting=${Math.max(0, waitTime)}ms`);
  if (waitTime > 0) await sleep(waitTime);
  lastRequestTime = Date.now();
}

function isRetryable(status) {
   return status === 429 || (status >= 500 && status < 600);
}

export async function politeFetch(url, options = {}) {
   const robots = await ensureRobotsChecked();
   const path = new URL(url).pathname;

   if (!isAllowed(path, robots)) {
      throw new Error(`Blocked by robots.txt: ${path}`);
   }

   let attempt = 0;
   while (true) {
      await waitForRateLimit();

      let response;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);
      try {
         response = await fetch(url, {
         ...options,
         headers: { 'User-Agent': config.userAgent, ...options.headers },
         signal: controller.signal,
         });
      } catch (err) {
         attempt++;
         if (attempt > config.maxRetries) {
         throw new Error(`Network error fetching ${url} after ${attempt} attempts: ${err.message}`);
         }
         const backoffMs = config.requestDelayMs * 2 ** attempt;
         console.warn(`[http] network error on ${url} (attempt ${attempt}/${config.maxRetries}), retrying in ${backoffMs}ms`);
         await sleep(backoffMs);
         continue;
      } finally {
         clearTimeout(timeoutId);
      }

      if (response.ok) return response;

      if (isRetryable(response.status) && attempt < config.maxRetries) {
         attempt++;
         const retryAfter = response.headers.get('retry-after');
         const backoffMs = retryAfter ? Number(retryAfter) * 1000 : config.requestDelayMs * 2 ** attempt;
         console.warn(`[http] ${response.status} on ${url} (attempt ${attempt}/${config.maxRetries}), retrying in ${backoffMs}ms`);
         await sleep(backoffMs);
         continue;
      }

      throw new Error(`Request failed: ${response.status} ${response.statusText} for ${url}`);
   }
}