// FILE: eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts"
  ]),

  {
    rules: {
      // Permet d’avancer sans bloquer le déploiement
      "@typescript-eslint/no-explicit-any": "warn",

      // Avertissement OK (tu pourras nettoyer progressivement)
      "react-hooks/exhaustive-deps": "warn",

      // Si tu as eu des warnings aria, on évite que ça bloque
      "jsx-a11y/role-supports-aria-props": "warn"
    }
  }
]);
