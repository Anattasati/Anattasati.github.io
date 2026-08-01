import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export const postCategories = ["reflections", "meditations"] as const;

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    category: z.enum(postCategories),
    description: z.string().min(1).optional(),
  }),
});

export const collections = { posts };
