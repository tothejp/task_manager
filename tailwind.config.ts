import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Drag & Drop으로 다루는 화면이 많아서 상자를 더 둥글게, 글씨를 한 단계씩 키운다.
      borderRadius: {
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      fontSize: {
        xs: "0.8125rem",
        sm: "0.9375rem",
        base: "1.0625rem",
        lg: "1.1875rem",
        xl: "1.3125rem",
        "2xl": "1.5625rem",
      },
    },
  },
  plugins: [],
};

export default config;
