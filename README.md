# Sketcher

A web-based Paint clone: pencil, brush, eraser, fill bucket, eyedropper, shapes (line/rectangle/ellipse, outlined or filled), text, undo/redo, a resizable canvas, and PNG export. Built with TypeScript and Vite.

**This project is way over-engineered for what it is.** It's a Paint clone. It does not need a Vite dev server, TypeScript, ESLint, or a `typecheck` script. It has all of these anyway, purely for fun and because it made a good excuse to set them up. Don't take the tooling as a sign this is serious business.

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

Runs `tsc --noEmit`. Note: `typescript-eslint` doesn't support TypeScript 7 yet, so `npm run lint` (below) doesn't currently cover the `.ts` source files. `typecheck` is the real safety net for those until that catches up.

## Linting

```bash
npm run lint
```

Covers JSON, Markdown, and CSS (see the caveat above re: `.ts` files).

## Production build

```bash
npm run build    # outputs to dist/
npm run preview  # serves the dist/ build locally to sanity-check it
```
