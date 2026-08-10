import { z } from 'zod';

export const bookRecordSchema = z.object({
   sourceUrl: z.string().url(),
   sourcePage: z.string().url(),
   fetchedAt: z.string().datetime(),
   title: z.string().min(1),
   price: z.number().positive(),
   priceText: z.string().nullable(),
   currencySymbol: z.string().nullable(),
   inStock: z.boolean().nullable(),
   availabilityText: z.string().nullable(),
   availableCount: z.number().int().nonnegative().nullable(),
   rating: z.number().int().min(1).max(5).nullable(),
   ratingText: z.string().nullable(),
   upc: z.string().min(1),
   category: z.string().min(1),
   description: z.string().nullable(),
   numReviews: z.number().int().nonnegative().nullable(),
   imageUrl: z.string().url(),
   dataQuality: z.object({
      descriptionTruncationArtifactRemoved: z.boolean(),
      descriptionDeduplicated: z.boolean(),
   }),
});