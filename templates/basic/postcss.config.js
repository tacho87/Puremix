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
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyParams: true,
          minifyGradients: true,
          minifyValues: true,
          reduceIdents: false,
          reduceInitial: true,
          mergeIdents: false,
          mergeRules: true,
          mergeLonghand: true,
          mergeSemantically: false,
          calc: true,
          colormin: true,
          convertValues: true,
          discardDuplicates: true,
          discardEmpty: true,
          discardOverridden: false,
          discardUnused: true,
          normalizeCharset: true,
          normalizeUrl: true,
          orderedValues: true,
          optimizeFont: true,
          reduceTransform: true,
          svgo: true
        }]
      }
    } : {}),
    
    // SCSS/SASS support (when needed)
    ...(process.env.USE_SCSS === 'true' ? {
      'postcss-scss': {}
    } : {})
  }
}