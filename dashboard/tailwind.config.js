/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#D1FFFFFF",
          100: "#C5FAFBFF",
          200: "#AFEBECFF",
          300: "#90D2D3FF",
          400: "#6AB3B5FF",
          500: "#3C8F91FF",
          600: "#2B6F71FF",
          700: "#205051FF",
          800: "#193333FF",
          900: "#0D1819FF",
          950: "#060A0AFF"
        },
        secondary: {
          50: "#FFEBECFF",
          100: "#FFE1E1FF",
          200: "#FFCFCFFF",
          300: "#EDB3B4FF",
          400: "#CF9294FF",
          500: "#AB6C6FFF",
          600: "#865355FF",
          700: "#613C3DFF",
          800: "#3C2728FF",
          900: "#1D1313FF",
          950: "#0C0808FF"
        },
        accent: {
          50: "#FFEBFFFF",
          100: "#FFE0F5FF",
          200: "#FECEE6FF",
          300: "#E6B3CCFF",
          400: "#C892ADFF",
          500: "#A46C89FF",
          600: "#80536AFF",
          700: "#5D3C4DFF",
          800: "#3A2731FF",
          900: "#1C1317FF",
          950: "#0C080AFF"
        },
        neutral: {
          50: "#EFFBFBFF",
          100: "#E5F1F2FF",
          200: "#D3E1E1FF",
          300: "#B8C8C8FF",
          400: "#98A8A9FF",
          500: "#738484FF",
          600: "#586667FF",
          700: "#404A4AFF",
          800: "#292F2FFF",
          900: "#141717FF",
          950: "#080909FF"
        },
        success: {
          50: "#D0FFD1FF",
          100: "#C4FFC4FF",
          200: "#AEF2AFFF",
          300: "#8EDA91FF",
          400: "#68BB6CFF",
          500: "#3A9742FF",
          600: "#297531FF",
          700: "#1F5524FF",
          800: "#18361AFF",
          900: "#0D1A0DFF",
          950: "#060B06FF"
        },
        warning: {
          50: "#FFF0AFFF",
          100: "#FFE5A0FF",
          200: "#FFD385FF",
          300: "#F4B860FF",
          400: "#D6962CFF",
          500: "#B37000FF",
          600: "#8C5600FF",
          700: "#663E00FF",
          800: "#3F2903FF",
          900: "#1E1406FF",
          950: "#0D0804FF"
        },
        error: {
          50: "#FFE0D8FF",
          100: "#FFD4CCFF",
          200: "#FFC0B8FF",
          300: "#FFA39BFF",
          400: "#EF7F78FF",
          500: "#CA5551FF",
          600: "#9F403CFF",
          700: "#732F2CFF",
          800: "#47211EFF",
          900: "#22100FFF",
          950: "#0F0706FF"
        },
        info: {
          50: "#C2FFFFFF",
          100: "#B4F6FFFF",
          200: "#9CE6FFFF",
          300: "#7ACCFFFF",
          400: "#4FACF5FF",
          500: "#0486D3FF",
          600: "#0068A6FF",
          700: "#064B78FF",
          800: "#0F304AFF",
          900: "#0A1723FF",
          950: "#050A0FFF"
        },
        dataviz: {
          1: "#009094FF",
          2: "#A65E98FF",
          3: "#7D821BFF",
          4: "#3D7FBFFF",
          5: "#B85C53FF",
          6: "#0E9169FF"
        }
      }
    }
  }
}
