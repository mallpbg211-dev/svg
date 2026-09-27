import React from 'react';
import { Upload, Download, Sparkles, SlidersHorizontal, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenGuide: () => void;
  onSelectSample: (id: string) => void;
  samples: Array<{ id: string; name: string }>;
  activeTab: 'canvas' | 'layers' | 'guide';
  setActiveTab: (tab: 'canvas' | 'layers' | 'guide') => void;
  totalLayers: number;
  finalLayers: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenExport,
  onOpenGuide,
  onSelectSample,
  samples,
  activeTab,
  setActiveTab,
  totalLayers,
  finalLayers,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0f172a] px-4 flex items-center justify-between z-30 select-none">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-950/40 text-sm">
            AM
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              SVG → Alight Motion XML
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Parsing & Optimizer Studio
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: Navigation Links / Workspace Views */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'canvas'
              ? 'bg-slate-800 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Editor & Canvas</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'layers'
              ? 'bg-slate-800 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layer Tree</span>
          <span className="ml-1 px-1.5 py-0.2 bg-slate-700/60 rounded text-[10px] font-mono text-slate-300">
            {finalLayers}
          </span>
        </button>

        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-md transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>AM Tag Guide</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Sample selector dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-md transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Presets</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
            <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-800">
              Contoh SVG Uji
            </div>
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSample(s.id)}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 flex flex-col gap-0.5"
              >
                <span className="font-medium truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import SVG</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-md shadow-md shadow-indigo-950/50 transition-all font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export XML</span>
        </button>
      </div>
    </header>
  );
};
