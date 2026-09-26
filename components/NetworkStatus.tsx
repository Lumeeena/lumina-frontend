"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NetworkStatus() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const reconnect = () => {
      setOffline(false);
      window.dispatchEvent(new Event("lumina:online"));
      router.refresh();
    };
    update();
    window.addEventListener("offline", update);
    window.addEventListener("online", reconnect);
    return () => {
      window.removeEventListener("offline", update);
      window.removeEventListener("online", reconnect);
    };
  }, [router]);

  if (!offline) return null;
  return <div role="status" className="fixed inset-x-0 bottom-0 z-50 bg-[#0e0e12] text-white text-center text-sm px-4 py-3">You’re offline. Showing already-loaded data; Lumina will refresh when you reconnect.</div>;
}
