# Polite Scraper

A scraper for [books.toscrape.com](http://books.toscrape.com) — a sandbox site built specifically for people to practice scraping on. It discovers book pages, fetches them politely, extracts structured fields, validates and cleans the data, and writes the results to `output/books.json`.

## Target classification

- **Site:** [books.toscrape.com](http://books.toscrape.com)
- **Why:** The site's own about page states it exists as a sandbox for practicing web scraping — this assignment only touches sites that explicitly invite it.
- **Scope:** The first 3 catalogue pages only (60 books). This is the default and only mode documented for grading purposes; see "Extended run" below for an opt-in larger crawl kept separate from this scope.
- **Data collected:** title, price, availability, star rating, UPC, category, description, cover image URL — all fields already present in the page's HTML, nothing scraped from JavaScript-rendered content.
- **robots.txt result:** `GET /robots.txt` returned `404 Not Found`. Per RFC 9309, a missing robots.txt is treated as unrestricted — but a missing file is not the same as explicit permission, so the scope stays deliberately narrow (3 pages) regardless.

**I will not reuse this code on another site without checking its rules and terms first.**

## Why no browser was needed

The data collected here is already present in the HTML the server sends on first response — no JavaScript rendering fills in the price, title, or description after the fact. A headless browser would only add startup cost and memory overhead for zero additional data.

## Ethics note

This scraper only targets a site that explicitly exists for scraping practice. In general: use an official API when one exists rather than scraping; never bypass logins, paywalls, or access blocks (a site that says no gets a no, not a retry with a different technique); and collect only the fields actually needed for the stated purpose, not everything reachable.

## Pipeline

discover (crawler) → fetch (http, cached) → parse → clean → validate (Zod) → store

- **`src/crawler/discoverBooks.js`** — walks the catalogue pages (capped at 3 by default) and collects book page URLs, deduped by URL.
- **`src/http/politeClient.js`** — wraps `fetch` with the politeness behaviors below.
- **`src/http/fetchHtml.js` + `src/http/cache.js`** — reads/writes each fetched page to `cache/` so reruns during development don't re-hit the live site.
- **`src/parser/bookParser.js`** — extracts raw fields from a book page's HTML, plus provenance (`sourcePage`, `fetchedAt`).
- **`src/clean/cleanBook.js`** — normalizes raw fields (price, availability, rating) while keeping the raw text alongside each cleaned value, and cleans the description (strips `...more` truncation, removes duplicated text).
- **`src/schema/bookRecord.js`** — Zod schema. Records that fail validation are set aside rather than silently written; see `output/errors.json`.
- **`src/storage/writeRecordsJson.js` / `writeErrorsJson.js` / `writeRunReport.js`** — write `output/books.json`, `output/errors.json`, and `output/run-report.json`, merging by `sourceUrl` so a rerun doesn't duplicate records.

## Politeness behaviors

- **robots.txt compliance** — checked once before any crawling starts. If robots.txt is missing (4xx), the site is treated as unrestricted per RFC 9309. If it fails to load (network error or 5xx), the scraper **fails closed** — assumes everything is disallowed rather than risk crawling a site that meant to block it.
- **Rate limiting** — a minimum delay (`REQUEST_DELAY_MS`, default 1000ms, always ≥500ms) between real requests, tracked globally. Cached reads skip this entirely — they never leave the machine.
- **Timeout** — every real request gives up after `REQUEST_TIMEOUT_MS` (default 8000ms) rather than hanging indefinitely.
- **Retry policy** — 429 and 5xx responses (and network errors/timeouts) are retried with exponential backoff up to `MAX_RETRIES`. 404 and 403 are never retried — a missing page won't appear on retry, and a site that said no shouldn't be asked again.
- **Identification** — every request sends a custom `User-Agent` with a contact email, so the site owner can identify and reach the bot.
- **Caching** — every fetched page is saved to `cache/` and read from there on subsequent runs, so development iteration doesn't repeatedly hit the live site.
- **Resumability** — `output/books.json` is loaded before each run and already-scraped URLs are skipped, so a rerun converges rather than re-fetching everything.

## Setup

```bash
npm install
cp .env.example .env   # fill in your own contact email in USER_AGENT
```

## Usage

```bash
node src/index.js
```

This is the one command that reproduces the graded scope: crawls the first 3 catalogue pages, fetches/validates/cleans 60 books, and writes `output/books.json`, `output/errors.json`, and `output/run-report.json`. A rerun reads from cache and produces the same 60 records, not duplicates.

Smoke-test a few books only:
```bash
node src/index.js --limit=5
```

Prove failure handling (adds one made-up book URL to the run on purpose — never used to hammer the real site):
```bash
node src/index.js --inject-broken
```

### Extended run

```bash
node src/index.js --full
```

Removes the 3-page cap and crawls the entire ~1000-book catalogue, writing to `data/output/books.jsonl`/`errors.jsonl` (streamed, append-as-you-go — a better fit at that scale than rewriting a full JSON array each run) instead of `output/books.json`. This is an intentional extension beyond the graded scope, kept in a separate output path so it never interferes with the 60-book assignment run above; the resulting dataset feeds the W6 RAG pipeline.

Each module also has a `_manualTest.js` for testing that stage in isolation (e.g. `node src/clean/_manualTest.js`).

## Record schema

`output/books.json` — a single JSON array of records:

```json
{
  "sourceUrl": "...",
  "sourcePage": "...",
  "fetchedAt": "2026-08-10T19:10:49.227Z",
  "title": "...",
  "price": 51.77,
  "priceText": "£51.77",
  "currencySymbol": "£",
  "inStock": true,
  "availabilityText": "In stock (22 available)",
  "availableCount": 22,
  "rating": 3,
  "ratingText": "Three",
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

`sourceUrl` is the canonical identity used for dedup and resume. Raw text (`priceText`, `availabilityText`, `ratingText`) is kept alongside each cleaned value rather than discarded, so downstream consumers can audit what was parsed versus what was original. The `dataQuality` block flags whether the description was cleaned of a truncation artifact or de-duplicated text.

Records that fail schema validation (missing title, non-positive price, malformed URL, etc.) go to `output/errors.json` instead, each with the offending URL and the specific validation issues.

## Sample run-report.json

```json
{
  "startTime": "2026-08-12T23:48:33.535Z",
  "endTime": "2026-08-12T23:49:38.006Z",
  "durationMs": 64471,
  "mode": "assignment",
  "cataloguePages": 3,
  "discovered": 60,
  "skippedResume": 0,
  "pending": 60,
  "fetchedOk": 60,
  "invalid": 0,
  "failedPages": 0,
  "cacheHits": 0,
  "cacheMisses": 63,
  "failures": []
}
```
(Captured from a cold-start run — `cache/` and `data/output/` cleared before running — proving all 60 books were fetched live rather than resumed from disk. For failure-handling proof, see the `--inject-broken` example under Usage above.)

## Known limitations

- Description de-duplication uses a whitespace-tolerant regex match against the first 30 characters to detect repeated text. This fixes a prior false-negative: when the truncated and complete copies of a description had inconsistent spacing (e.g. single-space vs. triple-space at the same position), exact-string matching missed the duplicate and left both copies concatenated in the output. Verified against the full 60-book assignment corpus via a cold-start run; spot-checked in detail against the Tsubasa record, which had this exact failure mode.
- Deduplication does not normalize whitespace in the retained text — if the source has irregular spacing (e.g. a triple space), that spacing is preserved as-is in the cleaned description.