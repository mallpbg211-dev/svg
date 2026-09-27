import { SolidColor, PaintFill, LinearGradientDef, RadialGradientDef, GradientStop, Matrix2D } from '../types/svg';
import { parseTransformString } from './matrix';

// Standard 140+ CSS Color Map
export const CSS_NAMED_COLORS: Record<string, string> = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  grey: '#808080',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32',
  transparent: '#00000000',
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function componentToHex(c: number): string {
  const hex = Math.round(c).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (((h % 360) + 360) % 360) / 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return [val, val, val];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return [r, g, b];
}

/**
 * Parse any CSS color value to normalized SolidColor object
 */
export function parseCssColor(rawColor: string | null | undefined, elementOpacity = 1): SolidColor | null {
  if (!rawColor || rawColor === 'none' || rawColor === 'transparent') {
    return null;
  }

  let color = rawColor.trim().toLowerCase();

  // If currentColor or inherit
  if (color === 'currentcolor' || color === 'inherit') {
    return {
      type: 'solid',
      hex: '#000000',
      r: 0,
      g: 0,
      b: 0,
      a: elementOpacity,
    };
  }

  // Check named colors
  if (CSS_NAMED_COLORS[color]) {
    color = CSS_NAMED_COLORS[color];
  }

  // Hex colors: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    let r = 0, g = 0, b = 0, a = 1;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
      return null;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

    return {
      type: 'solid',
      hex: rgbToHex(r, g, b),
      r,
      g,
      b,
      a: Number((a * elementOpacity).toFixed(4)),
    };
  }

  // rgb(r, g, b) or rgba(r, g, b, a) or rgb(r g b / a)
  const rgbMatch = color.match(/^rgba?\s*\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (rgbMatch) {
    const parseComponent = (val: string, max: number) => {
      if (val.endsWith('%')) {
        return (parseFloat(val) / 100) * max;
      }
      return parseFloat(val);
    };

    const r = clamp(Math.round(parseComponent(rgbMatch[1], 255)), 0, 255);
    const g = clamp(Math.round(parseComponent(rgbMatch[2], 255)), 0, 255);
    const b = clamp(Math.round(parseComponent(rgbMatch[3], 255)), 0, 255);
    let a = 1;

    if (rgbMatch[4] !== undefined) {
      if (rgbMatch[4].endsWith('%')) {
        a = parseFloat(rgbMatch[4]) / 100;
      } else {
        a = parseFloat(rgbMatch[4]);
      }
      a = clamp(a, 0, 1);
    }

    return {
      type: 'solid',
      hex: rgbToHex(r, g, b),
      r,
      g,
      b,
      a: Number((a * elementOpacity).toFixed(4)),
    };
  }

  // hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslMatch = color.match(/^hsla?\s*\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]);
    const l = parseFloat(hslMatch[3]);
    let a = 1;

    if (hslMatch[4] !== undefined) {
      if (hslMatch[4].endsWith('%')) {
        a = parseFloat(hslMatch[4]) / 100;
      } else {
        a = parseFloat(hslMatch[4]);
      }
      a = clamp(a, 0, 1);
    }

    const [r, g, b] = hslToRgb(h, s, l);
    return {
      type: 'solid',
      hex: rgbToHex(r, g, b),
      r,
      g,
      b,
      a: Number((a * elementOpacity).toFixed(4)),
    };
  }

  return null;
}

/**
 * Extract url(#id) reference from fill or stroke attribute
 */
export function extractGradientId(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/url\s*\(\s*['"]?#([^'"]+)['"]?\s*\)/);
  return match ? match[1] : null;
}

/**
 * Resolve paint (Solid, Gradient, or None)
 */
export function resolvePaint(
  paintAttr: string | null | undefined,
  opacityAttr: string | null | undefined,
  gradients: Record<string, LinearGradientDef | RadialGradientDef> = {},
  fallbackColor = '#000000'
): PaintFill {
  if (!paintAttr || paintAttr.trim() === 'none') {
    return { type: 'none' };
  }

  const opacity = opacityAttr ? clamp(parseFloat(opacityAttr), 0, 1) : 1;

  // Check gradient reference
  const gradId = extractGradientId(paintAttr);
  if (gradId && gradients[gradId]) {
    return gradients[gradId];
  }

  const solid = parseCssColor(paintAttr, opacity);
  if (solid) {
    return solid;
  }

  // Fallback if defined
  return {
    type: 'solid',
    hex: fallbackColor,
    r: 0,
    g: 0,
    b: 0,
    a: opacity,
  };
}

/**
 * Parse SVG <linearGradient> or <radialGradient> element
 */
export function parseGradientElement(
  elem: Element
): LinearGradientDef | RadialGradientDef | null {
  const tagName = elem.tagName.toLowerCase();
  const id = elem.getAttribute('id');
  if (!id) return null;

  const stops: GradientStop[] = [];
  const stopNodes = elem.querySelectorAll('stop');

  stopNodes.forEach((stopElem, idx) => {
    let offsetStr = stopElem.getAttribute('offset') || '0';
    let offset = 0;
    if (offsetStr.endsWith('%')) {
      offset = parseFloat(offsetStr) / 100;
    } else {
      offset = parseFloat(offsetStr);
    }
    if (isNaN(offset)) offset = idx / Math.max(1, stopNodes.length - 1);
    offset = clamp(offset, 0, 1);

    // Stop color and opacity
    const stopColorAttr = stopElem.getAttribute('stop-color') || stopElem.style.stopColor || '#000000';
    const stopOpacityAttr = stopElem.getAttribute('stop-opacity') || stopElem.style.stopOpacity || '1';
    const stopOpacity = clamp(parseFloat(stopOpacityAttr) || 1, 0, 1);

    const parsedColor = parseCssColor(stopColorAttr) || { hex: '#000000', r: 0, g: 0, b: 0, a: 1, type: 'solid' };

    stops.push({
      offset,
      color: parsedColor.hex,
      opacity: stopOpacity,
    });
  });

  const gradientTransformStr = elem.getAttribute('gradientTransform');
  const matrix: Matrix2D | undefined = gradientTransformStr
    ? parseTransformString(gradientTransformStr)
    : undefined;

  if (tagName === 'lineargradient') {
    const parseCoord = (attr: string | null, defVal: number) => {
      if (!attr) return defVal;
      if (attr.endsWith('%')) return parseFloat(attr) / 100;
      return parseFloat(attr);
    };

    return {
      type: 'linearGradient',
      id,
      x1: parseCoord(elem.getAttribute('x1'), 0),
      y1: parseCoord(elem.getAttribute('y1'), 0),
      x2: parseCoord(elem.getAttribute('x2'), 1),
      y2: parseCoord(elem.getAttribute('y2'), 0),
      stops,
      matrix,
    };
  }

  if (tagName === 'radialgradient') {
    const parseCoord = (attr: string | null, defVal: number) => {
      if (!attr) return defVal;
      if (attr.endsWith('%')) return parseFloat(attr) / 100;
      return parseFloat(attr);
    };

    return {
      type: 'radialGradient',
      id,
      cx: parseCoord(elem.getAttribute('cx'), 0.5),
      cy: parseCoord(elem.getAttribute('cy'), 0.5),
      r: parseCoord(elem.getAttribute('r'), 0.5),
      fx: elem.hasAttribute('fx') ? parseCoord(elem.getAttribute('fx'), 0.5) : undefined,
      fy: elem.hasAttribute('fy') ? parseCoord(elem.getAttribute('fy'), 0.5) : undefined,
      stops,
      matrix,
    };
  }

  return null;
}
