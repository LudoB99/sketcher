# Sketcher

A web-based Paint clone: pencil, brush, eraser, fill bucket, eyedropper, shapes (line/rectangle/ellipse, outlined or filled), text, undo/redo, a resizable canvas, and PNG export. Built with TypeScript, Vite, React, and Zustand.

**This project is way over-engineered for what it is.** It's a Paint clone. It does not need a Vite dev server, TypeScript, a state management library, or a whole frontend framework wrapped around a `<canvas>` element. It has all of these anyway, purely for fun and because it made a good excuse to set them up. The production bundle grew from 8.8 KB to 206 KB the day React showed up. Don't take the tooling as a sign this is serious business.

## Architecture, such as it is

React owns the UI chrome (toolbar, colors, status bar) via a small Zustand store (`src/store.ts`) holding the current tool, colors, sizes, and canvas dimensions. The actual pixel-drawing code (`src/history.ts`, `src/drawing.ts`, `src/engine.ts`) is plain imperative TypeScript that reads from the store and manipulates the `<canvas>` directly, untouched by React's render cycle. Nobody asked for this split; it just made the "over-engineered" bit funnier.

## Prerequisites

- [Node.js](https://nodejs.org/) `^20.19.0 || >=22.12.0`
- npm (bundled with Node)

## Setup

```bash
npm install
```

## Development

Starts a local dev server with hot reload (CSS updates apply instantly; JS/HTML changes auto-refresh the page):

```bash
npm run dev
```

Then open the URL it prints (defaults to `http://localhost:5173`).

## Type checking

```bash
npm run typecheck
```

Runs `tsc --noEmit`. Note: `typescript-eslint` doesn't support TypeScript 7 yet, so `npm run lint` (below) doesn't currently cover the `.ts`/`.tsx` source files. `typecheck` is the real safety net for those until that catches up.

## Linting

```bash
npm run lint
```

Covers JSON, Markdown, and CSS (see the caveat above re: `.ts`/`.tsx` files).

## Production build

```bash
npm run build    # outputs to dist/
npm run preview  # serves the dist/ build locally to sanity-check it
```
