import { pixelBasedPreset, type TailwindConfig } from "react-email";

const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#f4f1eb",
          surface: "#ffffff",
          primary: "#1e3a56",
          accent: "#1d6a65",
          ink: "#152033",
          muted: "#5c6573",
          border: "#ddd4c7",
          secondary: "#ebe4d8",
          conclusion: "#eef6f5",
          inverse: "#f7f4ee",
          technical: "#5b4d3a",
        },
      },
    },
  },
} satisfies TailwindConfig;

export default tailwindConfig;
