import * as cheerio from 'cheerio';
import { politeFetch } from '../http/politeClient.js';
import { config } from '../config.js';

export async function discoverBookUrls() {
   const bookUrls = []
   let currentUrl = config.baseUrl
   let pageCount = 0

   while (currentUrl) {
      pageCount++
      console.log(`[crawler] page ${pageCount}: ${currentUrl}`)

      const response = await politeFetch(currentUrl)
      const html = await response.text()
      const $ = cheerio.load(html)

      $('article.product_pod').each((i, element) => {
         const href = $(element).find('h3 > a').attr('href')
         if (href) {
            bookUrls.push(new URL(href, currentUrl).href)
         }
      })

      const nextHref = $('li.next > a').attr('href')
      currentUrl = nextHref ? new URL(nextHref, currentUrl).href : null
   }
   console.log(`[crawler] done - ${bookUrls.length} book URLs across ${pageCount} page(s)`)
   return bookUrls
}