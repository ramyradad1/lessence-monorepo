import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product, Inventory, Category } from '@lessence/core';

export function useAdminProducts(supabase: SupabaseClient) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(data || []);
  }, [supabase]);

  const createProduct = useCallback(async (product: Partial<Product>) => {
    try {
      const slug = product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
      const sku = product.sku || `SKU-${Date.now()}`;

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          slug,
          sku,
          is_active: product.is_active ?? true,
          is_new: product.is_new ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => [data, ...prev]);
      return { success: true, product: data };
    } catch (err: any) {
      console.error('Create product error:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      return { success: true, product: data };
    } catch (err: any) {
      console.error('Update product error:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  const toggleProductActive = useCallback(async (id: string, is_active: boolean) => {
    return updateProduct(id, { is_active } as any);
  }, [updateProduct]);

  const toggleProductNew = useCallback(async (id: string, is_new: boolean) => {
    return updateProduct(id, { is_new } as any);
  }, [updateProduct]);

  // Inventory management
  const fetchInventory = useCallback(async (productId: string): Promise<Inventory[]> => {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId)
      .order('size');
    return data || [];
  }, [supabase]);

  const upsertInventory = useCallback(async (productId: string, size: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .upsert(
          { product_id: productId, size, quantity_available: quantity, updated_at: new Date().toISOString() },
          { onConflict: 'product_id,size' }
        );
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [supabase]);

  // Image upload to Supabase Storage
  const uploadProductImage = useCallback(async (file: File, productId: string): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${productId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Upload image error:', err);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  return {
    products,
    categories,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleProductActive,
    toggleProductNew,
    fetchInventory,
    upsertInventory,
    uploadProductImage,
  };
}
