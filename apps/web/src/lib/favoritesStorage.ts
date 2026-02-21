import { FavoritesStorage } from '@lessence/supabase';

const FAV_KEY = 'lessence_favorites';

export const webFavoritesStorage: FavoritesStorage = {
  async getGuestFavorites(): Promise<string[]> {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async setGuestFavorites(ids: string[]): Promise<void> {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)); } catch { /* noop */ }
  },
  async clearGuestFavorites(): Promise<void> {
    try { localStorage.removeItem(FAV_KEY); } catch { /* noop */ }
  },
};
