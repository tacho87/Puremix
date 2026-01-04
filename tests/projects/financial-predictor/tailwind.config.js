module.exports = {
  content: [
    "./app/**/*.{html,js,puremix}",
    "./app/components/**/*.{html,js,puremix}",
    "./app/routes/**/*.{html,js,puremix}",
    "./app/views/**/*.{html,js,puremix}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        dark: '#1f2937'
      }
    }
  },
  plugins: []
}