"use client";

import { useTransition } from "react";
import { refreshRegistry } from "@/app/registry/actions";

export default function RegistryRefresh() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(refreshRegistry)}
      className="mt-2 font-bold underline"
    >
      {pending ? "Retrying…" : "Retry"}
    </button>
  );
}
