import { ProductsStorage } from '@lessence/supabase';
import { Product } from '@lessence/core';

const PRODUCTS_KEY_PREFIX = 'lessence_products_';

export const webProductsStorage: ProductsStorage = {
  async getProducts(categorySlug: string = 'all'): Promise<Product[] | null> {
    try {
      const raw = localStorage.getItem(`${PRODUCTS_KEY_PREFIX}${categorySlug}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async setProducts(products: Product[], categorySlug: string = 'all'): Promise<void> {
    try {
      localStorage.setItem(
        `${PRODUCTS_KEY_PREFIX}${categorySlug}`,
        JSON.stringify(products)
      );
    } catch {
      // LocalStorage might be full or private mode
    }
  }
};
