import React from 'react';
import { X, BookOpen, Layers, Move, Palette, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#0c121e] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Panduan Pemetaan XML Alight Motion (AM)
              </h2>
              <p className="text-xs text-slate-400">
                Prinsip fondasi parsing dan konversi tag ke struktur Alight Motion
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>1. Hirarki Tag & Pohon Layer</span>
            </h3>
            <p className="text-slate-400">
              Setiap elemen vektor diuraikan menjadi tag <code className="text-slate-200 font-mono">&lt;shapeLayer&gt;</code> yang terisolasi dengan atribut nama, indeks layer, dan opacity terpisah. Struktur ini dirancang agar setiap bentuk dapat dipindahkan atau dianimasikan secara independen di timeline Alight Motion.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400">
              &lt;shapeLayer id=&quot;layer_1&quot; name=&quot;Aperture_Ring&quot; primitive=&quot;circle&quot; opacity=&quot;1.0&quot;&gt;
              <br />
              &nbsp;&nbsp;&lt;transform&gt; ... &lt;/transform&gt;
              <br />
              &nbsp;&nbsp;&lt;geometry type=&quot;path&quot;&gt; ... &lt;/geometry&gt;
              <br />
              &nbsp;&nbsp;&lt;fill type=&quot;solid&quot; color=&quot;#3b82f6&quot;/&gt;
              <br />
              &nbsp;&nbsp;&lt;stroke color=&quot;#ffffff&quot; width=&quot;2&quot;/&gt;
              <br />
              &lt;/shapeLayer&gt;
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Move className="w-4 h-4 text-cyan-400" />
              <span>2. Akumulasi Matrix Transform dari Grup Bertingkat</span>
            </h3>
            <p className="text-slate-400">
              Banyak file SVG (terutama dari Illustrator, Inkscape, atau Figma) memiliki grup <code className="text-slate-200 font-mono">&lt;g&gt;</code> bertingkat dengan transform <code className="text-slate-200 font-mono">translate</code>, <code className="text-slate-200 font-mono">rotate</code>, dan <code className="text-slate-200 font-mono">scale</code> di setiap level.
            </p>
            <p className="text-slate-400">
              Converter ini mengalikan seluruh matrix orang tua (parent) dan anak menjadi satu matrix final per bentuk (<code className="text-slate-200 font-mono">[a, b, c, d, e, f]</code>), serta mengekstrak posisi <code className="text-slate-200 font-mono">(x, y)</code>, skala, dan rotasi derajat untuk memudahkan keyframe di Alight Motion.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>3. Pemecahan Titik Bezier & Konversi Arc (A)</span>
            </h3>
            <p className="text-slate-400">
              Alight Motion mengedit kurva melalui titik jangkar (anchor point) dan handle kontrol. Converter ini mengurai kurva kuadratik (Q) dan elliptic arc (A) SVG menjadi <strong>Cubic Bezier murni</strong> dengan koordinat jangkar <code className="text-slate-200 font-mono">(x, y)</code> serta dua titik kontrol <code className="text-slate-200 font-mono">(cp1x, cp1y)</code> dan <code className="text-slate-200 font-mono">(cp2x, cp2y)</code>.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>4. Optimasi Layer untuk File Auto-Trace (VTracer)</span>
            </h3>
            <p className="text-slate-400">
              Hasil auto-trace gambar bitmap menjadi vektor sering menghasilkan 500 hingga 2.000 path individual flat tanpa grup. Pada aplikasi Alight Motion versi HP, membuka project dengan ratusan layer akan menyebabkan freeze atau crash.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-semibold text-emerald-400 block mb-1">Mode Merge Path</span>
                <p className="text-slate-400 text-[11px]">
                  Menggabungkan path dengan fill warna sama menjadi 1 compound path. Jumlah layer turun drastis (contoh: 800 layer menjadi 18 layer), dengan kualitas vektor 100% tetap tajam.
                </p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-semibold text-amber-400 block mb-1">Mode Flatten Parsial</span>
                <p className="text-slate-400 text-[11px]">
                  Merender elemen background statis menjadi 1 file gambar raster PNG, dan menyisakan hanya karakter atau objek utama sebagai vektor terpisah untuk dianimasikan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0f172a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
