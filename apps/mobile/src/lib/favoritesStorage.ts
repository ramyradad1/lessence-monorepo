import { FavoritesStorage } from '@lessence/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAV_KEY = 'lessence_favorites';

export const mobileFavoritesStorage: FavoritesStorage = {
  async getGuestFavorites(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async setGuestFavorites(ids: string[]): Promise<void> {
    try { await AsyncStorage.setItem(FAV_KEY, JSON.stringify(ids)); } catch { /* noop */ }
  },
  async clearGuestFavorites(): Promise<void> {
    try { await AsyncStorage.removeItem(FAV_KEY); } catch { /* noop */ }
  },
};
