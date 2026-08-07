import * as cheerio from 'cheerio';

export function parseBookPage(html, pageUrl) {
   const $ = cheerio.load(html);

   const info = {};
   $('table.table-striped tr').each((i, row) => {
      const key = $(row).find('th').text().trim();
      const value = $(row).find('td').text().trim();
      info[key] = value;
   });

   const ratingClass = $('p.star-rating').attr('class') || '';
   const ratingWord = ratingClass.split(' ').find((c) => c !== 'star-rating') || null;

   const imageSrc = $('#product_gallery img').attr('src');
   const imageUrl = imageSrc ? new URL(imageSrc, pageUrl).href : null;

   const breadcrumbLinks = $('.breadcrumb li a');
   const category = breadcrumbLinks.length
      ? $(breadcrumbLinks[breadcrumbLinks.length - 1]).text().trim()
      : null;

   return {
      sourceUrl: pageUrl,
      title: $('.product_main h1').text().trim(),
      priceRaw: info['Price (incl. tax)'] || null,
      availabilityRaw: info['Availability'] || null,
      ratingWord,
      upc: info['UPC'] || null,
      category,
      descriptionRaw: $('#product_description').next('p').text().trim() || null,
      imageUrl,
      numReviewsRaw: info['Number of reviews'] || null,
   };
}