import { getCollection, type CollectionEntry } from "astro:content";

export const SITE = {
  title: "Anattasati",
  description:
    "Reflections on meditation, Buddhist philosophy, and the nature of experience.",
  url: "https://anattasati.org",
} as const;

export const SECTION_SLUGS = ["reflections", "meditations"] as const;

export const SECTIONS = [
  {
    slug: "reflections",
    label: "Reflections",
    number: "01",
  },
  {
    slug: "meditations",
    label: "Meditations",
    number: "02",
  },
] as const satisfies ReadonlyArray<{
  slug: (typeof SECTION_SLUGS)[number];
  label: string;
  number: string;
}>;

export type SectionSlug = (typeof SECTIONS)[number]["slug"];
export type PostEntry = CollectionEntry<"posts">;

export function isSectionSlug(value: string): value is SectionSlug {
  return SECTION_SLUGS.some((category) => category === value);
}

export function getSection(slug: SectionSlug) {
  return SECTIONS.find((section) => section.slug === slug)!;
}

export function getPostSlug(post: PostEntry): string {
  const slug = post.id.split("/").at(-1);

  if (!slug) {
    throw new Error(`Unable to derive a URL slug from post id: ${post.id}`);
  }

  return slug;
}

export function getPostPath(post: PostEntry): string {
  return `/${post.data.category}/${getPostSlug(post)}/`;
}

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const posts = await getCollection("posts");

  return posts.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() ||
      a.data.title.localeCompare(b.data.title),
  );
}

export async function getPostsByCategory(
  category: SectionSlug,
): Promise<PostEntry[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.category === category);
}

export function formatPostDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}
