// ESLint flat config (ESLint 9+).
// Goal: minimal rules that enforce zero obvious errors and allow npx eslint src __tests__ to exit 0.
// Rules will tighten in later phases.
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

module.exports = [
  {
    // Apply to all TS/TSX files under src/ and __tests__/.
    files: ["src/**/*.{ts,tsx}", "__tests__/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: {
        // React 19 — avoids the "version not specified" warning.
        version: "19",
      },
    },
    rules: {
      // TS plugin — error only on patterns that indicate clear bugs.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // React — enforce hooks rules; no need to require React in scope (React 17+ JSX transform).
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
