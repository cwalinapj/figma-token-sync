/**
 * Figma Token Extractor
 * 
 * Extracts design tokens from Figma files using:
 * 1. Figma MCP Server (preferred - when available via Claude)
 * 2. Figma REST API (fallback)
 */

import { 
  DesignTokens, 
  ColorToken, 
  TypographyToken, 
  SpacingToken, 
  EffectToken,
  FigmaColor,
  FigmaEffect,
  FigmaTextStyle 
} from '../types';

export interface FigmaConfig {
  fileKey: string;
  accessToken?: string;
  useMCP?: boolean;
  nodeIds?: string[];        // Specific nodes to extract from
  stylePrefix?: string;      // Filter styles by prefix
}

export class FigmaExtractor {
  private config: FigmaConfig;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(config: FigmaConfig) {
    this.config = config;
  }

  async extract(): Promise<DesignTokens> {
    // Get file data
    const fileData = await this.getFileData();
    const styles = await this.getStyles();
    
    // Extract tokens from styles
    const colors = this.extractColors(fileData, styles);
    const typography = this.extractTypography(fileData, styles);
    const spacing = this.extractSpacing(fileData);
    const effects = this.extractEffects(fileData, styles);

    return {
      colors,
      typography,
      spacing,
      effects,
      metadata: {
        version: '1.0.0',
        lastSynced: new Date().toISOString(),
        figmaFileKey: this.config.fileKey,
        figmaFileName: fileData.name
      }
    };
  }

  private async getFileData(): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/files/${this.config.fileKey}`,
      {
        headers: {
          'X-Figma-Token': this.config.accessToken || ''
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async getStyles(): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/files/${this.config.fileKey}/styles`,
      {
        headers: {
          'X-Figma-Token': this.config.accessToken || ''
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.meta?.styles || [];
  }

  private extractColors(fileData: any, styles: any[]): Record<string, ColorToken> {
    const colors: Record<string, ColorToken> = {};
    
    // Extract from published styles
    const colorStyles = styles.filter(s => s.style_type === 'FILL');
    
    for (const style of colorStyles) {
      const node = this.findNodeByStyleId(fileData.document, style.node_id);
      if (node?.fills?.[0]?.color) {
        const fill = node.fills[0];
        const name = this.tokenizeName(style.name);
        
        colors[name] = {
          name: style.name,
          value: this.figmaColorToHex(fill.color),
          opacity: fill.opacity ?? 1,
          description: style.description,
          figmaId: style.key
        };
      }
    }

    // Also extract colors from color variables if present
    this.extractColorVariables(fileData, colors);

    return colors;
  }

  private extractTypography(fileData: any, styles: any[]): Record<string, TypographyToken> {
    const typography: Record<string, TypographyToken> = {};
    
    const textStyles = styles.filter(s => s.style_type === 'TEXT');
    
    for (const style of textStyles) {
      const node = this.findNodeByStyleId(fileData.document, style.node_id);
      if (node?.style) {
        const textStyle: FigmaTextStyle = node.style;
        const name = this.tokenizeName(style.name);
        
        typography[name] = {
          name: style.name,
          fontFamily: textStyle.fontFamily,
          fontSize: textStyle.fontSize,
          fontWeight: textStyle.fontWeight,
          lineHeight: textStyle.lineHeightPx,
          letterSpacing: textStyle.letterSpacing,
          description: style.description,
          figmaId: style.key
        };
      }
    }

    return typography;
  }

  private extractSpacing(fileData: any): Record<string, SpacingToken> {
    const spacing: Record<string, SpacingToken> = {};
    
    // Look for a spacing frame/component in the file
    const spacingFrame = this.findNodeByName(fileData.document, 'Spacing');
    
    if (spacingFrame?.children) {
      for (const child of spacingFrame.children) {
        if (child.absoluteBoundingBox) {
          const name = this.tokenizeName(child.name);
          spacing[name] = {
            name: child.name,
            value: Math.round(child.absoluteBoundingBox.width),
            description: `Spacing unit: ${child.name}`
          };
        }
      }
    }

    // Default spacing scale if none found
    if (Object.keys(spacing).length === 0) {
      const defaultScale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
      defaultScale.forEach((value, index) => {
        spacing[`space-${index}`] = {
          name: `Space ${index}`,
          value,
          description: `${value}px spacing unit`
        };
      });
    }

    return spacing;
  }

  private extractEffects(fileData: any, styles: any[]): Record<string, EffectToken> {
    const effects: Record<string, EffectToken> = {};
    
    const effectStyles = styles.filter(s => s.style_type === 'EFFECT');
    
    for (const style of effectStyles) {
      const node = this.findNodeByStyleId(fileData.document, style.node_id);
      if (node?.effects?.[0]) {
        const effect: FigmaEffect = node.effects[0];
        const name = this.tokenizeName(style.name);
        
        effects[name] = {
          name: style.name,
          type: this.mapEffectType(effect.type),
          value: {
            color: effect.color ? this.figmaColorToRgba(effect.color) : undefined,
            offsetX: effect.offset?.x ?? 0,
            offsetY: effect.offset?.y ?? 0,
            blur: effect.radius,
            spread: effect.spread ?? 0
          },
          description: style.description,
          figmaId: style.key
        };
      }
    }

    return effects;
  }

  private extractColorVariables(fileData: any, colors: Record<string, ColorToken>): void {
    // Extract from Figma Variables (newer feature)
    if (fileData.variables) {
      for (const [id, variable] of Object.entries(fileData.variables as Record<string, any>)) {
        if (variable.resolvedType === 'COLOR') {
          const name = this.tokenizeName(variable.name);
          const value = variable.valuesByMode?.[Object.keys(variable.valuesByMode)[0]];
          
          if (value) {
            colors[name] = {
              name: variable.name,
              value: this.figmaColorToHex(value),
              description: variable.description,
              figmaId: id
            };
          }
        }
      }
    }
  }

  // Helper methods
  private findNodeByStyleId(node: any, styleId: string): any {
    if (node.styles) {
      for (const [, id] of Object.entries(node.styles)) {
        if (id === styleId) return node;
      }
    }
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeByStyleId(child, styleId);
        if (found) return found;
      }
    }
    
    return null;
  }

  private findNodeByName(node: any, name: string): any {
    if (node.name?.toLowerCase() === name.toLowerCase()) {
      return node;
    }
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeByName(child, name);
        if (found) return found;
      }
    }
    
    return null;
  }

  private tokenizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\//g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private figmaColorToHex(color: FigmaColor): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private figmaColorToRgba(color: FigmaColor): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a ?? 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  private mapEffectType(figmaType: string): 'shadow' | 'blur' | 'glow' {
    switch (figmaType) {
      case 'DROP_SHADOW':
      case 'INNER_SHADOW':
        return 'shadow';
      case 'LAYER_BLUR':
      case 'BACKGROUND_BLUR':
        return 'blur';
      default:
        return 'shadow';
    }
  }
}
