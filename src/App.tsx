import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PreviewCanvas } from './components/PreviewCanvas';
import { LayerPanel } from './components/LayerPanel';
import { InspectorPanel } from './components/InspectorPanel';
import { OptimizerToolbar } from './components/OptimizerToolbar';
import { ExportModal } from './components/ExportModal';
import { SvgInputModal } from './components/SvgInputModal';
import { GuideModal } from './components/GuideModal';
import { parseSvgDocument } from './utils/svgParser';
import { mergePathsByColor, rasterizeBackgroundToDataUrl, evaluateLayerOptimization } from './utils/optimizer';
import { generateAlightMotionXml } from './utils/alightMotionXml';
import { SAMPLE_SVGS } from './utils/sampleSvgs';
import { SVGDocumentData, ParsedShapeLayer, OptimizerSettings } from './types/svg';

const DEFAULT_SETTINGS: OptimizerSettings = {
  mergePathsByColor: false,
  detectPrimitives: true,
  bakeTransformsIntoGeometry: false,
  flattenMode: 'all_vector',
  layerThreshold: 300,
};

export default function App() {
  // Parse initial document from first sample
  const [docData, setDocData] = useState<SVGDocumentData>(() => {
    try {
      return parseSvgDocument(SAMPLE_SVGS[0].svg, true);
    } catch (err) {
      console.error('Initial SVG parse fallback triggered:', err);
      return {
        title: SAMPLE_SVGS[0].name,
        viewBox: { x: 0, y: 0, width: 512, height: 512 },
        width: 512,
        height: 512,
        layers: [],
        gradients: {},
        rawSvgString: SAMPLE_SVGS[0].svg,
      };
    }
  });

  const [layers, setLayers] = useState<ParsedShapeLayer[]>(() => docData.layers);
  const [settings, setSettings] = useState<OptimizerSettings>(DEFAULT_SETTINGS);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(() => docData.layers[0]?.id || null);

  // Modals & Views
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'layers' | 'guide'>('canvas');

  // Partial flatten cache
  const [flattenDataUrl, setFlattenDataUrl] = useState<string>('');
  const [isFlattening, setIsFlattening] = useState(false);

  // When docData changes, update layer state
  useEffect(() => {
    setLayers(docData.layers);
    setSelectedLayerId(docData.layers[0]?.id || null);
    setFlattenDataUrl('');
  }, [docData]);

  // Load new SVG
  const handleLoadSvg = useCallback((svgString: string, title?: string) => {
    try {
      const parsed = parseSvgDocument(svgString, settings.detectPrimitives);
      if (title) parsed.title = title;
      setDocData(parsed);
      setSelectedLayerId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses SVG');
    }
  }, [settings.detectPrimitives]);

  // Select Sample
  const handleSelectSample = useCallback((id: string) => {
    const sample = SAMPLE_SVGS.find((s) => s.id === id);
    if (sample) {
      handleLoadSvg(sample.svg, sample.name);
    }
  }, [handleLoadSvg]);

  // Toggle Settings
  const handleUpdateSettings = useCallback((newSettings: Partial<OptimizerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // If primitive detection toggle changed, re-parse doc
      if (newSettings.detectPrimitives !== undefined && newSettings.detectPrimitives !== prev.detectPrimitives) {
        try {
          const reParsed = parseSvgDocument(docData.rawSvgString, newSettings.detectPrimitives);
          setDocData(reParsed);
        } catch {
          // ignore
        }
      }
      return updated;
    });
  }, [docData.rawSvgString]);

  // Generate raster background for partial flatten
  const handleRunFlatten = useCallback(async () => {
    if (isFlattening) return;
    setIsFlattening(true);

    // Identify layers that should be rasterized into background:
    // If some layers are marked as `isFlattened: true`, rasterize only those.
    // If none are specifically marked, rasterize all except the currently selected one or first few.
    const layersToFlatten = layers.filter((l) => l.isIncluded && l.isFlattened);

    // If user hasn't marked any specific layer as flattened, mark unselected background layers
    const effectiveLayers = layersToFlatten.length > 0
      ? layersToFlatten
      : layers.filter((l) => l.id !== selectedLayerId);

    try {
      const dataUrl = await rasterizeBackgroundToDataUrl(
        docData,
        effectiveLayers,
        Math.min(1920, docData.viewBox.width),
        Math.min(1920, docData.viewBox.height)
      );
      setFlattenDataUrl(dataUrl);

      // Also ensure those layers have isFlattened = true
      if (layersToFlatten.length === 0) {
        setLayers((prev) =>
          prev.map((l) => ({
            ...l,
            isFlattened: l.id !== selectedLayerId,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFlattening(false);
    }
  }, [isFlattening, layers, selectedLayerId, docData]);

  // Effective layers after Merge Path (if enabled)
  const displayAndExportLayers = useMemo(() => {
    if (settings.mergePathsByColor) {
      return mergePathsByColor(layers, settings.bakeTransformsIntoGeometry);
    }
    return layers;
  }, [layers, settings.mergePathsByColor, settings.bakeTransformsIntoGeometry]);

  // Diagnostic metrics
  const diagnostics = useMemo(() => {
    return evaluateLayerOptimization(
      layers,
      settings.layerThreshold,
      settings.mergePathsByColor
    );
  }, [layers, settings.layerThreshold, settings.mergePathsByColor]);

  // Layer manipulation handlers
  const handleToggleVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isVisible: !l.isVisible } : l))
    );
  }, []);

  const handleToggleInclusion = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isIncluded: !l.isIncluded } : l))
    );
  }, []);

  const handleToggleFlatten = useCallback((id: string) => {
    setLayers((prev) => {
      const updated = prev.map((l) =>
        l.id === id ? { ...l, isFlattened: !l.isFlattened } : l
      );
      return updated;
    });
    // If in partial flatten mode, clear cache so it can regenerate
    setFlattenDataUrl('');
  }, []);

  const handleBulkSelectAll = useCallback((select: boolean) => {
    setLayers((prev) => prev.map((l) => ({ ...l, isIncluded: select })));
  }, []);

  const handleBulkFlattenAll = useCallback((flatten: boolean) => {
    setLayers((prev) => prev.map((l) => ({ ...l, isFlattened: flatten })));
    setFlattenDataUrl('');
  }, []);

  const handleSoloLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => ({ ...l, isVisible: l.id === id }))
    );
  }, []);

  // Selected layer reference
  const selectedLayer = useMemo(() => {
    return (
      displayAndExportLayers.find((l) => l.id === selectedLayerId) ||
      layers.find((l) => l.id === selectedLayerId) ||
      null
    );
  }, [displayAndExportLayers, layers, selectedLayerId]);

  // Generated XML string
  const generatedXml = useMemo(() => {
    return generateAlightMotionXml(docData, displayAndExportLayers, {
      projectName: docData.title,
      fps: 60,
      durationSeconds: 5.0,
      bakeTransforms: settings.bakeTransformsIntoGeometry,
      flattenMode: settings.flattenMode,
      flattenDataUrl,
    });
  }, [docData, displayAndExportLayers, settings, flattenDataUrl]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onSelectSample={handleSelectSample}
        samples={SAMPLE_SVGS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalLayers={layers.length}
        finalLayers={diagnostics.finalLayerCount}
      />

      {/* Optimizer Toolbar */}
      <OptimizerToolbar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        originalLayerCount={diagnostics.originalLayerCount}
        finalLayerCount={diagnostics.finalLayerCount}
        reductionPercentage={diagnostics.reductionPercentage}
        flattenedCount={layers.filter((l) => l.isFlattened && l.isIncluded).length}
        onRunFlatten={handleRunFlatten}
        isFlattening={isFlattening}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Layer Tree Panel (responsive) */}
        <div
          className={`w-72 md:w-80 shrink-0 h-full border-r border-slate-800 transition-all ${
            activeTab === 'layers' || activeTab === 'canvas' ? 'block' : 'hidden md:block'
          }`}
        >
          <LayerPanel
            layers={displayAndExportLayers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id) => setSelectedLayerId(id)}
            onToggleVisibility={handleToggleVisibility}
            onToggleInclusion={handleToggleInclusion}
            onToggleFlatten={handleToggleFlatten}
            onBulkSelectAll={handleBulkSelectAll}
            onBulkFlattenAll={handleBulkFlattenAll}
            onSoloLayer={handleSoloLayer}
          />
        </div>

        {/* Center: Interactive Pan & Zoom Canvas */}
        <div className="flex-1 h-full relative overflow-hidden">
          <PreviewCanvas
            docData={docData}
            layers={displayAndExportLayers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id) => setSelectedLayerId(id)}
            bakeTransforms={settings.bakeTransformsIntoGeometry}
            flattenMode={settings.flattenMode}
            flattenDataUrl={flattenDataUrl}
          />
        </div>

        {/* Right Side: Inspector Panel (Dimensions, Matrix, Bezier Points) */}
        <div className="w-80 shrink-0 h-full border-l border-slate-800 hidden lg:block">
          <InspectorPanel selectedLayer={selectedLayer} docData={docData} />
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        xmlContent={generatedXml}
        docData={docData}
        exportLayers={displayAndExportLayers}
        flattenMode={settings.flattenMode}
        flattenDataUrl={flattenDataUrl}
        originalLayerCount={diagnostics.originalLayerCount}
      />

      <SvgInputModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadSvg={handleLoadSvg}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
