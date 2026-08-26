import { create } from 'zustand';
import type { Tool } from './types';

interface AppState {
  currentTool: Tool;
  setTool: (tool: Tool) => void;

  size: number;
  setSize: (size: number) => void;
  fontSize: number;
  setFontSize: (fontSize: number) => void;

  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;

  canvasWidth: number;
  canvasHeight: number;
  setCanvasSize: (width: number, height: number) => void;

  cursorPos: { x: number; y: number };
  setCursorPos: (x: number, y: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTool: 'pencil',
  setTool: (tool) => set({ currentTool: tool }),

  size: 4,
  setSize: (size) => set({ size }),
  fontSize: 24,
  setFontSize: (fontSize) => set({ fontSize }),

  primaryColor: '#000000',
  setPrimaryColor: (color) => set({ primaryColor: color }),
  secondaryColor: '#ffffff',
  setSecondaryColor: (color) => set({ secondaryColor: color }),

  canvasWidth: 1000,
  canvasHeight: 650,
  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  cursorPos: { x: 0, y: 0 },
  setCursorPos: (x, y) => set({ cursorPos: { x, y } })
}));
