"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@lessence/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const { user, signIn, signUp, isLoading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to profile
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/profile");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (isLogin) {
      const { error: signInError } = await signIn(email, password);
      if (signInError) setError(signInError.message);
      else router.push("/profile");
    } else {
      const { error: signUpError } = await signUp(email, fullName, password);
      if (signUpError) setError(signUpError.message);
      else {
        router.push("/profile");
      }
    }
  };

  if (isLoading || user) {
     return (
       <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
         <p className="text-white/40 uppercase tracking-widest text-sm">Loading...</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-background-dark pt-32 pb-20 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md glass-effect p-8 sm:p-12 rounded-2xl shadow-2xl border border-white/5 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="mb-10 text-center relative z-10">
          <h1 className="font-display text-4xl text-white mb-3">L'ESSENCE</h1>
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase">
            {isLogin ? "Welcome Back to Luxury" : "Discover the Collection"}
          </p>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs tracking-wide mb-6 text-center relative z-10">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="FULL NAME"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-surface-dark border border-white/10 rounded-full px-6 py-4 text-xs tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-dark border border-white/10 rounded-full px-6 py-4 text-xs tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-dark border border-white/10 rounded-full px-6 py-4 text-xs tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-black py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all mt-4 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-white/40 text-[10px] tracking-[0.1em] uppercase hover:text-white transition-colors"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
