import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => setCartItems([]);

  const total = cartItems.reduce((sum, i) => sum + Number(i.price), 0);
  const count = cartItems.length;

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}