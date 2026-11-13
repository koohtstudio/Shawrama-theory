"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";

export type CartLine = {
  key: string;
  itemId: string;
  name: string;
  image: string | null;
  unitCents: number; // display only. The server re-prices everything.
  placeholderPrice: boolean;
  qty: number;
  modifierIds: string[];
  modifierNames: string[];
};

type State = { lines: CartLine[]; hydrated: boolean };
type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: Omit<CartLine, "key" | "qty">; qty: number }
  | { type: "qty"; key: string; qty: number }
  | { type: "clear" };

const STORAGE_KEY = "st-cart-v1";
export const lineKey = (itemId: string, modifierIds: string[]) => `${itemId}:${[...modifierIds].sort().join(",")}`;

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "hydrate":
      return { lines: a.lines, hydrated: true };
    case "add": {
      const key = lineKey(a.line.itemId, a.line.modifierIds);
      const existing = s.lines.find((l) => l.key === key);
      const lines = existing
        ? s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + a.qty), unitCents: a.line.unitCents } : l))
        : [...s.lines, { ...a.line, key, qty: a.qty }];
      return { ...s, lines };
    }
    case "qty":
      return { ...s, lines: s.lines.map((l) => (l.key === a.key ? { ...l, qty: a.qty } : l)).filter((l) => l.qty > 0) };
    case "clear":
      return { ...s, lines: [] };
  }
}

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  toast: string;
  flash: (msg: string) => void;
};

const Ctx = createContext<CartValue | null>(null);
export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart outside CartProvider");
  return v;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "hydrate", lines: raw ? (JSON.parse(raw) as CartLine[]) : [] });
    } catch {
      dispatch({ type: "hydrate", lines: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      /* private mode: cart just won't persist */
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((line: Omit<CartLine, "key" | "qty">, qty = 1) => dispatch({ type: "add", line, qty }), []);
  const setQty = useCallback((key: string, qty: number) => dispatch({ type: "qty", key, qty }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const flash = useCallback((m: string) => setToast(m), []);

  const value = useMemo<CartValue>(
    () => ({
      lines: state.lines,
      count: state.lines.reduce((n, l) => n + l.qty, 0),
      subtotalCents: state.lines.reduce((n, l) => n + l.unitCents * l.qty, 0),
      add, setQty, clear, open, setOpen, toast, flash,
    }),
    [state.lines, add, setQty, clear, open, toast, flash],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
