import { useAppStore } from '../store.js';
import { TOOL_LABELS } from '../constants.js';

export function StatusBar() {
  const currentTool = useAppStore((s) => s.currentTool);
  const cursorPos = useAppStore((s) => s.cursorPos);
  const canvasWidth = useAppStore((s) => s.canvasWidth);
  const canvasHeight = useAppStore((s) => s.canvasHeight);

  return (
    <footer id="statusbar">
      <span id="status-tool">{TOOL_LABELS[currentTool]}</span>
      <span id="status-pos">x: {cursorPos.x}, y: {cursorPos.y}</span>
      <span id="status-size">{canvasWidth} × {canvasHeight}</span>
    </footer>
  );
}
