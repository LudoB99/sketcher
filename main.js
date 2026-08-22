import { pushHistory, fillWhite } from './history.js';
import {
  getPos, clearOverlay, strokeStyleFor, setupStroke,
  hexToRgba, floodFill, drawShape, placeText, pickColor
} from './drawing.js';

const canvas = document.getElementById('canvas');
const overlay = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const octx = overlay.getContext('2d');

const sizeInput = document.getElementById('size');
const sizeVal = document.getElementById('size-val');
const fontsizeOpt = document.getElementById('fontsize-opt');
const fontsizeInput = document.getElementById('fontsize');
const fontsizeVal = document.getElementById('fontsize-val');

const primaryColor = document.getElementById('color-primary');
const secondaryColor = document.getElementById('color-secondary');
const swatchesEl = document.getElementById('swatches');

const statusTool = document.getElementById('status-tool');
const statusPos = document.getElementById('status-pos');

const TOOL_LABELS = {
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

let currentTool = 'pencil';
let drawing = false;
let startX = 0, startY = 0;

// ---------- toolbar wiring ----------
document.querySelectorAll('.tool-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
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

document.getElementById('btn-new').addEventListener('click', () => {
  if (!confirm('Start a new canvas? Unsaved work will be lost.')) return;
  pushHistory();
  fillWhite();
});

document.getElementById('btn-save').addEventListener('click', () => {
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
  } else if (['line', 'rect', 'rect-fill', 'ellipse', 'ellipse-fill'].includes(currentTool)) {
    clearOverlay();
    setupStroke(octx, e.buttons === 2 ? 2 : 1);
    drawShape(octx, currentTool, startX, startY, x, y);
  }
});

function endStroke(e) {
  if (!drawing) return;
  drawing = false;
  const { x, y } = getPos(e);

  if (['line', 'rect', 'rect-fill', 'ellipse', 'ellipse-fill'].includes(currentTool)) {
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
function touchToMouseEvent(touch, type) {
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
