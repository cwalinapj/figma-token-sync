# Figma Token Sync for Origin OS

Automatically sync design tokens from Figma to your Origin OS codebase. Extracts colors, typography, spacing, and effects, then generates CSS variables, Tailwind config, SCSS, and JSON tokens.

## Features

- 🎨 **Extract Design Tokens** - Colors, typography, spacing, shadows from Figma styles
- 🔄 **Multi-Format Output** - CSS variables, Tailwind config, SCSS, JSON (Style Dictionary)
- 🔌 **MCP Integration** - Works with Figma MCP server in Claude
- 👀 **Watch Mode** - Auto-sync on Figma changes
- 📦 **Variables Support** - Extracts Figma Variables (color modes)

## Quick Start

### 1. Install Dependencies

```bash
cd figma-token-sync
npm install
```

### 2. Configure Figma Access

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your Figma credentials:

```env
FIGMA_FILE_KEY=your-file-key-here
FIGMA_ACCESS_TOKEN=figd_xxxxx
```

**Get your file key** from the Figma URL:
```
figma.com/file/ABC123xyz/Design-System
                ↑
            FILE_KEY
```

**Get your access token** at [figma.com/developers/api](https://www.figma.com/developers/api#access-tokens)

### 3. Run Sync

```bash
# One-time sync
npm run sync

# Watch mode (re-syncs on changes)
npm run sync:watch
```

## Output Files

After running, you'll have:

```
tokens/
├── variables.css      # CSS custom properties
├── tailwind.tokens.js # Tailwind theme extension
├── tokens.json        # Style Dictionary compatible JSON
└── _variables.scss    # SCSS variables and mixins
```

### CSS Variables (`variables.css`)

```css
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-secondary: #10B981;
  
  /* Typography */
  --font-heading-1-family: "Inter";
  --font-heading-1-size: 32px;
  
  /* Spacing */
  --spacing-space-4: 16px;
  
  /* Effects */
  --shadow-elevation-1: 0px 2px 4px 0px rgba(0,0,0,0.1);
}
```

### Tailwind Config (`tailwind.tokens.js`)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      },
      spacing: {
        'space-4': '16px'
      }
    }
  }
}
```

Use in your main `tailwind.config.js`:

```js
const tokens = require('./tokens/tailwind.tokens.js');

module.exports = {
  ...tokens,
  content: ['./src/**/*.{js,jsx,ts,tsx}']
}
```

## Using with Figma MCP Server

If you've added the Figma MCP server to Claude:

```bash
claude mcp add --transport http figma-remote-mcp https://mcp.figma.com/mcp
```

You can ask Claude to:

1. **Extract tokens directly**: "Extract design tokens from my Figma file"
2. **Generate components**: "Create a React button using the Primary color token"
3. **Audit consistency**: "Check if the UI matches our Figma design system"

## Configuration

Customize in `figma-sync.config.js`:

```js
module.exports = {
  figma: {
    fileKey: process.env.FIGMA_FILE_KEY,
    accessToken: process.env.FIGMA_ACCESS_TOKEN,
    nodeIds: ['1:2'],        // Extract from specific frames
    stylePrefix: 'origin/'   // Filter by style name prefix
  },
  output: {
    css: './src/styles/variables.css',
    tailwind: './tailwind.tokens.js',
    json: './tokens/tokens.json',
    scss: './src/styles/_tokens.scss'
  }
};
```

## Figma Setup Best Practices

For best results, structure your Figma file:

### 1. Use Published Styles

Create color, text, and effect styles in Figma and **publish them** to your team library.

### 2. Naming Convention

Use `/` separators for token categories:

```
Colors/Primary/500
Colors/Neutral/100
Typography/Heading/H1
Spacing/Base/4
```

These become:
- `--color-primary-500`
- `--font-heading-h1-*`
- `--spacing-base-4`

### 3. Create a Spacing Frame

Add a frame named "Spacing" with rectangles representing your spacing scale:

```
Spacing/
  ├── 4   (4x4 rectangle)
  ├── 8   (8x8 rectangle)
  ├── 16  (16x16 rectangle)
  └── 32  (32x32 rectangle)
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Sync Design Tokens

on:
  workflow_dispatch:
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Monday

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd figma-token-sync && npm ci
      
      - name: Sync tokens
        env:
          FIGMA_FILE_KEY: ${{ secrets.FIGMA_FILE_KEY }}
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
        run: cd figma-token-sync && npm run sync
      
      - name: Create PR with changes
        uses: peter-evans/create-pull-request@v5
        with:
          title: '🎨 Update design tokens from Figma'
          commit-message: 'chore: sync design tokens from Figma'
          branch: design-token-sync
```

## Extending

### Add Custom Transformers

```typescript
// src/transformers/custom-transformer.ts
import { DesignTokens } from '../types';

export function toReactNative(tokens: DesignTokens): string {
  // Custom transformation logic
}
```

### Extract Additional Properties

Extend `FigmaExtractor` to pull more data:

```typescript
// Add to figma-extractor.ts
private extractGrids(fileData: any): Record<string, GridToken> {
  // Extract grid/layout tokens
}
```

## License

MIT
