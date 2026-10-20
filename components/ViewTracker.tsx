"use client";

import { useEffect } from "react";
import { addRecentlyViewed, type EntityType } from "@/lib/recentlyViewed";

interface Props {
  id: string;
  type: EntityType;
  label: string;
  path: string;
}

export default function ViewTracker({ id, type, label, path }: Props) {
  useEffect(() => {
    addRecentlyViewed(id, type, label, path);
  }, [id, type, label, path]);

  return null;
}
