import { Matrix2D, Point, DecomposedMatrix } from '../types/svg';

export const IDENTITY_MATRIX: Matrix2D = [1, 0, 0, 1, 0, 0];

/**
 * Multiply two 2D affine transform matrices:
 * [a1, b1, c1, d1, e1, f1] * [a2, b2, c2, d2, e2, f2]
 */
export function multiplyMatrices(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;

  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

/**
 * Apply 2D affine transformation to a point (x, y)
 */
export function transformPoint(p: Point, m: Matrix2D): Point {
  const [a, b, c, d, e, f] = m;
  return {
    x: a * p.x + c * p.y + e,
    y: b * p.x + d * p.y + f,
  };
}

/**
 * Invert a 2D affine transform matrix
 */
export function invertMatrix(m: Matrix2D): Matrix2D {
  const [a, b, c, d, e, f] = m;
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-12) {
    return [...IDENTITY_MATRIX];
  }
  const invDet = 1 / det;
  return [
    d * invDet,
    -b * invDet,
    -c * invDet,
    a * invDet,
    (c * f - d * e) * invDet,
    (b * e - a * f) * invDet,
  ];
}

/**
 * Parse SVG transform attribute:
 * Examples:
 * - "translate(10, 20) rotate(45) scale(2)"
 * - "matrix(1 0 0 1 50 100)"
 * - "skewX(15)"
 */
export function parseTransformString(transformStr: string | null | undefined): Matrix2D {
  if (!transformStr || !transformStr.trim()) {
    return [...IDENTITY_MATRIX];
  }

  let currentMatrix: Matrix2D = [...IDENTITY_MATRIX];

  // Regex to match transform functions
  const transformRegex = /([a-zA-Z]+)\s*\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = transformRegex.exec(transformStr)) !== null) {
    const fnName = match[1].toLowerCase();
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .map((val) => parseFloat(val))
      .filter((n) => !isNaN(n));

    let termMatrix: Matrix2D = [...IDENTITY_MATRIX];

    switch (fnName) {
      case 'matrix':
        if (args.length >= 6) {
          termMatrix = [args[0], args[1], args[2], args[3], args[4], args[5]];
        }
        break;

      case 'translate':
        {
          const tx = args[0] || 0;
          const ty = args[1] !== undefined ? args[1] : 0;
          termMatrix = [1, 0, 0, 1, tx, ty];
        }
        break;

      case 'scale':
        {
          const sx = args[0] !== undefined ? args[0] : 1;
          const sy = args[1] !== undefined ? args[1] : sx;
          termMatrix = [sx, 0, 0, sy, 0, 0];
        }
        break;

      case 'rotate':
        {
          const angleDeg = args[0] || 0;
          const rad = (angleDeg * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          if (args.length >= 3) {
            // rotate about (cx, cy): translate(cx, cy) * rotate(a) * translate(-cx, -cy)
            const cx = args[1];
            const cy = args[2];
            const mTrans = [1, 0, 0, 1, cx, cy] as Matrix2D;
            const mRot = [cos, sin, -sin, cos, 0, 0] as Matrix2D;
            const mInvTrans = [1, 0, 0, 1, -cx, -cy] as Matrix2D;
            termMatrix = multiplyMatrices(multiplyMatrices(mTrans, mRot), mInvTrans);
          } else {
            termMatrix = [cos, sin, -sin, cos, 0, 0];
          }
        }
        break;

      case 'skewx':
        {
          const angleDeg = args[0] || 0;
          const rad = (angleDeg * Math.PI) / 180;
          termMatrix = [1, 0, Math.tan(rad), 1, 0, 0];
        }
        break;

      case 'skewy':
        {
          const angleDeg = args[0] || 0;
          const rad = (angleDeg * Math.PI) / 180;
          termMatrix = [1, Math.tan(rad), 0, 1, 0, 0];
        }
        break;
    }

    currentMatrix = multiplyMatrices(currentMatrix, termMatrix);
  }

  return currentMatrix;
}

/**
 * Decompose 2D affine matrix [a, b, c, d, e, f] into
 * translation, rotation, scale, and skew.
 */
export function decomposeMatrix(m: Matrix2D): DecomposedMatrix {
  const [a, b, c, d, e, f] = m;
  const translateX = Number(e.toFixed(4));
  const translateY = Number(f.toFixed(4));

  const scaleX = Math.hypot(a, b);
  const det = a * d - b * c;
  const signY = det < 0 ? -1 : 1;
  const scaleY = signY * Math.hypot(c, d);

  let rotationDeg = (Math.atan2(b, a) * 180) / Math.PI;
  if (rotationDeg < 0) rotationDeg += 360;

  // Approximate skew
  const skewXDeg = ((Math.atan2(a * c + b * d, a * a + b * b) * 180) / Math.PI);

  return {
    translateX,
    translateY,
    scaleX: Number(scaleX.toFixed(4)),
    scaleY: Number(scaleY.toFixed(4)),
    rotationDeg: Number(rotationDeg.toFixed(2)),
    skewXDeg: Number(skewXDeg.toFixed(2)),
  };
}

export function formatMatrix(m: Matrix2D): string {
  return `matrix(${m.map((v) => Number(v.toFixed(4))).join(', ')})`;
}
