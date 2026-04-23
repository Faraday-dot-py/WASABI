import nextVitals from "eslint-config-next/core-web-vitals"

const config = [
  ...nextVitals,
  {
    ignores: [
      "components/ui/carousel.tsx",
      "components/ui/sidebar.tsx",
      "components/ui/use-mobile.tsx",
      "hooks/use-mobile.ts",
    ],
  },
]

export default config
