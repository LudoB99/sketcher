import { pushHistory, fillWhite } from '../history.js';
import { saveCanvasAsPng } from '../engine.js';

export function TitleBar() {
  return (
    <header id="titlebar">
      <span id="app-title">Sketcher</span>
      <div id="file-actions">
        <button
          id="btn-new"
          title="New canvas"
          onClick={() => {
            if (!confirm('Start a new canvas? Unsaved work will be lost.')) return;
            pushHistory();
            fillWhite();
          }}
        >
          New
        </button>
        <button id="btn-save" title="Save as PNG" onClick={saveCanvasAsPng}>
          Save PNG
        </button>
      </div>
    </header>
  );
}
