import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { ReturnRequest, ReturnRequestStatus } from '@lessence/core';

export function useReturnRequests(supabase: SupabaseClient, userId?: string) {
  const { data: requests = [], isLoading: loading } = useQuery<ReturnRequest[]>({
    queryKey: ['return_requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          orders (order_number),
          return_request_items (
            *,
            order_items (product_name, selected_size, price)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(req => ({
        ...req,
        order_number: req.orders?.order_number,
        items: req.return_request_items?.map((item: any) => ({
          ...item,
          product_name: item.order_items?.product_name,
          selected_size: item.order_items?.selected_size,
          price: item.order_items?.price
        }))
      })) as ReturnRequest[];
    },
    enabled: !!userId,
  });

  return { requests, loading };
}

export function useCreateReturnRequest(supabase: SupabaseClient) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (params: {
      userId: string;
      orderId: string;
      reason: string;
      comment?: string;
      items: { orderItemId: string; quantity: number }[];
      mediaFiles?: File[];
    }) => {
      // 1. Upload media if any
      const mediaUrls: string[] = [];
      if (params.mediaFiles && params.mediaFiles.length > 0) {
        for (const file of params.mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${params.userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { data, error: uploadError } = await supabase.storage
            .from('return_media')
            .upload(fileName, file);
          
          if (!uploadError && data) {
            const { data: { publicUrl } } = supabase.storage
              .from('return_media')
              .getPublicUrl(data.path);
            mediaUrls.push(publicUrl);
          }
        }
      }

      // 2. Create return request
      const { data: request, error: requestError } = await supabase
        .from('return_requests')
        .insert({
          user_id: params.userId,
          order_id: params.orderId,
          reason: params.reason,
          comment: params.comment,
          media_urls: mediaUrls
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 3. Create request items
      const { error: itemsError } = await supabase
        .from('return_request_items')
        .insert(
          params.items.map(item => ({
            return_request_id: request.id,
            order_item_id: item.orderItemId,
            quantity: item.quantity
          }))
        );

      if (itemsError) throw itemsError;

      return request;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['return_requests', variables.userId] });
    },
  });

  return { 
    createRequest: createMutation.mutateAsync, 
    submitting: createMutation.isPending 
  };
}

export function useAdminReturnRequests(supabase: SupabaseClient) {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading: loadingOrders } = useQuery<ReturnRequest[]>({
    queryKey: ['admin_return_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          orders (order_number),
          profiles (full_name, email),
          return_request_items (
            *,
            order_items (product_name, selected_size, price)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(req => ({
        ...req,
        order_number: req.orders?.order_number,
        customer_name: req.profiles?.full_name,
        customer_email: req.profiles?.email,
        items: req.return_request_items?.map((item: any) => ({
          ...item,
          product_name: item.order_items?.product_name,
          selected_size: item.order_items?.selected_size,
          price: item.order_items?.price
        }))
      })) as ReturnRequest[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: ReturnRequestStatus; notes?: string }) => {
      const update: any = { status };
      if (notes !== undefined) update.admin_notes = notes;

      const { error } = await supabase
        .from('return_requests')
        .update(update)
        .eq('id', requestId);

      if (error) throw error;
      return { requestId, status, notes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_return_requests'] });
    },
  });

  const fetchRequestDetail = async (requestId: string) => {
    // ... (keep fetchRequestDetail as is)
    const { data, error } = await supabase
      .from('return_requests')
      .select(`
        *,
        orders (order_number),
        profiles (full_name, email),
        return_request_items (
          *,
          order_items (product_name, selected_size, price)
        )
      `)
      .eq('id', requestId)
      .single();

    if (error) throw error;

    return {
      ...data,
      order_number: data.orders?.order_number,
      customer_name: data.profiles?.full_name,
      customer_email: data.profiles?.email,
      items: data.return_request_items?.map((item: any) => ({
        ...item,
        product_name: item.order_items?.product_name,
        selected_size: item.order_items?.selected_size,
        price: item.order_items?.price
      }))
    } as ReturnRequest;
  };

  return { 
    requests,
    fetchRequestDetail,
    updateRequestStatus: (requestId: string, status: ReturnRequestStatus, notes?: string) => 
      updateStatusMutation.mutateAsync({ requestId, status, notes }),
    loading: loadingOrders || updateStatusMutation.isPending
  };
}
