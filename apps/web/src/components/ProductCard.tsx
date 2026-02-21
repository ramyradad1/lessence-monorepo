"use client";
import { Product } from "@lessence/core";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function ProductCard({
  product,
  isFavorite = false,
  onToggleFavorite,
}: {
  product: Product;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const { addToCart } = useCart();
  const defaultSize = product.size_options?.[0]?.size || "50ml";

  return (
    <div className="group relative bg-surface-dark/40 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all">
      <Link href={`/shop/${product.id}`} className="block">
        <div className="aspect-[4/5] relative overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          {product.is_new && (
            <div className="absolute top-4 left-4 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded uppercase">
              New
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4" />
        </div>
      </Link>

      {/* Action buttons overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
            className="bg-black/50 backdrop-blur-sm p-2.5 rounded-full hover:bg-black/70 transition-colors"
            aria-label="Toggle favorite"
          >
            <Heart size={16} className={isFavorite ? "text-red-500 fill-red-500" : "text-white"} />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, defaultSize); }}
          className="bg-primary p-2.5 rounded-full text-black hover:scale-110 transition-transform"
          aria-label="Add to cart"
        >
          <ShoppingCart size={16} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-display text-white">{product.name}</h3>
            <p className="text-xs text-white/40 uppercase tracking-tighter">{product.subtitle}</p>
          </div>
          <p className="text-primary font-bold">${product.price}</p>
        </div>

        <div className="flex items-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < product.rating ? "text-primary fill-primary" : "text-white/20"} />
          ))}
          <span className="text-[10px] text-white/30 ml-2">({product.review_count} reviews)</span>
        </div>

        <div className="flex gap-2">
          {product.scent_profiles?.slice(0, 2).map((note, idx) => (
            <span key={idx} className="text-[10px] bg-white/5 text-white/60 px-2 py-1 rounded-full border border-white/10">
              {note.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
