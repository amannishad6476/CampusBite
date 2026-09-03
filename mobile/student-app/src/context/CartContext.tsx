import React, { createContext, useState, useContext, ReactNode } from 'react';
import { FoodItem, CartItem } from '../types';
import { APP_CONFIG } from '../utils/config';

interface CartContextType {
  cartItems: CartItem[];
  shopId: string | null;
  shopName: string | null;
  addToCart: (item: FoodItem, quantity: number, notes?: string, shopName?: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  reorderItems: (newItems: { food_item: FoodItem; quantity: number; notes?: string }[], newShopId: string, newShopName: string) => void;
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  taxFee: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  const addToCart = (item: FoodItem, quantity: number, notes = '', itemShopName = '') => {
    // If the cart already has items from another shop, prevent addition
    if (shopId && shopId !== item.shop_id) {
      throw new Error('Your cart contains items from a different canteen. Please clear your cart first.');
    }

    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.food_item.id === item.id);
      
      if (existingItemIndex > -1) {
        // Update quantity if item already exists in cart
        const updated = [...prevItems];
        updated[existingItemIndex].quantity += quantity;
        if (notes) {
          updated[existingItemIndex].notes = notes;
        }
        return updated;
      } else {
        // Add new item to cart
        if (!shopId) {
          setShopId(item.shop_id);
          if (itemShopName) setShopName(itemShopName);
        }
        return [...prevItems, { food_item: item, quantity, notes }];
      }
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) => {
      if (quantity <= 0) {
        const filtered = prevItems.filter((i) => i.food_item.id !== itemId);
        if (filtered.length === 0) {
          setShopId(null);
          setShopName(null);
        }
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
      if (filtered.length === 0) {
        setShopId(null);
        setShopName(null);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setShopId(null);
    setShopName(null);
  };

  const reorderItems = (
    newItems: { food_item: FoodItem; quantity: number; notes?: string }[],
    newShopId: string,
    newShopName: string
  ) => {
    setShopId(newShopId);
    setShopName(newShopName);
    setCartItems(newItems);
  };

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = cartItems.reduce((acc, i) => acc + Number(i.food_item.price) * i.quantity, 0);
  const deliveryFee = cartCount > 0 ? APP_CONFIG.defaultDeliveryFee : 0;
  const taxFee = cartCount > 0 ? APP_CONFIG.defaultTaxFee : 0;
  const grandTotal = subtotal + deliveryFee + taxFee;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        shopId,
        shopName,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        reorderItems,
        cartCount,
        subtotal,
        deliveryFee,
        taxFee,
        grandTotal,
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
