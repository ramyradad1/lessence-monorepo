"use client";
import { QueryProvider } from "@lessence/supabase";
import React from "react";

export default function QueryProviderWrapper({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
