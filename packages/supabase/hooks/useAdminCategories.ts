"use client";

import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Category } from '@lessence/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminCategories(supabase: SupabaseClient) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string | undefined>();

  // Fetch Categories
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['admin-categories', searchTerm],
    queryFn: async () => {
      let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (searchTerm) {
        query = query.ilike('name_en', `%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Category[];
    }
  });

  const fetchCategories = useCallback((search?: string) => {
    setSearchTerm(search);
  }, []);

  // Use Mutations for actions
  const createCategoryMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const slug = category.name_en?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          slug,
          is_active: category.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const createCategory = useCallback(async (category: Partial<Category>) => {
    try {
      const data = await createCategoryMutation.mutateAsync(category);
      return { success: true, category: data };
    } catch (err: any) {
      console.error('Create category error:', err);
      return { success: false, error: err.message };
    }
  }, [createCategoryMutation]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const data = await updateCategoryMutation.mutateAsync({ id, updates });
      return { success: true, category: data };
    } catch (err: any) {
      console.error('Update category error:', err);
      return { success: false, error: err.message };
    }
  }, [updateCategoryMutation]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      console.error('Delete category error:', err);
      return { success: false, error: err.message };
    }
  }, [deleteCategoryMutation]);

  const toggleCategoryActive = useCallback(async (id: string, is_active: boolean) => {
    return updateCategory(id, { is_active } as any);
  }, [updateCategory]);

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
  };
}
