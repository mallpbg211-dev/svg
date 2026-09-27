import React, { useState, useRef } from 'react';
import { Upload, FileCode, Sparkles, X, AlertCircle } from 'lucide-react';
import { SampleSvg, SAMPLE_SVGS } from '../utils/sampleSvgs';

interface SvgInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSvg: (svgString: string, title?: string) => void;
}

export const SvgInputModal: React.FC<SvgInputModalProps> = ({
  isOpen,
  onClose,
  onLoadSvg,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('samples');
  const [pastedCode, setPastedCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setErrorMessage('Harap unggah file dengan format .svg yang valid.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && content.includes('<svg')) {
        setErrorMessage(null);
        onLoadSvg(content, file.name.replace(/\.svg$/i, ''));
        onClose();
      } else {
        setErrorMessage('File tidak berisi elemen <svg> yang valid.');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file SVG.');
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedCode.trim()) {
      setErrorMessage('Silakan tempel kode SVG terlebih dahulu.');
      return;
    }
    if (!pastedCode.includes('<svg')) {
      setErrorMessage('Kode yang ditempel tidak mengandung tag <svg>.');
      return;
    }

    setErrorMessage(null);
    onLoadSvg(pastedCode, 'Pasted_SVG_Asset');
    onClose();
  };

  const handleSelectSample = (sample: SampleSvg) => {
    setErrorMessage(null);
    onLoadSvg(sample.svg, sample.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-[#0c121e] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Import File SVG</h2>
              <p className="text-xs text-slate-400">
                Unggah file .svg, tempel kode, atau pilih contoh uji
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-800 bg-[#0e1424]">
          <button
            onClick={() => {
              setActiveTab('samples');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'samples'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Sampel</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah File</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'paste'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Tempel Kode SVG</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-2.5 bg-rose-950/40 border border-rose-900/60 rounded-md flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 block mb-2">
                Pilih salah satu preset untuk menguji parsing bezier, gradien, atau performa merge layer:
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {SAMPLE_SVGS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="w-full text-left p-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 rounded-lg transition-all flex items-start justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300">
                          {sample.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded font-mono text-slate-400">
                          ~{sample.pathCountEstimate} paths
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {sample.description}
                      </p>
                    </div>
                    <span className="text-xs text-cyan-400 font-medium shrink-0 ml-4 group-hover:translate-x-0.5 transition-transform">
                      Pilih →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Klik untuk memilih file SVG dari komputer Anda
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung standar SVG 1.1 / 2.0 (Inkscape, Illustrator, Figma, VTracer)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <textarea
                rows={8}
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;>&#10;  <rect x=&quot;10&quot; y=&quot;10&quot; width=&quot;80&quot; height=&quot;80&quot; fill=&quot;#3b82f6&quot; />&#10;</svg>"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePasteSubmit}
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors"
                >
                  Proses Kode SVG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
