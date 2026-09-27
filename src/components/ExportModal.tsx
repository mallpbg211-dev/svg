import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Code2,
  FileText,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { SVGDocumentData, ParsedShapeLayer } from '../types/svg';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlContent: string;
  docData: SVGDocumentData;
  exportLayers: ParsedShapeLayer[];
  flattenMode: 'all_vector' | 'partial_flatten';
  flattenDataUrl: string;
  originalLayerCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  xmlContent,
  docData,
  exportLayers,
  flattenMode,
  flattenDataUrl,
  originalLayerCount,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'xml' | 'mapping' | 'stats'>('xml');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(docData.title || 'alight_motion_project').replace(/[^a-zA-Z0-9_-]/g, '_')}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!flattenDataUrl) return;
    const a = document.createElement('a');
    a.href = flattenDataUrl;
    a.download = 'background_flat.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const vectorCount = exportLayers.filter((l) => l.isIncluded && !l.isFlattened).length;
  const rasterCount = flattenMode === 'partial_flatten' && flattenDataUrl ? 1 : 0;
  const totalExportLayers = vectorCount + rasterCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c121e] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Export Alight Motion XML
              </h2>
              <p className="text-xs text-slate-400">
                Fondasi XML siap dipetakan ke skema layer Alight Motion
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-[#0e1424]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'xml'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>XML Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('mapping')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'mapping'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Panduan Tag Alight Motion</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Statistik Optimasi</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Copy XML'}</span>
            </button>

            {flattenMode === 'partial_flatten' && flattenDataUrl && (
              <button
                onClick={handleDownloadPng}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 rounded-md transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Unduh BG PNG</span>
              </button>
            )}

            <button
              onClick={handleDownloadXml}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-md shadow-md transition-all font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .xml</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#090d16]">
          {activeTab === 'xml' && (
            <div className="relative">
              <pre className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto max-h-[55vh] leading-relaxed selection:bg-cyan-900 selection:text-white">
                <code>{xmlContent}</code>
              </pre>
            </div>
          )}

          {activeTab === 'mapping' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <h4 className="text-sm font-semibold text-cyan-300 mb-1">
                  Bagaimana Memetakan XML Ini ke Skema Resmi Alight Motion?
                </h4>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Karena skema XML internal Alight Motion bervariasi sesuai versi aplikasi (Android / iOS) dan belum ada sampel XML resmi publik, converter ini menyajikan <strong>struktur pohon layer yang bersih dan 100% presisi geometris</strong>. Begitu Anda memiliki 1 file contoh project XML hasil export Alight Motion asli, struktur ini dapat dipetakan langsung:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="font-semibold text-white block">1. Geometri & Titik Kurva</span>
                  <p className="text-slate-400 text-xs">
                    Tag <code className="text-cyan-300 font-mono">&lt;contours&gt;</code> dan <code className="text-cyan-300 font-mono">&lt;point type="cubic"&gt;</code> memisahkan koordinat titik utama <code className="text-slate-200 font-mono">(x, y)</code> serta dua pegangan kontrol bezier <code className="text-slate-200 font-mono">(cp1, cp2)</code>. Ini mencocokkan sistem vector node Alight Motion tanpa perlu dekonstruksi string SVG d lagi.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="font-semibold text-white block">2. Transformasi Terakumulasi</span>
                  <p className="text-slate-400 text-xs">
                    Grup bertingkat <code className="text-cyan-300 font-mono">&lt;g&gt;</code> telah dikalikan jadi satu affine matrix 2D per bentuk di <code className="text-cyan-300 font-mono">&lt;transform&gt;</code>, serta disediakan nilai posisi <code className="text-slate-200 font-mono">(x, y)</code>, skala, dan rotasi sudut untuk keyframe Alight Motion.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="font-semibold text-white block">3. Fill & Stroke Terpisah</span>
                  <p className="text-slate-400 text-xs">
                    Warna hex, opacity fill terpisah, linearGradient & radialGradient beserta daftar stops offset dan color tertera eksplisit di bawah node <code className="text-cyan-300 font-mono">&lt;fill&gt;</code> dan <code className="text-cyan-300 font-mono">&lt;stroke&gt;</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="font-semibold text-white block">4. Flatten Parsial Background</span>
                  <p className="text-slate-400 text-xs">
                    Untuk ilustrasi rumit, background diexport sebagai <code className="text-cyan-300 font-mono">&lt;imageLayer&gt;</code> PNG berkualitas tinggi, sementara bagian yang ingin dianimasikan tetap utuh sebagai <code className="text-cyan-300 font-mono">&lt;shapeLayer&gt;</code> vektor independen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <span className="text-slate-500 text-xs block mb-1">Layer Asli SVG</span>
                  <span className="text-xl font-bold font-mono text-slate-300">
                    {originalLayerCount}
                  </span>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <span className="text-slate-500 text-xs block mb-1">Layer Vektor Final</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {vectorCount}
                  </span>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <span className="text-slate-500 text-xs block mb-1">Raster Layer (PNG)</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {rasterCount}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Status Kinerja di Mobile (Alight Motion):</span>
                  <span
                    className={`font-semibold font-mono ${
                      totalExportLayers <= 150
                        ? 'text-emerald-400'
                        : totalExportLayers <= 300
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {totalExportLayers <= 150
                      ? 'Optimal & Sangat Ringan (<150 layer)'
                      : totalExportLayers <= 300
                      ? 'Sedang (150-300 layer)'
                      : 'Berat (>300 layer, disarankan Merge/Flatten)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Ukuran Dimensi Canvas Project:</span>
                  <span className="font-mono text-slate-200">
                    {docData.viewBox.width} × {docData.viewBox.height} px
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0f172a] flex items-center justify-between text-xs text-slate-400">
          <span>Total {totalExportLayers} layer akan dibuat dalam project Alight Motion</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
