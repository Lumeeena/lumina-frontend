import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: process.env.GRAPHQL_SCHEMA ?? "graphql/schema.graphql",
  documents: ["graphql/operations.graphql", "lib/queries.ts"],
  generates: {
    "lib/generated/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      config: {
        documentMode: "string",
        useTypeImports: true,
        enumsAsTypes: true,
        skipTypename: true,
        avoidOptionals: { field: true },
      },
    },
  },
};
export default config;
