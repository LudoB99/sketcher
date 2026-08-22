const canvas = document.getElementById('canvas');
const overlay = document.getElementById('overlay');
const ctx = canvas.getContext('2d');

const statusSize = document.getElementById('status-size');
const resizePreview = document.getElementById('resize-preview');
const handleE = document.getElementById('handle-e');
const handleS = document.getElementById('handle-s');
const handleSE = document.getElementById('handle-se');
const canvasWInput = document.getElementById('canvas-w');
const canvasHInput = document.getElementById('canvas-h');

const MIN_CANVAS_SIZE = 10;
const MAX_CANVAS_SIZE = 4000;
const CANVAS_OFFSET = 20; // matches #canvas/#overlay top/left in style.css

// ---------- history (undo/redo) ----------
const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 30;

function snapshot() {
  return {
    imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
    width: canvas.width,
    height: canvas.height
  };
}

function restore(entry) {
  if (canvas.width !== entry.width || canvas.height !== entry.height) {
    resizeCanvases(entry.width, entry.height);
  }
  ctx.putImageData(entry.imageData, 0, 0);
  updateSizeUI();
}

export function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
}

export function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
}

export function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
}

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);

window.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
});

// ---------- canvas init ----------
export function fillWhite() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateSizeUI() {
  statusSize.textContent = `${canvas.width} × ${canvas.height}`;
  canvasWInput.value = canvas.width;
  canvasHInput.value = canvas.height;
  positionHandles();
}

function positionHandles() {
  const w = canvas.width, h = canvas.height;
  handleE.style.left = `${CANVAS_OFFSET + w}px`;
  handleE.style.top = `${CANVAS_OFFSET}px`;
  handleE.style.height = `${h}px`;

  handleS.style.left = `${CANVAS_OFFSET}px`;
  handleS.style.top = `${CANVAS_OFFSET + h}px`;
  handleS.style.width = `${w}px`;

  handleSE.style.left = `${CANVAS_OFFSET + w}px`;
  handleSE.style.top = `${CANVAS_OFFSET + h}px`;
}

fillWhite();
updateSizeUI();

// ---------- resizing ----------
function resizeCanvases(w, h) {
  canvas.width = w;
  canvas.height = h;
  overlay.width = w;
  overlay.height = h;
}

function clampSize(v) {
  return Math.max(MIN_CANVAS_SIZE, Math.min(MAX_CANVAS_SIZE, Math.round(v)));
}

function performResize(newW, newH) {
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

let resizeDir = null;
let dragStartClientX = 0, dragStartClientY = 0, dragStartW = 0, dragStartH = 0;

function computeDragSize(e) {
  const dx = e.clientX - dragStartClientX;
  const dy = e.clientY - dragStartClientY;
  let w = dragStartW, h = dragStartH;
  if (resizeDir === 'e' || resizeDir === 'se') w = dragStartW + dx;
  if (resizeDir === 's' || resizeDir === 'se') h = dragStartH + dy;
  return { w: clampSize(w), h: clampSize(h) };
}

function onResizeDragMove(e) {
  const { w, h } = computeDragSize(e);
  resizePreview.style.width = `${w}px`;
  resizePreview.style.height = `${h}px`;
}

function onResizeDragEnd(e) {
  const { w, h } = computeDragSize(e);
  resizePreview.style.display = 'none';
  document.removeEventListener('mousemove', onResizeDragMove);
  document.removeEventListener('mouseup', onResizeDragEnd);
  resizeDir = null;
  performResize(w, h);
}

[handleE, handleS, handleSE].forEach((handle) => {
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    resizeDir = handle.dataset.dir;
    dragStartClientX = e.clientX;
    dragStartClientY = e.clientY;
    dragStartW = canvas.width;
    dragStartH = canvas.height;
    resizePreview.style.left = `${CANVAS_OFFSET}px`;
    resizePreview.style.top = `${CANVAS_OFFSET}px`;
    resizePreview.style.width = `${dragStartW}px`;
    resizePreview.style.height = `${dragStartH}px`;
    resizePreview.style.display = 'block';
    document.addEventListener('mousemove', onResizeDragMove);
    document.addEventListener('mouseup', onResizeDragEnd);
  });
});

document.getElementById('btn-resize').addEventListener('click', () => {
  performResize(Number(canvasWInput.value), Number(canvasHInput.value));
});
