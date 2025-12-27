#!/usr/bin/env node

/**
 * Origin OS Figma Token Sync CLI
 * 
 * Usage:
 *   figma-sync                    # One-time sync
 *   figma-sync --watch            # Watch mode
 *   figma-sync --config ./config  # Custom config path
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');

// Parse CLI arguments
const args = process.argv.slice(2);
const flags = {
  watch: args.includes('--watch') || args.includes('-w'),
  config: null,
  help: args.includes('--help') || args.includes('-h')
};

// Get config path
const configIndex = args.findIndex(a => a === '--config' || a === '-c');
if (configIndex !== -1 && args[configIndex + 1]) {
  flags.config = args[configIndex + 1];
}

// Show help
if (flags.help) {
  console.log(`
Origin OS Figma Token Sync

Usage:
  figma-sync [options]

Options:
  -w, --watch          Watch for changes and re-sync
  -c, --config <path>  Path to config file (default: ./figma-sync.config.js)
  -h, --help           Show this help message

Environment Variables:
  FIGMA_FILE_KEY       Your Figma file key (from URL)
  FIGMA_ACCESS_TOKEN   Your Figma personal access token

Example:
  FIGMA_FILE_KEY=abc123 figma-sync --watch
`);
  process.exit(0);
}

// Load config
let config = {
  figma: {
    fileKey: process.env.FIGMA_FILE_KEY,
    accessToken: process.env.FIGMA_ACCESS_TOKEN,
    useMCP: true
  },
  output: {
    css: './tokens/variables.css',
    tailwind: './tokens/tailwind.tokens.js',
    json: './tokens/tokens.json',
    scss: './tokens/_variables.scss'
  }
};

// Try to load custom config
const configPath = flags.config || './figma-sync.config.js';
if (fs.existsSync(configPath)) {
  const customConfig = require(path.resolve(configPath));
  config = { ...config, ...customConfig };
}

// Validate required config
if (!config.figma.fileKey) {
  console.error('Error: FIGMA_FILE_KEY environment variable or config.figma.fileKey is required');
  console.error('Get it from your Figma file URL: figma.com/file/<FILE_KEY>/...');
  process.exit(1);
}

// Run sync
const { DesignTokenSync } = require('../dist/sync');

const sync = new DesignTokenSync(config);

if (flags.watch) {
  sync.watch().catch(err => {
    console.error('Watch error:', err);
    process.exit(1);
  });
} else {
  sync.sync().catch(err => {
    console.error('Sync error:', err);
    process.exit(1);
  });
}
