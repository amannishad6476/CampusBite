import React, { createContext, useState, useContext, ReactNode } from 'react';
import { FoodItem, CartItem } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  shopId: string | null;
  addToCart: (item: FoodItem, quantity: number, notes?: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);

  const addToCart = (item: FoodItem, quantity: number, notes = '') => {
    // If the cart already has items from another shop, prevent addition
    if (shopId && shopId !== item.shop_id) {
      throw new Error('You cannot add items from a different shop. Clear your cart first.');
    }

    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.food_item.id === item.id);
      
      if (existingItemIndex > -1) {
        // Update quantity if item already exists in cart
        const updated = [...prevItems];
        updated[existingItemIndex].quantity += quantity;
        updated[existingItemIndex].notes = notes || updated[existingItemIndex].notes;
        return updated;
      } else {
        // Add new item to cart
        if (!shopId) {
          setShopId(item.shop_id);
        }
        return [...prevItems, { food_item: item, quantity, notes }];
      }
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) => {
      if (quantity <= 0) {
        const filtered = prevItems.filter((i) => i.food_item.id !== itemId);
        if (filtered.length === 0) setShopId(null);
        return filtered;
      }
      return prevItems.map((i) =>
        i.food_item.id === itemId ? { ...i, quantity } : i
      );
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const filtered = prevItems.filter((i) => i.food_item.id !== itemId);
      if (filtered.length === 0) setShopId(null);
      return filtered;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setShopId(null);
  };

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cartItems.reduce((acc, i) => acc + i.food_item.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        shopId,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
};
export default CartContext;
