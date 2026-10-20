"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import CodeSnippet from "./CodeSnippet";
import LanguageSelector from "./LanguageSelector";
import {
  generateJavaScriptClient,
  generatePythonClient,
  generateCurlCommand,
} from "@/lib/codegen";

type Language = "javascript" | "python" | "curl";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({ language: "javascript", setLanguage: () => {} });

export function ExampleLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("javascript");
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function ExampleLanguageSelector() {
  const { language, setLanguage } = useContext(LanguageContext);
  return (
    <LanguageSelector
      selected={language}
      onChange={(value) => {
        if (value === "javascript" || value === "python" || value === "curl")
          setLanguage(value);
      }}
    />
  );
}

export function QueryExample({
  query,
  title,
}: {
  query: string;
  title: string;
}) {
  const { language } = useContext(LanguageContext);
  const code =
    language === "python"
      ? generatePythonClient(query)
      : language === "curl"
        ? generateCurlCommand(query)
        : generateJavaScriptClient(query);
  return <CodeSnippet code={code} language={language} title={title} />;
}
