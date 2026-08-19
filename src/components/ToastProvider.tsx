"use client";

import { useEffect, useState } from "react";
import { subscribeToast, type ToastMessage } from "@/lib/toast";

const DISPLAY_MS = 2800;

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToast((message) => {
      setToasts((prev) => [...prev, message]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== message.id));
      }, DISPLAY_MS);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto max-w-sm rounded-full px-5 py-2.5 text-center font-display text-sm font-bold text-white shadow-lg ${
            t.variant === "error" ? "bg-al-pink" : "bg-al-black"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
