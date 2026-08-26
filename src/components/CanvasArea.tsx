import { useEffect } from 'react';
import { useAppStore } from '../store.js';
import { initHistory } from '../history.js';
import { initDrawing } from '../drawing.js';
import { initEngine } from '../engine.js';

export function CanvasArea() {
  const currentTool = useAppStore((s) => s.currentTool);

  // One-time wiring of the imperative canvas engine, once these elements exist in the DOM.
  useEffect(() => {
    initHistory();
    initDrawing();
    initEngine();
  }, []);

  // Cosmetic only: canvas width/height below are set ONCE as plain DOM attributes.
  // The resize engine (history.ts) owns them from then on via direct DOM mutation -
  // they must never be re-bound to reactive state, since re-applying width/height
  // (even to the same value) clears the canvas bitmap per the HTMLCanvasElement spec.
  useEffect(() => {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.cursor = currentTool === 'eyedropper' ? 'copy' : 'crosshair';
  }, [currentTool]);

  return (
    <div id="canvas-wrap">
      <canvas id="canvas" width={1000} height={650} />
      <canvas id="overlay" width={1000} height={650} />
      <div id="resize-preview" />
      <div className="resize-handle" id="handle-e" data-dir="e" title="Drag to resize width" />
      <div className="resize-handle" id="handle-s" data-dir="s" title="Drag to resize height" />
      <div className="resize-handle" id="handle-se" data-dir="se" title="Drag to resize" />
    </div>
  );
}
