import * as cheerio from 'cheerio';
import { fetchHtml } from '../http/fetchHtml.js';
import { config } from '../config.js';

export async function discoverBookUrls({ maxPages = null } = {}) {
   const discovered = []
   const bookPages = new Map()
   let currentUrl = config.baseUrl
   let pageCount = 0

   while (currentUrl) {
      pageCount++
      console.log(`[crawler] page ${pageCount}: ${currentUrl}`)

      const html = await fetchHtml(currentUrl)
      const $ = cheerio.load(html)

      $('article.product_pod').each((i, element) => {
         const href = $(element).find('h3 > a').attr('href')
         if (href) {
            const bookUrl = new URL(href, currentUrl).href
            discovered.push(bookUrl)
            if (!bookPages.has(bookUrl)) {
               bookPages.set(bookUrl, currentUrl)
            }
         }
      })

      if (maxPages && pageCount >= maxPages) {
         currentUrl = null
         break
      }

      const nextHref = $('li.next > a').attr('href')
      currentUrl = nextHref ? new URL(nextHref, currentUrl).href : null
   }

   const urls = [...bookPages.entries()].map(([url, sourcePage]) => ({ url, sourcePage }))
   console.log(`[crawler] catalogue_pages=${pageCount}, discovered=${discovered.length}, unique_urls=${urls.length}`)
   return { urls, pageCount }
}