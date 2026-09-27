import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Custom ESLint rule that flags raw hex color values in code.
 *
 * Once the project has a color token system, all colors should come from that
 * instead of raw hex values. This rule prevents the inconsistency from creeping
 * back in after token adoption.
 */
const noRawHexColorsRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw hex color values in component code",
    },
    messages: {
      noRawHex: "Use a color token instead of raw hex value '{{ color }}'",
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string") {
          // Match hex colors: #fff, #ffffff, #fff0, #ffffff00, etc.
          const hexColorPattern = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/g;
          let match;
          while ((match = hexColorPattern.exec(node.value)) !== null) {
            context.report({
              node,
              messageId: "noRawHex",
              data: { color: match[0] },
            });
          }
        }
      },
    };
  },
};

/**
 * Custom plugin that wraps the no-raw-hex-colors rule.
 */
const customPlugin = {
  rules: {
    "no-raw-hex-colors": noRawHexColorsRule,
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated test output — istanbul's HTML report ships its own bundled
    // scripts, which have nothing to do with this codebase's rules.
    "coverage/**",
    "lib/generated/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    // Enable the custom rule for component and app files.
    // Token definitions and design system files are excluded.
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    plugins: {
      custom: customPlugin,
    },
    rules: {
      "custom/no-raw-hex-colors": "error",
    },
  },
]);

export default eslintConfig;
