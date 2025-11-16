export default {
  plugins: {
    // PostCSS import for @import statements
    'postcss-import': {},
    
    // Tailwind CSS processing
    tailwindcss: {},
    
    // Autoprefixer for browser compatibility
    autoprefixer: {},
    
    // CSS nano for minification in production
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true
        }]
      }
    } : {})
  }
}