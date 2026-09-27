import { SVGDocumentData, ParsedShapeLayer } from '../types/svg';

export interface XmlExportOptions {
  projectName?: string;
  fps?: number;
  durationSeconds?: number;
  bakeTransforms?: boolean;
  flattenMode?: 'all_vector' | 'partial_flatten';
  flattenDataUrl?: string;
}

/**
 * Escapes characters for valid XML attribute or text values
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate Alight Motion compatible foundation XML
 */
export function generateAlightMotionXml(
  doc: SVGDocumentData,
  exportLayers: ParsedShapeLayer[],
  options: XmlExportOptions = {}
): string {
  const {
    projectName = doc.title || 'Alight_Motion_Vector_Asset',
    fps = 60,
    durationSeconds = 5.0,
    bakeTransforms = false,
    flattenMode = 'all_vector',
    flattenDataUrl = '',
  } = options;

  const width = Math.round(doc.width);
  const height = Math.round(doc.height);

  // Filter vector layers (not flattened and included)
  const vectorLayers = exportLayers.filter((l) => l.isIncluded && !l.isFlattened);
  const hasBackgroundRaster = flattenMode === 'partial_flatten' && flattenDataUrl;

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<!-- ======================================================================= -->');
  lines.push('<!-- ALIGHT MOTION XML CONVERSION FOUNDATION                                -->');
  lines.push('<!-- Generated from SVG by SVG to Alight Motion Converter                    -->');
  lines.push('<!-- Notes for Alight Motion mapping:                                        -->');
  lines.push('<!--   <shapeLayer>  -> Maps to AM Vector Shape Layer                        -->');
  lines.push('<!--   <transform>   -> Maps to AM Transform properties (Pos, Scale, Angle)  -->');
  lines.push('<!--   <geometry>    -> Vector contours and cubic bezier anchor points       -->');
  lines.push('<!--   <fill>        -> Solid Color or Linear/Radial Gradient fill           -->');
  lines.push('<!--   <stroke>      -> Stroke width, caps, joins, and colors                -->');
  lines.push('<!-- ======================================================================= -->');
  lines.push(
    `<alightMotionProject version="1.0" name="${escapeXml(projectName)}" width="${width}" height="${height}" fps="${fps}" totalFrames="${Math.round(fps * durationSeconds)}">`
  );
  lines.push(`  <scene name="Vector_Scene" duration="${durationSeconds.toFixed(2)}" backgroundColor="#00000000">`);

  // If partial flatten raster background layer exists
  if (hasBackgroundRaster) {
    lines.push('    <!-- Background Layer (Rasterized from non-animated SVG paths) -->');
    lines.push('    <imageLayer id="layer_bg_raster" name="Background (Flattened)" opacity="1.0" blendMode="normal">');
    lines.push('      <transform>');
    lines.push(`        <position x="${(width / 2).toFixed(2)}" y="${(height / 2).toFixed(2)}"/>`);
    lines.push('        <scale x="1.0000" y="1.0000"/>');
    lines.push('        <rotation degrees="0.00"/>');
    lines.push(`        <size width="${width}" height="${height}"/>`);
    lines.push('      </transform>');
    lines.push('      <!-- Embedded PNG Asset for Alight Motion -->');
    lines.push(`      <asset type="image/png" filename="background_flat.png" embedded="${flattenDataUrl.startsWith('data:') ? 'true' : 'false'}"/>`);
    lines.push('    </imageLayer>');
  }

  // Vector Shape Layers
  vectorLayers.forEach((layer, idx) => {
    const layerId = escapeXml(layer.id || `shape_${idx + 1}`);
    const layerName = escapeXml(layer.name || `Layer_${idx + 1}`);
    const primitiveAttr = layer.isPrimitive ? ` primitive="${layer.primitiveType}"` : '';

    lines.push(`    <!-- Shape Layer ${idx + 1}: ${layerName} -->`);
    lines.push(
      `    <shapeLayer id="${layerId}" name="${layerName}" index="${idx + 1}" opacity="${layer.opacity.toFixed(3)}"${primitiveAttr}>`
    );

    // Transform Node
    lines.push('      <transform>');
    if (bakeTransforms) {
      lines.push('        <!-- Matrix baked into geometry -->');
      lines.push('        <matrix a="1.0000" b="0.0000" c="0.0000" d="1.0000" tx="0.0000" ty="0.0000"/>');
      lines.push('        <position x="0.00" y="0.00"/>');
      lines.push('        <scale x="1.0000" y="1.0000"/>');
      lines.push('        <rotation degrees="0.00"/>');
    } else {
      const [a, b, c, d, e, f] = layer.accumulatedMatrix;
      const dec = layer.decomposedMatrix;
      lines.push(
        `        <matrix a="${a.toFixed(4)}" b="${b.toFixed(4)}" c="${c.toFixed(4)}" d="${d.toFixed(4)}" tx="${e.toFixed(2)}" ty="${f.toFixed(2)}"/>`
      );
      lines.push(
        `        <position x="${dec.translateX.toFixed(2)}" y="${dec.translateY.toFixed(2)}"/>`
      );
      lines.push(
        `        <scale x="${dec.scaleX.toFixed(4)}" y="${dec.scaleY.toFixed(4)}"/>`
      );
      lines.push(`        <rotation degrees="${dec.rotationDeg.toFixed(2)}"/>`);
      if (Math.abs(dec.skewXDeg) > 0.01) {
        lines.push(`        <skew x="${dec.skewXDeg.toFixed(2)}"/>`);
      }
    }
    lines.push('      </transform>');

    // Geometry Node
    const effectiveD = bakeTransforms ? layer.transformedPathData : layer.pathData;
    lines.push(`      <geometry type="${layer.primitiveType}">`);
    lines.push(`        <bounds x="${layer.bounds.x}" y="${layer.bounds.y}" width="${layer.bounds.width}" height="${layer.bounds.height}"/>`);
    lines.push(`        <svgPath>${escapeXml(effectiveD)}</svgPath>`);

    // Structured Bezier Contours for Alight Motion Vector Editor
    lines.push(`        <contours count="${layer.contours.length}">`);
    layer.contours.forEach((contour, cIdx) => {
      lines.push(`          <contour index="${cIdx + 1}" closed="${contour.closed}">`);
      contour.points.forEach((pt, pIdx) => {
        if (pt.type === 'move') {
          lines.push(`            <point index="${pIdx}" type="move" x="${pt.x.toFixed(2)}" y="${pt.y.toFixed(2)}"/>`);
        } else if (pt.type === 'line') {
          lines.push(`            <point index="${pIdx}" type="line" x="${pt.x.toFixed(2)}" y="${pt.y.toFixed(2)}"/>`);
        } else if (pt.type === 'cubic') {
          lines.push(
            `            <point index="${pIdx}" type="cubic" x="${pt.x.toFixed(2)}" y="${pt.y.toFixed(2)}" cp1x="${pt.cp1x?.toFixed(2)}" cp1y="${pt.cp1y?.toFixed(2)}" cp2x="${pt.cp2x?.toFixed(2)}" cp2y="${pt.cp2y?.toFixed(2)}"/>`
          );
        } else if (pt.type === 'close') {
          lines.push(`            <point index="${pIdx}" type="close"/>`);
        }
      });
      lines.push('          </contour>');
    });
    lines.push('        </contours>');
    lines.push('      </geometry>');

    // Fill Node
    if (layer.fill.type === 'solid') {
      lines.push(
        `      <fill type="solid" color="${layer.fill.hex}" opacity="${layer.fill.a.toFixed(3)}"/>`
      );
    } else if (layer.fill.type === 'linearGradient') {
      const grad = layer.fill;
      lines.push(`      <fill type="linearGradient" id="${escapeXml(grad.id)}" x1="${grad.x1}" y1="${grad.y1}" x2="${grad.x2}" y2="${grad.y2}">`);
      lines.push('        <stops>');
      grad.stops.forEach((s) => {
        lines.push(`          <stop offset="${s.offset.toFixed(3)}" color="${s.color}" opacity="${s.opacity.toFixed(3)}"/>`);
      });
      lines.push('        </stops>');
      lines.push('      </fill>');
    } else if (layer.fill.type === 'radialGradient') {
      const grad = layer.fill;
      lines.push(`      <fill type="radialGradient" id="${escapeXml(grad.id)}" cx="${grad.cx}" cy="${grad.cy}" r="${grad.r}">`);
      lines.push('        <stops>');
      grad.stops.forEach((s) => {
        lines.push(`          <stop offset="${s.offset.toFixed(3)}" color="${s.color}" opacity="${s.opacity.toFixed(3)}"/>`);
      });
      lines.push('        </stops>');
      lines.push('      </fill>');
    } else {
      lines.push('      <fill type="none"/>');
    }

    // Stroke Node
    if (layer.stroke.enabled) {
      const dashAttr = layer.stroke.dasharray ? ` dasharray="${layer.stroke.dasharray.join(',')}"` : '';
      lines.push(
        `      <stroke color="${layer.stroke.color}" width="${layer.stroke.width.toFixed(2)}" linecap="${layer.stroke.linecap}" linejoin="${layer.stroke.linejoin}" opacity="${layer.stroke.opacity.toFixed(3)}"${dashAttr}/>`
      );
    } else {
      lines.push('      <stroke enabled="false"/>');
    }

    lines.push('    </shapeLayer>');
  });

  lines.push('  </scene>');
  lines.push('</alightMotionProject>');

  return lines.join('\n');
}
