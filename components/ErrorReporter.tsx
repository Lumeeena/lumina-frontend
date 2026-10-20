"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/errorReporting";

export default function ErrorReporter() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ERROR_REPORTING_URL) return;

    const onError = (event: ErrorEvent) => {
      void reportError(event.error ?? new Error(event.message), "error");
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      void reportError(event.reason, "unhandledrejection");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
