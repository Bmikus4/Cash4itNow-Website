import React from "react";
import { motion } from "framer-motion";
import { Phone, ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { POSTS, postBySlug, postPath } from "@/content/posts";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { usePageMeta, SITE_ORIGIN } from "@/lib/usePageMeta";
import { useJsonLd, articleGraph, breadcrumbGraph } from "@/lib/structuredData";

/**
 * The body is deliberately NOT animated on scroll.
 *
 * Every other page reveals its sections with framer-motion `whileInView`, which
 * starts them at opacity:0. That is fine for a page of panels and wrong for a
 * page that is almost entirely prose: the prerender crawl captures whatever the
 * browser had painted, so an answer page is exactly the kind of page that can
 * snapshot as a wall of invisible text and still look like a successful build.
 * Plain markup removes the failure mode rather than relying on the crawl's
 * scroll to defeat it.
 */
function Section({ section }) {
  return (
    <section className="mb-12">
      <h2 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-tight mb-2">
        {section.heading}
      </h2>
      <div className="h-1.5 bg-accent w-16 mb-6" />

      {section.table && (
        // Scrolls inside itself rather than pushing the document sideways: five
        // columns of comparison cannot fit 390px at a readable size. The floor
        // is applied ONLY past three columns — measured at 390, a flat
        // min-w-[560px] made the two-column table scroll 222px when it fit the
        // viewport with room to spare, which is a worse read than a plain table.
        <div className="overflow-x-auto mb-6 border-2 border-foreground">
          <table
            className={`w-full text-left border-collapse ${
              section.table.columns.length > 3 ? "min-w-[560px]" : ""
            }`}
          >
            <caption className="sr-only">{section.table.caption}</caption>
            <thead>
              <tr className="bg-foreground text-background">
                {section.table.columns.map((column) => (
                  <th key={column} scope="col" className="font-heading text-xs uppercase tracking-widest p-3 align-bottom">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row[0]} className="border-t border-foreground/15 align-top">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={
                        i === 0
                          ? "p-3 font-heading font-bold text-sm uppercase tracking-wide"
                          : "p-3 text-muted-foreground text-sm leading-relaxed"
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.body?.map((paragraph) => (
        <p key={paragraph} className="text-muted-foreground text-lg leading-relaxed mb-4">
          {paragraph}
        </p>
      ))}

      {section.list && (
        <ul className="space-y-3 mb-4">
          {section.list.map((item) => (
            <li key={item} className="flex gap-3 text-muted-foreground text-lg leading-relaxed">
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-4 bg-accent shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {section.links?.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="inline-flex items-center gap-2 font-heading font-bold uppercase tracking-wide text-accent hover:underline"
        >
          {link.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      ))}
    </section>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = postBySlug(slug);

  // Before the early return: hooks cannot be conditional, and the not-found
  // state needs its meta set too — otherwise it inherits the title of whatever
  // page the visitor walked in from.
  usePageMeta(
    post
      ? { title: post.title, description: post.description }
      : {
          title: "Answer not found",
          description: "That answer page does not exist.",
          // An unknown slug under /blog is a dead URL, not content. Same reason
          // as the site 404: never a search result, and never worth crawl budget.
          robots: "noindex, follow",
        }
  );
  useJsonLd("article", post ? articleGraph(post, `${SITE_ORIGIN}${postPath(post)}`) : null);
  useJsonLd(
    "breadcrumb",
    breadcrumbGraph(
      post
        ? [
            { name: "Home", path: "/" },
            { name: "Answers", path: "/blog" },
            { name: post.title, path: postPath(post) },
          ]
        : [
            { name: "Home", path: "/" },
            { name: "Answers", path: "/blog" },
          ]
    )
  );

  if (!post) {
    return (
      <div className="pt-16 bg-background">
        <section className="px-6 md:px-10 py-24">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tight mb-4">
              We don't have that one
            </h1>
            <div className="h-1.5 bg-accent w-24 mb-6" />
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              That answer page does not exist. Everything we have written is on the answers index — or call and ask,
              which is faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/blog"
                className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 font-heading font-black uppercase tracking-wider hover:bg-foreground/90 transition-colors"
              >
                All answers
              </Link>
              <a
                href={CONTACT_PHONE_HREF}
                className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-4 font-heading font-black uppercase tracking-wider hover:bg-accent/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                {CONTACT_PHONE}
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const others = POSTS.filter((other) => other.slug !== post.slug);

  return (
    <div className="pt-16 bg-background">
      <article>
        {/* The question, then the answer, and nothing between them. §8.2's whole
            point: an assistant summarising this page reads the top of it. */}
        <header className="bg-foreground px-6 md:px-10 py-16 md:py-20">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 font-heading text-accent text-sm uppercase tracking-[0.3em] mb-6 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Answers
              </Link>
              <h1 className="font-heading font-black text-background text-3xl md:text-5xl uppercase leading-[1.05] tracking-tight mb-6">
                {post.question}
              </h1>
              <div className="h-1.5 bg-accent w-24" />
            </motion.div>
          </div>
        </header>

        <div className="px-6 md:px-10 py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <div className="border-l-4 border-accent pl-6 mb-14">
              {post.answer.map((paragraph) => (
                <p key={paragraph} className="text-foreground text-lg md:text-xl leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {post.sections.map((section) => (
              <Section key={section.heading} section={section} />
            ))}
          </div>
        </div>
      </article>

      <section className="bg-accent px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading font-black text-white text-3xl md:text-4xl uppercase tracking-tight mb-3">
            Ask us about your situation
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            The walkthrough is free and carries no obligation to sell through us. If the answer is that you don't need
            us, that's a fine answer to get.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={CONTACT_PHONE_HREF}
              className="inline-flex items-center justify-center gap-3 bg-background text-foreground px-8 py-4 font-heading font-black text-lg uppercase tracking-wider hover:bg-background/90 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {CONTACT_PHONE}
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-background text-background px-8 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-background/10 transition-colors"
            >
              Send a message
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-tight mb-2">
            Other answers
          </h2>
          <div className="h-1.5 bg-accent w-16 mb-8" />
          <div className="border border-foreground">
            {others.map((other) => (
              <Link
                key={other.slug}
                to={postPath(other)}
                className="block p-5 md:p-6 border-b border-foreground/15 last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-heading font-black text-lg uppercase tracking-tight mb-1">{other.question}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{other.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
