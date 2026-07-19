import { z } from "zod";

export const ratingSchema = z
  .number()
  .min(1)
  .max(5)
  .refine((v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9, {
    message: "Rating must be in half-star increments",
  });

export const createLogSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(300),
  authorName: z.string().max(200).optional().or(z.literal("")),
  sourceName: z.string().max(200).optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal("")),
  readAt: z.string().min(1),
  rating: ratingSchema.optional().nullable(),
  review: z.string().max(20000).optional().or(z.literal("")),
  hasSpoilers: z.boolean().optional(),
  readingMinutes: z.number().int().min(1).max(10000).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
