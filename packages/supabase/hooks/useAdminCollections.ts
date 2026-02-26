import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Collection {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  is_active: boolean;
  show_on_homepage: boolean;
  is_smart: boolean;
  smart_rules?: any;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useAdminCollections(supabase: SupabaseClient) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string | undefined>();

  // Fetch Collections
  const { data: collections = [], isLoading: loading } = useQuery({
    queryKey: ['admin-collections', searchTerm],
    queryFn: async () => {
      let query = supabase.from('collections').select('*').order('sort_order', { ascending: true });
      if (searchTerm) {
        query = query.ilike('name_en', `%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Collection[];
    }
  });

  const fetchCollections = useCallback((search?: string) => {
    setSearchTerm(search);
  }, []);

  // Use Mutations for actions
  const createCollectionMutation = useMutation({
    mutationFn: async (collection: Partial<Collection>) => {
      const slug = collection.name_en?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
      const { data, error } = await supabase
        .from('collections')
        .insert({
          ...collection,
          slug,
          is_active: collection.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Collection> }) => {
      const { data, error } = await supabase
        .from('collections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('collections').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  });

  const createCollection = useCallback(async (collection: Partial<Collection>) => {
    try {
      const data = await createCollectionMutation.mutateAsync(collection);
      return { success: true, collection: data };
    } catch (err: any) {
      console.error('Create collection error:', err);
      return { success: false, error: err.message };
    }
  }, [createCollectionMutation]);

  const updateCollection = useCallback(async (id: string, updates: Partial<Collection>) => {
    try {
      const data = await updateCollectionMutation.mutateAsync({ id, updates });
      return { success: true, collection: data };
    } catch (err: any) {
      console.error('Update collection error:', err);
      return { success: false, error: err.message };
    }
  }, [updateCollectionMutation]);

  const deleteCollection = useCallback(async (id: string) => {
    try {
      await deleteCollectionMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      console.error('Delete collection error:', err);
      return { success: false, error: err.message };
    }
  }, [deleteCollectionMutation]);

  const toggleCollectionActive = useCallback(async (id: string, is_active: boolean) => {
    return updateCollection(id, { is_active } as any);
  }, [updateCollection]);

  const fetchCollectionProducts = useCallback(async (collectionId: string) => {
    const { data, error } = await supabase
      .from('collection_products')
      .select('*, products(*)')
      .eq('collection_id', collectionId)
      .order('sort_order');
    if (error) {
      console.error('Error fetching collection products', error);
      return [];
    }
    return data;
  }, [supabase]);

  return {
    collections,
    loading,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollectionActive,
    fetchCollectionProducts
  };
}
