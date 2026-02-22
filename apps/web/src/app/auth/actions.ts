"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction() {
  const supabase = createClient();
  
  // 1. Sign out from Supabase (this will clear the session and cookies via setAll adapter)
  await supabase.auth.signOut();
  
  // 2. Revalidate the entire app to ensure state is fresh
  revalidatePath("/", "layout");
  
  // 3. Redirect to login
  return redirect("/login");
}
