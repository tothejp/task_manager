import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 로고 이미지(방패 아이콘)의 실제 색상에서 뽑아낸 팔레트 — 로그인/회원가입 화면 톤에 사용
      colors: {
        brand: {
          50: "#EAF3FC",
          100: "#D3E7F9",
          200: "#A8CFF3",
          300: "#7DB7ED",
          400: "#4CA0E6",
          500: "#1E8AE2",
          600: "#136FC0",
          700: "#0F5798",
          800: "#0B3F70",
          900: "#0B2A5B",
          ink: "#182736",
        },
      },
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
