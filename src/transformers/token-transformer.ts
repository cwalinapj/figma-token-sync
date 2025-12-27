/**
 * Token Transformer
 * 
 * Converts extracted design tokens into various output formats:
 * - CSS Custom Properties (variables)
 * - Tailwind CSS configuration
 * - SCSS Variables
 * - JSON (Style Dictionary compatible)
 */

import { DesignTokens, ColorToken, TypographyToken, SpacingToken, EffectToken } from '../types';

export class TokenTransformer {
  
  /**
   * Convert tokens to CSS Custom Properties
   */
  toCSSVariables(tokens: DesignTokens): string {
    const lines: string[] = [
      '/**',
      ' * Origin OS Design Tokens',
      ` * Generated: ${tokens.metadata.lastSynced}`,
      ` * Source: Figma file ${tokens.metadata.figmaFileKey || 'unknown'}`,
      ' * DO NOT EDIT MANUALLY - This file is auto-generated',
      ' */',
      '',
      ':root {'
    ];

    // Colors
    if (Object.keys(tokens.colors).length > 0) {
      lines.push('  /* Colors */');
      for (const [key, color] of Object.entries(tokens.colors)) {
        lines.push(`  --color-${key}: ${color.value};`);
        if (color.opacity !== undefined && color.opacity < 1) {
          lines.push(`  --color-${key}-opacity: ${color.opacity};`);
        }
      }
      lines.push('');
    }

    // Typography
    if (Object.keys(tokens.typography).length > 0) {
      lines.push('  /* Typography */');
      for (const [key, typo] of Object.entries(tokens.typography)) {
        lines.push(`  --font-${key}-family: "${typo.fontFamily}";`);
        lines.push(`  --font-${key}-size: ${typo.fontSize}px;`);
        lines.push(`  --font-${key}-weight: ${typo.fontWeight};`);
        lines.push(`  --font-${key}-line-height: ${typeof typo.lineHeight === 'number' ? typo.lineHeight + 'px' : typo.lineHeight};`);
        lines.push(`  --font-${key}-letter-spacing: ${typo.letterSpacing}px;`);
      }
      lines.push('');
    }

    // Spacing
    if (Object.keys(tokens.spacing).length > 0) {
      lines.push('  /* Spacing */');
      for (const [key, space] of Object.entries(tokens.spacing)) {
        lines.push(`  --spacing-${key}: ${space.value}px;`);
      }
      lines.push('');
    }

    // Effects (Shadows)
    if (Object.keys(tokens.effects).length > 0) {
      lines.push('  /* Effects */');
      for (const [key, effect] of Object.entries(tokens.effects)) {
        if (effect.type === 'shadow') {
          const { offsetX, offsetY, blur, spread, color } = effect.value;
          lines.push(`  --shadow-${key}: ${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color};`);
        } else if (effect.type === 'blur') {
          lines.push(`  --blur-${key}: ${effect.value.blur}px;`);
        }
      }
      lines.push('');
    }

    lines.push('}');

    // Dark mode variant (placeholder)
    lines.push('');
    lines.push('[data-theme="dark"] {');
    lines.push('  /* Dark mode overrides - customize as needed */');
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Convert tokens to Tailwind CSS configuration
   */
  toTailwindConfig(tokens: DesignTokens): string {
    const config: any = {
      theme: {
        extend: {
          colors: {},
          fontFamily: {},
          fontSize: {},
          fontWeight: {},
          lineHeight: {},
          letterSpacing: {},
          spacing: {},
          boxShadow: {},
          blur: {}
        }
      }
    };

    // Colors
    for (const [key, color] of Object.entries(tokens.colors)) {
      config.theme.extend.colors[key] = color.value;
    }

    // Typography
    const fontFamilies: Record<string, string[]> = {};
    const fontSizes: Record<string, string> = {};
    
    for (const [key, typo] of Object.entries(tokens.typography)) {
      // Group font families
      const familyKey = this.slugify(typo.fontFamily);
      if (!fontFamilies[familyKey]) {
        fontFamilies[familyKey] = [typo.fontFamily];
      }
      
      // Font sizes with line-height
      fontSizes[key] = [
        `${typo.fontSize}px`,
        { lineHeight: typeof typo.lineHeight === 'number' ? `${typo.lineHeight}px` : typo.lineHeight }
      ] as any;
    }
    
    config.theme.extend.fontFamily = fontFamilies;
    config.theme.extend.fontSize = fontSizes;

    // Spacing
    for (const [key, space] of Object.entries(tokens.spacing)) {
      config.theme.extend.spacing[key] = `${space.value}px`;
    }

    // Effects
    for (const [key, effect] of Object.entries(tokens.effects)) {
      if (effect.type === 'shadow') {
        const { offsetX, offsetY, blur, spread, color } = effect.value;
        config.theme.extend.boxShadow[key] = `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
      } else if (effect.type === 'blur') {
        config.theme.extend.blur[key] = `${effect.value.blur}px`;
      }
    }

    const output = [
      '/**',
      ' * Origin OS Tailwind Design Tokens',
      ` * Generated: ${tokens.metadata.lastSynced}`,
      ' * DO NOT EDIT MANUALLY - This file is auto-generated',
      ' */',
      '',
      '/** @type {import("tailwindcss").Config} */',
      'module.exports = ' + JSON.stringify(config, null, 2)
    ];

    return output.join('\n');
  }

  /**
   * Convert tokens to SCSS variables
   */
  toSCSS(tokens: DesignTokens): string {
    const lines: string[] = [
      '//',
      '// Origin OS Design Tokens (SCSS)',
      `// Generated: ${tokens.metadata.lastSynced}`,
      '// DO NOT EDIT MANUALLY - This file is auto-generated',
      '//',
      ''
    ];

    // Colors
    if (Object.keys(tokens.colors).length > 0) {
      lines.push('// Colors');
      lines.push('// -------');
      for (const [key, color] of Object.entries(tokens.colors)) {
        lines.push(`$color-${key}: ${color.value};`);
      }
      lines.push('');
      
      // Color map for iteration
      lines.push('$colors: (');
      for (const [key, color] of Object.entries(tokens.colors)) {
        lines.push(`  "${key}": ${color.value},`);
      }
      lines.push(');');
      lines.push('');
    }

    // Typography
    if (Object.keys(tokens.typography).length > 0) {
      lines.push('// Typography');
      lines.push('// ----------');
      for (const [key, typo] of Object.entries(tokens.typography)) {
        lines.push(`$font-${key}-family: "${typo.fontFamily}";`);
        lines.push(`$font-${key}-size: ${typo.fontSize}px;`);
        lines.push(`$font-${key}-weight: ${typo.fontWeight};`);
        lines.push(`$font-${key}-line-height: ${typeof typo.lineHeight === 'number' ? typo.lineHeight + 'px' : typo.lineHeight};`);
        lines.push(`$font-${key}-letter-spacing: ${typo.letterSpacing}px;`);
        lines.push('');
      }
      
      // Typography mixin
      lines.push('// Typography Mixin');
      lines.push('@mixin typography($style) {');
      for (const [key] of Object.entries(tokens.typography)) {
        lines.push(`  @if $style == "${key}" {`);
        lines.push(`    font-family: $font-${key}-family;`);
        lines.push(`    font-size: $font-${key}-size;`);
        lines.push(`    font-weight: $font-${key}-weight;`);
        lines.push(`    line-height: $font-${key}-line-height;`);
        lines.push(`    letter-spacing: $font-${key}-letter-spacing;`);
        lines.push('  }');
      }
      lines.push('}');
      lines.push('');
    }

    // Spacing
    if (Object.keys(tokens.spacing).length > 0) {
      lines.push('// Spacing');
      lines.push('// -------');
      for (const [key, space] of Object.entries(tokens.spacing)) {
        lines.push(`$spacing-${key}: ${space.value}px;`);
      }
      lines.push('');
      
      // Spacing map
      lines.push('$spacing: (');
      for (const [key, space] of Object.entries(tokens.spacing)) {
        lines.push(`  "${key}": ${space.value}px,`);
      }
      lines.push(');');
      lines.push('');
    }

    // Effects
    if (Object.keys(tokens.effects).length > 0) {
      lines.push('// Effects');
      lines.push('// -------');
      for (const [key, effect] of Object.entries(tokens.effects)) {
        if (effect.type === 'shadow') {
          const { offsetX, offsetY, blur, spread, color } = effect.value;
          lines.push(`$shadow-${key}: ${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color};`);
        } else if (effect.type === 'blur') {
          lines.push(`$blur-${key}: ${effect.value.blur}px;`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Convert tokens to JSON (Style Dictionary compatible)
   */
  toJSON(tokens: DesignTokens): string {
    const output: any = {
      $schema: "https://design-tokens.github.io/community-group/format/",
      $metadata: {
        generator: "origin-os-figma-sync",
        version: tokens.metadata.version,
        lastSynced: tokens.metadata.lastSynced,
        source: {
          type: "figma",
          fileKey: tokens.metadata.figmaFileKey
        }
      },
      color: {},
      typography: {},
      spacing: {},
      effect: {}
    };

    // Colors in DTCG format
    for (const [key, color] of Object.entries(tokens.colors)) {
      output.color[key] = {
        $type: "color",
        $value: color.value,
        $description: color.description || color.name
      };
    }

    // Typography
    for (const [key, typo] of Object.entries(tokens.typography)) {
      output.typography[key] = {
        $type: "typography",
        $value: {
          fontFamily: typo.fontFamily,
          fontSize: `${typo.fontSize}px`,
          fontWeight: typo.fontWeight,
          lineHeight: typeof typo.lineHeight === 'number' ? `${typo.lineHeight}px` : typo.lineHeight,
          letterSpacing: `${typo.letterSpacing}px`
        },
        $description: typo.description || typo.name
      };
    }

    // Spacing
    for (const [key, space] of Object.entries(tokens.spacing)) {
      output.spacing[key] = {
        $type: "dimension",
        $value: `${space.value}px`,
        $description: space.description || space.name
      };
    }

    // Effects
    for (const [key, effect] of Object.entries(tokens.effects)) {
      if (effect.type === 'shadow') {
        output.effect[key] = {
          $type: "shadow",
          $value: {
            color: effect.value.color,
            offsetX: `${effect.value.offsetX}px`,
            offsetY: `${effect.value.offsetY}px`,
            blur: `${effect.value.blur}px`,
            spread: `${effect.value.spread}px`
          },
          $description: effect.description || effect.name
        };
      }
    }

    return JSON.stringify(output, null, 2);
  }

  // Helper methods
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
