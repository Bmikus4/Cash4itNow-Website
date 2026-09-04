import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { useLeadForm, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import Wordmark from "@/components/brand/Wordmark";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [error, setError] = useState("");
  const { honeypotField, submit } = useLeadForm();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    const result = await submit("footer_newsletter", { email });
    if (!result.ok) {
      setStatus("error");
      setError(result.message);
      return;
    }
    setStatus("success");
    setError("");
    setEmail("");
  };

  return (
    <footer className="bg-foreground text-background">
      {/* Big brand name */}
      <div className="border-b border-background/10 overflow-hidden py-10 md:py-14">
        {/* The 4 is recoloured on the STROKE, not the fill: this wordmark is
            transparent text and the fill is exactly what has been switched off,
            so text-accent alone would change nothing visible here. */}
        <h2
          className="font-heading font-black text-[13vw] leading-none tracking-tight text-transparent whitespace-nowrap select-none px-4 uppercase"
          style={{ WebkitTextStroke: "2px white" }}
        >
          <Wordmark accentStyle={{ WebkitTextStroke: "2px hsl(var(--accent))" }} />
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <p className="font-heading text-accent text-xs uppercase tracking-widest mb-3">
              Estate Liquidators
            </p>
            <p className="text-background/70 text-sm leading-relaxed">
              Veteran-owned. Full estate liquidation services across Western Pennsylvania. We pay cash on the spot.
            </p>
            <p className="font-heading font-bold text-background text-lg mt-4">Veteran-Owned</p>
          </div>

          <div>
            <p className="font-heading text-accent text-xs uppercase tracking-widest mb-3">
              Navigate
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Home", path: "/" },
                { label: "Upcoming Sales", path: "/upcoming-sales" },
                { label: "Shop", path: "/shop" },
                { label: "What We Buy", path: "/categories" },
                { label: "Our Story", path: "/about" },
                // Footer, not the top nav. Every page linking to /blog is what
                // the answer pages need to be crawled and to pass authority;
                // a sixth item in the primary nav is a layout decision at 1440
                // and Ben's eye, so it is raised with him rather than taken here.
                { label: "Answers", path: "/blog" },
                { label: "Contact", path: "/contact" },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="font-heading text-background/70 hover:text-accent transition-colors uppercase text-sm tracking-wide">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="font-heading text-accent text-xs uppercase tracking-widest mb-3">
              Contact Us
            </p>
            <div className="flex flex-col gap-3">
              <a href="tel:4129697757" className="flex items-center gap-2 text-background hover:text-accent transition-colors font-heading font-bold text-lg">
                <Phone className="w-4 h-4" />
                412-969-7757
              </a>
              <a href="mailto:info@cash4itnow.com" className="flex items-center gap-2 text-background/70 hover:text-accent transition-colors text-sm">
                <Mail className="w-4 h-4" />
                Cash4itnow.com
              </a>
              <span className="flex items-start gap-2 text-background/70 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Pittsburgh, PA &amp; Western Pennsylvania
              </span>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/10 mt-10 pt-10">
          <div className="max-w-xl mx-auto text-center mb-6">
            <p className="font-heading text-accent text-xs uppercase tracking-widest mb-2">Stay In The Loop</p>
            <h3 className="font-heading font-black text-background text-2xl md:text-3xl uppercase tracking-tight mb-2">
              Get Notified About New Sales
            </h3>
            <p className="text-background/60 text-sm">Be the first to know when we post new inventory or upcoming estate sales.</p>
          </div>
          {status === "success" ? (
            <p className="text-center font-heading font-bold text-accent uppercase tracking-widest text-sm">You're on the list!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
              {honeypotField}
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-background/10 border border-background/30 text-background placeholder-background/40 px-4 py-3 text-sm font-body focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-accent text-white font-heading font-black text-sm uppercase tracking-widest px-6 py-3 hover:bg-accent/90 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {status === "loading" ? "..." : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-center text-background/70 text-sm mt-3">
              {error}{" "}
              <a href={CONTACT_PHONE_HREF} className="font-heading font-bold text-accent hover:underline">
                {CONTACT_PHONE}
              </a>
            </p>
          )}
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 text-center">
          <p className="text-background/40 text-xs">
            © {new Date().getFullYear()} Cash 4 It Now Estate Liquidators. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}