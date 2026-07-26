import { z } from "zod";

export const ratingSchema = z
  .number()
  .min(1)
  .max(10)
  .refine((v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9, {
    message: "Rating must be in half-point increments",
  });

export const createLogSchema = z.object({
  olWorkKey: z.string().min(1).max(40),
  title: z.string().max(200).optional().or(z.literal("")),
  rating: ratingSchema,
  body: z.string().min(1).max(20000),
  readAt: z.string().min(1).optional(),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
