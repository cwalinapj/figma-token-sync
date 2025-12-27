/**
 * Origin OS Design Token Types
 */

export interface ColorToken {
  name: string;
  value: string;          // Hex, RGB, or RGBA
  opacity?: number;
  description?: string;
  figmaId?: string;
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing: number;
  textCase?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  description?: string;
  figmaId?: string;
}

export interface SpacingToken {
  name: string;
  value: number;          // In pixels
  description?: string;
}

export interface EffectToken {
  name: string;
  type: 'shadow' | 'blur' | 'glow';
  value: {
    color?: string;
    offsetX?: number;
    offsetY?: number;
    blur?: number;
    spread?: number;
  };
  description?: string;
  figmaId?: string;
}

export interface BorderToken {
  name: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  radius?: number;
  description?: string;
}

export interface DesignTokens {
  colors: Record<string, ColorToken>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, SpacingToken>;
  effects: Record<string, EffectToken>;
  borders?: Record<string, BorderToken>;
  breakpoints?: Record<string, number>;
  metadata: {
    version: string;
    lastSynced: string;
    figmaFileKey?: string;
    figmaFileName?: string;
  };
}

// Figma API Response Types
export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description: string;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName: string;
  fontSize: number;
  fontWeight: number;
  textAlignHorizontal: string;
  textAlignVertical: string;
  letterSpacing: number;
  lineHeightPx: number;
  lineHeightPercent: number;
  lineHeightUnit: string;
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  color?: FigmaColor;
  blendMode?: string;
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
}
