/**
 * Origin OS - Figma Design Token Sync
 * 
 * Extracts design tokens from Figma and syncs them to your codebase
 * in multiple formats (CSS variables, Tailwind config, JSON tokens)
 */

import { FigmaExtractor, FigmaConfig } from './extractors/figma-extractor';
import { TokenTransformer } from './transformers/token-transformer';
import { OutputWriter } from './writers/output-writer';
import { DesignTokens } from './types';

interface SyncConfig {
  figma: FigmaConfig;
  output: {
    css?: string;
    tailwind?: string;
    json?: string;
    scss?: string;
  };
  watch?: boolean;
}

export class DesignTokenSync {
  private extractor: FigmaExtractor;
  private transformer: TokenTransformer;
  private writer: OutputWriter;
  private config: SyncConfig;

  constructor(config: SyncConfig) {
    this.config = config;
    this.extractor = new FigmaExtractor(config.figma);
    this.transformer = new TokenTransformer();
    this.writer = new OutputWriter();
  }

  async sync(): Promise<void> {
    console.log('🎨 Starting Figma design token sync...\n');

    // Step 1: Extract tokens from Figma
    console.log('📥 Extracting tokens from Figma...');
    const rawTokens = await this.extractor.extract();
    console.log(`   Found ${Object.keys(rawTokens.colors || {}).length} colors`);
    console.log(`   Found ${Object.keys(rawTokens.typography || {}).length} typography styles`);
    console.log(`   Found ${Object.keys(rawTokens.spacing || {}).length} spacing values`);
    console.log(`   Found ${Object.keys(rawTokens.effects || {}).length} effects\n`);

    // Step 2: Transform to various formats
    console.log('🔄 Transforming tokens...');
    
    if (this.config.output.css) {
      const css = this.transformer.toCSSVariables(rawTokens);
      await this.writer.write(this.config.output.css, css);
      console.log(`   ✓ CSS variables → ${this.config.output.css}`);
    }

    if (this.config.output.tailwind) {
      const tailwind = this.transformer.toTailwindConfig(rawTokens);
      await this.writer.write(this.config.output.tailwind, tailwind);
      console.log(`   ✓ Tailwind config → ${this.config.output.tailwind}`);
    }

    if (this.config.output.json) {
      const json = this.transformer.toJSON(rawTokens);
      await this.writer.write(this.config.output.json, json);
      console.log(`   ✓ JSON tokens → ${this.config.output.json}`);
    }

    if (this.config.output.scss) {
      const scss = this.transformer.toSCSS(rawTokens);
      await this.writer.write(this.config.output.scss, scss);
      console.log(`   ✓ SCSS variables → ${this.config.output.scss}`);
    }

    console.log('\n✅ Design token sync complete!');
  }

  async watch(): Promise<void> {
    console.log('👀 Watching for Figma changes...');
    // In production, this would use Figma webhooks or polling
    await this.sync();
  }
}

// CLI Entry Point
async function main() {
  const config: SyncConfig = {
    figma: {
      fileKey: process.env.FIGMA_FILE_KEY || '',
      accessToken: process.env.FIGMA_ACCESS_TOKEN || '',
      // Use MCP if available (auto-detected)
      useMCP: true
    },
    output: {
      css: './tokens/variables.css',
      tailwind: './tokens/tailwind.config.js',
      json: './tokens/tokens.json',
      scss: './tokens/_variables.scss'
    }
  };

  const sync = new DesignTokenSync(config);
  
  if (process.argv.includes('--watch')) {
    await sync.watch();
  } else {
    await sync.sync();
  }
}

main().catch(console.error);
