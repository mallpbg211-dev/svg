import { ParsedShapeLayer, SVGDocumentData, RectBounds } from '../types/svg';
import { IDENTITY_MATRIX } from './matrix';

export interface OptimizationResult {
  layers: ParsedShapeLayer[];
  originalLayerCount: number;
  finalLayerCount: number;
  reductionPercentage: number;
  hasThresholdWarning: boolean;
  threshold: number;
  colorClustersCount: number;
}

/**
 * Merge paths that share the same fill color & stroke
 */
export function mergePathsByColor(
  layers: ParsedShapeLayer[],
  bakeTransforms = true
): ParsedShapeLayer[] {
  const merged: ParsedShapeLayer[] = [];
  const groupsByColorKey = new Map<string, ParsedShapeLayer[]>();

  // Helper to generate unique key for appearance
  const getAppearanceKey = (layer: ParsedShapeLayer): string => {
    let fillStr = 'none';
    if (layer.fill.type === 'solid') {
      fillStr = `solid:${layer.fill.hex}:${layer.fill.a}`;
    } else if (layer.fill.type === 'linearGradient' || layer.fill.type === 'radialGradient') {
      fillStr = `gradient:${layer.fill.id}`;
    }

    const strokeStr = layer.stroke.enabled
      ? `stroke:${layer.stroke.color}:${layer.stroke.width}:${layer.stroke.linecap}:${layer.stroke.linejoin}`
      : 'no-stroke';

    return `${fillStr}|${strokeStr}|op:${layer.opacity.toFixed(2)}`;
  };

  // Group active layers
  layers.forEach((layer) => {
    if (!layer.isIncluded) return;
    const key = getAppearanceKey(layer);
    if (!groupsByColorKey.has(key)) {
      groupsByColorKey.set(key, []);
    }
    groupsByColorKey.get(key)!.push(layer);
  });

  let clusterIndex = 0;
  groupsByColorKey.forEach((cluster, key) => {
    clusterIndex++;
    if (cluster.length === 1) {
      merged.push({ ...cluster[0] });
      return;
    }

    // Merge multiple paths into a compound path
    const combinedPathData = cluster
      .map((l) => (bakeTransforms ? l.transformedPathData : l.pathData))
      .filter(Boolean)
      .join(' ');

    // Merge contours
    const combinedContours = cluster.flatMap((l) => l.contours);

    // Compute combined bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    cluster.forEach((l) => {
      minX = Math.min(minX, l.bounds.x);
      minY = Math.min(minY, l.bounds.y);
      maxX = Math.max(maxX, l.bounds.x + l.bounds.width);
      maxY = Math.max(maxY, l.bounds.y + l.bounds.height);
    });

    const rep = cluster[0];
    const fillLabel = rep.fill.type === 'solid' ? rep.fill.hex : 'Gradient';

    merged.push({
      id: `merged_cluster_${clusterIndex}`,
      name: `Merged Layer (${cluster.length} paths · ${fillLabel})`,
      originalTag: 'path',
      pathData: combinedPathData,
      transformedPathData: combinedPathData,
      contours: combinedContours,
      accumulatedMatrix: bakeTransforms ? [...IDENTITY_MATRIX] : rep.accumulatedMatrix,
      decomposedMatrix: rep.decomposedMatrix,
      fill: rep.fill,
      stroke: rep.stroke,
      opacity: rep.opacity,
      bounds: {
        x: Number(minX.toFixed(2)),
        y: Number(minY.toFixed(2)),
        width: Number(Math.max(0, maxX - minX).toFixed(2)),
        height: Number(Math.max(0, maxY - minY).toFixed(2)),
      },
      isPrimitive: false,
      primitiveType: 'path',
      isIncluded: true,
      isVisible: true,
      isFlattened: false,
    });
  });

  return merged;
}

/**
 * Diagnostic analysis of document layers
 */
export function evaluateLayerOptimization(
  layers: ParsedShapeLayer[],
  threshold = 300,
  isMergeEnabled = false
): OptimizationResult {
  const activeLayers = layers.filter((l) => l.isIncluded);
  const originalLayerCount = activeLayers.length;

  let effectiveLayers = activeLayers;
  if (isMergeEnabled) {
    effectiveLayers = mergePathsByColor(activeLayers);
  }

  // Count distinct colors
  const colorSet = new Set<string>();
  activeLayers.forEach((l) => {
    if (l.fill.type === 'solid') colorSet.add(l.fill.hex);
  });

  const finalLayerCount = effectiveLayers.length;
  const reductionPercentage =
    originalLayerCount > 0
      ? Math.round(((originalLayerCount - finalLayerCount) / originalLayerCount) * 100)
      : 0;

  return {
    layers: effectiveLayers,
    originalLayerCount,
    finalLayerCount,
    reductionPercentage: Math.max(0, reductionPercentage),
    hasThresholdWarning: finalLayerCount > threshold,
    threshold,
    colorClustersCount: colorSet.size,
  };
}

/**
 * Render designated background layers onto an HTML5 Canvas to produce high-res raster PNG
 */
export async function rasterizeBackgroundToDataUrl(
  docData: SVGDocumentData,
  layersToRasterize: ParsedShapeLayer[],
  targetWidth = 1080,
  targetHeight = 1080
): Promise<string> {
  if (layersToRasterize.length === 0) {
    return '';
  }

  // Create SVG string containing only the background layers
  const viewBox = docData.viewBox;
  let defsString = '';
  Object.values(docData.gradients).forEach((g) => {
    if (g.type === 'linearGradient') {
      const stops = g.stops
        .map((s) => `<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${s.color}" stop-opacity="${s.opacity}"/>`)
        .join('');
      defsString += `<linearGradient id="${g.id}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${stops}</linearGradient>`;
    } else if (g.type === 'radialGradient') {
      const stops = g.stops
        .map((s) => `<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${s.color}" stop-opacity="${s.opacity}"/>`)
        .join('');
      defsString += `<radialGradient id="${g.id}" cx="${g.cx}" cy="${g.cy}" r="${g.r}">${stops}</radialGradient>`;
    }
  });

  let pathsString = '';
  layersToRasterize.forEach((l) => {
    let fillAttr = 'none';
    if (l.fill.type === 'solid') {
      fillAttr = l.fill.hex;
    } else if (l.fill.type === 'linearGradient' || l.fill.type === 'radialGradient') {
      fillAttr = `url(#${l.fill.id})`;
    }

    const strokeAttr = l.stroke.enabled
      ? `stroke="${l.stroke.color}" stroke-width="${l.stroke.width}" stroke-linecap="${l.stroke.linecap}" stroke-linejoin="${l.stroke.linejoin}" stroke-opacity="${l.stroke.opacity}"`
      : '';

    const [a, b, c, d, e, f] = l.accumulatedMatrix;
    const transformAttr = `transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})"`;

    pathsString += `<path d="${l.pathData}" fill="${fillAttr}" fill-opacity="${l.fill.type === 'solid' ? l.fill.a : 1}" opacity="${l.opacity}" ${transformAttr} ${strokeAttr} />\n`;
  });

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" width="${targetWidth}" height="${targetHeight}">
    <defs>${defsString}</defs>
    ${pathsString}
  </svg>`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal merender background PNG dari SVG'));
    };

    img.src = url;
  });
}
