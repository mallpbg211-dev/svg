import { Matrix2D, RectBounds, Contour, BezierPoint, PrimitiveShapeType } from '../types/svg';
import { transformPoint } from './matrix';
import { arcToBezier } from './arcToBezier';

export interface ParsedPathResult {
  standardizedD: string;
  transformedD: string;
  contours: Contour[];
  bounds: RectBounds;
  detectedPrimitive: {
    isPrimitive: boolean;
    type: PrimitiveShapeType;
    details?: Record<string, number | string>;
  };
}

/**
 * Tokenize path data string into command and coordinate tokens
 */
function tokenizePath(d: string): string[] {
  // Regex matches commands or floating point numbers (including scientific notation like 1e-4)
  const regex = /([a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/gi;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(d)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

/**
 * Standardize path data to absolute M, L, C, Z commands and extract contours
 */
export function parseAndStandardizePath(d: string, matrix: Matrix2D): ParsedPathResult {
  if (!d || !d.trim()) {
    return {
      standardizedD: '',
      transformedD: '',
      contours: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      detectedPrimitive: { isPrimitive: false, type: 'path' },
    };
  }

  const tokens = tokenizePath(d);
  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  let lastCubicCpX = 0;
  let lastCubicCpY = 0;
  let lastQuadCpX = 0;
  let lastQuadCpY = 0;
  let lastCommand = '';

  const contours: Contour[] = [];
  let currentContour: Contour = { closed: false, points: [] };

  const standardCommands: string[] = [];
  const transformedCommands: string[] = [];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const updateBounds = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  const commitContour = () => {
    if (currentContour.points.length > 0) {
      contours.push(currentContour);
      currentContour = { closed: false, points: [] };
    }
  };

  let i = 0;
  while (i < tokens.length) {
    let token = tokens[i];
    let isCommand = /^[a-zA-Z]$/.test(token);
    let cmd = isCommand ? token : lastCommand;

    if (isCommand) {
      i++;
    } else {
      // Repeat command with previous type
      if (cmd === 'M') cmd = 'L';
      if (cmd === 'm') cmd = 'l';
    }

    const nextNumber = (): number => {
      if (i >= tokens.length) return 0;
      const val = parseFloat(tokens[i++]);
      return isNaN(val) ? 0 : val;
    };

    switch (cmd) {
      case 'M':
      case 'm': {
        const isRel = cmd === 'm';
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = isRel ? curY + nextNumber() : nextNumber();

        commitContour();
        startX = x;
        startY = y;
        curX = x;
        curY = y;
        lastCubicCpX = curX;
        lastCubicCpY = curY;
        lastQuadCpX = curX;
        lastQuadCpY = curY;

        currentContour.points.push({ x, y, type: 'move' });
        updateBounds(x, y);

        const tp = transformPoint({ x, y }, matrix);
        standardCommands.push(`M ${x.toFixed(4)} ${y.toFixed(4)}`);
        transformedCommands.push(`M ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`);
        break;
      }

      case 'L':
      case 'l': {
        const isRel = cmd === 'l';
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = isRel ? curY + nextNumber() : nextNumber();

        curX = x;
        curY = y;
        lastCubicCpX = curX;
        lastCubicCpY = curY;
        lastQuadCpX = curX;
        lastQuadCpY = curY;

        currentContour.points.push({ x, y, type: 'line' });
        updateBounds(x, y);

        const tp = transformPoint({ x, y }, matrix);
        standardCommands.push(`L ${x.toFixed(4)} ${y.toFixed(4)}`);
        transformedCommands.push(`L ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`);
        break;
      }

      case 'H':
      case 'h': {
        const isRel = cmd === 'h';
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = curY;

        curX = x;
        curY = y;
        lastCubicCpX = curX;
        lastCubicCpY = curY;
        lastQuadCpX = curX;
        lastQuadCpY = curY;

        currentContour.points.push({ x, y, type: 'line' });
        updateBounds(x, y);

        const tp = transformPoint({ x, y }, matrix);
        standardCommands.push(`L ${x.toFixed(4)} ${y.toFixed(4)}`);
        transformedCommands.push(`L ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`);
        break;
      }

      case 'V':
      case 'v': {
        const isRel = cmd === 'v';
        const x = curX;
        const y = isRel ? curY + nextNumber() : nextNumber();

        curX = x;
        curY = y;
        lastCubicCpX = curX;
        lastCubicCpY = curY;
        lastQuadCpX = curX;
        lastQuadCpY = curY;

        currentContour.points.push({ x, y, type: 'line' });
        updateBounds(x, y);

        const tp = transformPoint({ x, y }, matrix);
        standardCommands.push(`L ${x.toFixed(4)} ${y.toFixed(4)}`);
        transformedCommands.push(`L ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`);
        break;
      }

      case 'C':
      case 'c': {
        const isRel = cmd === 'c';
        const cp1x = isRel ? curX + nextNumber() : nextNumber();
        const cp1y = isRel ? curY + nextNumber() : nextNumber();
        const cp2x = isRel ? curX + nextNumber() : nextNumber();
        const cp2y = isRel ? curY + nextNumber() : nextNumber();
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = isRel ? curY + nextNumber() : nextNumber();

        lastCubicCpX = cp2x;
        lastCubicCpY = cp2y;
        lastQuadCpX = x;
        lastQuadCpY = y;
        curX = x;
        curY = y;

        currentContour.points.push({ x, y, type: 'cubic', cp1x, cp1y, cp2x, cp2y });
        updateBounds(cp1x, cp1y);
        updateBounds(cp2x, cp2y);
        updateBounds(x, y);

        const tcp1 = transformPoint({ x: cp1x, y: cp1y }, matrix);
        const tcp2 = transformPoint({ x: cp2x, y: cp2y }, matrix);
        const tp = transformPoint({ x, y }, matrix);

        standardCommands.push(
          `C ${cp1x.toFixed(4)} ${cp1y.toFixed(4)}, ${cp2x.toFixed(4)} ${cp2y.toFixed(4)}, ${x.toFixed(4)} ${y.toFixed(4)}`
        );
        transformedCommands.push(
          `C ${tcp1.x.toFixed(4)} ${tcp1.y.toFixed(4)}, ${tcp2.x.toFixed(4)} ${tcp2.y.toFixed(4)}, ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`
        );
        break;
      }

      case 'S':
      case 's': {
        const isRel = cmd === 's';
        let cp1x = curX;
        let cp1y = curY;
        if (/[CcSs]/.test(lastCommand)) {
          cp1x = 2 * curX - lastCubicCpX;
          cp1y = 2 * curY - lastCubicCpY;
        }
        const cp2x = isRel ? curX + nextNumber() : nextNumber();
        const cp2y = isRel ? curY + nextNumber() : nextNumber();
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = isRel ? curY + nextNumber() : nextNumber();

        lastCubicCpX = cp2x;
        lastCubicCpY = cp2y;
        lastQuadCpX = x;
        lastQuadCpY = y;
        curX = x;
        curY = y;

        currentContour.points.push({ x, y, type: 'cubic', cp1x, cp1y, cp2x, cp2y });
        updateBounds(cp1x, cp1y);
        updateBounds(cp2x, cp2y);
        updateBounds(x, y);

        const tcp1 = transformPoint({ x: cp1x, y: cp1y }, matrix);
        const tcp2 = transformPoint({ x: cp2x, y: cp2y }, matrix);
        const tp = transformPoint({ x, y }, matrix);

        standardCommands.push(
          `C ${cp1x.toFixed(4)} ${cp1y.toFixed(4)}, ${cp2x.toFixed(4)} ${cp2y.toFixed(4)}, ${x.toFixed(4)} ${y.toFixed(4)}`
        );
        transformedCommands.push(
          `C ${tcp1.x.toFixed(4)} ${tcp1.y.toFixed(4)}, ${tcp2.x.toFixed(4)} ${tcp2.y.toFixed(4)}, ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`
        );
        break;
      }

      case 'Q':
      case 'q': {
        const isRel = cmd === 'q';
        const qpx = isRel ? curX + nextNumber() : nextNumber();
        const qpy = isRel ? curY + nextNumber() : nextNumber();
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = isRel ? curY + nextNumber() : nextNumber();

        // Elevate Quadratic Bezier to Cubic Bezier
        const cp1x = curX + (2 / 3) * (qpx - curX);
        const cp1y = curY + (2 / 3) * (qpy - curY);
        const cp2x = x + (2 / 3) * (qpx - x);
        const cp2y = y + (2 / 3) * (qpy - y);

        lastQuadCpX = qpx;
        lastQuadCpY = qpy;
        lastCubicCpX = cp2x;
        lastCubicCpY = cp2y;
        curX = x;
        curY = y;

        currentContour.points.push({ x, y, type: 'cubic', cp1x, cp1y, cp2x, cp2y });
        updateBounds(qpx, qpy);
        updateBounds(x, y);

        const tcp1 = transformPoint({ x: cp1x, y: cp1y }, matrix);
        const tcp2 = transformPoint({ x: cp2x, y: cp2y }, matrix);
        const tp = transformPoint({ x, y }, matrix);

        standardCommands.push(
          `C ${cp1x.toFixed(4)} ${cp1y.toFixed(4)}, ${cp2x.toFixed(4)} ${cp2y.toFixed(4)}, ${x.toFixed(4)} ${y.toFixed(4)}`
        );
        transformedCommands.push(
          `C ${tcp1.x.toFixed(4)} ${tcp1.y.toFixed(4)}, ${tcp2.x.toFixed(4)} ${tcp2.y.toFixed(4)}, ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`
        );
        break;
      }

      case 'T':
      case 't': {
        const isRel = cmd === 't';
        let qpx = curX;
        let qpy = curY;
        if (/[QqTt]/.test(lastCommand)) {
          qpx = 2 * curX - lastQuadCpX;
          qpy = 2 * curY - lastQuadCpY;
        }
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = isRel ? curY + nextNumber() : nextNumber();

        // Elevate to Cubic Bezier
        const cp1x = curX + (2 / 3) * (qpx - curX);
        const cp1y = curY + (2 / 3) * (qpy - curY);
        const cp2x = x + (2 / 3) * (qpx - x);
        const cp2y = y + (2 / 3) * (qpy - y);

        lastQuadCpX = qpx;
        lastQuadCpY = qpy;
        lastCubicCpX = cp2x;
        lastCubicCpY = cp2y;
        curX = x;
        curY = y;

        currentContour.points.push({ x, y, type: 'cubic', cp1x, cp1y, cp2x, cp2y });
        updateBounds(qpx, qpy);
        updateBounds(x, y);

        const tcp1 = transformPoint({ x: cp1x, y: cp1y }, matrix);
        const tcp2 = transformPoint({ x: cp2x, y: cp2y }, matrix);
        const tp = transformPoint({ x, y }, matrix);

        standardCommands.push(
          `C ${cp1x.toFixed(4)} ${cp1y.toFixed(4)}, ${cp2x.toFixed(4)} ${cp2y.toFixed(4)}, ${x.toFixed(4)} ${y.toFixed(4)}`
        );
        transformedCommands.push(
          `C ${tcp1.x.toFixed(4)} ${tcp1.y.toFixed(4)}, ${tcp2.x.toFixed(4)} ${tcp2.y.toFixed(4)}, ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`
        );
        break;
      }

      case 'A':
      case 'a': {
        const isRel = cmd === 'a';
        const rx = nextNumber();
        const ry = nextNumber();
        const rot = nextNumber();
        const largeArc = Math.round(nextNumber());
        const sweep = Math.round(nextNumber());
        const x = isRel ? curX + nextNumber() : nextNumber();
        const y = isRel ? curY + nextNumber() : nextNumber();

        const beziers = arcToBezier(curX, curY, rx, ry, rot, largeArc, sweep, x, y);

        for (const seg of beziers) {
          currentContour.points.push({
            x: seg.x,
            y: seg.y,
            type: 'cubic',
            cp1x: seg.cp1x,
            cp1y: seg.cp1y,
            cp2x: seg.cp2x,
            cp2y: seg.cp2y,
          });
          updateBounds(seg.cp1x, seg.cp1y);
          updateBounds(seg.cp2x, seg.cp2y);
          updateBounds(seg.x, seg.y);

          const tcp1 = transformPoint({ x: seg.cp1x, y: seg.cp1y }, matrix);
          const tcp2 = transformPoint({ x: seg.cp2x, y: seg.cp2y }, matrix);
          const tp = transformPoint({ x: seg.x, y: seg.y }, matrix);

          standardCommands.push(
            `C ${seg.cp1x.toFixed(4)} ${seg.cp1y.toFixed(4)}, ${seg.cp2x.toFixed(4)} ${seg.cp2y.toFixed(4)}, ${seg.x.toFixed(4)} ${seg.y.toFixed(4)}`
          );
          transformedCommands.push(
            `C ${tcp1.x.toFixed(4)} ${tcp1.y.toFixed(4)}, ${tcp2.x.toFixed(4)} ${tcp2.y.toFixed(4)}, ${tp.x.toFixed(4)} ${tp.y.toFixed(4)}`
          );
        }

        curX = x;
        curY = y;
        lastCubicCpX = curX;
        lastCubicCpY = curY;
        lastQuadCpX = curX;
        lastQuadCpY = curY;
        break;
      }

      case 'Z':
      case 'z': {
        currentContour.closed = true;
        currentContour.points.push({ x: startX, y: startY, type: 'close' });
        curX = startX;
        curY = startY;
        lastCubicCpX = curX;
        lastCubicCpY = curY;
        lastQuadCpX = curX;
        lastQuadCpY = curY;

        standardCommands.push('Z');
        transformedCommands.push('Z');
        commitContour();
        break;
      }
    }

    lastCommand = cmd;
  }

  commitContour();

  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }

  const bounds: RectBounds = {
    x: Number(minX.toFixed(2)),
    y: Number(minY.toFixed(2)),
    width: Number(Math.max(0, maxX - minX).toFixed(2)),
    height: Number(Math.max(0, maxY - minY).toFixed(2)),
  };

  const detectedPrimitive = detectPrimitiveShape(contours, bounds);

  return {
    standardizedD: standardCommands.join(' '),
    transformedD: transformedCommands.join(' '),
    contours,
    bounds,
    detectedPrimitive,
  };
}

/**
 * Geometric shape detection:
 * Detects if a parsed contour represents a rectangle, circle, ellipse, or regular polygon
 */
function detectPrimitiveShape(
  contours: Contour[],
  bounds: RectBounds
): { isPrimitive: boolean; type: PrimitiveShapeType; details?: Record<string, number | string> } {
  if (contours.length !== 1 || !contours[0].closed) {
    return { isPrimitive: false, type: 'path' };
  }

  const points = contours[0].points;
  // If exactly 4 or 5 points and all are lines (except close)
  const linePoints = points.filter((p) => p.type === 'move' || p.type === 'line');

  if (linePoints.length === 4) {
    // Check if lines form an axis-aligned rectangle
    const [p0, p1, p2, p3] = linePoints;
    const isBox =
      (Math.abs(p0.y - p1.y) < 0.5 && Math.abs(p1.x - p2.x) < 0.5 && Math.abs(p2.y - p3.y) < 0.5 && Math.abs(p3.x - p0.x) < 0.5) ||
      (Math.abs(p0.x - p1.x) < 0.5 && Math.abs(p1.y - p2.y) < 0.5 && Math.abs(p2.x - p3.x) < 0.5 && Math.abs(p3.y - p0.y) < 0.5);

    if (isBox) {
      return {
        isPrimitive: true,
        type: 'rect',
        details: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      };
    }
  }

  // Check circle / ellipse: 4 cubic bezier segments forming a closed loop
  const cubicPoints = points.filter((p) => p.type === 'cubic');
  if (cubicPoints.length === 4) {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;

    if (rx > 0 && ry > 0) {
      const isCircle = Math.abs(rx - ry) < 1.0;
      if (isCircle) {
        return {
          isPrimitive: true,
          type: 'circle',
          details: {
            cx: Number(cx.toFixed(2)),
            cy: Number(cy.toFixed(2)),
            r: Number(rx.toFixed(2)),
          },
        };
      }
      return {
        isPrimitive: true,
        type: 'ellipse',
        details: {
          cx: Number(cx.toFixed(2)),
          cy: Number(cy.toFixed(2)),
          rx: Number(rx.toFixed(2)),
          ry: Number(ry.toFixed(2)),
        },
      };
    }
  }

  // Check polygon (triangle, pentagon, hexagon, etc.)
  if (linePoints.length >= 3 && linePoints.length <= 12 && cubicPoints.length === 0) {
    return {
      isPrimitive: true,
      type: 'polygon',
      details: {
        vertexCount: linePoints.length,
      },
    };
  }

  return { isPrimitive: false, type: 'path' };
}
