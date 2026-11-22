// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { STABLE_ROUTES } from "./routes";
import {
  GO_KEY,
  HELP_KEY,
  ROUTE_SHORTCUTS,
  SEARCH_KEY,
  isEditableTarget,
  isPlainKey,
} from "./shortcuts";

describe("route shortcut map", () => {
  it("binds every route to a single lower-case letter, typed after g", () => {
    for (const { key } of ROUTE_SHORTCUTS) expect(key).toMatch(/^[a-z]$/);
  });

  it("uses each letter once, so a key can only mean one destination", () => {
    const keys = ROUTE_SHORTCUTS.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never takes a key the shortcuts already reserve", () => {
    // `g` starts a sequence, `/` focuses search and `?` opens help. A route on
    // any of them would either never fire or fire the wrong action.
    const reserved: string[] = [GO_KEY, SEARCH_KEY, HELP_KEY];
    for (const { key } of ROUTE_SHORTCUTS) expect(reserved, key).not.toContain(key);
  });

  it("sends every shortcut to a route the app serves", () => {
    const paths = STABLE_ROUTES.map((route) => route.path);
    for (const { href } of ROUTE_SHORTCUTS) expect(paths, href).toContain(href);
  });

  it("names each shortcut after the nav label of the route it opens", () => {
    for (const { href, label } of ROUTE_SHORTCUTS) {
      expect(STABLE_ROUTES.find((route) => route.path === href)?.label, href).toBe(label);
    }
  });
});

describe("isEditableTarget", () => {
  it("treats text fields as editable", () => {
    for (const tag of ["input", "textarea", "select"]) {
      expect(isEditableTarget(document.createElement(tag)), tag).toBe(true);
    }
  });

  it("treats widgets that take typed text as editable", () => {
    for (const role of ["textbox", "combobox", "searchbox"]) {
      const element = document.createElement("div");
      element.setAttribute("role", role);
      expect(isEditableTarget(element), role).toBe(true);
    }
  });

  it("treats content-editable regions as editable", () => {
    // jsdom does not implement isContentEditable, so the flag is set directly.
    const element = document.createElement("div");
    Object.defineProperty(element, "isContentEditable", { value: true });
    expect(isEditableTarget(element)).toBe(true);
  });

  it("treats buttons, links and plain page content as not editable", () => {
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
    expect(isEditableTarget(document.createElement("a"))).toBe(false);
    expect(isEditableTarget(document.body)).toBe(false);
  });

  it("treats a missing or non-element target as not editable", () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(window)).toBe(false);
  });
});

describe("isPlainKey", () => {
  const plain = {
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    defaultPrevented: false,
    target: document.body,
  };

  it("accepts an unmodified key pressed outside a field", () => {
    expect(isPlainKey(plain)).toBe(true);
  });

  it.each(["ctrlKey", "metaKey", "altKey", "repeat", "defaultPrevented"] as const)(
    "rejects a keydown with %s set, leaving that combination to the browser",
    (flag) => {
      expect(isPlainKey({ ...plain, [flag]: true })).toBe(false);
    },
  );

  it("rejects a keydown typed into a field, so typing never navigates", () => {
    expect(isPlainKey({ ...plain, target: document.createElement("input") })).toBe(false);
  });
});
