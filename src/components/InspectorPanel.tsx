import React, { useState } from 'react';
import {
  Sliders,
  Copy,
  Check,
  Code2,
  Box,
  Compass,
  Move,
  Maximize,
  RotateCw,
  Palette,
  Crosshair,
  Hash,
} from 'lucide-react';
import { ParsedShapeLayer, SVGDocumentData } from '../types/svg';

interface InspectorPanelProps {
  selectedLayer: ParsedShapeLayer | null;
  docData: SVGDocumentData;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ selectedLayer, docData }) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedMatrix, setCopiedMatrix] = useState(false);

  const copyToClipboard = (text: string, isPath: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPath) {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    } else {
      setCopiedMatrix(true);
      setTimeout(() => setCopiedMatrix(false), 2000);
    }
  };

  if (!selectedLayer) {
    return (
      <div className="flex flex-col h-full bg-[#0b0f19] border-l border-slate-800 p-4 text-slate-400 select-none">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Document Inspector
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
            <span className="text-slate-400 block text-[11px] mb-1">Judul Dokumen</span>
            <span className="text-slate-200 font-medium">{docData.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[10px] block">ViewBox Width</span>
              <span className="text-cyan-300 font-mono text-sm font-semibold">
                {docData.viewBox.width}px
              </span>
            </div>
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[10px] block">ViewBox Height</span>
              <span className="text-cyan-300 font-mono text-sm font-semibold">
                {docData.viewBox.height}px
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Layers Terurai:</span>
              <span className="text-slate-200 font-mono">{docData.layers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gradient Defs:</span>
              <span className="text-slate-200 font-mono">
                {Object.keys(docData.gradients).length}
              </span>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-lg text-[11px] text-cyan-300/80 leading-relaxed">
            💡 Pilih salah satu elemen pada Canvas atau di daftar Layer Panel untuk memeriksa matrix transform terakumulasi, data kurva bezier, dan mapping layer Alight Motion.
          </div>
        </div>
      </div>
    );
  }

  const [a, b, c, d, e, f] = selectedLayer.accumulatedMatrix;
  const dec = selectedLayer.decomposedMatrix;

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border-l border-slate-800 text-slate-300 select-none overflow-y-auto">
      {/* Inspector Header */}
      <div className="p-3 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Layer Inspector
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
          ID: {selectedLayer.id}
        </span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Basic Identity */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
            Nama & Tipe Bentuk
          </label>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-md flex items-center justify-between">
            <span className="font-medium text-slate-200 truncate">{selectedLayer.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
              {selectedLayer.primitiveType}
            </span>
          </div>
        </div>

        {/* Bounding Box Geometry */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1.5 uppercase font-semibold flex items-center gap-1">
            <Box className="w-3 h-3 text-slate-400" />
            <span>Dimensi Bounding Box</span>
          </label>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-md">
              <span className="text-slate-500 text-[10px] block">X / Y</span>
              <span className="text-slate-200">
                {selectedLayer.bounds.x.toFixed(1)}, {selectedLayer.bounds.y.toFixed(1)}
              </span>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-md">
              <span className="text-slate-500 text-[10px] block">W × H</span>
              <span className="text-slate-200">
                {selectedLayer.bounds.width.toFixed(1)} × {selectedLayer.bounds.height.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Accumulated Transform Matrix */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-400" />
              <span>Accumulated Matrix (Grup Bertingkat)</span>
            </label>
            <button
              onClick={() =>
                copyToClipboard(
                  `matrix(${a.toFixed(4)}, ${b.toFixed(4)}, ${c.toFixed(4)}, ${d.toFixed(4)}, ${e.toFixed(2)}, ${f.toFixed(2)})`,
                  false
                )
              }
              title="Copy Transform Matrix"
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              {copiedMatrix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedMatrix ? 'Tersalin' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-md font-mono text-[11px] text-slate-300">
            <div className="grid grid-cols-3 gap-1 text-center py-1 bg-slate-950/50 rounded mb-2">
              <span className="text-cyan-400">a: {a.toFixed(3)}</span>
              <span className="text-cyan-400">c: {c.toFixed(3)}</span>
              <span className="text-cyan-400">tx: {e.toFixed(1)}</span>
              <span className="text-cyan-400">b: {b.toFixed(3)}</span>
              <span className="text-cyan-400">d: {d.toFixed(3)}</span>
              <span className="text-cyan-400">ty: {f.toFixed(1)}</span>
            </div>

            {/* Decomposed Properties for Alight Motion */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Posisi:</span>
                <span className="text-slate-300">({dec.translateX}, {dec.translateY})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Skala:</span>
                <span className="text-slate-300">{dec.scaleX}×, {dec.scaleY}×</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rotasi:</span>
                <span className="text-slate-300">{dec.rotationDeg}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Skew:</span>
                <span className="text-slate-300">{dec.skewXDeg}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fill & Stroke */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1.5 uppercase font-semibold flex items-center gap-1">
            <Palette className="w-3 h-3 text-slate-400" />
            <span>Pewarnaan (Fill & Stroke)</span>
          </label>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-md space-y-2 text-xs">
            {/* Fill */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Fill:</span>
              {selectedLayer.fill.type === 'solid' ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-slate-700"
                    style={{ backgroundColor: selectedLayer.fill.hex }}
                  />
                  <span className="font-mono text-slate-200">{selectedLayer.fill.hex}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    α: {selectedLayer.fill.a}
                  </span>
                </div>
              ) : selectedLayer.fill.type === 'linearGradient' || selectedLayer.fill.type === 'radialGradient' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-cyan-300 font-medium capitalize">
                    {selectedLayer.fill.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({selectedLayer.fill.stops.length} stops)
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </div>

            {/* Stroke */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
              <span className="text-slate-400">Stroke:</span>
              {selectedLayer.stroke.enabled ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-slate-700"
                    style={{ backgroundColor: selectedLayer.stroke.color }}
                  />
                  <span className="font-mono text-slate-200">
                    {selectedLayer.stroke.width}px ({selectedLayer.stroke.linecap})
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </div>

            {/* Layer Opacity */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
              <span className="text-slate-400">Opacity Layer:</span>
              <span className="font-mono text-slate-200">
                {Math.round(selectedLayer.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bezier & Contour Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Code2 className="w-3 h-3 text-slate-400" />
              <span>Data Bezier & SVG Path</span>
            </label>
            <button
              onClick={() => copyToClipboard(selectedLayer.pathData, true)}
              title="Copy SVG Path Data"
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPath ? 'Tersalin' : 'Copy d'}</span>
            </button>
          </div>

          <div className="p-2 bg-slate-900 border border-slate-800 rounded-md">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Subpaths (Contours):</span>
              <span className="font-mono text-slate-200">{selectedLayer.contours.length}</span>
            </div>
            <div className="max-h-24 overflow-y-auto p-1.5 bg-slate-950 rounded font-mono text-[10px] text-slate-400 break-all leading-tight">
              {selectedLayer.pathData.slice(0, 300)}
              {selectedLayer.pathData.length > 300 && '...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
