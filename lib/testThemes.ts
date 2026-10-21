import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

const THEMES = ["light", "dark"] as const;

function setTheme(theme: string) {
  const root = document.documentElement;
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
}

function getTheme(): string {
  const root = document.documentElement;
  return root.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function describeWithThemes(
  name: string,
  fn: (theme: string) => void,
) {
  for (const theme of THEMES) {
    describe(`${name} (${theme} theme)`, () => {
      fn(theme);
    });
  }
}

export function renderInTheme(
  ui: ReactElement,
  theme: string,
  options?: Omit<RenderOptions, "wrapper">,
) {
  setTheme(theme);
  return render(ui, options);
}

export function testInThemes(
  name: string,
  fn: (theme: string) => void,
) {
  for (const theme of THEMES) {
    it(`${name} (${theme} theme)`, () => {
      setTheme(theme);
      fn(theme);
    });
  }
}
