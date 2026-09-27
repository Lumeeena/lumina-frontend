import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { transformSync } from "@babel/core";
import compiler from "babel-plugin-react-compiler";

const files = [
  ["before", "components/TransactionExplorer.tsx"],
  ["after", "components/TransactionExplorer.tsx"],
  ["isolated", "components/VirtualizedTransactionTable.tsx"],
];
for (const [label, filename] of files) {
  const source =
    label === "before"
      ? execFileSync(
          "git",
          [
            "show",
            `${process.argv[2] ?? "511bbce50b68350cecbf44e94d76017ca39c6df4"}:${filename}`,
          ],
          { encoding: "utf8" },
        )
      : readFileSync(filename, "utf8");
  const events = [];
  const { code } = transformSync(source, {
    filename,
    configFile: false,
    babelrc: false,
    presets: [
      ["@babel/preset-typescript", { allExtensions: true, isTSX: true }],
    ],
    plugins: [
      [
        compiler,
        { logger: { logEvent: (_file, event) => events.push(event) } },
      ],
    ],
  });
  const compiled = events.filter(
    (event) => event.kind === "CompileSuccess",
  ).length;
  if (label === "after" && compiled !== 1)
    throw new Error("Explorer must compile");
  if (label === "isolated" && compiled !== 0)
    throw new Error("Virtualizer must remain uncompiled");
  console.log(
    JSON.stringify(
      {
        label,
        filename,
        compiled,
        memoSlots: [...code.matchAll(/_c\((\d+)\)/g)].reduce(
          (sum, match) => sum + Number(match[1]),
          0,
        ),
        diagnostics: events
          .filter((event) => event.kind === "CompileError")
          .map((event) => event.detail.reason),
      },
      null,
      2,
    ),
  );
}
