import { createContext, useState, useEffect, useCallback, useContext } from 'react';

export const CartContext = createContext({
  cartItems: [],
  addToCart: () => {},
  updateQty: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  cartCount: 0,
});

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bagsearch_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('bagsearch_cart', JSON.stringify(cartItems)); } catch {}
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, qty) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
