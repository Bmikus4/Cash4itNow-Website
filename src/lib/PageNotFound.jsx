import { Link, useLocation } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { usePageMeta } from "@/lib/usePageMeta";

/**
 * A visitor who lands here mistyped a URL or followed a stale link from
 * somewhere we do not control — a Facebook post, a printed flyer. They are not
 * lost customers unless the page makes them one, so this carries the site's
 * navigation and the phone number rather than a single Go Home button.
 *
 * Rendered inside AppLayout, so the navbar and footer come with it.
 */
export default function PageNotFound() {
  const location = useLocation();
  // noindex: an error page must never be a search result, and crawl budget spent
  // here is budget not spent on sale pages. follow, so the links out of it still
  // feed the crawl.
  usePageMeta({
    title: "Page Not Found",
    description:
      "That page could not be found. Everything Cash 4 It Now buys, the upcoming estate sales, and the free evaluation form are all one tap away.",
    robots: "noindex, follow",
  });

  return (
    <section className="bg-foreground min-h-[70vh] flex items-center px-6 md:px-10 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-heading font-black text-accent text-7xl md:text-8xl leading-none">404</p>
        <div className="h-1.5 bg-accent w-24 mx-auto my-6" />
        <h1 className="font-heading font-black text-background text-4xl md:text-5xl uppercase tracking-tight mb-4">
          Page Not Found
        </h1>
        <p className="text-background/70 text-base md:text-lg leading-relaxed mb-10">
          Nothing lives at <span className="text-background font-heading">{location.pathname}</span>. It may have
          moved, or the link that sent you here may be out of date. Everything we buy, every upcoming sale, and the
          evaluation form are all a tap away.
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
            to="/"
            className="inline-flex items-center justify-center gap-2 border-2 border-background text-background px-8 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-background/10 transition-colors"
          >
            Back to Home
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
