import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Coupon } from '@lessence/core';

type CouponMutationInput = Omit<Partial<Coupon>, 'valid_from' | 'valid_until' | 'usage_limit'> & {
  valid_from?: string | null;
  valid_until?: string | null;
  usage_limit?: number | null;
};

export function useAdminCoupons(supabase: SupabaseClient) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const createCoupon = useCallback(async (coupon: CouponMutationInput) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: coupon.code?.toUpperCase(),
          discount_type: coupon.discount_type || 'percentage',
          discount_amount: coupon.discount_amount || 0,
          is_active: coupon.is_active ?? true,
          valid_from: coupon.valid_from || null,
          valid_until: coupon.valid_until || null,
          usage_limit: coupon.usage_limit || null,
          times_used: 0,
        })
        .select()
        .single();

      if (error) throw error;
      setCoupons(prev => [data, ...prev]);
      return { success: true, coupon: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [supabase]);

  const updateCoupon = useCallback(async (id: string, updates: CouponMutationInput) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCoupons(prev => prev.map(c => c.id === id ? data : c));
      return { success: true, coupon: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [supabase]);

  const toggleCouponActive = useCallback(async (id: string, is_active: boolean) => {
    return updateCoupon(id, { is_active } as any);
  }, [updateCoupon]);

  const deleteCoupon = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCoupons(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [supabase]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  return { coupons, loading, fetchCoupons, createCoupon, updateCoupon, toggleCouponActive, deleteCoupon };
}
