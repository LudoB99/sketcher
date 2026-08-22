import { pushHistory, fillWhite } from './history.js';
import {
  getPos, clearOverlay, strokeStyleFor, setupStroke,
  hexToRgba, floodFill, drawShape, placeText, pickColor
} from './drawing.js';
import { SHAPE_TOOLS, type Tool } from './types.js';

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
const sizeVal = getEl<HTMLElement>('size-val');
const fontsizeOpt = getEl<HTMLElement>('fontsize-opt');
const fontsizeInput = getEl<HTMLInputElement>('fontsize');
const fontsizeVal = getEl<HTMLElement>('fontsize-val');

const primaryColor = getEl<HTMLInputElement>('color-primary');
const secondaryColor = getEl<HTMLInputElement>('color-secondary');
const swatchesEl = getEl<HTMLElement>('swatches');

const statusTool = getEl<HTMLElement>('status-tool');
const statusPos = getEl<HTMLElement>('status-pos');

const TOOL_LABELS: Record<Tool, string> = {
  pencil: 'Pencil', brush: 'Brush', eraser: 'Eraser', fill: 'Fill',
  eyedropper: 'Color Picker', line: 'Line', rect: 'Rectangle',
  'rect-fill': 'Filled Rectangle', ellipse: 'Ellipse',
  'ellipse-fill': 'Filled Ellipse', text: 'Text'
};

const PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'
];

let currentTool: Tool = 'pencil';
let drawing = false;
let startX = 0, startY = 0;

// ---------- toolbar wiring ----------
document.querySelectorAll<HTMLButtonElement>('.tool-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool as Tool;
    statusTool.textContent = TOOL_LABELS[currentTool];
    fontsizeOpt.hidden = currentTool !== 'text';
    overlay.style.cursor = currentTool === 'eyedropper' ? 'copy' : 'crosshair';
  });
});

sizeInput.addEventListener('input', () => { sizeVal.textContent = sizeInput.value; });
fontsizeInput.addEventListener('input', () => { fontsizeVal.textContent = fontsizeInput.value; });

PALETTE.forEach((color) => {
  const sw = document.createElement('div');
  sw.className = 'swatch';
  sw.style.background = color;
  sw.title = color;
  sw.addEventListener('click', (e) => {
    if (e.shiftKey) secondaryColor.value = color;
    else primaryColor.value = color;
  });
  sw.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    secondaryColor.value = color;
  });
  swatchesEl.appendChild(sw);
});

getEl<HTMLButtonElement>('btn-new').addEventListener('click', () => {
  if (!confirm('Start a new canvas? Unsaved work will be lost.')) return;
  pushHistory();
  fillWhite();
});

getEl<HTMLButtonElement>('btn-save').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `sketch-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ---------- pointer events ----------
overlay.addEventListener('mousedown', (e) => {
  const { x, y } = getPos(e);
  startX = x;
  startY = y;

  if (currentTool === 'eyedropper') {
    pickColor(x, y, e.button);
    return;
  }
  if (currentTool === 'fill') {
    pushHistory();
    const hex = strokeStyleFor(e.button);
    floodFill(x, y, hexToRgba(hex));
    return;
  }
  if (currentTool === 'text') {
    placeText(x, y);
    return;
  }

  pushHistory();
  drawing = true;

  if (currentTool === 'pencil' || currentTool === 'brush' || currentTool === 'eraser') {
    setupStroke(ctx, e.button);
    if (currentTool === 'eraser') ctx.strokeStyle = '#ffffff';
    if (currentTool === 'brush') ctx.lineWidth = Number(sizeInput.value) * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
});

overlay.addEventListener('mousemove', (e) => {
  const { x, y } = getPos(e);
  statusPos.textContent = `x: ${x}, y: ${y}`;
  if (!drawing) return;

  if (currentTool === 'pencil' || currentTool === 'brush' || currentTool === 'eraser') {
    ctx.lineTo(x, y);
    ctx.stroke();
  } else if (SHAPE_TOOLS.includes(currentTool)) {
    clearOverlay();
    setupStroke(octx, e.buttons === 2 ? 2 : 1);
    drawShape(octx, currentTool, startX, startY, x, y);
  }
});

function endStroke(e: MouseEvent): void {
  if (!drawing) return;
  drawing = false;

  if (SHAPE_TOOLS.includes(currentTool)) {
    const { x, y } = getPos(e);
    clearOverlay();
    setupStroke(ctx, e.button);
    drawShape(ctx, currentTool, startX, startY, x, y);
  }
}

overlay.addEventListener('mouseup', endStroke);
overlay.addEventListener('mouseleave', () => {
  if (drawing && (currentTool === 'pencil' || currentTool === 'brush' || currentTool === 'eraser')) {
    // stop freehand strokes when leaving canvas, but keep shape rubber-banding
    drawing = false;
  }
});
overlay.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- touch support ----------
function touchToMouseEvent(touch: Touch, type: string): MouseEvent {
  return new MouseEvent(type, {
    clientX: touch.clientX,
    clientY: touch.clientY,
    button: 0,
    buttons: 1
  });
}
overlay.addEventListener('touchstart', (e) => {
  e.preventDefault();
  overlay.dispatchEvent(touchToMouseEvent(e.touches[0], 'mousedown'));
}, { passive: false });
overlay.addEventListener('touchmove', (e) => {
  e.preventDefault();
  overlay.dispatchEvent(touchToMouseEvent(e.touches[0], 'mousemove'));
}, { passive: false });
overlay.addEventListener('touchend', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  overlay.dispatchEvent(new MouseEvent('mouseup', { clientX: t.clientX, clientY: t.clientY, button: 0 }));
}, { passive: false });
