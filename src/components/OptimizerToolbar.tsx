import React from 'react';
import {
  AlertTriangle,
  GitMerge,
  Shapes,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Flame,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { OptimizerSettings } from '../types/svg';

interface OptimizerToolbarProps {
  settings: OptimizerSettings;
  onUpdateSettings: (settings: Partial<OptimizerSettings>) => void;
  originalLayerCount: number;
  finalLayerCount: number;
  reductionPercentage: number;
  flattenedCount: number;
  onRunFlatten: () => void;
  isFlattening: boolean;
}

export const OptimizerToolbar: React.FC<OptimizerToolbarProps> = ({
  settings,
  onUpdateSettings,
  originalLayerCount,
  finalLayerCount,
  reductionPercentage,
  flattenedCount,
  onRunFlatten,
  isFlattening,
}) => {
  const isHighLayerCount = finalLayerCount > settings.layerThreshold;

  return (
    <div className="bg-[#0e1424] border-b border-slate-800 px-4 py-2 flex flex-col gap-2 z-10 select-none">
      {/* Upper row: Toggles & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left side: Feature Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Merge Path */}
          <button
            onClick={() =>
              onUpdateSettings({ mergePathsByColor: !settings.mergePathsByColor })
            }
            title="Gabungkan path-path bertetangga dengan warna fill sama menjadi 1 compound path untuk mengurangi layer"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-all ${
              settings.mergePathsByColor
                ? 'bg-indigo-950/70 border-indigo-500/80 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Merge Path (Warna Sama)</span>
            {settings.mergePathsByColor && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* Toggle Detect Primitives */}
          <button
            onClick={() =>
              onUpdateSettings({ detectPrimitives: !settings.detectPrimitives })
            }
            title="Deteksi jika path geometris sama dengan persegi/lingkaran/poligon dan tandai sebagai bentuk primitif Alight Motion"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-all ${
              settings.detectPrimitives
                ? 'bg-indigo-950/70 border-indigo-500/80 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Deteksi Primitif</span>
            {settings.detectPrimitives && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* Mode Flatten Parsial vs All Vector */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-md">
            <button
              onClick={() => onUpdateSettings({ flattenMode: 'all_vector' })}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                settings.flattenMode === 'all_vector'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Vektor
            </button>
            <button
              onClick={() => {
                onUpdateSettings({ flattenMode: 'partial_flatten' });
                onRunFlatten();
              }}
              title="Render layer background jadi 1 gambar raster PNG, pertahankan layer penting sebagai vektor terpisah"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                settings.flattenMode === 'partial_flatten'
                  ? 'bg-amber-950/80 text-amber-300 shadow-sm border border-amber-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Flatten Parsial</span>
              {flattenedCount > 0 && (
                <span className="text-[10px] text-amber-400 font-mono">
                  ({flattenedCount})
                </span>
              )}
            </button>
          </div>

          {/* Toggle Bake Transforms */}
          <button
            onClick={() =>
              onUpdateSettings({
                bakeTransformsIntoGeometry: !settings.bakeTransformsIntoGeometry,
              })
            }
            title="Bake matrix ke koordinat titik kurva vs pisahkan matrix di tag <transform>"
            className={`px-2 py-1.5 rounded-md border text-[11px] font-mono transition-colors ${
              settings.bakeTransformsIntoGeometry
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            {settings.bakeTransformsIntoGeometry
              ? 'Bake Transform: ON'
              : 'Matrix Tag: Terpisah'}
          </button>
        </div>

        {/* Right side: Layer Count Metrics */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Asli:</span>
            <span className="text-slate-300">{originalLayerCount}</span>
            <span className="text-slate-600">→</span>
            <span className="text-slate-500">Hasil:</span>
            <span
              className={`font-semibold ${
                isHighLayerCount ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {finalLayerCount} layers
            </span>
          </div>

          {reductionPercentage > 0 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              -{reductionPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Warning Alert Banner when layers exceed safe threshold */}
      {isHighLayerCount && (
        <div className="flex items-center justify-between gap-3 p-2 bg-rose-950/40 border border-rose-900/60 rounded-md text-xs text-rose-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Peringatan Ambang Layer:</strong> Dokumen menghasilkan{' '}
              <strong className="text-rose-300 font-mono">{finalLayerCount}</strong>{' '}
              layer (ambang aman: {settings.layerThreshold}). Project Alight Motion
              pada perangkat mobile berpotensi lag parah atau crash.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!settings.mergePathsByColor && (
              <button
                onClick={() => onUpdateSettings({ mergePathsByColor: true })}
                className="px-2 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded font-medium text-[11px] transition-colors"
              >
                Aktifkan Merge Path
              </button>
            )}
            {settings.flattenMode !== 'partial_flatten' && (
              <button
                onClick={() => {
                  onUpdateSettings({ flattenMode: 'partial_flatten' });
                  onRunFlatten();
                }}
                className="px-2 py-1 bg-amber-900 hover:bg-amber-800 text-white rounded font-medium text-[11px] transition-colors"
              >
                Aktifkan Flatten Parsial
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
