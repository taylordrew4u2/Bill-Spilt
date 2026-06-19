import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

// Flat config composed directly from the Next.js and react-hooks plugins.
// (eslint-config-next's FlatCompat path has a circular-ref bug under ESLint 9.)
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/sw.js",
      "public/workbox-*.js",
      "app/sw.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      // New react-hooks v7 compiler-style rule; flags standard patterns
      // (loading flags, reading navigator.onLine on mount) that aren't bugs.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
