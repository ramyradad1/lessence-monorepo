import { RecentlyViewedStorage } from '@lessence/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REC_KEY = 'lessence_recently_viewed';

export const mobileRecentlyViewedStorage: RecentlyViewedStorage = {
  async getGuestRecentlyViewed(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(REC_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async setGuestRecentlyViewed(ids: string[]): Promise<void> {
    try { await AsyncStorage.setItem(REC_KEY, JSON.stringify(ids)); } catch { /* noop */ }
  },
  async clearGuestRecentlyViewed(): Promise<void> {
    try { await AsyncStorage.removeItem(REC_KEY); } catch { /* noop */ }
  },
};
