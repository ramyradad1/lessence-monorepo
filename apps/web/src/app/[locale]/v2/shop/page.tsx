"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ShopCollection from "@/components/v2/ShopCollection";

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  return (
    <div className="w-full min-h-screen pt-32 pb-16 flex flex-col items-center">
      <ShopCollection initialCategory={categoryParam || 'all'} />
    </div>
  );
}

export default function V2ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#c9a96e] animate-spin" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
