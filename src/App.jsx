import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { CartProvider } from '@/lib/CartContext';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import Favorites from './pages/Favorites';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Categories from './pages/Categories';
import About from './pages/About';
import Contact from './pages/Contact';
import ForSale from './pages/ForSale';
import UpcomingSales from './pages/UpcomingSales';
import ForProfessionals from './pages/ForProfessionals';
import SalePage from './pages/SalePage';
import BlogIndex from './pages/BlogIndex';
import BlogPost from './pages/BlogPost';

// Every route here is public. There is no sign-in and no admin surface on the
// website — the tool is the admin — so there is nothing to gate and nothing to
// wait for before the first paint.
function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <CartProvider>
        <FavoritesProvider>
          <Router>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/for-sale" element={<ForSale />} />
                {/* The public end of the tool's catalogs. Static, unlike
                    /sale/:slug: the LIST is one URL and can be prerendered and
                    put in the sitemap, while the individual sales behind it
                    cannot, because their slugs only exist once a catalog is
                    published. */}
                <Route path="/upcoming-sales" element={<UpcomingSales />} />
                <Route path="/for-professionals" element={<ForProfessionals />} />
                <Route path="/blog" element={<BlogIndex />} />
                {/* Parameterised, but unlike /sale/:slug its complete slug list
                    is known at build time from src/content/posts.js — so the
                    route gate, vercel.json, the prerender crawl and the sitemap
                    all expand it into one route per post. See postExpansions(). */}
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/sale/:slug" element={<SalePage />} />
                <Route path="/favorites" element={<Favorites />} />
                {/* Inside the layout: a 404 outside it is a dead end with no
                    nav, which is what a mistyped URL or a stale link off a
                    Facebook post lands on. */}
                <Route path="*" element={<PageNotFound />} />
              </Route>
            </Routes>
          </Router>
          <Toaster />
        </FavoritesProvider>
      </CartProvider>
    </QueryClientProvider>
  )
}

export default App
