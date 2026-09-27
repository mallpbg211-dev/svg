export interface CubicBezierSegment {
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  x: number;
  y: number;
}

const TAU = Math.PI * 2;

/**
 * Standard W3C Elliptic Arc to Cubic Bezier curve conversion
 * Based on W3C SVG Implementation Notes F.6
 */
export function arcToBezier(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  xAxisRotationDeg: number,
  largeArcFlag: number,
  sweepFlag: number,
  x2: number,
  y2: number
): CubicBezierSegment[] {
  // If the endpoints are identical, no arc to draw
  if (Math.abs(x1 - x2) < 1e-8 && Math.abs(y1 - y2) < 1e-8) {
    return [];
  }

  // If rx or ry is 0, the arc degenerates into a straight line
  if (rx === 0 || ry === 0) {
    return [
      {
        cp1x: x1 + (x2 - x1) / 3,
        cp1y: y1 + (y2 - y1) / 3,
        cp2x: x1 + (2 * (x2 - x1)) / 3,
        cp2y: y1 + (2 * (y2 - y1)) / 3,
        x: x2,
        y: y2,
      },
    ];
  }

  rx = Math.abs(rx);
  ry = Math.abs(ry);

  const phi = (xAxisRotationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // Step 1: Compute (x1', y1')
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  // Step 2: Ensure radii are large enough
  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  const radiiCheck = x1pSq / rxSq + y1pSq / rySq;
  if (radiiCheck > 1) {
    const scale = Math.sqrt(radiiCheck);
    rx *= scale;
    ry *= scale;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  // Step 3: Compute (cx', cy')
  let sign = largeArcFlag !== sweepFlag ? 1 : -1;
  const num = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
  const den = rxSq * y1pSq + rySq * x1pSq;
  let factor = 0;
  if (den > 0 && num > 0) {
    factor = sign * Math.sqrt(num / den);
  }

  const cxp = factor * ((rx * y1p) / ry);
  const cyp = factor * (-(ry * x1p) / rx);

  // Step 4: Compute (cx, cy) in original coordinate system
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  // Step 5: Compute start angle (theta1) and angle delta (dTheta)
  const vecAngle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    if (len === 0) return 0;
    let cos = dot / len;
    if (cos > 1) cos = 1;
    if (cos < -1) cos = -1;
    let ang = Math.acos(cos);
    if (ux * vy - uy * vx < 0) ang = -ang;
    return ang;
  };

  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = vecAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

  if (sweepFlag === 0 && dTheta > 0) {
    dTheta -= TAU;
  } else if (sweepFlag === 1 && dTheta < 0) {
    dTheta += TAU;
  }

  // Step 6: Subdivide into segments of at most PI/2
  const segmentsCount = Math.max(Math.ceil(Math.abs(dTheta) / (Math.PI / 2)), 1);
  const segDelta = dTheta / segmentsCount;
  const beziers: CubicBezierSegment[] = [];

  let currentAngle = theta1;

  for (let i = 0; i < segmentsCount; i++) {
    const nextAngle = currentAngle + segDelta;
    const t = segDelta;
    const alpha = (4 / 3) * Math.tan(t / 4);

    const cosCurrent = Math.cos(currentAngle);
    const sinCurrent = Math.sin(currentAngle);
    const cosNext = Math.cos(nextAngle);
    const sinNext = Math.sin(nextAngle);

    // Segment start and end in ellipse coordinates
    const eStart = { x: rx * cosCurrent, y: ry * sinCurrent };
    const eEnd = { x: rx * cosNext, y: ry * sinNext };

    // Control points in ellipse coordinates
    const eCp1 = {
      x: eStart.x - alpha * rx * sinCurrent,
      y: eStart.y + alpha * ry * cosCurrent,
    };
    const eCp2 = {
      x: eEnd.x + alpha * rx * sinNext,
      y: eEnd.y - alpha * ry * cosNext,
    };

    // Rotate and translate to original system
    const mapPoint = (px: number, py: number) => ({
      x: cosPhi * px - sinPhi * py + cx,
      y: sinPhi * px + cosPhi * py + cy,
    });

    const pCp1 = mapPoint(eCp1.x, eCp1.y);
    const pCp2 = mapPoint(eCp2.x, eCp2.y);
    const pEnd = i === segmentsCount - 1 ? { x: x2, y: y2 } : mapPoint(eEnd.x, eEnd.y);

    beziers.push({
      cp1x: Number(pCp1.x.toFixed(4)),
      cp1y: Number(pCp1.y.toFixed(4)),
      cp2x: Number(pCp2.x.toFixed(4)),
      cp2y: Number(pCp2.y.toFixed(4)),
      x: Number(pEnd.x.toFixed(4)),
      y: Number(pEnd.y.toFixed(4)),
    });

    currentAngle = nextAngle;
  }

  return beziers;
}
