"use client";

import { useEffect } from "react";
import {
  getDirection,
  getLocale,
  setLocale,
  subscribeLocale,
} from "@/lib/i18n";

/**
 * Keeps `<html dir>` and `<html lang>` in sync with the active locale (#31).
 *
 * The root layout is a server component and can only render the default
 * `lang="en"` / LTR document, so this client component applies the active
 * locale's direction after mount and on every locale change. Without it an
 * RTL locale would still render an LTR document and the nav, tables, and
 * filter controls would not mirror.
 */
export default function DirectionSync() {
  useEffect(() => {
    const apply = (locale: string) => {
      const root = document.documentElement;
      root.lang = locale;
      root.dir = getDirection(locale);
    };

    const params = new URLSearchParams(window.location.search);
    const urlLoc = params.get("locale") || params.get("lang");
    const storedLoc = localStorage.getItem("lumina-locale");
    
    if (urlLoc) {
      setLocale(urlLoc);
    } else if (storedLoc) {
      setLocale(storedLoc);
    }

    apply(getLocale());
    return subscribeLocale(apply);
  }, []);

  return null;
}
