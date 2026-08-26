import type { Tool } from './types';

export const TOOL_LABELS: Record<Tool, string> = {
  pencil: 'Pencil', brush: 'Brush', eraser: 'Eraser', fill: 'Fill',
  eyedropper: 'Color Picker', line: 'Line', rect: 'Rectangle',
  'rect-fill': 'Filled Rectangle', ellipse: 'Ellipse',
  'ellipse-fill': 'Filled Ellipse', text: 'Text'
};

export const TOOL_ICONS: Record<Tool, string> = {
  pencil: '✏️', brush: '🖌️', eraser: '🧽', fill: '🪣',
  eyedropper: '💧', line: '╱', rect: '▭', 'rect-fill': '▮',
  ellipse: '◯', 'ellipse-fill': '⬤', text: '🅰️'
};

export const TOOL_ORDER: Tool[] = [
  'pencil', 'brush', 'eraser', 'fill', 'eyedropper',
  'line', 'rect', 'rect-fill', 'ellipse', 'ellipse-fill', 'text'
];

export const PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'
];
