const RATING_WORDS = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 };

function parsePrice(raw) {
   if (!raw) return { amount: null, currencySymbol: null };
   const match = raw.match(/^([£$€])?([\d.]+)/);
   if (!match) return { amount: null, currencySymbol: null };
   return { amount: parseFloat(match[2]), currencySymbol: match[1] || null };
}

function parseAvailability(raw) {
   if (!raw) return { inStock: null, availableCount: null };
   const inStock = /in stock/i.test(raw);
   const countMatch = raw.match(/(\d+)\s+available/i);
   return {
      inStock,
      availableCount: countMatch ? parseInt(countMatch[1], 10) : null,
   };
}

function parseRating(word) {
   return RATING_WORDS[word] ?? null;
}

function escapeRegExp(str) {
   return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFlexibleProbePattern(probe) {
   const escaped = escapeRegExp(probe);
   return escaped.replace(/\s+/g, '\\s+');
}

function dedupeDescription(text, sourceUrl) {
   if (!text || text.length < 60) return { text, wasDeduped: false };

   const probe = text.slice(0, 30);
   const pattern = buildFlexibleProbePattern(probe);
   const regex = new RegExp(pattern);

   const searchSpace = text.slice(15);
   const match = searchSpace.match(regex);

   if (match) {
      const secondOccurrence = match.index + 15;
      console.warn(`[clean] description dedup fired for ${sourceUrl}`);
      return { text: text.slice(secondOccurrence), wasDeduped: true };
   }
   return { text, wasDeduped: false };
}

function cleanDescription(raw, sourceUrl) {
   if (!raw) return { text: null, wasTruncationArtifact: false, wasDeduped: false };

   let text = raw.trim();
   const wasTruncationArtifact = /\.\.\.more\s*$/.test(text);
   if (wasTruncationArtifact) {
      text = text.replace(/\.\.\.more\s*$/, '').trim();
   }

   const { text: deduped, wasDeduped } = dedupeDescription(text, sourceUrl);
   return { text: deduped, wasTruncationArtifact, wasDeduped };
}

export function cleanBook(raw) {
   const { amount: price, currencySymbol } = parsePrice(raw.priceRaw);
   const { inStock, availableCount } = parseAvailability(raw.availabilityRaw);
   const rating = parseRating(raw.ratingWord);
   const { text: description, wasTruncationArtifact, wasDeduped } = cleanDescription(
      raw.descriptionRaw,
      raw.sourceUrl
   );

   return {
      sourceUrl: raw.sourceUrl,
      sourcePage: raw.sourcePage,
      fetchedAt: raw.fetchedAt,
      title: raw.title || null,
      price,
      priceText: raw.priceRaw,
      currencySymbol,
      inStock,
      availabilityText: raw.availabilityRaw,
      availableCount,
      rating,
      ratingText: raw.ratingWord,
      upc: raw.upc,
      category: raw.category,
      description,
      numReviews: raw.numReviewsRaw !== null ? parseInt(raw.numReviewsRaw, 10) : null,
      imageUrl: raw.imageUrl,
      dataQuality: {
         descriptionTruncationArtifactRemoved: wasTruncationArtifact,
         descriptionDeduplicated: wasDeduped,
      },
   };
}