"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { webFavoritesStorage } from "@/lib/favoritesStorage";
import { useAuth, useFavorites } from "@lessence/supabase";
import { useCart } from "@/context/CartContext";
import { Product } from "@lessence/core";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Star, Heart, ShoppingCart, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(supabase, user?.id, webFavoritesStorage);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!error && data) setProduct(data);
      setLoading(false);
    }
    if (productId) fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <main className="bg-background-dark min-h-screen">
        <Navbar />
        <div className="pt-28 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-[4/5] bg-surface-dark/50 animate-pulse rounded-2xl" />
            <div className="space-y-6 pt-8">
              <div className="h-8 w-48 bg-surface-dark/50 animate-pulse rounded" />
              <div className="h-6 w-32 bg-surface-dark/50 animate-pulse rounded" />
              <div className="h-12 w-28 bg-surface-dark/50 animate-pulse rounded" />
              <div className="h-32 bg-surface-dark/50 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-background-dark min-h-screen">
        <Navbar />
        <div className="pt-28 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-display text-white mb-4">Product Not Found</h2>
          <p className="text-white/40 text-sm mb-8">This fragrance may no longer be available.</p>
          <Link href="/shop" className="bg-primary text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all">
            Browse Collection
          </Link>
        </div>
      </main>
    );
  }

  const sizes = product.size_options?.length > 0
    ? product.size_options
    : [{ size: "50ml", price: product.price }, { size: "100ml", price: Math.round(product.price * 1.44) }];
  const currentPrice = sizes[selectedSize]?.price || product.price;
  const notes = product.fragrance_notes || { top: [], heart: [], base: [] };
  const profiles = product.scent_profiles || [];

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, sizes[selectedSize].size);
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <main className="bg-background-dark min-h-screen">
      <Navbar />

      <div className="pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/shop" className="hover:text-white transition-colors">Fragrances</Link>
            <ChevronRight size={12} />
            <span className="text-white/60">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-dark group">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {product.is_new && (
                <div className="absolute top-6 left-6 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded uppercase">
                  New
                </div>
              )}
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-6 right-6 p-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                aria-label="Toggle favorite"
              >
                <Heart
                  size={20}
                  className={isFavorite(product.id) ? "text-red-500 fill-red-500" : "text-white"}
                />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-8 pt-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-display text-white leading-tight">{product.name}</h1>
                <p className="text-white/40 text-lg mt-1 uppercase tracking-wider">{product.subtitle}</p>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-3xl text-white font-bold">${currentPrice}</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < product.rating ? "text-primary fill-primary" : "text-white/20"} />
                  ))}
                  <span className="text-white/30 text-xs ml-2">({product.review_count} reviews)</span>
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-3">Select Size</span>
                <div className="flex gap-3">
                  {sizes.map((s: { size: string; price: number }, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSize(i)}
                      className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                        selectedSize === i
                          ? "bg-primary text-black border-primary"
                          : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {s.size} — ${s.price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scent Profiles */}
              {profiles.length > 0 && (
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-4">Scent Profile</span>
                  <div className="flex gap-4">
                    {profiles.map((p: { name: string; icon?: string }, i: number) => (
                      <div key={i} className="flex-1 text-center py-4 bg-surface-dark rounded-xl border border-white/5">
                        <span className="text-2xl mb-2 block">🌿</span>
                        <span className="text-sm text-white/80">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-white/50 leading-relaxed">{product.description}</p>

              {/* CTA */}
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`w-full py-4 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                  isAdding
                    ? "bg-green-500 text-white"
                    : "bg-primary text-black hover:bg-white"
                }`}
              >
                {isAdding ? "Added to Bag ✓" : (
                  <>
                    <ShoppingCart size={16} />
                    Add to Bag — ${currentPrice}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fragrance Notes */}
          {(notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0) && (
            <div className="mt-20">
              <span className="text-primary text-xs font-bold tracking-widest uppercase mb-2 block">The Journey</span>
              <h2 className="text-3xl font-display text-white mb-8">Fragrance Notes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Top Notes", desc: "The initial impression", items: notes.top },
                  { label: "Heart Notes", desc: "The core of the fragrance", items: notes.heart },
                  { label: "Base Notes", desc: "The lasting memory", items: notes.base },
                ].map((note, i) => (
                  <div key={i} className="glass-effect p-6 rounded-2xl border border-white/5">
                    <h3 className="text-white font-display text-lg mb-1">{note.label}</h3>
                    <p className="text-white/30 text-xs italic mb-4">{note.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {note.items.map((item: string, j: number) => (
                        <span key={j} className="text-[11px] bg-white/5 text-white/60 px-3 py-1.5 rounded-full border border-white/10">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
