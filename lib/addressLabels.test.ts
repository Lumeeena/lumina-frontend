// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  ADDRESS_LABELS_KEY,
  readLabels,
  saveLabels,
  getLabel,
  setLabel,
  removeLabel,
  exportLabels,
  importLabels,
  type AddressLabels,
} from "./addressLabels";

beforeEach(() => {
  localStorage.clear();
});

describe("readLabels", () => {
  it("returns empty object when localStorage is empty", () => {
    expect(readLabels()).toEqual({});
  });

  it("reads stored labels from localStorage", () => {
    const labels: AddressLabels = {
      "GABC123": "My Wallet",
      "GDEF456": "Exchange",
    };
    localStorage.setItem(ADDRESS_LABELS_KEY, JSON.stringify(labels));
    expect(readLabels()).toEqual(labels);
  });

  it("returns empty object for corrupt JSON", () => {
    localStorage.setItem(ADDRESS_LABELS_KEY, "not valid json{");
    expect(readLabels()).toEqual({});
  });

  it("returns empty object when localStorage throws", () => {
    // Simulate localStorage access failure
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("Storage unavailable");
        },
      },
      configurable: true,
    });
    expect(readLabels()).toEqual({});
  });
});

describe("saveLabels", () => {
  it("saves labels to localStorage", () => {
    const labels: AddressLabels = {
      "GABC123": "My Wallet",
    };
    saveLabels(labels);
    const stored = localStorage.getItem(ADDRESS_LABELS_KEY);
    expect(JSON.parse(stored!)).toEqual(labels);
  });

  it("overwrites existing labels", () => {
    const first: AddressLabels = { "GABC123": "First" };
    const second: AddressLabels = { "GDEF456": "Second" };
    saveLabels(first);
    saveLabels(second);
    expect(readLabels()).toEqual(second);
  });

  it("handles localStorage errors gracefully", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: () => {
          throw new Error("Storage full");
        },
      },
      configurable: true,
    });
    expect(() => saveLabels({ "GABC123": "Test" })).not.toThrow();
  });
});

describe("getLabel", () => {
  it("returns undefined for an address with no label", () => {
    expect(getLabel("GABC123")).toBeUndefined();
  });

  it("retrieves a stored label by address", () => {
    const labels: AddressLabels = {
      "GABC123": "My Wallet",
      "GDEF456": "Exchange",
    };
    localStorage.setItem(ADDRESS_LABELS_KEY, JSON.stringify(labels));
    expect(getLabel("GABC123")).toBe("My Wallet");
    expect(getLabel("GDEF456")).toBe("Exchange");
  });

  it("returns undefined for corrupt storage", () => {
    localStorage.setItem(ADDRESS_LABELS_KEY, "corrupt");
    expect(getLabel("GABC123")).toBeUndefined();
  });

  it("returns undefined when localStorage throws", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("Storage unavailable");
        },
      },
      configurable: true,
    });
    expect(getLabel("GABC123")).toBeUndefined();
  });
});

describe("setLabel", () => {
  it("sets a label for an address", () => {
    setLabel("GABC123", "My Wallet");
    expect(getLabel("GABC123")).toBe("My Wallet");
  });

  it("updates an existing label", () => {
    setLabel("GABC123", "First Label");
    setLabel("GABC123", "Updated Label");
    expect(getLabel("GABC123")).toBe("Updated Label");
  });

  it("removes a label when given empty string", () => {
    setLabel("GABC123", "My Wallet");
    setLabel("GABC123", "");
    expect(getLabel("GABC123")).toBeUndefined();
  });

  it("preserves other labels when setting one", () => {
    setLabel("GABC123", "First");
    setLabel("GDEF456", "Second");
    expect(getLabel("GABC123")).toBe("First");
    expect(getLabel("GDEF456")).toBe("Second");
  });

  it("preserves other labels when removing one", () => {
    setLabel("GABC123", "First");
    setLabel("GDEF456", "Second");
    setLabel("GABC123", "");
    expect(getLabel("GABC123")).toBeUndefined();
    expect(getLabel("GDEF456")).toBe("Second");
  });
});

describe("removeLabel", () => {
  it("removes a label for an address", () => {
    setLabel("GABC123", "My Wallet");
    removeLabel("GABC123");
    expect(getLabel("GABC123")).toBeUndefined();
  });

  it("does nothing when removing a non-existent label", () => {
    expect(() => removeLabel("GABC123")).not.toThrow();
    expect(getLabel("GABC123")).toBeUndefined();
  });

  it("preserves other labels when removing one", () => {
    setLabel("GABC123", "First");
    setLabel("GDEF456", "Second");
    removeLabel("GABC123");
    expect(getLabel("GDEF456")).toBe("Second");
  });
});

describe("exportLabels", () => {
  it("exports empty labels as formatted JSON", () => {
    const result = exportLabels();
    expect(JSON.parse(result)).toEqual({});
  });

  it("exports stored labels as formatted JSON", () => {
    const labels: AddressLabels = {
      "GABC123": "My Wallet",
      "GDEF456": "Exchange",
    };
    saveLabels(labels);
    const result = exportLabels();
    expect(JSON.parse(result)).toEqual(labels);
    // Check it's formatted with indentation
    expect(result).toContain("\n");
  });
});

describe("importLabels", () => {
  it("imports valid JSON labels", () => {
    const labels: AddressLabels = {
      "GABC123": "My Wallet",
      "GDEF456": "Exchange",
    };
    const json = JSON.stringify(labels);
    expect(importLabels(json)).toBe(true);
    expect(readLabels()).toEqual(labels);
  });

  it("returns false for invalid JSON", () => {
    expect(importLabels("not valid json{")).toBe(false);
  });

  it("returns false for JSON array instead of object", () => {
    expect(importLabels(JSON.stringify(["GABC123", "GDEF456"]))).toBe(false);
  });

  it("returns false for JSON primitive instead of object", () => {
    expect(importLabels(JSON.stringify("string"))).toBe(false);
    expect(importLabels(JSON.stringify(123))).toBe(false);
    expect(importLabels(JSON.stringify(null))).toBe(false);
  });

  it("accepts empty object", () => {
    setLabel("GABC123", "Existing");
    expect(importLabels(JSON.stringify({}))).toBe(true);
    expect(readLabels()).toEqual({});
  });

  it("overwrites existing labels on successful import", () => {
    setLabel("GABC123", "Old Label");
    const newLabels: AddressLabels = { "GDEF456": "New Label" };
    importLabels(JSON.stringify(newLabels));
    expect(getLabel("GABC123")).toBeUndefined();
    expect(getLabel("GDEF456")).toBe("New Label");
  });

  it("preserves existing labels on failed import", () => {
    setLabel("GABC123", "My Wallet");
    importLabels("invalid json");
    expect(getLabel("GABC123")).toBe("My Wallet");
  });
});
