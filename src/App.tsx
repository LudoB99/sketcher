import { TitleBar } from './components/TitleBar.js';
import { Toolbar } from './components/Toolbar.js';
import { ColorBar } from './components/ColorBar.js';
import { CanvasArea } from './components/CanvasArea.js';
import { StatusBar } from './components/StatusBar.js';

export function App() {
  return (
    <div id="app">
      <TitleBar />
      <Toolbar />
      <ColorBar />
      <CanvasArea />
      <StatusBar />
    </div>
  );
}
