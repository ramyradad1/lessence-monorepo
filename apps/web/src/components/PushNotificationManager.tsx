"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { useWebPushNotifications } from "@lessence/supabase/hooks/useWebPushNotifications";
import { X, Bell } from "lucide-react";
import { usePathname } from "@/navigation";

interface Payload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export default function PushNotificationManager() {
  const { user } = useAuth();
  const { isSupported, permission, subscribeToPush } = useWebPushNotifications(supabase, user?.id);
  const [toastPayload, setToastPayload] = useState<Payload | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/push-sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  useEffect(() => {
    // 2. Setup Foreground Message Handler using Supabase Realtime fallback for Web Push
    // Since we are using standard Web Push, foreground messages sent from the SW don't easily
    // reach the DOM directly unless we postMessage from the SW.
    // However, our `useNotifications` hook actually already handles Realtime insert events!
    // But if we want an iOS-style toast when a push arrives, we can listen for `message` events
    // from the Service Worker.
    
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "PUSH_RECEIVED") {
        setToastPayload(event.data.payload);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => setToastPayload(null), 5000);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, []);

  // 3. Let's proactively ask for permission if the user is logged in, but has not granted it
  // and they are visiting the profile or orders page, rather than spamming them on launch.
  useEffect(() => {
    if (user && isSupported && permission === "default" && (pathname.includes('/profile') || pathname.includes('/checkout'))) {
      const timer = setTimeout(() => {
         const confirmPush = window.confirm("Would you like to receive notifications about your orders?");
         if(confirmPush) {
           subscribeToPush();
         }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, permission, pathname, subscribeToPush]);

  if (!toastPayload) return null;

  // iOS Style Banner Animation
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-10 duration-500 ease-out">
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[1.5rem] p-4 flex items-start gap-4 cursor-pointer hover:bg-white/95 transition-colors"
           style={{
             WebkitBackdropFilter: "blur(20px)",
             boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
           }}
           onClick={() => setToastPayload(null)}
      >
        <div className="bg-primary/20 p-2 rounded-xl shrink-0">
          <Bell className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1 pt-1">
          <h4 className="text-black font-semibold text-[15px] leading-tight mb-1">{toastPayload.title}</h4>
          <p className="text-black/70 text-[13px] leading-tight">{toastPayload.body}</p>
        </div>
        <button 
          aria-label="Close notification"
          title="Close notification"
          onClick={(e) => { e.stopPropagation(); setToastPayload(null); }}
          className="text-black/40 hover:text-black transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
