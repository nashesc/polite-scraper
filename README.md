# Polite Scraper

A scraper for [books.toscrape.com](http://books.toscrape.com) that discovers all book pages, fetches them, extracts structured fields, cleans the data, and writes it to `data/output/books.jsonl` — one JSON record per line.

## Pipeline

```
discover (crawler) → fetch (http) → parse → clean → store
```

- **`src/crawler/discoverBooks.js`** — walks the paginated catalogue (`page-1.html` → `page-N.html`) and collects every book page URL.
- **`src/http/politeClient.js`** — wraps `fetch` with the politeness behaviors below.
- **`src/parser/bookParser.js`** — extracts raw fields from a book page's HTML (title, price, availability, rating, UPC, category, description, image).
- **`src/clean/cleanBook.js`** — normalizes raw fields (parses price/currency, availability count, rating word → number) and cleans the description (strips `...more` truncation artifacts, removes duplicated text).
- **`src/storage/writeRecords.js`** — appends each cleaned record to `data/output/books.jsonl` and supports resuming a partial run.

## Politeness behaviors

- **robots.txt compliance** — `src/robots/robotsCheck.js` fetches `/robots.txt` before any crawling starts and parses `Disallow`/`Allow` rules for the `*` user-agent. Every URL is checked against these rules before it's fetched.
  - If robots.txt is missing (4xx), the site is treated as unrestricted per RFC 9309.
  - If robots.txt fails to load (network error or 5xx), the scraper **fails closed** — it assumes everything is disallowed rather than risk crawling a site that meant to block it.
- **Rate limiting** — `politeClient.js` enforces a minimum delay (`REQUEST_DELAY_MS`, default 1000ms) between requests, tracked globally so it applies across the whole crawl, not per-page.
- **Retry with backoff** — retryable failures (429, 5xx, network errors) are retried up to `MAX_RETRIES` times with exponential backoff. A `Retry-After` header is respected when present.
- **Identification** — every request sends a custom `User-Agent` (configured in `.env`) that includes a contact email, so the site owner can identify and reach the bot if needed.
- **Resumability** — before crawling, the scraper loads URLs already present in `books.jsonl` and skips them, so a partial or interrupted run can be resumed without re-fetching everything from scratch.

## Setup

```bash
npm install
cp .env.example .env   # fill in your own contact email in USER_AGENT
```

## Usage

Full run (all ~1000 books):

```bash
npm start
```

Smoke-test run (first N pending books only):

```bash
node src/index.js --limit=10
```

Each module also has a `_manualTest.js` for testing that stage in isolation (e.g. `node src/clean/_manualTest.js`).

## Output

`data/output/books.jsonl` — one JSON object per line:

```json
{
  "sourceUrl": "...",
  "title": "...",
  "price": 51.77,
  "currencySymbol": "£",
  "inStock": true,
  "availableCount": 22,
  "rating": 3,
  "upc": "...",
  "category": "...",
  "description": "...",
  "numReviews": 0,
  "imageUrl": "...",
  "dataQuality": {
    "descriptionTruncationArtifactRemoved": true,
    "descriptionDeduplicated": true
  }
}
```

The `dataQuality` block flags whether the description was cleaned of a truncation artifact (`...more`) or de-duplicated text, so downstream consumers (e.g. a W6 RAG pipeline) can audit cleaning decisions rather than trust them blindly.

## Known limitations

- Description de-duplication uses a first-30-characters probe to detect repeated text. It was spot-checked against a handful of records but wasn't exhaustively verified against every flagged book — worth another pass before treating the corpus as fully trustworthy.