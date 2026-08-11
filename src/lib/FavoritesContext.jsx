import React, { createContext, useContext, useState, useEffect } from "react";

const FavoritesContext = createContext();
const STORAGE_KEY = "c4in_favorites";

export function FavoritesProvider({ children }) {
  // The first render is always empty, even in a browser holding a saved list.
  // Reading storage during render makes the first client render disagree with
  // any pre-rendered HTML, and hydration resolves that disagreement by throwing
  // one of the two away.
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setFavorites(stored);
    } catch {
      // No storage (private mode), or the value is not JSON: start empty.
    }
    setLoaded(true);
  }, []);

  // Guarded on `loaded`, and that guard is the whole point: without it this
  // effect fires on mount with the empty initial state and overwrites the saved
  // list before the load above has committed. The list would survive in memory
  // and be gone from storage.
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Storage full or blocked. Favourites still work for this session.
    }
  }, [favorites, loaded]);

  const toggleFavorite = (itemId) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const isFavorite = (itemId) => favorites.includes(itemId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
