import { pushHistory } from './history.js';
import type { Tool } from './types.js';

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const canvas = getEl<HTMLCanvasElement>('canvas');
const overlay = getEl<HTMLCanvasElement>('overlay');
const ctx = canvas.getContext('2d')!;
const octx = overlay.getContext('2d')!;

const sizeInput = getEl<HTMLInputElement>('size');
const fontsizeInput = getEl<HTMLInputElement>('fontsize');
const primaryColor = getEl<HTMLInputElement>('color-primary');
const secondaryColor = getEl<HTMLInputElement>('color-secondary');

export type RgbaColor = [number, number, number, number];

// ---------- helpers ----------
export function getPos(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: Math.round((e.clientX - rect.left) * scaleX),
    y: Math.round((e.clientY - rect.top) * scaleY)
  };
}

export function clearOverlay(): void {
  octx.clearRect(0, 0, overlay.width, overlay.height);
}

export function strokeStyleFor(button: number): string {
  return button === 2 ? secondaryColor.value : primaryColor.value;
}

export function setupStroke(targetCtx: CanvasRenderingContext2D, button: number): void {
  targetCtx.strokeStyle = strokeStyleFor(button);
  targetCtx.fillStyle = strokeStyleFor(button);
  targetCtx.lineWidth = Number(sizeInput.value);
  targetCtx.lineCap = 'round';
  targetCtx.lineJoin = 'round';
}

// ---------- eyedropper ----------
export function pickColor(x: number, y: number, button: number): void {
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  if (button === 2) secondaryColor.value = hex; else primaryColor.value = hex;
}

// ---------- flood fill ----------
export function hexToRgba(hex: string): RgbaColor {
  const v = hex.replace('#', '');
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return [r, g, b, 255];
}

export function floodFill(x: number, y: number, fillColor: RgbaColor): void {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const w = canvas.width, h = canvas.height;
  const idx = (px: number, py: number) => (py * w + px) * 4;
  const startIdx = idx(x, y);
  const target = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]];
  const [fr, fg, fb, fa] = fillColor;

  if (target[0] === fr && target[1] === fg && target[2] === fb && target[3] === fa) return;

  const matches = (i: number) => (
    data[i] === target[0] && data[i + 1] === target[1] &&
    data[i + 2] === target[2] && data[i + 3] === target[3]
  );

  const stack: [number, number][] = [[x, y]];
  while (stack.length) {
    const next = stack.pop();
    if (!next) break;
    const [cx, cy] = next;
    const i = idx(cx, cy);
    if (cx < 0 || cx >= w || cy < 0 || cy >= h || !matches(i)) continue;

    // scan left/right on this row, filling as we go
    let left = cx, right = cx;
    while (left > 0 && matches(idx(left - 1, cy))) left--;
    while (right < w - 1 && matches(idx(right + 1, cy))) right++;
    for (let px = left; px <= right; px++) {
      const pi = idx(px, cy);
      data[pi] = fr; data[pi + 1] = fg; data[pi + 2] = fb; data[pi + 3] = fa;
      if (cy > 0 && matches(idx(px, cy - 1))) stack.push([px, cy - 1]);
      if (cy < h - 1 && matches(idx(px, cy + 1))) stack.push([px, cy + 1]);
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ---------- shape preview ----------
export function drawShape(
  targetCtx: CanvasRenderingContext2D,
  tool: Tool,
  x0: number, y0: number, x1: number, y1: number
): void {
  targetCtx.beginPath();
  switch (tool) {
    case 'line':
      targetCtx.moveTo(x0, y0);
      targetCtx.lineTo(x1, y1);
      targetCtx.stroke();
      break;
    case 'rect':
      targetCtx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      break;
    case 'rect-fill':
      targetCtx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      break;
    case 'ellipse':
    case 'ellipse-fill': {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
      targetCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      if (tool === 'ellipse-fill') targetCtx.fill(); else targetCtx.stroke();
      break;
    }
  }
}

// ---------- text tool ----------
export function placeText(x: number, y: number): void {
  const value = prompt('Enter text:');
  if (!value) return;
  pushHistory();
  ctx.fillStyle = primaryColor.value;
  ctx.font = `${fontsizeInput.value}px "Segoe UI", Arial, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(value, x, y);
}
