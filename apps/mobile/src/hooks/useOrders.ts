import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import { Order } from "@lessence/core";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    }
    return { success: !error, error };
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, fetchOrders, updateOrderStatus };
}
