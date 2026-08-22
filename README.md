# Sketcher

A web-based Paint clone built with vanilla HTML, CSS, and JavaScript — pencil, brush, eraser, fill bucket, eyedropper, shapes (line/rectangle/ellipse, outlined or filled), text, undo/redo, a resizable canvas, and PNG export.

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

## Linting

```bash
npm run lint
```

## Production build

```bash
npm run build    # outputs to dist/
npm run preview  # serves the dist/ build locally to sanity-check it
```
