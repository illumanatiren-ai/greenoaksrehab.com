"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type CartItem = { id: string; qty: number };
type Ctx = {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "go_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((id: string, qty = 1) => {
    setItems((cur) => {
      const found = cur.find((i) => i.id === id);
      if (found) return cur.map((i) => (i.id === id ? { ...i, qty: Math.min(20, i.qty + qty) } : i));
      return [...cur, { id, qty }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setItems((cur) => (qty <= 0 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, qty: Math.min(20, qty) } : i))));
  }, []);
  const remove = useCallback((id: string) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  return <CartCtx.Provider value={{ items, count, ready, add, setQty, remove, clear }}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
