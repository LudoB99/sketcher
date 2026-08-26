import { pushHistory } from './history.js';
import {
  getPos, clearOverlay, strokeStyleFor, setupStroke,
  hexToRgba, floodFill, drawShape, placeText, pickColor
} from './drawing.js';
import { useAppStore } from './store.js';
import { SHAPE_TOOLS } from './types.js';

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

export function saveCanvasAsPng(): void {
  const canvas = getEl<HTMLCanvasElement>('canvas');
  const link = document.createElement('a');
  link.download = `sketch-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

let initialized = false;

export function initEngine(): void {
  if (initialized) return;
  initialized = true;

  const canvas = getEl<HTMLCanvasElement>('canvas');
  const overlay = getEl<HTMLCanvasElement>('overlay');
  const ctx = canvas.getContext('2d')!;
  const octx = overlay.getContext('2d')!;

  let drawing = false;
  let startX = 0, startY = 0;

  overlay.addEventListener('mousedown', (e) => {
    const { x, y } = getPos(e);
    startX = x;
    startY = y;
    const currentTool = useAppStore.getState().currentTool;

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
      if (currentTool === 'brush') ctx.lineWidth = useAppStore.getState().size * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  });

  overlay.addEventListener('mousemove', (e) => {
    const { x, y } = getPos(e);
    useAppStore.getState().setCursorPos(x, y);
    if (!drawing) return;

    const currentTool = useAppStore.getState().currentTool;
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

    const currentTool = useAppStore.getState().currentTool;
    if (SHAPE_TOOLS.includes(currentTool)) {
      const { x, y } = getPos(e);
      clearOverlay();
      setupStroke(ctx, e.button);
      drawShape(ctx, currentTool, startX, startY, x, y);
    }
  }

  overlay.addEventListener('mouseup', endStroke);
  overlay.addEventListener('mouseleave', () => {
    const currentTool = useAppStore.getState().currentTool;
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
}
