import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cardEntranceVariants, containerStaggerVariants } from '../lib/animationVariants';
import { 
  GitCompare, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RotateCw, 
  Layers, 
  ExternalLink,
  ChevronDown,
  Info,
  BrainCircuit,
  Sliders,
  Sparkles,
  Download,
  ShieldCheck,
  Thermometer,
  Wind,
  Droplets
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  ReferenceLine 
} from 'recharts';
import { 
  PRESET_LOCATIONS, 
  NASA_PARAMETERS, 
  fetchNasaLocationData, 
  LocationDataResult, 
  PresetLocation 
} from '../lib/nasaPowerService';
import { fetchCachedLocationData } from '../services/dataCache';
import { 
  analyzeTrend, 
  compareSeries, 
  TrendAnalysisResult, 
  ComparisonMetrics 
} from '../lib/statistics';
import { Link } from 'react-router-dom';

type ViewMode = 'combined' | 'split' | 'delta';

export default function LocationComparison() {
  // Location A & B states
  const [locAPresetIndex, setLocAPresetIndex] = useState<number>(0); // Nagpur
  const [locBPresetIndex, setLocBPresetIndex] = useState<number>(1); // Mumbai
  
  const [customLocA, setCustomLocA] = useState({ name: 'Nagpur', lat: 21.1458, lon: 79.0882 });
  const [customLocB, setCustomLocB] = useState({ name: 'Mumbai', lat: 19.0760, lon: 72.8777 });
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Variable & temporal controls
  const [selectedParamKey, setSelectedParamKey] = useState<string>('PM25');
  const [startYear, setStartYear] = useState<number>(2018);
  const [endYear, setEndYear] = useState<number>(2024);

  // Visual toggle
  const [viewMode, setViewMode] = useState<ViewMode>('combined');

  // Async data states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [dataA, setDataA] = useState<LocationDataResult | null>(null);
  const [dataB, setDataB] = useState<LocationDataResult | null>(null);
  const [isCachedA, setIsCachedA] = useState<boolean>(false);
  const [isCachedB, setIsCachedB] = useState<boolean>(false);

  // Compute stats on loaded data
  const statsA: TrendAnalysisResult | null = useMemo(() => {
    if (!dataA || dataA.points.length === 0) return null;
    return analyzeTrend(dataA.points.map(p => p.value), 12);
  }, [dataA]);

  const statsB: TrendAnalysisResult | null = useMemo(() => {
    if (!dataB || dataB.points.length === 0) return null;
    return analyzeTrend(dataB.points.map(p => p.value), 12);
  }, [dataB]);

  const comparison: ComparisonMetrics | null = useMemo(() => {
    if (!statsA || !statsB || statsA.classification === 'insufficient observations' || statsB.classification === 'insufficient observations') {
      return null;
    }
    const isRatio = NASA_PARAMETERS[selectedParamKey]?.isRatioScale || false;
    return compareSeries(statsA.stats, statsA.regression, statsB.stats, statsB.regression, isRatio);
  }, [statsA, statsB, selectedParamKey]);

  // Combined chart dataset
  const combinedChartData = useMemo(() => {
    if (!dataA || !dataB) return [];
    
    // Map periods to values
    const mapB = new Map<string, number>();
    for (const pt of dataB.points) {
      mapB.set(pt.period, pt.value);
    }

    return dataA.points.map((ptA, index) => {
      const valB = mapB.get(ptA.period) ?? null;
      const fittedA = statsA?.regression?.fittedLine?.[index] ?? null;
      const fittedB = statsB?.regression?.fittedLine?.[index] ?? null;
      const delta = valB !== null ? ptA.value - valB : null;

      return {
        period: ptA.period,
        dateLabel: ptA.dateLabel,
        valueA: ptA.value,
        valueB: valB,
        trendA: fittedA !== null ? Number(fittedA.toFixed(2)) : null,
        trendB: fittedB !== null ? Number(fittedB.toFixed(2)) : null,
        delta: delta !== null ? Number(delta.toFixed(2)) : null
      };
    });
  }, [dataA, dataB, statsA, statsB]);

  // Execution trigger
  const executeComparison = async (
    targetA: { name: string; lat: number; lon: number },
    targetB: { name: string; lat: number; lon: number },
    sYear: number,
    eYear: number,
    param: string
  ) => {
    if (sYear > eYear) {
      setError('Start year must be less than or equal to End year.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [resA, resB] = await Promise.all([
        fetchCachedLocationData(targetA.lat, targetA.lon, sYear, eYear, param, targetA.name),
        fetchCachedLocationData(targetB.lat, targetB.lon, sYear, eYear, param, targetB.name)
      ]);

      setDataA(resA.data);
      setDataB(resB.data);
      setIsCachedA(resA.isCached);
      setIsCachedB(resB.isCached);
    } catch (err: any) {
      console.error('Comparative fetch failed:', err);
      setError(err.message || 'Failed to retrieve NASA POWER datasets.');
      setIsCachedA(false);
      setIsCachedB(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const targetA = isCustomMode ? customLocA : PRESET_LOCATIONS[locAPresetIndex];
    const targetB = isCustomMode ? customLocB : PRESET_LOCATIONS[locBPresetIndex];
    executeComparison(targetA, targetB, startYear, endYear, selectedParamKey);
  }, [locAPresetIndex, locBPresetIndex, isCustomMode, selectedParamKey, startYear, endYear]);

  const activeParam = NASA_PARAMETERS[selectedParamKey];
  const nameA = isCustomMode ? customLocA.name : PRESET_LOCATIONS[locAPresetIndex]?.name;
  const nameB = isCustomMode ? customLocB.name : PRESET_LOCATIONS[locBPresetIndex]?.name;

  // Compute empirical correlation between Series A and B
  const seriesCorrelation = useMemo(() => {
    if (!combinedChartData || combinedChartData.length < 3) return null;
    const validPairs = combinedChartData.filter(d => d.valueA !== null && d.valueB !== null) as { valueA: number; valueB: number }[];
    if (validPairs.length < 3) return null;
    const meanA = validPairs.reduce((s, p) => s + p.valueA, 0) / validPairs.length;
    const meanB = validPairs.reduce((s, p) => s + p.valueB, 0) / validPairs.length;
    let num = 0, denA = 0, denB = 0;
    for (const p of validPairs) {
      num += (p.valueA - meanA) * (p.valueB - meanB);
      denA += Math.pow(p.valueA - meanA, 2);
      denB += Math.pow(p.valueB - meanB, 2);
    }
    return denA && denB ? Number((num / Math.sqrt(denA * denB)).toFixed(3)) : 0;
  }, [combinedChartData]);

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-12 font-sans">
      
      {/* Top Control Bar */}
      <motion.div 
        variants={cardEntranceVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#232A3D] border border-[#48516A] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-[#F0EBDD]">DUAL STATION SATELLITE COMPARISON</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#353D55] text-[#A6B7D4] border border-[#48516A] font-semibold">
              NASA MERRA-2 ASSIMILATION
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#1D2436] p-1 rounded-lg border border-[#48516A]">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Combined Overlay</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'split'
                ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Side-by-Side Split</span>
          </button>
          <button
            onClick={() => setViewMode('delta')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'delta'
                ? 'bg-[#F0B44D] text-[#171B2B] font-bold shadow-sm'
                : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Differential Delta (Δ)</span>
          </button>
        </div>
      </motion.div>

      {/* 5 Comparative Dial / Telemetry Cards */}
      <motion.div 
        variants={containerStaggerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        {/* Station A Mean */}
        <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
            <span className="truncate">Station A: {nameA}</span>
            <span className="w-2 h-2 rounded-full bg-[#A6B7D4]"></span>
          </div>
          <div className="my-2">
            <div className="text-xl font-mono font-black text-[#A6B7D4]">
              {statsA ? statsA.stats.mean.toFixed(2) : '--'}
            </div>
            <div className="text-[10px] font-mono text-[#B5BDCC]">{activeParam?.units || ''} (Mean)</div>
          </div>
          <div className="text-[9px] font-mono text-[#A6B7D4] flex items-center justify-between">
            <span>Trend: {statsA ? `${(statsA.regression.slope * 12).toFixed(2)} / yr` : '--'}</span>
            {isCachedA && <span className="text-[8px] bg-[#232A3D] text-[#A6B7D4] border border-[#48516A] px-1 py-0.5 rounded font-mono">⚡ CACHED</span>}
          </div>
        </div>

        {/* Station B Mean */}
        <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
            <span className="truncate">Station B: {nameB}</span>
            <span className="w-2 h-2 rounded-full bg-[#D28B71]"></span>
          </div>
          <div className="my-2">
            <div className="text-xl font-mono font-black text-[#D28B71]">
              {statsB ? statsB.stats.mean.toFixed(2) : '--'}
            </div>
            <div className="text-[10px] font-mono text-[#B5BDCC]">{activeParam?.units || ''} (Mean)</div>
          </div>
          <div className="text-[9px] font-mono text-[#D28B71] flex items-center justify-between">
            <span>Trend: {statsB ? `${(statsB.regression.slope * 12).toFixed(2)} / yr` : '--'}</span>
            {isCachedB && <span className="text-[8px] bg-[#232A3D] text-[#D28B71] border border-[#48516A] px-1 py-0.5 rounded font-mono">⚡ CACHED</span>}
          </div>
        </div>

        {/* Absolute Difference (Δ) */}
        <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
            <span>Differential Gap (Δ)</span>
            <span className="w-2 h-2 rounded-full bg-[#F0B44D]"></span>
          </div>
          <div className="my-2">
            <div className="text-xl font-mono font-black text-[#F0B44D]">
              {comparison ? `${comparison.deltaMean > 0 ? '+' : ''}${comparison.deltaMean.toFixed(2)}` : '--'}
            </div>
            <div className="text-[10px] font-mono text-[#B5BDCC]">{activeParam?.units || ''} (A minus B)</div>
          </div>
          <div className="text-[9px] font-mono text-[#F0B44D]">
            {comparison?.relativeMeanDiffPct !== null && comparison?.relativeMeanDiffPct !== undefined
              ? `${comparison.relativeMeanDiffPct > 0 ? '+' : ''}${comparison.relativeMeanDiffPct.toFixed(1)}% Gap` 
              : `Δ = ${comparison?.deltaMean.toFixed(2) || '--'}`}
          </div>
        </div>

        {/* Correlation Coefficient (r) */}
        <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
            <span>Correlation (r)</span>
            <span className="w-2 h-2 rounded-full bg-[#A6B7D4]"></span>
          </div>
          <div className="my-2">
            <div className="text-xl font-mono font-black text-[#F0EBDD]">
              {seriesCorrelation !== null ? seriesCorrelation : '--'}
            </div>
            <div className="text-[10px] font-mono text-[#B5BDCC]">Synchronous Covariance</div>
          </div>
          <div className="text-[9px] font-mono text-[#B5BDCC]">
            {seriesCorrelation !== null && Math.abs(seriesCorrelation) > 0.6 ? 'High Temporal Sync' : 'Regional Variance'}
          </div>
        </div>

        {/* Trend Divergence */}
        <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
            <span>Trend Trajectory</span>
            <span className="w-2 h-2 rounded-full bg-[#35C98B]"></span>
          </div>
          <div className="my-2">
            <div className="text-sm font-mono font-black text-[#F0EBDD] leading-tight">
              {comparison?.fasterWarmingLocation === 'A' ? `${nameA} Rising Faster` : comparison?.fasterWarmingLocation === 'B' ? `${nameB} Rising Faster` : 'Parallel Trajectory'}
            </div>
            <div className="text-[10px] font-mono text-[#B5BDCC] mt-1">
              Δ Slope: {comparison ? `${comparison.deltaSlopePerYear > 0 ? '+' : ''}${comparison.deltaSlopePerYear.toFixed(3)}/yr` : '--'}
            </div>
          </div>
          <div className="text-[9px] font-mono text-[#35C98B] font-semibold">
            {comparison && Math.abs(comparison.deltaSlopePerYear) > 0.05 ? 'DIVERGENCE DISCERNIBLE' : 'PARALLEL TRAJECTORY'}
          </div>
        </div>
      </motion.div>

      {/* Main Console Layout: Left Selector Sidebar + Right Chart Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Side: Target Stations & Variable Controls (1 Column) */}
        <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#48516A] pb-2">
            <span className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#A6B7D4]" />
              Comparative Stations
            </span>
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-[10px] font-mono text-[#A6B7D4] hover:underline cursor-pointer"
            >
              {isCustomMode ? 'Presets' : 'Custom'}
            </button>
          </div>

          {/* Station A Card */}
          <div className="p-3 bg-[#232A3D] rounded-lg border border-[#48516A] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#A6B7D4] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#A6B7D4]"></span>
                STATION A (Primary)
              </span>
              <span className="text-[10px] text-[#838FA3] font-mono">Series #1</span>
            </div>
            {!isCustomMode ? (
              <select
                value={locAPresetIndex}
                onChange={(e) => setLocAPresetIndex(Number(e.target.value))}
                className="w-full bg-[#1D2436] border border-[#48516A] rounded px-2.5 py-1.5 text-xs font-mono text-[#F0EBDD]"
              >
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <option key={`a-${loc.name}`} value={idx}>{loc.name} ({loc.region})</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <input
                  type="number"
                  step="0.0001"
                  value={customLocA.lat}
                  onChange={(e) => setCustomLocA({ ...customLocA, lat: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1D2436] border border-[#48516A] rounded px-2 py-1 text-[#F0EBDD]"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={customLocA.lon}
                  onChange={(e) => setCustomLocA({ ...customLocA, lon: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1D2436] border border-[#48516A] rounded px-2 py-1 text-[#F0EBDD]"
                  placeholder="Lon"
                />
              </div>
            )}
          </div>

          {/* Station B Card */}
          <div className="p-3 bg-[#232A3D] rounded-lg border border-[#48516A] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#D28B71] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D28B71]"></span>
                STATION B (Benchmark)
              </span>
              <span className="text-[10px] text-[#838FA3] font-mono">Series #2</span>
            </div>
            {!isCustomMode ? (
              <select
                value={locBPresetIndex}
                onChange={(e) => setLocBPresetIndex(Number(e.target.value))}
                className="w-full bg-[#1D2436] border border-[#48516A] rounded px-2.5 py-1.5 text-xs font-mono text-[#F0EBDD]"
              >
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <option key={`b-${loc.name}`} value={idx}>{loc.name} ({loc.region})</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <input
                  type="number"
                  step="0.0001"
                  value={customLocB.lat}
                  onChange={(e) => setCustomLocB({ ...customLocB, lat: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1D2436] border border-[#48516A] rounded px-2 py-1 text-[#F0EBDD]"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={customLocB.lon}
                  onChange={(e) => setCustomLocB({ ...customLocB, lon: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1D2436] border border-[#48516A] rounded px-2 py-1 text-[#F0EBDD]"
                  placeholder="Lon"
                />
              </div>
            )}
          </div>

          {/* Variable Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#B5BDCC] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#A6B7D4]" />
              Environmental Parameter
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {['PM25', 'AOD_550', 'T2M', 'PRECTOTCORR', 'WS10M'].map((key) => {
                const param = NASA_PARAMETERS[key];
                const isSelected = selectedParamKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedParamKey(key)}
                    className={`px-3 py-2 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? 'bg-[#232A3D] text-[#F0EBDD] border-[#A6B7D4] font-bold shadow-sm'
                        : 'bg-[#1D2436] text-[#B5BDCC] border-[#48516A] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{param?.name || key}</div>
                      <div className="text-[10px] text-[#838FA3] font-normal">{param?.units}</div>
                    </div>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#A6B7D4]"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temporal Range */}
          <div className="space-y-2 pt-2 border-t border-[#48516A]">
            <label className="text-xs font-mono text-[#B5BDCC] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#A6B7D4]" /> Time Horizon
              </span>
              <span className="text-[10px] font-mono text-[#A6B7D4]">{endYear - startYear + 1} Yrs</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="bg-[#1D2436] border border-[#48516A] rounded px-2 py-1.5 text-xs font-mono text-[#F0EBDD]"
              >
                {[2015, 2018, 2020].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="bg-[#1D2436] border border-[#48516A] rounded px-2 py-1.5 text-xs font-mono text-[#F0EBDD]"
              >
                {[2022, 2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <Link
            to={`/ai-insights?lat=${PRESET_LOCATIONS[locAPresetIndex]?.lat}&lon=${PRESET_LOCATIONS[locAPresetIndex]?.lon}&param=${selectedParamKey}`}
            className="w-full py-2.5 bg-[#A6B7D4] hover:bg-[#B8C6DF] text-[#171B2B] rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-[#171B2B]" />
            <span>Generate Comparative AI Dossier</span>
          </Link>
        </div>

        {/* Right Side: Interactive Comparative Visualization (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#48516A] pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A6B7D4]"></span>
                  {activeParam?.name} Dual Satellite Telemetry ({startYear}–{endYear})
                </h3>
                <p className="text-[11px] font-mono text-[#B5BDCC] mt-0.5">
                  Monthly observations from NASA POWER MERRA-2 assimilation calibrated with surface monitors.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#A6B7D4]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A6B7D4]"></span> {nameA}
                </span>
                <span className="flex items-center gap-1.5 text-[#D28B71]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D28B71]"></span> {nameB}
                </span>
              </div>
            </div>

            {/* Main Comparative Chart */}
            <div className="h-80 w-full bg-[#232A3D] p-3 rounded-lg border border-[#48516A]">
              {loading ? (
                <div className="h-full flex items-center justify-center flex-col gap-3 text-[#B5BDCC] font-mono text-xs">
                  <RotateCw className="w-8 h-8 text-[#A6B7D4] animate-spin" />
                  <span>Synchronizing Dual NASA Stations...</span>
                </div>
              ) : viewMode === 'combined' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D354A" vertical={false} />
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="#48516A" 
                      tick={{ fill: '#B5BDCC', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      stroke="#48516A" 
                      tick={{ fill: '#B5BDCC', fontSize: 10, fontFamily: 'monospace' }}
                      unit={` ${activeParam?.units || ''}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#232A3D', 
                        borderColor: '#48516A', 
                        borderRadius: '8px',
                        color: '#F0EBDD',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="valueA" 
                      name={`${nameA} (${activeParam?.units})`} 
                      stroke="#A6B7D4" 
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valueB" 
                      name={`${nameB} (${activeParam?.units})`} 
                      stroke="#D28B71" 
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : viewMode === 'delta' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D354A" vertical={false} />
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="#48516A" 
                      tick={{ fill: '#B5BDCC', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      stroke="#48516A" 
                      tick={{ fill: '#B5BDCC', fontSize: 10, fontFamily: 'monospace' }}
                      unit={` ${activeParam?.units || ''}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#232A3D', 
                        borderColor: '#48516A', 
                        borderRadius: '8px',
                        color: '#F0EBDD',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    />
                    <ReferenceLine y={0} stroke="#64718A" strokeWidth={1.5} />
                    <Bar 
                      dataKey="delta" 
                      name={`Differential (A minus B)`} 
                      fill="#F0B44D" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                /* Split View: Dual Mini Charts */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#2D354A" vertical={false} />
                      <XAxis dataKey="dateLabel" stroke="#48516A" tick={{ fill: '#B5BDCC', fontSize: 9 }} />
                      <YAxis stroke="#48516A" tick={{ fill: '#B5BDCC', fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#232A3D', borderColor: '#48516A', color: '#F0EBDD', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="valueA" stroke="#A6B7D4" fill="#A6B7D4" fillOpacity={0.2} name={nameA} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#2D354A" vertical={false} />
                      <XAxis dataKey="dateLabel" stroke="#48516A" tick={{ fill: '#B5BDCC', fontSize: 9 }} />
                      <YAxis stroke="#48516A" tick={{ fill: '#B5BDCC', fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#232A3D', borderColor: '#48516A', color: '#F0EBDD', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="valueB" stroke="#D28B71" fill="#D28B71" fillOpacity={0.2} name={nameB} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Comparative Metrics Matrix Table */}
          {statsA && statsB && comparison && (
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#48516A] pb-3 mb-3">
                <span className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A6B7D4]" />
                  Comparative Statistical Decomposition
                </span>
                <span className="text-[10px] font-mono text-[#A6B7D4]">Non-Parametric Contrast</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1D2436] text-[#B5BDCC] text-[10px] uppercase border-b border-[#48516A]">
                    <tr>
                      <th className="py-2 px-3">Metric</th>
                      <th className="py-2 px-3 text-[#A6B7D4]">{nameA}</th>
                      <th className="py-2 px-3 text-[#D28B71]">{nameB}</th>
                      <th className="py-2 px-3 text-[#F0B44D]">Differential (Δ)</th>
                      <th className="py-2 px-3">Statistical Inference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#48516A] text-[#F0EBDD]">
                    <tr className="hover:bg-[#2B3349]">
                      <td className="py-2 px-3 font-semibold text-[#F0EBDD]">Mean Value</td>
                      <td className="py-2 px-3 text-[#A6B7D4] font-bold">{statsA.stats.mean.toFixed(2)}</td>
                      <td className="py-2 px-3 text-[#D28B71] font-bold">{statsB.stats.mean.toFixed(2)}</td>
                      <td className="py-2 px-3 text-[#F0B44D] font-bold">{comparison.deltaMean > 0 ? '+' : ''}{comparison.deltaMean.toFixed(2)}</td>
                      <td className="py-2 px-3 text-[#B5BDCC]">
                        {comparison.relativeMeanDiffPct !== null ? `${comparison.relativeMeanDiffPct.toFixed(1)}% Divergence` : 'Absolute Gap'}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#2B3349]">
                      <td className="py-2 px-3 font-semibold text-[#F0EBDD]">Standard Deviation (σ)</td>
                      <td className="py-2 px-3">{statsA.stats.stdDev.toFixed(2)}</td>
                      <td className="py-2 px-3">{statsB.stats.stdDev.toFixed(2)}</td>
                      <td className="py-2 px-3 text-[#B5BDCC]">{(statsA.stats.stdDev - statsB.stats.stdDev).toFixed(2)}</td>
                      <td className="py-2 px-3 text-[#B5BDCC]">Volatility Index</td>
                    </tr>
                    <tr className="hover:bg-[#2B3349]">
                      <td className="py-2 px-3 font-semibold text-[#F0EBDD]">Annual Trend Rate</td>
                      <td className="py-2 px-3 text-[#A6B7D4] font-bold">{(statsA.regression.slope * 12).toFixed(3)} / yr</td>
                      <td className="py-2 px-3 text-[#D28B71] font-bold">{(statsB.regression.slope * 12).toFixed(3)} / yr</td>
                      <td className="py-2 px-3 text-[#F0B44D] font-bold">{((statsA.regression.slope - statsB.regression.slope) * 12).toFixed(3)} / yr</td>
                      <td className="py-2 px-3 text-[#35C98B] font-semibold">
                        {comparison.fasterWarmingLocation === 'A' ? `${nameA} Rising Faster` : comparison.fasterWarmingLocation === 'B' ? `${nameB} Rising Faster` : 'Parallel'}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#2B3349]">
                      <td className="py-2 px-3 font-semibold text-[#F0EBDD]">Mann-Kendall p-value</td>
                      <td className="py-2 px-3">{statsA.mannKendall.pValue.toFixed(4)}</td>
                      <td className="py-2 px-3">{statsB.mannKendall.pValue.toFixed(4)}</td>
                      <td className="py-2 px-3 text-[#B5BDCC]">--</td>
                      <td className="py-2 px-3">
                        {statsA.mannKendall.pValue < 0.05 ? 'Sig A' : 'Inconclusive A'} / {statsB.mannKendall.pValue < 0.05 ? 'Sig B' : 'Inconclusive B'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
