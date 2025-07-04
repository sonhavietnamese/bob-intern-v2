# Bob - Node.js TypeScript Project

A simple Node.js TypeScript project set up with pnpm.

## Setup

This project uses:
- **Node.js** with TypeScript
- **pnpm** as the package manager
- **tsx** for running TypeScript files directly
- **ESM modules** (ES modules)

## Scripts

- `pnpm dev` - Run the TypeScript file directly with tsx
- `pnpm dev:watch` - Run in watch mode (restarts on file changes)
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Run the compiled JavaScript
- `pnpm clean` - Remove the dist directory
- `pnpm type-check` - Check TypeScript types without compilation

## Project Structure

```
bob/
├── src/
│   └── index.ts        # Main TypeScript file
├── dist/               # Compiled JavaScript output
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run in development mode:
   ```bash
   pnpm dev
   ```

3. Or build and run in production:
   ```bash
   pnpm build
   pnpm start
   ```

## Development

The project is configured with strict TypeScript settings and modern ES2022 features. You can modify the TypeScript configuration in `tsconfig.json` as needed.

For development, use `pnpm dev:watch` to automatically restart the application when files change. 