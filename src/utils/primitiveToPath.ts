const KAPPA = 0.5522847498307936; // 4 * (Math.sqrt(2) - 1) / 3

/**
 * Convert <rect> element attributes into SVG path data
 */
export function rectToPath(
  x: number,
  y: number,
  width: number,
  height: number,
  rx = 0,
  ry = 0
): string {
  if (width <= 0 || height <= 0) return '';

  rx = Math.max(0, rx);
  ry = Math.max(0, ry);

  // If only one radius is specified, use it for both
  if (rx === 0 && ry > 0) rx = ry;
  if (ry === 0 && rx > 0) ry = rx;

  // Clamp radii to half dimensions
  rx = Math.min(rx, width / 2);
  ry = Math.min(ry, height / 2);

  if (rx === 0 && ry === 0) {
    return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  }

  // Rounded rectangle using cubic beziers
  const kx = rx * (1 - KAPPA);
  const ky = ry * (1 - KAPPA);

  return [
    `M ${x + rx} ${y}`,
    `H ${x + width - rx}`,
    `C ${x + width - kx} ${y}, ${x + width} ${y + ky}, ${x + width} ${y + ry}`,
    `V ${y + height - ry}`,
    `C ${x + width} ${y + height - ky}, ${x + width - kx} ${y + height}, ${x + width - rx} ${y + height}`,
    `H ${x + rx}`,
    `C ${x + kx} ${y + height}, ${x} ${y + height - ky}, ${x} ${y + height - ry}`,
    `V ${y + ry}`,
    `C ${x} ${y + ky}, ${x + kx} ${y}, ${x + rx} ${y}`,
    `Z`,
  ].join(' ');
}

/**
 * Convert <circle> into 4 cubic bezier segments
 */
export function circleToPath(cx: number, cy: number, r: number): string {
  if (r <= 0) return '';
  return ellipseToPath(cx, cy, r, r);
}

/**
 * Convert <ellipse> into 4 cubic bezier segments
 */
export function ellipseToPath(cx: number, cy: number, rx: number, ry: number): string {
  if (rx <= 0 || ry <= 0) return '';

  const ox = rx * KAPPA;
  const oy = ry * KAPPA;

  return [
    `M ${cx + rx} ${cy}`,
    `C ${cx + rx} ${cy + oy}, ${cx + ox} ${cy + ry}, ${cx} ${cy + ry}`,
    `C ${cx - ox} ${cy + ry}, ${cx - rx} ${cy + oy}, ${cx - rx} ${cy}`,
    `C ${cx - rx} ${cy - oy}, ${cx - ox} ${cy - ry}, ${cx} ${cy - ry}`,
    `C ${cx + ox} ${cy - ry}, ${cx + rx} ${cy - oy}, ${cx + rx} ${cy}`,
    `Z`,
  ].join(' ');
}

/**
 * Convert <line> to path
 */
export function lineToPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/**
 * Parse points string "x1,y1 x2,y2..." or "x1 y1 x2 y2..."
 */
export function parsePointsString(pointsStr: string): Array<{ x: number; y: number }> {
  if (!pointsStr || !pointsStr.trim()) return [];

  const nums = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n));

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    pts.push({ x: nums[i], y: nums[i + 1] });
  }
  return pts;
}

/**
 * Convert <polyline> to path
 */
export function polylineToPath(pointsStr: string): string {
  const pts = parsePointsString(pointsStr);
  if (pts.length === 0) return '';
  const first = pts[0];
  const rest = pts.slice(1).map((p) => `L ${p.x} ${p.y}`);
  return `M ${first.x} ${first.y} ${rest.join(' ')}`;
}

/**
 * Convert <polygon> to path
 */
export function polygonToPath(pointsStr: string): string {
  const pts = parsePointsString(pointsStr);
  if (pts.length === 0) return '';
  const first = pts[0];
  const rest = pts.slice(1).map((p) => `L ${p.x} ${p.y}`);
  return `M ${first.x} ${first.y} ${rest.join(' ')} Z`;
}
