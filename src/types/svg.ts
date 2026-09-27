export interface Point {
  x: number;
  y: number;
}

export type Matrix2D = [number, number, number, number, number, number]; // [a, b, c, d, e, f]

export interface DecomposedMatrix {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotationDeg: number;
  skewXDeg: number;
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SolidColor {
  type: 'solid';
  hex: string;
  r: number;
  g: number;
  b: number;
  a: number; // 0 to 1
}

export interface GradientStop {
  offset: number; // 0 to 1
  color: string;
  opacity: number;
}

export interface LinearGradientDef {
  type: 'linearGradient';
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: GradientStop[];
  matrix?: Matrix2D;
}

export interface RadialGradientDef {
  type: 'radialGradient';
  id: string;
  cx: number;
  cy: number;
  r: number;
  fx?: number;
  fy?: number;
  stops: GradientStop[];
  matrix?: Matrix2D;
}

export type PaintFill = SolidColor | LinearGradientDef | RadialGradientDef | { type: 'none' };

export interface StrokeStyle {
  enabled: boolean;
  color: string;
  opacity: number;
  width: number;
  linecap: 'butt' | 'round' | 'square';
  linejoin: 'miter' | 'round' | 'bevel';
  miterlimit: number;
  dasharray?: number[];
}

export type PrimitiveShapeType = 'rect' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'path';

export interface BezierPoint {
  x: number;
  y: number;
  type: 'move' | 'line' | 'cubic' | 'close';
  cp1x?: number;
  cp1y?: number;
  cp2x?: number;
  cp2y?: number;
}

export interface Contour {
  closed: boolean;
  points: BezierPoint[];
}

export interface ParsedShapeLayer {
  id: string;
  name: string;
  originalTag: string;
  pathData: string; // standard SVG path data (all M, L, C, Z)
  transformedPathData: string; // path with matrix baked in (optional)
  contours: Contour[];
  accumulatedMatrix: Matrix2D;
  decomposedMatrix: DecomposedMatrix;
  fill: PaintFill;
  stroke: StrokeStyle;
  opacity: number;
  bounds: RectBounds;
  isPrimitive: boolean;
  primitiveType: PrimitiveShapeType;
  primitiveDetails?: Record<string, number | string>;
  // UI and Optimizer states
  isIncluded: boolean; // included in XML export
  isVisible: boolean;  // rendered on preview canvas
  isFlattened: boolean; // if true, baked into background raster; if false, exported as vector layer
}

export interface SVGDocumentData {
  title: string;
  viewBox: RectBounds;
  width: number;
  height: number;
  layers: ParsedShapeLayer[];
  gradients: Record<string, LinearGradientDef | RadialGradientDef>;
  rawSvgString: string;
}

export interface OptimizerSettings {
  mergePathsByColor: boolean;
  detectPrimitives: boolean;
  bakeTransformsIntoGeometry: boolean;
  flattenMode: 'all_vector' | 'partial_flatten';
  layerThreshold: number; // default 300
}
