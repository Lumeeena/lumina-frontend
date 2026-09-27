import { readFileSync } from "node:fs";
import { buildSchema, parse, validate } from "graphql";
import { describe, expect, it } from "vitest";

const schemaText = readFileSync(
  new URL("./schema.graphql", import.meta.url),
  "utf8",
);
const operations = parse(
  readFileSync(new URL("./operations.graphql", import.meta.url), "utf8"),
);

describe("backend schema contract", () => {
  it("accepts every application operation", () => {
    expect(validate(buildSchema(schemaText), operations)).toEqual([]);
  });

  it("rejects operations when a selected field disappears from the backend", () => {
    const changed = schemaText.replace("  feeCharged: String!", "");
    expect(changed).not.toBe(schemaText);
    const errors = validate(buildSchema(changed), operations);
    expect(
      errors.some((error) =>
        error.message.includes('Cannot query field "feeCharged"'),
      ),
    ).toBe(true);
  });
});
