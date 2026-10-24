/**
 * The answer pages. THE PLATFORM IS THE ONLY POST LIST: posts are written, checked and published in
 * the admin (Visibility > Posts), and scripts/fetch-posts.mjs writes them into posts.feed.js before
 * every build. The routes, the rewrites, the sitemap, llms.txt and the prerender crawl all derive
 * from POSTS, so a post published there reaches every one of them in one build.
 *
 * Pure data, no imports beyond the generated feed. `vite.config.js` and `scripts/` import this under
 * plain Node, so anything that needs the app's `@` alias or `import.meta.env` cannot live here.
 *
 * WHAT MAY BE WRITTEN IN A POST, AND WHAT MAY NOT, is enforced where posts are written now: every
 * sentence true without a fact nobody on the build has; no invented prices, payout ranges,
 * commission rates, durations or claims about what sells in this region. A person's post is checked
 * by the person who publishes it; an automatic post publishes only when every number appears in the
 * brand facts or a live post and a second model finds every claim about the business backed by a
 * quoted brand fact or live-post sentence (the platform's packages/domain/src/visibility/autopost.ts).
 *
 * `published` and `updated` are written-down dates from the platform, never `new Date()`: the crawl
 * must emit byte-identical HTML across two builds of one feed.
 *
 * GEO form, per §8.2: `answer` is the whole answer and it renders first, above every section,
 * because an assistant summarising the page reads the top of it.
 */
import { FEED_POSTS } from "./posts.feed.js";

/** In the platform's order: newest published first. */
export const POSTS = FEED_POSTS;

export const postBySlug = (slug) => POSTS.find((post) => post.slug === slug);

/** The one place a post's URL is spelled out. */
export const postPath = (post) => `/blog/${post.slug}`;
