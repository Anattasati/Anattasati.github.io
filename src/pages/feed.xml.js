import rss from "@astrojs/rss";

import { getPostPath, getPublishedPosts, SITE } from "../lib/content";

export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: getPostPath(post),
      content: post.rendered?.html,
    })),
  });
}
