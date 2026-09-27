import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Layers,
  Filter,
  Palette,
  Image as ImageIcon,
  Compass,
  Shapes,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ParsedShapeLayer } from '../types/svg';

interface LayerPanelProps {
  layers: ParsedShapeLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleInclusion: (id: string) => void;
  onToggleFlatten: (id: string) => void;
  onBulkSelectAll: (select: boolean) => void;
  onBulkFlattenAll: (flatten: boolean) => void;
  onSoloLayer: (id: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleInclusion,
  onToggleFlatten,
  onBulkSelectAll,
  onBulkFlattenAll,
  onSoloLayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'primitive' | 'path'>('all');

  // Extract unique palette colors from active layers
  const paletteColors = useMemo(() => {
    const counts = new Map<string, number>();
    layers.forEach((l) => {
      if (l.fill.type === 'solid') {
        const hex = l.fill.hex.toLowerCase();
        counts.set(hex, (counts.get(hex) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
  }, [layers]);

  // Filtered layers
  const filteredLayers = useMemo(() => {
    return layers.filter((layer) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = layer.name.toLowerCase().includes(query);
        const matchesTag = layer.originalTag.toLowerCase().includes(query);
        const matchesType = layer.primitiveType.toLowerCase().includes(query);
        if (!matchesName && !matchesTag && !matchesType) return false;
      }

      // Color filter
      if (selectedColorFilter) {
        if (layer.fill.type !== 'solid' || layer.fill.hex.toLowerCase() !== selectedColorFilter) {
          return false;
        }
      }

      // Type filter
      if (typeFilter === 'primitive' && !layer.isPrimitive) return false;
      if (typeFilter === 'path' && layer.isPrimitive) return false;

      return true;
    });
  }, [layers, searchQuery, selectedColorFilter, typeFilter]);

  const includedCount = layers.filter((l) => l.isIncluded).length;
  const flattenedCount = layers.filter((l) => l.isFlattened && l.isIncluded).length;

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border-r border-slate-800 text-slate-200 select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800 bg-[#0e1424]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Layers ({filteredLayers.length}/{layers.length})
            </h2>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            <span>{includedCount} export</span>
            {flattenedCount > 0 && (
              <span className="text-amber-400 ml-1">({flattenedCount} flat)</span>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama, tipe, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Color Palette Filter Bar */}
        {paletteColors.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-500" />
                <span>Filter Warna ({paletteColors.length})</span>
              </span>
              {selectedColorFilter && (
                <button
                  onClick={() => setSelectedColorFilter(null)}
                  className="text-cyan-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {paletteColors.slice(0, 14).map((p) => {
                const isActive = selectedColorFilter === p.color;
                return (
                  <button
                    key={p.color}
                    onClick={() =>
                      setSelectedColorFilter(isActive ? null : p.color)
                    }
                    title={`${p.color} (${p.count} layers)`}
                    className={`relative w-5 h-5 rounded-full shrink-0 border transition-all ${
                      isActive
                        ? 'border-white scale-110 shadow-md ring-2 ring-cyan-500/50'
                        : 'border-slate-700/80 hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Tabs & Bulk Actions */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                typeFilter === 'all'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter('primitive')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                typeFilter === 'primitive'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Primitif
            </button>
            <button
              onClick={() => setTypeFilter('path')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                typeFilter === 'path'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Path
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onBulkSelectAll(true)}
              title="Pilih Semua Layer untuk Export"
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 bg-slate-800/60 rounded"
            >
              All
            </button>
            <button
              onClick={() => onBulkSelectAll(false)}
              title="Batalkan Semua Pilihan"
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 bg-slate-800/60 rounded"
            >
              None
            </button>
          </div>
        </div>
      </div>

      {/* Layer List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {filteredLayers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Tidak ada layer yang cocok dengan filter.
          </div>
        ) : (
          filteredLayers.map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;

            // Fill color representation
            let fillBg = '#334155';
            let isGradient = false;
            if (layer.fill.type === 'solid') {
              fillBg = layer.fill.hex;
            } else if (layer.fill.type === 'linearGradient' || layer.fill.type === 'radialGradient') {
              isGradient = true;
            }

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`group flex items-center gap-2 px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-950/40 border-l-2 border-cyan-400 text-cyan-200'
                    : 'hover:bg-slate-900/80 text-slate-300'
                } ${!layer.isVisible ? 'opacity-40' : ''}`}
              >
                {/* Export Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInclusion(layer.id);
                  }}
                  title={layer.isIncluded ? 'Termasuk dalam XML Export' : 'Dikecualikan dari export'}
                  className="text-slate-400 hover:text-cyan-400 p-0.5"
                >
                  {layer.isIncluded ? (
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>

                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  title={layer.isVisible ? 'Sembunyikan di Canvas' : 'Tampilkan di Canvas'}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  {layer.isVisible ? (
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>

                {/* Color Swatch */}
                <div
                  className="w-4 h-4 rounded border border-slate-700/80 shrink-0 shadow-inner flex items-center justify-center text-[8px]"
                  style={{
                    backgroundColor: isGradient ? undefined : fillBg,
                    background: isGradient
                      ? 'linear-gradient(135deg, #4f46e5, #06b6d4)'
                      : undefined,
                  }}
                  title={`Fill: ${layer.fill.type === 'solid' ? layer.fill.hex : 'Gradient'}`}
                >
                  {layer.stroke.enabled && (
                    <div
                      className="w-1.5 h-1.5 rounded-full border border-white/60"
                      style={{ backgroundColor: layer.stroke.color }}
                    />
                  )}
                </div>

                {/* Layer Name & Tag Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium truncate text-xs">{layer.name}</span>
                    {layer.isPrimitive && (
                      <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-cyan-300 rounded font-mono shrink-0">
                        {layer.primitiveType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>&lt;{layer.originalTag}&gt;</span>
                    <span>·</span>
                    <span>
                      {Math.round(layer.bounds.width)}×{Math.round(layer.bounds.height)}
                    </span>
                  </div>
                </div>

                {/* Flatten Mode Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFlatten(layer.id);
                  }}
                  title={
                    layer.isFlattened
                      ? 'Mode: Dibake ke Background Raster PNG (Klik untuk ubah jadi Vektor)'
                      : 'Mode: Diexport sebagai Vektor Layer di AM (Klik untuk jadikan Background Raster)'
                  }
                  className={`px-1.5 py-0.5 text-[9px] rounded font-medium transition-colors shrink-0 ${
                    layer.isFlattened
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60'
                      : 'bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60'
                  }`}
                >
                  {layer.isFlattened ? 'Flatten' : 'Vector'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Layer Panel Footer Action */}
      <div className="p-2 border-t border-slate-800 bg-[#0e1424] flex items-center justify-between text-[11px] text-slate-400">
        <span>Klik layer untuk melihat data matrix & bezier</span>
        {selectedLayerId && (
          <button
            onClick={() => onSoloLayer(selectedLayerId)}
            className="text-cyan-400 hover:underline"
          >
            Solo Layer Ini
          </button>
        )}
      </div>
    </div>
  );
};
