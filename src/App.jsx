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
import SalePage from './pages/SalePage';

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
                <Route path="/sale/:slug" element={<SalePage />} />
                <Route path="/favorites" element={<Favorites />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </FavoritesProvider>
      </CartProvider>
    </QueryClientProvider>
  )
}

export default App
