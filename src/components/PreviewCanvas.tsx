import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid, Eye, EyeOff, Layers } from 'lucide-react';
import { SVGDocumentData, ParsedShapeLayer } from '../types/svg';

interface PreviewCanvasProps {
  docData: SVGDocumentData;
  layers: ParsedShapeLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  bakeTransforms: boolean;
  flattenMode: 'all_vector' | 'partial_flatten';
  flattenDataUrl: string;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  docData,
  layers,
  selectedLayerId,
  onSelectLayer,
  bakeTransforms,
  flattenMode,
  flattenDataUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transformation state: pan (x, y) & zoom (scale)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

  // Auto-fit to viewBox
  const handleFitToView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 48; // px padding
    const availW = Math.max(100, clientWidth - padding * 2);
    const availH = Math.max(100, clientHeight - padding * 2);

    const scaleX = availW / docData.viewBox.width;
    const scaleY = availH / docData.viewBox.height;
    const fitScale = Math.min(scaleX, scaleY, 2.5); // cap at 2.5x

    const centerX = (clientWidth - docData.viewBox.width * fitScale) / 2 - docData.viewBox.x * fitScale;
    const centerY = (clientHeight - docData.viewBox.height * fitScale) / 2 - docData.viewBox.y * fitScale;

    setZoom(fitScale);
    setPan({ x: centerX, y: centerY });
  }, [docData.viewBox]);

  // Initial fit on document change
  useEffect(() => {
    handleFitToView();
  }, [docData, handleFitToView]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(Math.max(0.05, zoom * zoomFactor), 20);

    // Zoom towards mouse position
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Mouse drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click if not clicking directly on a selectable path or if holding space/middle click
    if (e.button === 1 || e.altKey || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div
      ref={containerRef}
      id="canvas-bg"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none bg-[#090d16] flex items-center justify-center ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Floating Canvas Controls */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.25, 20))}
          title="Zoom In (Scroll Up)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.05))}
          title="Zoom Out (Scroll Down)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-slate-700/60 mx-0.5" />
        <button
          onClick={handleFitToView}
          title="Auto-Fit to Viewport"
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          title="Reset to 100%"
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{Math.round(zoom * 100)}%</span>
        </button>
        <div className="h-4 w-[1px] bg-slate-700/60 mx-0.5" />
        <button
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle Transparent Checkerboard"
          className={`p-1.5 rounded transition-colors ${
            showGrid ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Status & Dimensions Badge */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 p-1.5 px-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg text-xs font-mono text-slate-300 shadow-lg">
        <span className="text-slate-400">ViewBox:</span>
        <span className="text-cyan-300">
          {docData.viewBox.width} × {docData.viewBox.height}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Visible:</span>
        <span className="text-emerald-400">
          {layers.filter((l) => l.isVisible && l.isIncluded).length}
        </span>
      </div>

      {/* Viewport Transform Layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.05s ease-out',
        }}
        className="relative"
      >
        {/* Document Boundary & Checkerboard Backdrop */}
        <div
          style={{
            width: docData.viewBox.width,
            height: docData.viewBox.height,
            marginLeft: docData.viewBox.x,
            marginTop: docData.viewBox.y,
          }}
          className={`relative shadow-2xl transition-all border border-slate-700/80 ${
            showGrid
              ? 'bg-[linear-gradient(45deg,#151c2c_25%,transparent_25%),linear-gradient(-45deg,#151c2c_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151c2c_75%),linear-gradient(-45deg,transparent_75%,#151c2c_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-[#0c121e]'
              : 'bg-[#121826]'
          }`}
        >
          {/* Render SVG Content */}
          <svg
            viewBox={`${docData.viewBox.x} ${docData.viewBox.y} ${docData.viewBox.width} ${docData.viewBox.height}`}
            width={docData.viewBox.width}
            height={docData.viewBox.height}
            className="w-full h-full block"
          >
            {/* SVG Defs for Gradients */}
            <defs>
              {Object.values(docData.gradients).map((g) => {
                if (g.type === 'linearGradient') {
                  return (
                    <linearGradient
                      key={g.id}
                      id={`preview_${g.id}`}
                      x1={g.x1}
                      y1={g.y1}
                      x2={g.x2}
                      y2={g.y2}
                    >
                      {g.stops.map((s, idx) => (
                        <stop
                          key={idx}
                          offset={`${(s.offset * 100).toFixed(1)}%`}
                          stopColor={s.color}
                          stopOpacity={s.opacity}
                        />
                      ))}
                    </linearGradient>
                  );
                }
                if (g.type === 'radialGradient') {
                  return (
                    <radialGradient
                      key={g.id}
                      id={`preview_${g.id}`}
                      cx={g.cx}
                      cy={g.cy}
                      r={g.r}
                      fx={g.fx}
                      fy={g.fy}
                    >
                      {g.stops.map((s, idx) => (
                        <stop
                          key={idx}
                          offset={`${(s.offset * 100).toFixed(1)}%`}
                          stopColor={s.color}
                          stopOpacity={s.opacity}
                        />
                      ))}
                    </radialGradient>
                  );
                }
                return null;
              })}
            </defs>

            {/* Background Image if in partial flatten mode */}
            {flattenMode === 'partial_flatten' && flattenDataUrl && (
              <image
                href={flattenDataUrl}
                x={docData.viewBox.x}
                y={docData.viewBox.y}
                width={docData.viewBox.width}
                height={docData.viewBox.height}
                opacity={1}
              />
            )}

            {/* Vector Shape Layers */}
            {layers.map((layer) => {
              if (!layer.isVisible) return null;
              // If partial flatten is active and layer is flattened, it's rendered by image above
              if (flattenMode === 'partial_flatten' && layer.isFlattened) return null;

              const isSelected = layer.id === selectedLayerId;
              const isHovered = layer.id === hoveredLayerId;

              let fillVal = 'none';
              if (layer.fill.type === 'solid') {
                fillVal = layer.fill.hex;
              } else if (layer.fill.type === 'linearGradient' || layer.fill.type === 'radialGradient') {
                fillVal = `url(#preview_${layer.fill.id})`;
              }

              const strokeVal = layer.stroke.enabled ? layer.stroke.color : 'none';
              const strokeWidth = layer.stroke.enabled ? layer.stroke.width : 0;
              const [a, b, c, d, e, f] = layer.accumulatedMatrix;

              const transformAttr = bakeTransforms ? undefined : `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
              const pathD = bakeTransforms ? layer.transformedPathData : layer.pathData;

              return (
                <path
                  key={layer.id}
                  id={layer.id}
                  d={pathD}
                  fill={fillVal}
                  fillOpacity={layer.fill.type === 'solid' ? layer.fill.a : 1}
                  stroke={isHovered && !isSelected ? '#38bdf8' : strokeVal}
                  strokeWidth={isHovered && !isSelected ? Math.max(strokeWidth, 2 / zoom) : strokeWidth}
                  strokeLinecap={layer.stroke.linecap}
                  strokeLinejoin={layer.stroke.linejoin}
                  strokeDasharray={layer.stroke.dasharray?.join(' ')}
                  strokeOpacity={layer.stroke.opacity}
                  opacity={layer.opacity}
                  transform={transformAttr}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLayer(layer.id);
                  }}
                  onMouseEnter={() => setHoveredLayerId(layer.id)}
                  onMouseLeave={() => setHoveredLayerId(null)}
                  className="cursor-pointer transition-opacity"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.75))' : undefined,
                  }}
                />
              );
            })}

            {/* Selection Bounding Box & Handles Overlay */}
            {selectedLayer && selectedLayer.isVisible && (
              <g pointerEvents="none">
                <rect
                  x={selectedLayer.bounds.x - 2}
                  y={selectedLayer.bounds.y - 2}
                  width={selectedLayer.bounds.width + 4}
                  height={selectedLayer.bounds.height + 4}
                  fill="rgba(56, 189, 248, 0.08)"
                  stroke="#38bdf8"
                  strokeWidth={1.5 / zoom}
                  strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                />
                {/* 4 Corner Anchors */}
                {[
                  { x: selectedLayer.bounds.x - 2, y: selectedLayer.bounds.y - 2 },
                  { x: selectedLayer.bounds.x + selectedLayer.bounds.width + 2, y: selectedLayer.bounds.y - 2 },
                  { x: selectedLayer.bounds.x - 2, y: selectedLayer.bounds.y + selectedLayer.bounds.height + 2 },
                  {
                    x: selectedLayer.bounds.x + selectedLayer.bounds.width + 2,
                    y: selectedLayer.bounds.y + selectedLayer.bounds.height + 2,
                  },
                ].map((pt, idx) => (
                  <rect
                    key={idx}
                    x={pt.x - 3 / zoom}
                    y={pt.y - 3 / zoom}
                    width={6 / zoom}
                    height={6 / zoom}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth={1 / zoom}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Floating Info bar */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 p-1.5 px-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 shadow-lg">
        {selectedLayer ? (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-200 font-medium">{selectedLayer.name}</span>
            <span className="text-slate-500">·</span>
            <span>
              {selectedLayer.bounds.width.toFixed(1)} × {selectedLayer.bounds.height.toFixed(1)} px
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-400 capitalize">{selectedLayer.primitiveType}</span>
          </div>
        ) : (
          <span>Klik layer pada canvas untuk inspeksi atau geser untuk navigasi (Drag/Scroll)</span>
        )}
      </div>
    </div>
  );
};
