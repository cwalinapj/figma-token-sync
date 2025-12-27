/**
 * Figma Token Sync Configuration
 * 
 * Customize token extraction and output for Origin OS
 */

module.exports = {
  figma: {
    // Your Figma file key (or use FIGMA_FILE_KEY env var)
    fileKey: process.env.FIGMA_FILE_KEY,
    
    // Personal access token (or use FIGMA_ACCESS_TOKEN env var)
    accessToken: process.env.FIGMA_ACCESS_TOKEN,
    
    // Use MCP server when available (recommended with Claude)
    useMCP: true,
    
    // Optional: Extract only from specific frames/pages
    // nodeIds: ['1:2', '3:4'],
    
    // Optional: Filter styles by prefix (e.g., 'origin/')
    // stylePrefix: 'origin/'
  },

  output: {
    // CSS Custom Properties
    css: './src/styles/tokens/variables.css',
    
    // Tailwind CSS configuration
    tailwind: './tailwind.tokens.js',
    
    // JSON tokens (Style Dictionary compatible)
    json: './src/styles/tokens/tokens.json',
    
    // SCSS variables
    scss: './src/styles/tokens/_variables.scss'
  },

  // Transform options
  transform: {
    // Color format: 'hex' | 'rgb' | 'hsl'
    colorFormat: 'hex',
    
    // Include opacity as separate variable
    includeOpacity: true,
    
    // Prefix for CSS variables (e.g., '--origin-')
    cssPrefix: '',
    
    // Generate dark mode variants
    darkMode: true
  },

  // Watch mode options
  watch: {
    // Poll interval in milliseconds
    interval: 30000,
    
    // Debounce changes
    debounce: 1000
  }
};
