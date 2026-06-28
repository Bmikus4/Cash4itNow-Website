import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Heart } from "lucide-react";
import { useFavorites } from "@/lib/FavoritesContext";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "What We Buy", path: "/categories" },
  { label: "For Sale", path: "/for-sale" },
  { label: "Our Story", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { favorites } = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-foreground shadow-lg" : "bg-foreground"
      }`}>
        {/* Top red bar */}
        <div className="bg-accent h-1 w-full" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-18">
          <Link to="/" className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-background uppercase leading-none">
            Cash 4 It Now
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-heading text-sm tracking-wider uppercase transition-colors duration-200 ${
                  location.pathname === link.path
                    ? "text-accent"
                    : "text-background/80 hover:text-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link to="/favorites" className="hidden md:flex items-center justify-center relative p-2 text-background/80 hover:text-accent transition-colors">
            <Heart className={`w-5 h-5 ${favorites.length > 0 ? "fill-accent text-accent" : ""}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-heading font-black flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
          <a
            href="tel:4129697757"
            className="hidden md:flex items-center gap-2 bg-accent text-white px-5 py-2.5 font-heading text-sm font-bold tracking-wider uppercase hover:bg-accent/90 transition-colors"
          >
            <Phone className="w-4 h-4" />
            412-969-7757
          </a>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-background"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground flex flex-col items-center justify-center gap-6"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  to={link.path}
                  className={`font-heading text-4xl font-bold uppercase tracking-wide ${
                    location.pathname === link.path ? "text-accent" : "text-background hover:text-accent"
                  } transition-colors`}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navLinks.length * 0.07 }}
            >
              <Link
                to="/favorites"
                className={`font-heading text-4xl font-bold uppercase tracking-wide flex items-center gap-3 ${
                  location.pathname === "/favorites" ? "text-accent" : "text-background hover:text-accent"
                } transition-colors`}
              >
                <span className="relative">
                  <Heart className={`w-7 h-7 ${favorites.length > 0 ? "fill-accent text-accent" : ""}`} />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white text-[11px] font-heading font-black flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </span>
                Saved Items
              </Link>
            </motion.div>
            <motion.a
              href="tel:4129697757"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.39 }}
              className="flex items-center gap-2 bg-accent text-white px-8 py-4 font-heading text-xl font-bold uppercase mt-4"
            >
              <Phone className="w-5 h-5" />
              412-969-7757
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}