"use client";

import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Brand {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  logo_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useAdminBrands(supabase: SupabaseClient) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string | undefined>();

  // Fetch Brands
  const { data: brands = [], isLoading: loading } = useQuery({
    queryKey: ['admin-brands', searchTerm],
    queryFn: async () => {
      let query = supabase.from('brands').select('*').order('sort_order', { ascending: true });
      if (searchTerm) {
        query = query.ilike('name_en', `%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Brand[];
    }
  });

  const fetchBrands = useCallback((search?: string) => {
    setSearchTerm(search);
  }, []);

  // Use Mutations for actions
  const createBrandMutation = useMutation({
    mutationFn: async (brand: Partial<Brand>) => {
      const { data, error } = await supabase
        .from('brands')
        .insert({
          ...brand,
          is_active: brand.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    }
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Brand> }) => {
      const { data, error } = await supabase
        .from('brands')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    }
  });

  const createBrand = useCallback(async (brand: Partial<Brand>) => {
    try {
      const data = await createBrandMutation.mutateAsync(brand);
      return { success: true, brand: data };
    } catch (err: any) {
      console.error('Create brand error:', err);
      return { success: false, error: err.message };
    }
  }, [createBrandMutation]);

  const updateBrand = useCallback(async (id: string, updates: Partial<Brand>) => {
    try {
      const data = await updateBrandMutation.mutateAsync({ id, updates });
      return { success: true, brand: data };
    } catch (err: any) {
      console.error('Update brand error:', err);
      return { success: false, error: err.message };
    }
  }, [updateBrandMutation]);

  const deleteBrand = useCallback(async (id: string) => {
    try {
      await deleteBrandMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      console.error('Delete brand error:', err);
      return { success: false, error: err.message };
    }
  }, [deleteBrandMutation]);

  const toggleBrandActive = useCallback(async (id: string, is_active: boolean) => {
    return updateBrand(id, { is_active } as any);
  }, [updateBrand]);

  return {
    brands,
    loading,
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    toggleBrandActive,
  };
}
