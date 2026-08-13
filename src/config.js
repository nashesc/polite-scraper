import 'dotenv/config';

export const config = {
  baseUrl: process.env.BASE_URL || 'http://books.toscrape.com',
  userAgent: process.env.USER_AGENT || 'polite-scraper-bot/1.0',
  requestDelayMs: Number(process.env.REQUEST_DELAY_MS) || 1000,
  maxRetries: Number(process.env.MAX_RETRIES) || 3,
  outputDir: process.env.OUTPUT_DIR || './data/output',
  fullOutputDir: process.env.FULL_OUTPUT_DIR || './data/output-full',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 8000,
};