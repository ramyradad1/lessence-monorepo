import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { Product } from "@lessence/core";
import { supabase } from "../lib/supabase";
import {
  useAuth,
  useFavorites as useSharedFavorites,
  FavoritesStorage,
} from "@lessence/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Mobile AsyncStorage adapter ──
const FAVORITES_KEY = "lessence_favorites";

const mobileFavoritesStorage: FavoritesStorage = {
  async getGuestFavorites(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  async setGuestFavorites(items: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
    } catch {
      /* noop */
    }
  },
  async clearGuestFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
    } catch {
      /* noop */
    }
  },
};

// ── Context type ──
interface FavoritesContextType {
  favorites: string[];
  favoriteProducts: Product[];
  toggleFavorite: (product: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const engine = useSharedFavorites(supabase, user?.id, mobileFavoritesStorage);

  const value = useMemo(
    () => ({
      favorites: Array.from(engine.favoriteIds),
      favoriteProducts: [], // Not provided by this hook directly; handled in screens
      toggleFavorite: engine.toggleFavorite,
      isFavorite: engine.isFavorite,
    }),
    [engine.favoriteIds, engine.toggleFavorite, engine.isFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
