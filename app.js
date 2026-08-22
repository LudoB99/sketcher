(() => {
  const canvas = document.getElementById('canvas');
  const overlay = document.getElementById('overlay');
  const ctx = canvas.getContext('2d');
  const octx = overlay.getContext('2d');

  const sizeInput = document.getElementById('size');
  const sizeVal = document.getElementById('size-val');
  const fontsizeOpt = document.getElementById('fontsize-opt');
  const fontsizeInput = document.getElementById('fontsize');
  const fontsizeVal = document.getElementById('fontsize-val');

  const primaryColor = document.getElementById('color-primary');
  const secondaryColor = document.getElementById('color-secondary');
  const swatchesEl = document.getElementById('swatches');

  const statusTool = document.getElementById('status-tool');
  const statusPos = document.getElementById('status-pos');
  const statusSize = document.getElementById('status-size');

  const resizePreview = document.getElementById('resize-preview');
  const handleE = document.getElementById('handle-e');
  const handleS = document.getElementById('handle-s');
  const handleSE = document.getElementById('handle-se');
  const canvasWInput = document.getElementById('canvas-w');
  const canvasHInput = document.getElementById('canvas-h');

  const MIN_CANVAS_SIZE = 10;
  const MAX_CANVAS_SIZE = 4000;
  const CANVAS_OFFSET = 20; // matches #canvas/#overlay top/left in style.css

  const TOOL_LABELS = {
    pencil: 'Pencil', brush: 'Brush', eraser: 'Eraser', fill: 'Fill',
    eyedropper: 'Color Picker', line: 'Line', rect: 'Rectangle',
    'rect-fill': 'Filled Rectangle', ellipse: 'Ellipse',
    'ellipse-fill': 'Filled Ellipse', text: 'Text'
  };

  const PALETTE = [
    '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
    '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
    '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'
  ];

  let currentTool = 'pencil';
  let drawing = false;
  let startX = 0, startY = 0;

  // ---------- history (undo/redo) ----------
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 30;

  function snapshot() {
    return {
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      width: canvas.width,
      height: canvas.height
    };
  }

  function restore(entry) {
    if (canvas.width !== entry.width || canvas.height !== entry.height) {
      resizeCanvases(entry.width, entry.height);
    }
    ctx.putImageData(entry.imageData, 0, 0);
    updateSizeUI();
  }

  function pushHistory() {
    undoStack.push(snapshot());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
  }

  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);

  window.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
  });

  // ---------- canvas init ----------
  function fillWhite() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function updateSizeUI() {
    statusSize.textContent = `${canvas.width} × ${canvas.height}`;
    canvasWInput.value = canvas.width;
    canvasHInput.value = canvas.height;
    positionHandles();
  }

  function positionHandles() {
    const w = canvas.width, h = canvas.height;
    handleE.style.left = `${CANVAS_OFFSET + w}px`;
    handleE.style.top = `${CANVAS_OFFSET}px`;
    handleE.style.height = `${h}px`;

    handleS.style.left = `${CANVAS_OFFSET}px`;
    handleS.style.top = `${CANVAS_OFFSET + h}px`;
    handleS.style.width = `${w}px`;

    handleSE.style.left = `${CANVAS_OFFSET + w}px`;
    handleSE.style.top = `${CANVAS_OFFSET + h}px`;
  }

  fillWhite();
  updateSizeUI();

  // ---------- resizing ----------
  function resizeCanvases(w, h) {
    canvas.width = w;
    canvas.height = h;
    overlay.width = w;
    overlay.height = h;
  }

  function clampSize(v) {
    return Math.max(MIN_CANVAS_SIZE, Math.min(MAX_CANVAS_SIZE, Math.round(v)));
  }

  function performResize(newW, newH) {
    newW = clampSize(newW);
    newH = clampSize(newH);
    if (newW === canvas.width && newH === canvas.height) return;
    pushHistory();
    const oldImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    resizeCanvases(newW, newH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newW, newH);
    ctx.putImageData(oldImage, 0, 0);
    updateSizeUI();
  }

  let resizeDir = null;
  let dragStartClientX = 0, dragStartClientY = 0, dragStartW = 0, dragStartH = 0;

  function computeDragSize(e) {
    const dx = e.clientX - dragStartClientX;
    const dy = e.clientY - dragStartClientY;
    let w = dragStartW, h = dragStartH;
    if (resizeDir === 'e' || resizeDir === 'se') w = dragStartW + dx;
    if (resizeDir === 's' || resizeDir === 'se') h = dragStartH + dy;
    return { w: clampSize(w), h: clampSize(h) };
  }

  function onResizeDragMove(e) {
    const { w, h } = computeDragSize(e);
    resizePreview.style.width = `${w}px`;
    resizePreview.style.height = `${h}px`;
  }

  function onResizeDragEnd(e) {
    const { w, h } = computeDragSize(e);
    resizePreview.style.display = 'none';
    document.removeEventListener('mousemove', onResizeDragMove);
    document.removeEventListener('mouseup', onResizeDragEnd);
    resizeDir = null;
    performResize(w, h);
  }

  [handleE, handleS, handleSE].forEach((handle) => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      resizeDir = handle.dataset.dir;
      dragStartClientX = e.clientX;
      dragStartClientY = e.clientY;
      dragStartW = canvas.width;
      dragStartH = canvas.height;
      resizePreview.style.left = `${CANVAS_OFFSET}px`;
      resizePreview.style.top = `${CANVAS_OFFSET}px`;
      resizePreview.style.width = `${dragStartW}px`;
      resizePreview.style.height = `${dragStartH}px`;
      resizePreview.style.display = 'block';
      document.addEventListener('mousemove', onResizeDragMove);
      document.addEventListener('mouseup', onResizeDragEnd);
    });
  });

  document.getElementById('btn-resize').addEventListener('click', () => {
    performResize(Number(canvasWInput.value), Number(canvasHInput.value));
  });

  // ---------- toolbar wiring ----------
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
      statusTool.textContent = TOOL_LABELS[currentTool];
      fontsizeOpt.hidden = currentTool !== 'text';
      overlay.style.cursor = currentTool === 'eyedropper' ? 'copy' : 'crosshair';
    });
  });

  sizeInput.addEventListener('input', () => { sizeVal.textContent = sizeInput.value; });
  fontsizeInput.addEventListener('input', () => { fontsizeVal.textContent = fontsizeInput.value; });

  PALETTE.forEach((color) => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = color;
    sw.title = color;
    sw.addEventListener('click', (e) => {
      if (e.shiftKey) secondaryColor.value = color;
      else primaryColor.value = color;
    });
    sw.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      secondaryColor.value = color;
    });
    swatchesEl.appendChild(sw);
  });

  document.getElementById('btn-new').addEventListener('click', () => {
    if (!confirm('Start a new canvas? Unsaved work will be lost.')) return;
    pushHistory();
    fillWhite();
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `sketch-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // ---------- helpers ----------
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  }

  function clearOverlay() {
    octx.clearRect(0, 0, overlay.width, overlay.height);
  }

  function strokeStyleFor(button) {
    return button === 2 ? secondaryColor.value : primaryColor.value;
  }

  function setupStroke(targetCtx, button) {
    targetCtx.strokeStyle = strokeStyleFor(button);
    targetCtx.fillStyle = strokeStyleFor(button);
    targetCtx.lineWidth = Number(sizeInput.value);
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
  }

  // ---------- flood fill ----------
  function hexToRgba(hex) {
    const v = hex.replace('#', '');
    const r = parseInt(v.substring(0, 2), 16);
    const g = parseInt(v.substring(2, 4), 16);
    const b = parseInt(v.substring(4, 6), 16);
    return [r, g, b, 255];
  }

  function floodFill(x, y, fillColor) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = canvas.width, h = canvas.height;
    const idx = (px, py) => (py * w + px) * 4;
    const startIdx = idx(x, y);
    const target = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]];
    const [fr, fg, fb, fa] = fillColor;

    if (target[0] === fr && target[1] === fg && target[2] === fb && target[3] === fa) return;

    const matches = (i) => (
      data[i] === target[0] && data[i + 1] === target[1] &&
      data[i + 2] === target[2] && data[i + 3] === target[3]
    );

    const stack = [[x, y]];
    while (stack.length) {
      let [cx, cy] = stack.pop();
      let i = idx(cx, cy);
      if (cx < 0 || cx >= w || cy < 0 || cy >= h || !matches(i)) continue;

      // scan left/right on this row, filling as we go
      let left = cx, right = cx;
      while (left > 0 && matches(idx(left - 1, cy))) left--;
      while (right < w - 1 && matches(idx(right + 1, cy))) right++;
      for (let px = left; px <= right; px++) {
        const pi = idx(px, cy);
        data[pi] = fr; data[pi + 1] = fg; data[pi + 2] = fb; data[pi + 3] = fa;
        if (cy > 0 && matches(idx(px, cy - 1))) stack.push([px, cy - 1]);
        if (cy < h - 1 && matches(idx(px, cy + 1))) stack.push([px, cy + 1]);
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---------- shape preview ----------
  function drawShape(targetCtx, tool, x0, y0, x1, y1) {
    targetCtx.beginPath();
    switch (tool) {
      case 'line':
        targetCtx.moveTo(x0, y0);
        targetCtx.lineTo(x1, y1);
        targetCtx.stroke();
        break;
      case 'rect':
        targetCtx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
        break;
      case 'rect-fill':
        targetCtx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
        break;
      case 'ellipse':
      case 'ellipse-fill': {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
        targetCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (tool === 'ellipse-fill') targetCtx.fill(); else targetCtx.stroke();
        break;
      }
    }
  }

  // ---------- text tool ----------
  function placeText(x, y) {
    const value = prompt('Enter text:');
    if (!value) return;
    pushHistory();
    ctx.fillStyle = primaryColor.value;
    ctx.font = `${fontsizeInput.value}px "Segoe UI", Arial, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(value, x, y);
  }

  // ---------- pointer events ----------
  overlay.addEventListener('mousedown', (e) => {
    const { x, y } = getPos(e);
    startX = x;
    startY = y;

    if (currentTool === 'eyedropper') {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
      if (e.button === 2) secondaryColor.value = hex; else primaryColor.value = hex;
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
      if (currentTool === 'brush') ctx.lineWidth = Number(sizeInput.value) * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  });

  overlay.addEventListener('mousemove', (e) => {
    const { x, y } = getPos(e);
    statusPos.textContent = `x: ${x}, y: ${y}`;
    if (!drawing) return;

    if (currentTool === 'pencil' || currentTool === 'brush' || currentTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (['line', 'rect', 'rect-fill', 'ellipse', 'ellipse-fill'].includes(currentTool)) {
      clearOverlay();
      setupStroke(octx, e.buttons === 2 ? 2 : 1);
      drawShape(octx, currentTool, startX, startY, x, y);
    }
  });

  function endStroke(e) {
    if (!drawing) return;
    drawing = false;
    const { x, y } = getPos(e);

    if (['line', 'rect', 'rect-fill', 'ellipse', 'ellipse-fill'].includes(currentTool)) {
      clearOverlay();
      setupStroke(ctx, e.button);
      drawShape(ctx, currentTool, startX, startY, x, y);
    }
  }

  overlay.addEventListener('mouseup', endStroke);
  overlay.addEventListener('mouseleave', () => {
    if (drawing && (currentTool === 'pencil' || currentTool === 'brush' || currentTool === 'eraser')) {
      // stop freehand strokes when leaving canvas, but keep shape rubber-banding
      drawing = false;
    }
  });
  overlay.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- touch support ----------
  function touchToMouseEvent(touch, type) {
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
})();
