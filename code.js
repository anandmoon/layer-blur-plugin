figma.showUI(__html__, { width: 300, height: 520 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "GENERATE") {
    generateComposition(msg);
  }
};

function generateComposition(config) {
  const {
    count,
    mode,
    colors,
    blur,
    canvas,
    density,
    preset
  } = config;

  const shapesToGenerate = count * density;
  const nodes = [];

  const viewportCenter = figma.viewport.center;

  const frame = figma.createFrame();
  frame.resize(canvas, canvas);
  frame.fills = [];
  frame.name = "Blur Canvas";

  // 🎯 Center frame in current viewport
  frame.x = viewportCenter.x - canvas / 2;
  frame.y = viewportCenter.y - canvas / 2;

  figma.currentPage.appendChild(frame);


  const palette = generatePalette(preset, shapesToGenerate, colors, mode);

  for (let i = 0; i < shapesToGenerate; i++) {
    const blob = createOrganicBlob(canvas * 0.6);
    blob.x = random(-canvas * 0.2, canvas * 0.4);
    blob.y = random(-canvas * 0.2, canvas * 0.4);

    blob.fills = [{
      type: "SOLID",
      color: palette[i]
    }];

    blob.effects = [{
      type: "LAYER_BLUR",
      radius: blur + random(-40, 60),
      visible: true
    }];

    frame.appendChild(blob);
    nodes.push(blob);
  }

  figma.viewport.scrollAndZoomIntoView([frame]);
}

// ----------------------------
// Preset Palettes
// ----------------------------

function generatePalette(preset, count, manualColors, mode) {
  if (mode === "manual") {
    return manualColors.map(hexToRgb);
  }

  // Base hue anchor → keeps palette cohesive
  const baseHue = random(0, 360);

  const presetConfig = {
    aurora: { sat: [0.55, 0.75], light: [0.55, 0.7], hueDrift: 40 },
    neon:   { sat: [0.85, 1.0],  light: [0.5, 0.6], hueDrift: 25 },
    pastel: { sat: [0.3, 0.45],  light: [0.7, 0.82], hueDrift: 30 },
    dark:   { sat: [0.45, 0.7],  light: [0.25, 0.38], hueDrift: 35 }
  };

  const cfg = presetConfig[preset];

  return Array.from({ length: count }, (_, i) => {
    const hue =
      baseHue +
      random(-cfg.hueDrift, cfg.hueDrift) +
      i * random(6, 14);     // subtle progression for blending

    const sat = random(cfg.sat[0], cfg.sat[1]);
    const light = random(cfg.light[0], cfg.light[1]);

    return hslColor(normalizeHue(hue), sat, light);
  });
}

function normalizeHue(h) {
  return (h + 360) % 360;
}


// ----------------------------
// Organic Blob Generator
// ----------------------------

function createOrganicBlob(radius) {
  const pointCount = 7 + Math.floor(Math.random() * 9);
  const points = [];

  for (let i = 0; i < pointCount; i++) {
    const angle = (Math.PI * 2 / pointCount) * i;
    const variance = radius * (0.4 + Math.random() * 0.7);

    points.push({
      x: Math.cos(angle) * variance,
      y: Math.sin(angle) * variance
    });
  }

  let path = `M ${points[0].x} ${points[0].y} `;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const cx = (prev.x + current.x) / 2;
    const cy = (prev.y + current.y) / 2;
    path += `Q ${prev.x} ${prev.y} ${cx} ${cy} `;
  }

  path += "Z";

  const vector = figma.createVector();
  vector.vectorPaths = [{ windingRule: "NONZERO", data: path }];

  return vector;
}

// ----------------------------
// Color Utilities
// ----------------------------

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255
  };
}

function hslColor(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0), g: f(8), b: f(4) };
}
