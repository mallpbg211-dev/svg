import {
  SVGDocumentData,
  ParsedShapeLayer,
  LinearGradientDef,
  RadialGradientDef,
  Matrix2D,
  StrokeStyle,
  PrimitiveShapeType,
} from '../types/svg';
import { multiplyMatrices, parseTransformString, decomposeMatrix, IDENTITY_MATRIX } from './matrix';
import { resolvePaint, parseGradientElement, parseCssColor } from './colors';
import {
  rectToPath,
  circleToPath,
  ellipseToPath,
  lineToPath,
  polylineToPath,
  polygonToPath,
} from './primitiveToPath';
import { parseAndStandardizePath } from './pathParser';

interface InheritedStyle {
  fill?: string;
  fillOpacity?: string;
  stroke?: string;
  strokeOpacity?: string;
  strokeWidth?: string;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  strokeMiterlimit?: string;
  strokeDasharray?: string;
  opacity: number;
}

export function parseSvgDocument(svgString: string, detectPrimitives = true): SVGDocumentData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  // Check for parse error
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Gagal mem-parsing SVG: Format XML/SVG tidak valid.');
  }

  const svgElem = doc.querySelector('svg');
  if (!svgElem) {
    throw new Error('Tidak ditemukan elemen <svg> root.');
  }

  // 1. Parse viewBox & dimensions
  let viewBoxX = 0;
  let viewBoxY = 0;
  let viewBoxW = 1080;
  let viewBoxH = 1080;

  const viewBoxAttr = svgElem.getAttribute('viewBox');
  if (viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map((v) => parseFloat(v));
    if (parts.length === 4 && !parts.some((n) => isNaN(n))) {
      viewBoxX = parts[0];
      viewBoxY = parts[1];
      viewBoxW = parts[2];
      viewBoxH = parts[3];
    }
  } else {
    const widthAttr = parseFloat(svgElem.getAttribute('width') || '1080');
    const heightAttr = parseFloat(svgElem.getAttribute('height') || '1080');
    viewBoxW = isNaN(widthAttr) || widthAttr <= 0 ? 1080 : widthAttr;
    viewBoxH = isNaN(heightAttr) || heightAttr <= 0 ? 1080 : heightAttr;
  }

  // 2. Parse <defs> gradients
  const gradients: Record<string, LinearGradientDef | RadialGradientDef> = {};
  const gradElements = doc.querySelectorAll('linearGradient, radialGradient');
  gradElements.forEach((elem) => {
    const grad = parseGradientElement(elem);
    if (grad) {
      gradients[grad.id] = grad;
    }
  });

  // 3. Recursive traversal of graphical elements
  const layers: ParsedShapeLayer[] = [];
  let layerIndex = 0;

  const title = svgElem.querySelector('title')?.textContent || 'Alight Motion Vector Asset';

  function traverseNode(node: Element, parentMatrix: Matrix2D, parentStyle: InheritedStyle) {
    const tagName = node.tagName.toLowerCase();

    // Exclusion: Ignore elements inside defs, clipPath, mask, pattern, metadata
    if (
      tagName === 'defs' ||
      tagName === 'clippath' ||
      tagName === 'mask' ||
      tagName === 'pattern' ||
      tagName === 'symbol' ||
      tagName === 'metadata' ||
      tagName === 'style' ||
      tagName === 'script' ||
      tagName === 'desc' ||
      tagName === 'title'
    ) {
      return;
    }

    // Check display="none" or visibility="hidden"
    const display = node.getAttribute('display') || (node as SVGElement).style?.display;
    const visibility = node.getAttribute('visibility') || (node as SVGElement).style?.visibility;
    if (display === 'none' || visibility === 'hidden' || visibility === 'collapse') {
      return;
    }

    // Transform accumulation
    const nodeTransformStr = node.getAttribute('transform');
    const nodeMatrix = parseTransformString(nodeTransformStr);
    const accumulatedMatrix = multiplyMatrices(parentMatrix, nodeMatrix);

    // Style inheritance
    const styleAttr = node.getAttribute('style') || '';
    const inlineStyles: Record<string, string> = {};
    if (styleAttr) {
      styleAttr.split(';').forEach((decl) => {
        const [k, v] = decl.split(':').map((s) => s.trim());
        if (k && v) {
          // normalize kebab-case
          const camel = k.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
          inlineStyles[camel] = v;
          inlineStyles[k] = v;
        }
      });
    }

    const getProp = (attrName: string, camelName: string): string | undefined => {
      return (
        node.getAttribute(attrName) ||
        inlineStyles[camelName] ||
        inlineStyles[attrName] ||
        ((parentStyle as unknown as Record<string, unknown>)[camelName] as string | undefined)
      );
    };

    const nodeOpacityAttr = node.getAttribute('opacity') || inlineStyles['opacity'];
    const nodeOpacity = nodeOpacityAttr !== undefined ? parseFloat(nodeOpacityAttr) : 1;
    const currentOpacity = isNaN(nodeOpacity) ? parentStyle.opacity : parentStyle.opacity * nodeOpacity;

    if (currentOpacity <= 0) {
      return; // excluded invisible layer
    }

    const currentStyle: InheritedStyle = {
      fill: getProp('fill', 'fill'),
      fillOpacity: getProp('fill-opacity', 'fillOpacity'),
      stroke: getProp('stroke', 'stroke'),
      strokeOpacity: getProp('stroke-opacity', 'strokeOpacity'),
      strokeWidth: getProp('stroke-width', 'strokeWidth'),
      strokeLinecap: (getProp('stroke-linecap', 'strokeLinecap') as 'butt' | 'round' | 'square') || parentStyle.strokeLinecap || 'butt',
      strokeLinejoin: (getProp('stroke-linejoin', 'strokeLinejoin') as 'miter' | 'round' | 'bevel') || parentStyle.strokeLinejoin || 'miter',
      strokeMiterlimit: getProp('stroke-miterlimit', 'strokeMiterlimit') || parentStyle.strokeMiterlimit,
      strokeDasharray: getProp('stroke-dasharray', 'strokeDasharray'),
      opacity: currentOpacity,
    };

    // If group <g> or <a> or <svg>
    if (tagName === 'g' || tagName === 'a' || tagName === 'svg') {
      const children = Array.from(node.children);
      for (const child of children) {
        traverseNode(child, accumulatedMatrix, currentStyle);
      }
      return;
    }

    // Graphical elements
    let rawPathD = '';
    let initialType: PrimitiveShapeType = 'path';
    let isOriginallyPrimitive = false;
    const primitiveDetails: Record<string, number | string> = {};

    switch (tagName) {
      case 'rect': {
        const x = parseFloat(node.getAttribute('x') || '0');
        const y = parseFloat(node.getAttribute('y') || '0');
        const w = parseFloat(node.getAttribute('width') || '0');
        const h = parseFloat(node.getAttribute('height') || '0');
        const rx = parseFloat(node.getAttribute('rx') || '0');
        const ry = parseFloat(node.getAttribute('ry') || '0');
        if (w > 0 && h > 0) {
          rawPathD = rectToPath(x, y, w, h, rx, ry);
          initialType = 'rect';
          isOriginallyPrimitive = true;
          primitiveDetails.x = x;
          primitiveDetails.y = y;
          primitiveDetails.width = w;
          primitiveDetails.height = h;
          if (rx || ry) {
            primitiveDetails.rx = rx;
            primitiveDetails.ry = ry;
          }
        }
        break;
      }

      case 'circle': {
        const cx = parseFloat(node.getAttribute('cx') || '0');
        const cy = parseFloat(node.getAttribute('cy') || '0');
        const r = parseFloat(node.getAttribute('r') || '0');
        if (r > 0) {
          rawPathD = circleToPath(cx, cy, r);
          initialType = 'circle';
          isOriginallyPrimitive = true;
          primitiveDetails.cx = cx;
          primitiveDetails.cy = cy;
          primitiveDetails.r = r;
        }
        break;
      }

      case 'ellipse': {
        const cx = parseFloat(node.getAttribute('cx') || '0');
        const cy = parseFloat(node.getAttribute('cy') || '0');
        const rx = parseFloat(node.getAttribute('rx') || '0');
        const ry = parseFloat(node.getAttribute('ry') || '0');
        if (rx > 0 && ry > 0) {
          rawPathD = ellipseToPath(cx, cy, rx, ry);
          initialType = 'ellipse';
          isOriginallyPrimitive = true;
          primitiveDetails.cx = cx;
          primitiveDetails.cy = cy;
          primitiveDetails.rx = rx;
          primitiveDetails.ry = ry;
        }
        break;
      }

      case 'line': {
        const x1 = parseFloat(node.getAttribute('x1') || '0');
        const y1 = parseFloat(node.getAttribute('y1') || '0');
        const x2 = parseFloat(node.getAttribute('x2') || '0');
        const y2 = parseFloat(node.getAttribute('y2') || '0');
        rawPathD = lineToPath(x1, y1, x2, y2);
        initialType = 'line';
        isOriginallyPrimitive = true;
        break;
      }

      case 'polyline': {
        const points = node.getAttribute('points') || '';
        rawPathD = polylineToPath(points);
        initialType = 'path';
        break;
      }

      case 'polygon': {
        const points = node.getAttribute('points') || '';
        rawPathD = polygonToPath(points);
        initialType = 'polygon';
        isOriginallyPrimitive = true;
        break;
      }

      case 'path': {
        rawPathD = node.getAttribute('d') || '';
        initialType = 'path';
        break;
      }

      default:
        // Other SVG elements (e.g. text or image) are skipped or could be logged
        break;
    }

    if (!rawPathD || !rawPathD.trim()) {
      return;
    }

    // Resolve Fill & Stroke
    // Default fill in SVG is black (#000000) if not specified; stroke is none
    const fillAttr = currentStyle.fill !== undefined ? currentStyle.fill : '#000000';
    const fill = resolvePaint(fillAttr, currentStyle.fillOpacity, gradients, '#000000');

    // Stroke
    let stroke: StrokeStyle = {
      enabled: false,
      color: '#000000',
      opacity: 1,
      width: 1,
      linecap: 'butt',
      linejoin: 'miter',
      miterlimit: 4,
    };

    if (currentStyle.stroke && currentStyle.stroke !== 'none') {
      const strokeOpacity = currentStyle.strokeOpacity ? parseFloat(currentStyle.strokeOpacity) : 1;
      const parsedStrokeColor = parseCssColor(currentStyle.stroke, strokeOpacity) || {
        hex: '#000000',
        r: 0,
        g: 0,
        b: 0,
        a: 1,
        type: 'solid' as const,
      };
      const widthVal = currentStyle.strokeWidth ? parseFloat(currentStyle.strokeWidth) : 1;

      let dasharray: number[] | undefined;
      if (currentStyle.strokeDasharray && currentStyle.strokeDasharray !== 'none') {
        dasharray = currentStyle.strokeDasharray
          .split(/[\s,]+/)
          .map((n) => parseFloat(n))
          .filter((n) => !isNaN(n));
      }

      stroke = {
        enabled: widthVal > 0,
        color: parsedStrokeColor.hex,
        opacity: parsedStrokeColor.a,
        width: Math.max(0, widthVal),
        linecap: currentStyle.strokeLinecap || 'butt',
        linejoin: currentStyle.strokeLinejoin || 'miter',
        miterlimit: currentStyle.strokeMiterlimit ? parseFloat(currentStyle.strokeMiterlimit) : 4,
        dasharray,
      };
    }

    // Skip if shape has no fill AND no stroke (completely invisible)
    if (fill.type === 'none' && !stroke.enabled) {
      return;
    }

    // Parse path geometry, standardize commands to M, L, C, Z
    const pathResult = parseAndStandardizePath(rawPathD, accumulatedMatrix);
    if (pathResult.contours.length === 0) {
      return;
    }

    layerIndex++;
    const nodeId = node.getAttribute('id') || `layer_${layerIndex}`;
    const nodeName =
      node.getAttribute('data-name') ||
      node.getAttribute('inkscape:label') ||
      node.getAttribute('id') ||
      `${tagName}_${layerIndex}`;

    // Primitive shape classification
    let finalType: PrimitiveShapeType = initialType;
    let isPrimitive = isOriginallyPrimitive;

    if (detectPrimitives) {
      if (pathResult.detectedPrimitive.isPrimitive) {
        finalType = pathResult.detectedPrimitive.type;
        isPrimitive = true;
      }
    }

    const decomposed = decomposeMatrix(accumulatedMatrix);

    layers.push({
      id: nodeId,
      name: nodeName,
      originalTag: tagName,
      pathData: pathResult.standardizedD,
      transformedPathData: pathResult.transformedD,
      contours: pathResult.contours,
      accumulatedMatrix,
      decomposedMatrix: decomposed,
      fill,
      stroke,
      opacity: currentOpacity,
      bounds: pathResult.bounds,
      isPrimitive,
      primitiveType: finalType,
      primitiveDetails: isPrimitive ? primitiveDetails : undefined,
      isIncluded: true,
      isVisible: true,
      isFlattened: false,
    });
  }

  // Start traversal from svg root
  const initialStyle: InheritedStyle = {
    fill: '#000000',
    fillOpacity: '1',
    stroke: 'none',
    opacity: 1,
  };

  const directChildren = Array.from(svgElem.children);
  for (const child of directChildren) {
    traverseNode(child, [...IDENTITY_MATRIX], initialStyle);
  }

  return {
    title,
    viewBox: {
      x: viewBoxX,
      y: viewBoxY,
      width: viewBoxW,
      height: viewBoxH,
    },
    width: viewBoxW,
    height: viewBoxH,
    layers,
    gradients,
    rawSvgString: svgString,
  };
}
