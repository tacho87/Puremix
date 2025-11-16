/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{puremix,html,js}",
    "./app/components/**/*.{puremix,html,js}",
    "./app/routes/**/*.{puremix,html,js}",
    "./app/views/**/*.{puremix,html,js}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [
    // Form plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    
    // Typography plugin for beautiful text styling
    require('@tailwindcss/typography'),
    
    // Container queries
    require('@tailwindcss/container-queries'),
  ],
  darkMode: 'class',
}