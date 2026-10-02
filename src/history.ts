import { useAppStore } from './store';

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

let canvas: HTMLCanvasElement;
let overlay: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let resizePreview: HTMLElement;
let handleE: HTMLElement;
let handleS: HTMLElement;
let handleSE: HTMLElement;

const MIN_CANVAS_SIZE = 10;
const MAX_CANVAS_SIZE = 4000;

// ---------- history (undo/redo) ----------
interface HistoryEntry {
  imageData: ImageData;
  width: number;
  height: number;
}

const undoStack: HistoryEntry[] = [];
const redoStack: HistoryEntry[] = [];
const MAX_HISTORY = 30;

function snapshot(): HistoryEntry {
  return {
    imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
    width: canvas.width,
    height: canvas.height
  };
}

function restore(entry: HistoryEntry): void {
  if (canvas.width !== entry.width || canvas.height !== entry.height) {
    resizeCanvases(entry.width, entry.height);
  }
  ctx.putImageData(entry.imageData, 0, 0);
  updateSizeUI();
}

export function pushHistory(): void {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
}

export function undo(): void {
  const entry = undoStack.pop();
  if (!entry) return;
  redoStack.push(snapshot());
  restore(entry);
}

export function redo(): void {
  const entry = redoStack.pop();
  if (!entry) return;
  undoStack.push(snapshot());
  restore(entry);
}

// ---------- canvas init ----------
export function fillWhite(): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateSizeUI(): void {
  useAppStore.getState().setCanvasSize(canvas.width, canvas.height);
  positionHandles();
}

function positionHandles(): void {
  const w = canvas.width, h = canvas.height;
  handleE.style.left = `${w}px`;
  handleE.style.top = '0px';
  handleE.style.height = `${h}px`;

  handleS.style.left = '0px';
  handleS.style.top = `${h}px`;
  handleS.style.width = `${w}px`;

  handleSE.style.left = `${w}px`;
  handleSE.style.top = `${h}px`;
}

// ---------- resizing ----------
function resizeCanvases(w: number, h: number): void {
  canvas.width = w;
  canvas.height = h;
  overlay.width = w;
  overlay.height = h;
}

function clampSize(v: number): number {
  return Math.max(MIN_CANVAS_SIZE, Math.min(MAX_CANVAS_SIZE, Math.round(v)));
}

export function performResize(newW: number, newH: number): void {
  newW = clampSize(newW);
  newH = clampSize(newH);
  if (newW === canvas.width && newH === canvas.height) return;
  pushHistory();
  const oldImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
  resizeCanvases(newW, newH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, newW, newH);
  ctx.putImageData(oldImage, 0, 0);
  updateSizeUI();
}

type ResizeDir = 'e' | 's' | 'se';
let resizeDir: ResizeDir | null = null;
let dragStartClientX = 0, dragStartClientY = 0, dragStartW = 0, dragStartH = 0;

function computeDragSize(e: MouseEvent): { w: number; h: number } {
  const dx = e.clientX - dragStartClientX;
  const dy = e.clientY - dragStartClientY;
  let w = dragStartW, h = dragStartH;
  if (resizeDir === 'e' || resizeDir === 'se') w = dragStartW + dx;
  if (resizeDir === 's' || resizeDir === 'se') h = dragStartH + dy;
  return { w: clampSize(w), h: clampSize(h) };
}

function onResizeDragMove(e: MouseEvent): void {
  const { w, h } = computeDragSize(e);
  resizePreview.style.width = `${w}px`;
  resizePreview.style.height = `${h}px`;
}

function onResizeDragEnd(e: MouseEvent): void {
  const { w, h } = computeDragSize(e);
  resizePreview.style.display = 'none';
  document.removeEventListener('mousemove', onResizeDragMove);
  document.removeEventListener('mouseup', onResizeDragEnd);
  resizeDir = null;
  performResize(w, h);
}

// ---------- init (called once the DOM exists, i.e. after React mounts) ----------
let initialized = false;

export function initHistory(): void {
  if (initialized) return;
  initialized = true;

  canvas = getEl<HTMLCanvasElement>('canvas');
  overlay = getEl<HTMLCanvasElement>('overlay');
  ctx = canvas.getContext('2d')!;
  resizePreview = getEl<HTMLElement>('resize-preview');
  handleE = getEl<HTMLElement>('handle-e');
  handleS = getEl<HTMLElement>('handle-s');
  handleSE = getEl<HTMLElement>('handle-se');

  fillWhite();
  updateSizeUI();

  [handleE, handleS, handleSE].forEach((handle) => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      resizeDir = handle.dataset.dir as ResizeDir;
      dragStartClientX = e.clientX;
      dragStartClientY = e.clientY;
      dragStartW = canvas.width;
      dragStartH = canvas.height;
      resizePreview.style.left = '0px';
      resizePreview.style.top = '0px';
      resizePreview.style.width = `${dragStartW}px`;
      resizePreview.style.height = `${dragStartH}px`;
      resizePreview.style.display = 'block';
      document.addEventListener('mousemove', onResizeDragMove);
      document.addEventListener('mouseup', onResizeDragEnd);
    });
  });

  window.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
  });
}
