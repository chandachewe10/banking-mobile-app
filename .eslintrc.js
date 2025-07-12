module.exports = {
  root: true,
  ignorePatterns: [
    "**/*.json",
    "**/*.jsonc",
    "app.json",
    "app.config.js",
    "tsconfig.json",
    "babel.config.js",
    "metro.config.js",
    ".eslintrc.json",
    ".eslintrc",
    "package.json",
    "*.config.js"
  ],
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    // project-specific rules
    "react/react-in-jsx-scope": "off" // React 17+ doesn't require importing React
  },
  overrides: [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      // no need to specify parser etc here; uses defaults
    }
  ]
};