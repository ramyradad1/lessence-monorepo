import { RecentlyViewedStorage } from '@lessence/supabase';

const REC_KEY = 'lessence_recently_viewed';

export const webRecentlyViewedStorage: RecentlyViewedStorage = {
  async getGuestRecentlyViewed(): Promise<string[]> {
    try {
      const raw = localStorage.getItem(REC_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  async setGuestRecentlyViewed(ids: string[]): Promise<void> {
    try { localStorage.setItem(REC_KEY, JSON.stringify(ids)); } catch { /* noop */ }
  },
  async clearGuestRecentlyViewed(): Promise<void> {
    try { localStorage.removeItem(REC_KEY); } catch { /* noop */ }
  },
};
