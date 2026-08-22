export type Tool =
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'fill'
  | 'eyedropper'
  | 'line'
  | 'rect'
  | 'rect-fill'
  | 'ellipse'
  | 'ellipse-fill'
  | 'text';

export const SHAPE_TOOLS: readonly Tool[] = ['line', 'rect', 'rect-fill', 'ellipse', 'ellipse-fill'];
