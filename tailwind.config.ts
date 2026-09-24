import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // The responsive variants (sm/md/lg/xl/2xl) are defined by the plugin at
    // the bottom instead, so they can be switched off on phones that render
    // the page desktop-wide (see components/viewport-fix.tsx).
    screens: {},
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // Mobile-first type ramp, sized for reading on a phone at arm's length.
      // `base` is 17px — iOS's own body size — so body copy never needs a
      // pinch-zoom, and it keeps form fields above the 16px line where iOS
      // Safari auto-zooms on focus. Nothing in the app goes below `xs` (13px),
      // and body steps (sm, base) keep >= 1.5x line height per WCAG 1.4.12.
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.125rem" }], // 13 / 18
        sm: ["0.9375rem", { lineHeight: "1.4375rem" }], // 15 / 23
        base: ["1.0625rem", { lineHeight: "1.625rem" }], // 17 / 26
        lg: ["1.1875rem", { lineHeight: "1.75rem" }], // 19 / 28
        xl: ["1.375rem", { lineHeight: "1.875rem" }], // 22 / 30
        "2xl": ["1.625rem", { lineHeight: "2.125rem" }], // 26 / 34
        "3xl": ["1.875rem", { lineHeight: "2.375rem" }], // 30 / 38
        "4xl": ["2.25rem", { lineHeight: "2.625rem" }], // 36 / 42
        "5xl": ["2.75rem", { lineHeight: "3.125rem" }], // 44 / 50
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        // Money direction. `positive` = you are owed / gets back, `negative` =
        // you owe. Tuned per theme for >= 4.5:1 contrast on cards.
        positive: {
          DEFAULT: "hsl(var(--positive))",
          soft: "hsl(var(--positive-soft))",
        },
        negative: {
          DEFAULT: "hsl(var(--negative))",
          soft: "hsl(var(--negative-soft))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Height of the mobile tab bar, not counting the home-indicator inset.
        tabbar: "4.25rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // Imported (not `require`d): Next 16 loads this TS config as an ES module on
  // Node 22.12+/24, where `require` is undefined — a `require()` here threw
  // "ReferenceError: require is not defined" and took the dev server down with
  // it, so no page (the login screen included) could render.
  plugins: [
    tailwindcssAnimate,
    // Standard min-width breakpoints, except when <html> carries
    // `bb-phone-fix`: a phone in "Desktop site" mode lays the page out 980px
    // wide, which would otherwise switch on the tablet/desktop layout. There
    // the page is scaled back to phone size and must keep the phone layout.
    plugin(({ addVariant }) => {
      const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 };
      for (const [name, px] of Object.entries(breakpoints)) {
        addVariant(name, `@media (min-width: ${px}px) { :root:not(.bb-phone-fix) & }`);
      }
    }),
  ],
};

export default config;
