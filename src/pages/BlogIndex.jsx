import React from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { POSTS, postPath } from "@/content/posts";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { usePageMeta } from "@/lib/usePageMeta";
import { useJsonLd, blogGraph, breadcrumbGraph } from "@/lib/structuredData";

/**
 * The index is a list of questions, not a list of articles — no dates, no
 * excerpts-with-read-more, no author line. These are reference pages that stay
 * true rather than posts that age, and dating them invites the reader to
 * discount the older ones for no reason.
 */
export default function BlogIndex() {
  usePageMeta({
    title: "Answers",
    description:
      "Straight answers to what executors, families and realtors ask before an estate is cleared — what the options are, what order to do things in, and what happens to what doesn't sell.",
  });
  useJsonLd("blog", blogGraph(POSTS, postPath));
  useJsonLd(
    "breadcrumb",
    breadcrumbGraph([
      { name: "Home", path: "/" },
      { name: "Answers", path: "/blog" },
    ])
  );

  return (
    <div className="pt-16 bg-background">
      <section className="bg-foreground px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-4">Answers</p>
            <h1 className="font-heading font-black text-background text-4xl md:text-6xl uppercase leading-[0.95] tracking-tight mb-4">
              The questions people call and ask
            </h1>
            <div className="h-1.5 bg-accent w-24 mb-6" />
            <p className="text-background/70 text-lg leading-relaxed max-w-2xl">
              Written for whoever is holding the keys — an executor, a family member, or the realtor who cannot list a
              house until somebody empties it. Every page answers its question in the first paragraph.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="border-2 border-foreground">
            {POSTS.map((post, i) => (
              <Link
                key={post.slug}
                to={postPath(post)}
                className="group flex gap-5 p-6 md:p-8 border-b border-foreground/15 last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <span className="font-heading font-black text-accent text-2xl md:text-3xl leading-none shrink-0 w-10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block font-heading font-black text-xl md:text-2xl uppercase tracking-tight mb-2">
                    {post.question}
                  </span>
                  <span className="block text-muted-foreground leading-relaxed mb-3">{post.description}</span>
                  <span className="inline-flex items-center gap-2 font-heading font-bold text-sm uppercase tracking-wide text-accent">
                    Read the answer
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-tight mb-3">
            Not the question you have?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Call and ask it. The walkthrough is free and carries no obligation to sell through us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={CONTACT_PHONE_HREF}
              className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-4 font-heading font-black text-lg uppercase tracking-wider hover:bg-accent/90 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {CONTACT_PHONE}
            </a>
            <Link
              to="/for-professionals"
              className="inline-flex items-center justify-center gap-2 border-2 border-foreground px-8 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-foreground/5 transition-colors"
            >
              For realtors &amp; attorneys
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
