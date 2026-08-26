import { useAppStore } from '../store.js';
import { PALETTE } from '../constants.js';

export function ColorBar() {
  const primaryColor = useAppStore((s) => s.primaryColor);
  const setPrimaryColor = useAppStore((s) => s.setPrimaryColor);
  const secondaryColor = useAppStore((s) => s.secondaryColor);
  const setSecondaryColor = useAppStore((s) => s.setSecondaryColor);

  return (
    <div id="colorbar">
      <div id="swatches">
        {PALETTE.map((color) => (
          <div
            key={color}
            className="swatch"
            style={{ background: color }}
            title={color}
            onClick={(e) => (e.shiftKey ? setSecondaryColor(color) : setPrimaryColor(color))}
            onContextMenu={(e) => {
              e.preventDefault();
              setSecondaryColor(color);
            }}
          />
        ))}
      </div>
      <div id="active-colors">
        <label className="color-slot">
          <input
            type="color" id="color-primary" value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
          <span>Primary</span>
        </label>
        <label className="color-slot">
          <input
            type="color" id="color-secondary" value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
          />
          <span>Secondary</span>
        </label>
      </div>
    </div>
  );
}
