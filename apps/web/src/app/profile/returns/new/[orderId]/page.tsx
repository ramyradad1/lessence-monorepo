"use client";

import { useAuth, useCreateReturnRequest } from "@lessence/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Package, Camera, X, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Order, OrderItem } from "@lessence/core";

const RETURN_REASONS = [
  "Wrong size/fit",
  "Damaged item",
  "Item not as described",
  "Defective/Doesn't work",
  "Changed my mind",
  "Other"
];

export default function NewReturnPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { createRequest, submitting } = useCreateReturnRequest(supabase);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchOrder = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        if (data.status !== 'delivered') {
          router.push(`/profile/orders/${orderId}`);
          return;
        }
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [user, authLoading, orderId, router]);

  const handleItemToggle = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const handleQtyChange = (itemId: string, qty: number, maxQty: number) => {
    if (qty < 1 || qty > maxQty) return;
    setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }
    
    setMediaFiles(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(selectedItems).length === 0) {
      setError("Please select at least one item to return");
      return;
    }
    if (!reason) {
      setError("Please select a reason for return");
      return;
    }
    if (!user) return;

    setError(null);
    const result = await createRequest({
      userId: user.id,
      orderId,
      reason,
      comment,
      items: Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
        orderItemId,
        quantity
      })),
      mediaFiles
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/profile/orders/${orderId}`);
      }, 3000);
    } else {
      setError("Failed to submit return request. Please try again.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#181611] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#181611] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h1 className="font-display text-2xl text-white mb-2">Request Submitted</h1>
        <p className="text-white/40 text-center max-w-sm mb-8">
          Your return request has been submitted successfully. Our team will review it and get back to you soon.
        </p>
        <p className="text-[10px] text-white/20 uppercase tracking-widest">Redirecting to order details...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background-dark pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm uppercase tracking-widest font-bold mb-8"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <h1 className="font-display text-3xl text-white mb-2">Request Return</h1>
          <p className="text-white/40 mb-10 italic">Order {order?.order_number}</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Item Selection */}
            <div className="glass-effect p-8 rounded-3xl border border-white/5">
              <h2 className="text-lg font-display text-white mb-6">Select Items to Return</h2>
              <div className="space-y-4">
                {order?.items?.map((item) => {
                  if (!item.id) return null;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        selectedItems[item.id] ? 'border-[#f4c025]/50 bg-[#f4c025]/5' : 'border-white/5 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={!!selectedItems[item.id]}
                          onChange={() => handleItemToggle(item.id!, item.quantity)}
                          className="w-5 h-5 rounded border-white/10 bg-transparent text-[#f4c025] focus:ring-[#f4c025]/20 focus:ring-offset-0"
                        />
                        <label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">
                          <p className="text-white font-medium">{item.product_name}</p>
                          <p className="text-white/40 text-xs">{item.selected_size}</p>
                        </label>
                        {selectedItems[item.id] && item.quantity > 1 && (
                          <div className="flex items-center gap-3">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest">Qty:</label>
                            <input 
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={selectedItems[item.id]}
                              onChange={(e) => handleQtyChange(item.id!, parseInt(e.target.value), item.quantity)}
                              className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-[#f4c025]/40"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason and Comment */}
            <div className="glass-effect p-8 rounded-3xl border border-white/5 space-y-6">
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">Reason for Return</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#f4c025]/40 transition-all"
                  required
                >
                  <option value="" className="bg-[#181611]">Select a reason...</option>
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r} className="bg-[#181611]">{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-widest mb-3">Additional Comments (Optional)</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about the issue..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#f4c025]/40 transition-all min-h-[120px] resize-none"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="glass-effect p-8 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display text-white">Upload Photos (Optional)</h2>
                <span className="text-[10px] text-white/20 uppercase tracking-widest">{mediaFiles.length}/5 files</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="aspect-square rounded-xl bg-white/5 relative overflow-hidden group">
                    <img src={preview} alt="Return product" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                {mediaFiles.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-white/5 bg-white/0 hover:bg-white/[0.02] hover:border-[#f4c025]/20 cursor-pointer flex flex-col items-center justify-center transition-all">
                    <Camera size={24} className="text-white/20 mb-2" />
                    <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold font-display">Add Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
              <p className="mt-4 text-[10px] text-white/20 uppercase tracking-widest">Supported formats: JPG, PNG. Max 5MB per file.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-400 bg-red-400/10 border border-red-400/20 p-4 rounded-2xl">
                <AlertCircle size={18} />
                <p className="text-xs uppercase tracking-widest font-bold">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={submitting}
              className={`w-full bg-[#f4c025] text-black py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl shadow-[#f4c025]/5 ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : "Submit Return Request"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
