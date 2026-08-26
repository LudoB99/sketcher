import { useEffect, useState } from 'react';
import { useAppStore } from '../store.js';
import { undo, redo, performResize } from '../history.js';
import { TOOL_ICONS, TOOL_LABELS, TOOL_ORDER } from '../constants.js';

function ToolButtons() {
  const currentTool = useAppStore((s) => s.currentTool);
  const setTool = useAppStore((s) => s.setTool);

  return (
    <div className="tool-group" id="tools">
      {TOOL_ORDER.map((tool) => (
        <button
          key={tool}
          className={`tool-btn${tool === currentTool ? ' active' : ''}`}
          title={TOOL_LABELS[tool]}
          onClick={() => setTool(tool)}
        >
          {TOOL_ICONS[tool]}
        </button>
      ))}
    </div>
  );
}

function ToolOptions() {
  const currentTool = useAppStore((s) => s.currentTool);
  const size = useAppStore((s) => s.size);
  const setSize = useAppStore((s) => s.setSize);
  const fontSize = useAppStore((s) => s.fontSize);
  const setFontSize = useAppStore((s) => s.setFontSize);

  return (
    <div className="tool-group" id="options">
      <label className="opt">
        Size
        <input
          type="range" min={1} max={50} value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <span id="size-val">{size}</span>
      </label>
      <label className="opt" id="fontsize-opt" hidden={currentTool !== 'text'}>
        Font
        <input
          type="range" min={8} max={96} value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
        />
        <span id="fontsize-val">{fontSize}</span>
      </label>
    </div>
  );
}

function HistoryButtons() {
  return (
    <div className="tool-group" id="history">
      <button id="btn-undo" title="Undo (Ctrl+Z)" onClick={undo}>↶ Undo</button>
      <button id="btn-redo" title="Redo (Ctrl+Y)" onClick={redo}>↷ Redo</button>
    </div>
  );
}

function ResizeControls() {
  const canvasWidth = useAppStore((s) => s.canvasWidth);
  const canvasHeight = useAppStore((s) => s.canvasHeight);
  const [w, setW] = useState(canvasWidth);
  const [h, setH] = useState(canvasHeight);

  // Reflect resizes that happen elsewhere (drag handles, undo/redo) into the inputs.
  useEffect(() => setW(canvasWidth), [canvasWidth]);
  useEffect(() => setH(canvasHeight), [canvasHeight]);

  return (
    <div className="tool-group" id="canvas-size-group">
      <label className="opt">
        W <input
          type="number" min={10} max={4000} value={w}
          onChange={(e) => setW(Number(e.target.value))}
        />
      </label>
      <label className="opt">
        H <input
          type="number" min={10} max={4000} value={h}
          onChange={(e) => setH(Number(e.target.value))}
        />
      </label>
      <button id="btn-resize" title="Resize canvas to the values above" onClick={() => performResize(w, h)}>
        Resize
      </button>
    </div>
  );
}

export function Toolbar() {
  return (
    <div id="toolbar">
      <ToolButtons />
      <ToolOptions />
      <HistoryButtons />
      <ResizeControls />
    </div>
  );
}
