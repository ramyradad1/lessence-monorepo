"use client";

import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Product, Inventory, Category } from '@lessence/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminProducts(supabase: SupabaseClient) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string | undefined>();

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return (data || []) as Category[];
    }
  });

  // Fetch Products
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['admin-products', searchTerm],
    queryFn: async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Product[];
    }
  });

  // The UI calls fetchProducts(search) on input change
  const fetchProducts = useCallback((search?: string) => {
    setSearchTerm(search);
  }, []);

  // Use Mutations for actions
  const createProductMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const createProduct = useCallback(async (product: Partial<Product>) => {
    try {
      const data = await createProductMutation.mutateAsync(product);
      return { success: true, product: data };
    } catch (err: any) {
      console.error('Create product error:', err);
      return { success: false, error: err.message };
    }
  }, [createProductMutation]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const data = await updateProductMutation.mutateAsync({ id, updates });
      return { success: true, product: data };
    } catch (err: any) {
      console.error('Update product error:', err);
      return { success: false, error: err.message };
    }
  }, [updateProductMutation]);

  const toggleProductActive = useCallback(async (id: string, is_active: boolean) => {
    return updateProduct(id, { is_active } as any);
  }, [updateProduct]);

  const toggleProductNew = useCallback(async (id: string, is_new: boolean) => {
    return updateProduct(id, { is_new } as any);
  }, [updateProduct]);

  const bulkUpdateProductStatusMutation = useMutation({
    mutationFn: async ({ productIds, status, isActive }: { productIds: string[], status: string, isActive: boolean }) => {
      const { error } = await supabase.rpc('admin_bulk_update_product_status', {
        p_product_ids: productIds,
        p_status: status,
        p_is_active: isActive
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const bulkUpdateProductStatus = useCallback(async (productIds: string[], status: string, isActive: boolean) => {
    try {
      await bulkUpdateProductStatusMutation.mutateAsync({ productIds, status, isActive });
      return { success: true };
    } catch (err: any) {
      console.error('Bulk update status error:', err);
      return { success: false, error: err.message };
    }
  }, [bulkUpdateProductStatusMutation]);

  // Inventory management
  const fetchInventory = useCallback(async (productId: string): Promise<Inventory[]> => {
    const { data } = await supabase.from('inventory').select('*').eq('product_id', productId).order('size');
    return data || [];
  }, [supabase]);

  const upsertInventory = useCallback(async (productId: string, size: string, quantity: number) => {
    try {
      const { error } = await supabase.from('inventory')
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

  const saveProductFullMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.rpc('admin_save_product', payload);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const saveProductFull = useCallback(async (payload: any) => {
    try {
      const productId = await saveProductFullMutation.mutateAsync(payload);
      return { success: true, productId };
    } catch (err: any) {
      console.error('Save product full error:', err);
      return { success: false, error: err.message };
    }
  }, [saveProductFullMutation]);

  // Image upload
  const uploadProductImage = useCallback(async (file: File, productId: string): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${productId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      // Ensure image is cache-busted natively on edge
      return `${data.publicUrl}?v=${Date.now()}`;
    } catch (err) {
      console.error('Upload image error:', err);
      return null;
    }
  }, [supabase]);

  return {
    products,
    categories,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    saveProductFull,
    toggleProductActive,
    toggleProductNew,
    bulkUpdateProductStatus,
    fetchInventory,
    upsertInventory,
    uploadProductImage,
  };
}
