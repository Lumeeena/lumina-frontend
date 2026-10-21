// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import {
  ExampleLanguageProvider,
  ExampleLanguageSelector,
  QueryExample,
} from "./GettingStartedExamples";

afterEach(cleanup);

it("keeps both query examples in sync while static guide content remains server-supplied", () => {
  render(
    <ExampleLanguageProvider>
      <h1>Guide from the server</h1>
      <ExampleLanguageSelector />
      <QueryExample
        query="query A { latestLedger { sequence } }"
        title="First"
      />
      <QueryExample
        query="query B { transactions { items { hash } } }"
        title="Second"
      />
    </ExampleLanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /python/i }));
  expect(screen.getAllByText(/import requests/)).toHaveLength(2);
  expect(screen.getByRole("heading").textContent).toBe("Guide from the server");
});
