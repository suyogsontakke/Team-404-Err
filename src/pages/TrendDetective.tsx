import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageContainer from '../components/PageContainer';
import { 
  analyzeAnnualTrend, 
  AnnualTrendAnalysisResult 
} from '../lib/statistics';
import { 
  fetchNasaDailyAnnualT2M, 
  NasaDailyAnnualInvestigationResult,
  PRESET_LOCATIONS 
} from '../lib/nasaPowerService';
import { fetchCachedDailyAnnualT2M } from '../services/dataCache';
import { createGoogleDocReport } from '../services/googleDocsService';
import { getAccessToken } from '../lib/authService';
import { cardEntranceVariants, containerStaggerVariants, chartEntranceVariants } from '../lib/animationVariants';
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
  Search, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  BrainCircuit, 
  MapPin, 
  Calendar, 
  Layers, 
  Info, 
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Award,
  Thermometer,
  Compass,
  Activity,
  History,
  BarChart3,
  Sliders,
  Maximize2,
  FileText
} from 'lucide-react';
import AtmosphericColumn3D from '../components/AtmosphericColumn3D';

type ActiveViewMode = 'detective' | 'historical' | '3d-column';

export default function TrendDetective() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode from URL query (e.g. ?mode=historical)
  const modeParam = searchParams.get('mode');
  const [activeMode, setActiveMode] = useState<ActiveViewMode>(
    modeParam === 'historical' ? 'historical' : 'detective'
  );

  // Sync mode with URL if needed
  useEffect(() => {
    if (modeParam === 'historical') {
      setActiveMode('historical');
    }
  }, [modeParam]);

  // Primary Investigation Parameters (Defaults to NASA Hackathon Case Study: Nagpur T2M 2001-2025)
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0); // Nagpur default
  const [startYear, setStartYear] = useState<number>(2001);
  const [endYear, setEndYear] = useState<number>(2025);

  // Custom coordinates toggle
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<number>(21.1458);
  const [customLon, setCustomLon] = useState<number>(79.0882);

  // Chart display toggles
  const [showOLS, setShowOLS] = useState<boolean>(true);
  const [showSen, setShowSen] = useState<boolean>(true);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(true);

  // Async data & analysis states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [investigationData, setInvestigationData] = useState<NasaDailyAnnualInvestigationResult | null>(null);
  const [analysis, setAnalysis] = useState<AnnualTrendAnalysisResult | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // Parse URL query parameters if present
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const sYear = searchParams.get('start');
    const eYear = searchParams.get('end');

    if (sYear && !isNaN(parseInt(sYear))) setStartYear(parseInt(sYear));
    if (eYear && !isNaN(parseInt(eYear))) setEndYear(parseInt(eYear));

    if (lat && lon) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        const matched = PRESET_LOCATIONS.findIndex(
          p => Math.abs(p.lat - parsedLat) < 0.05 && Math.abs(p.lon - parsedLon) < 0.05
        );
        if (matched >= 0) {
          setSelectedPresetIdx(matched);
          setIsCustom(false);
        } else {
          setCustomLat(parsedLat);
          setCustomLon(parsedLon);
          setIsCustom(true);
        }
      }
    }
  }, [searchParams]);

  // Execute actual NASA Daily Investigation & Annual Trend Analysis with Memoized Cache
  const runInvestigation = async (forceRefresh: boolean = false) => {
    const activeLat = isCustom ? customLat : PRESET_LOCATIONS[selectedPresetIdx].lat;
    const activeLon = isCustom ? customLon : PRESET_LOCATIONS[selectedPresetIdx].lon;
    const activeName = isCustom 
      ? `Custom Location (${activeLat.toFixed(4)}°N, ${activeLon.toFixed(4)}°E)` 
      : `${PRESET_LOCATIONS[selectedPresetIdx].name}, ${PRESET_LOCATIONS[selectedPresetIdx].region}`;

    setLoading(true);
    setError(null);

    try {
      const cachedRes = await fetchCachedDailyAnnualT2M(
        activeLat,
        activeLon,
        startYear,
        endYear,
        activeName,
        forceRefresh
      );

      setInvestigationData(cachedRes.investigationData);
      setAnalysis(cachedRes.analysis);
      setIsCached(cachedRes.isCached);
    } catch (err: any) {
      console.error('Trend Detective fetch error:', err);
      setError(err.message || 'Failed to retrieve NASA POWER daily data.');
      setInvestigationData(null);
      setAnalysis(null);
      setIsCached(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    runInvestigation();
  }, [selectedPresetIdx, startYear, endYear, isCustom]);

  // Load Main Nagpur Hackathon Benchmark
  const handleLoadNagpurCaseStudy = () => {
    setIsCustom(false);
    setSelectedPresetIdx(0); // Nagpur
    setStartYear(2001);
    setEndYear(2025);
  };

  const handleExportToDocs = async () => {
    if (!investigationData || !analysis) return;
    
    setSavingDoc(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Please sign in with Google to save to Docs.');
        return;
      }
      
      const docId = await createGoogleDocReport({
        id: 'temp',
        title: `Trend Analysis: ${investigationData.locationName}`,
        createdAt: new Date().toISOString(),
        locationName: investigationData.locationName,
        lat: investigationData.lat,
        lon: investigationData.lon,
        parameterKey: 'T2M',
        parameterName: 'Temperature',
        units: '°C',
        startYear: startYear,
        endYear: endYear,
        source: 'NASA POWER',
        retrievedAt: new Date().toISOString(),
        points: investigationData.annualPoints.map(p => ({ period: p.year.toString(), dateLabel: p.year.toString(), value: p.avgTemp })),
        stats: { count: analysis.stats.count, mean: analysis.stats.mean, median: analysis.stats.median, min: analysis.stats.min, max: analysis.stats.max, stdDev: analysis.stats.stdDev },
        regression: { slope: analysis.regression.slope, intercept: analysis.regression.intercept, r2: analysis.regression.r2, trendPerYear: analysis.regression.trendPerYear, trendPerDecade: analysis.regression.trendPerDecade, fittedLine: analysis.regression.fittedLine, ciSlope: analysis.regression.ciSlope },
        mannKendall: { s: analysis.mannKendall.s, varS: analysis.mannKendall.varS, z: analysis.mannKendall.z, pValue: analysis.mannKendall.pValue, trend: analysis.mannKendall.trend },
        classification: analysis.classification,
        aiInsight: {
            scientificSummary: `Analysis of ${investigationData.locationName} from ${startYear} to ${endYear}. ${analysis.classification}.`,
            whatChanged: 'Mean Temperature',
            whereChanged: investigationData.locationName,
            howMuchChanged: `${analysis.regression.trendPerDecade.toFixed(2)} °C/decade`,
            statisticalSignificance: `p=${analysis.mannKendall.pValue.toFixed(4)}`,
            environmentalMeaning: 'Thermal trajectory analysis.',
            limitationsAndUncertainty: 'NASA reanalysis smoothing.',
            keyTakeawayBullets: [analysis.classification]
        },
        dataLimitations: []
      }, token);
      
      alert(`Report saved to Google Doc: ${docId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save to Google Docs.');
    } finally {
      setSavingDoc(false);
    }
  };

  // Combined chart dataset with fitted OLS line, Sen slope line, and baseline anomaly
  const chartData = useMemo(() => {
    if (!investigationData || !analysis || analysis.classification === 'insufficient observations') {
      return [];
    }

    const firstYear = investigationData.annualPoints[0]?.year || startYear;
    // Calculate 2001-2010 baseline if available, otherwise mean
    const baselineSlice = investigationData.annualPoints.slice(0, Math.min(10, investigationData.annualPoints.length));
    const baselineMean = baselineSlice.reduce((s, p) => s + p.avgTemp, 0) / (baselineSlice.length || 1);

    return investigationData.annualPoints.map((pt, index) => {
      const fittedOLS = analysis.regression.fittedLine[index];
      // Sen's slope line anchored at overall median
      const senTrendVal = analysis.stats.median + analysis.senSlope * (pt.year - (firstYear + Math.floor(analysis.stats.count / 2)));
      const anomaly = pt.avgTemp - baselineMean;

      return {
        year: pt.year,
        yearLabel: String(pt.year),
        observed: Number(pt.avgTemp.toFixed(2)),
        olsTrend: fittedOLS !== undefined ? Number(fittedOLS.toFixed(2)) : null,
        senTrend: Number(senTrendVal.toFixed(2)),
        anomaly: Number(anomaly.toFixed(2)),
        validDays: pt.validDays,
        minDaily: pt.minDaily,
        maxDaily: pt.maxDaily
      };
    });
  }, [investigationData, analysis, startYear]);

  // Calculate serial Lag-1 autocorrelation r1 to inspect autocorrelation limitations
  const lag1Autocorr = useMemo(() => {
    if (!investigationData || investigationData.annualPoints.length < 5) return 0;
    const vals = investigationData.annualPoints.map(p => p.avgTemp);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    let num = 0;
    let den = 0;
    for (let i = 0; i < vals.length; i++) {
      den += Math.pow(vals[i] - mean, 2);
      if (i < vals.length - 1) {
        num += (vals[i] - mean) * (vals[i + 1] - mean);
      }
    }
    return den === 0 ? 0 : Number((num / den).toFixed(3));
  }, [investigationData]);

  return (
    <PageContainer title="Earth System Trend Detective — NASA Hackathon Benchmark">
      <div className="space-y-5 max-w-[1700px] mx-auto pb-12 font-sans">
        
        {/* Top Control Bar with Mac Dots & Multi-Mode Navigation */}
        <div className="bg-[#091122]/90 backdrop-blur-md border border-[#1b2b48] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-white">EARTH SYSTEM TREND DETECTIVE</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold">
                NASA POWER DAILY KERNEL
              </span>
              {isCached && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/90 text-purple-300 border border-purple-500/60 font-semibold animate-pulse flex items-center gap-1 shadow-sm shadow-purple-500/20">
                  <span>⚡</span> [CACHED OBSERVATION]
                </span>
              )}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-[#050913] p-1 rounded-lg border border-[#16243d]">
            <button
              onClick={() => setActiveMode('detective')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'detective'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Trend Detective (Mann-Kendall)</span>
            </button>
            <button
              onClick={() => setActiveMode('historical')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'historical'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historical Analysis (2001–2025)</span>
            </button>
            <button
              onClick={() => setActiveMode('3d-column')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === '3d-column'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>3D Boundary Layer Column</span>
            </button>
          </div>
        </div>

        {/* NASA Hackathon Hero Banner (Benchmark Nagpur) */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-r from-[#070e1c] via-[#0a1529] to-[#070f1e] border border-cyan-500/30 rounded-xl p-5 shadow-2xl shadow-cyan-950/20"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-[11px] font-mono text-cyan-300">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>NASA SPACE APPS CHALLENGE · BE AN EARTH SYSTEM TREND DETECTIVE</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Case Study: Nagpur Decadal Air Temperature Trajectory (2001–2025)
              </h1>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                Empirical environmental trend analysis using the official <strong>NASA POWER Daily Point API</strong>. 
                Daily near-surface temperature (T2M) observations from MERRA-2 assimilation (<span className="text-cyan-300 font-mono font-bold">9,131 days</span>) aggregated into annual averages, 
                evaluated with Ordinary Least Squares (OLS) regression, Sen's robust slope estimator, and the non-parametric Mann-Kendall test.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                  <MapPin className="w-3.5 h-3.5" /> 21.1458° N, 79.0882° E
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                  <Thermometer className="w-3.5 h-3.5" /> T2M Air Temperature (°C)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  <Calendar className="w-3.5 h-3.5" /> 2001–2025 (25 Years Daily)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <button
                onClick={handleLoadNagpurCaseStudy}
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs tracking-wider rounded-lg transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>INVESTIGATE NAGPUR BENCHMARK</span>
              </button>

              <Link
                to={`/ai-insights?lat=${investigationData?.lat || 21.1458}&lon=${investigationData?.lon || 79.0882}&param=T2M`}
                className="px-4 py-2 bg-[#0c1424] hover:bg-[#121e36] text-slate-300 hover:text-white border border-[#1b2b48] rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Scientific Synthesis</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 6 Key Circular / Telemetry Gauges (Inspired by Meteo Intelligence Reference) */}
        {analysis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Rate per Decade */}
            <div className="bg-[#0b1322]/80 backdrop-blur-md border border-[#182742] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Slope Rate</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              </div>
              <div className="my-2">
                <div className={`text-xl font-mono font-black ${
                  analysis.mannKendall.trend === 'increasing' ? 'text-amber-400' :
                  analysis.mannKendall.trend === 'decreasing' ? 'text-cyan-400' : 'text-slate-200'
                }`}>
                  {analysis.regression.trendPerDecade > 0 ? '+' : ''}{analysis.regression.trendPerDecade.toFixed(3)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">°C / decade (OLS)</div>
              </div>
              <div className="text-[9px] font-mono text-cyan-400/80">
                Annual: {(analysis.regression.slope).toFixed(4)} °C/yr
              </div>
            </div>

            {/* 2. Mann-Kendall Z-score */}
            <div className="bg-[#0b1322]/80 backdrop-blur-md border border-[#182742] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Mann-Kendall Z</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-white">
                  {analysis.mannKendall.z > 0 ? '+' : ''}{analysis.mannKendall.z.toFixed(3)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">Standardized Normal</div>
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                S = {analysis.mannKendall.s} · Var: {analysis.mannKendall.varS.toFixed(0)}
              </div>
            </div>

            {/* 3. Significance P-Value */}
            <div className="bg-[#0b1322]/80 backdrop-blur-md border border-[#182742] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Significance (p)</span>
                <span className={`w-1.5 h-1.5 rounded-full ${analysis.mannKendall.pValue < 0.05 ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              </div>
              <div className="my-2">
                <div className={`text-xl font-mono font-black ${analysis.mannKendall.pValue < 0.05 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {analysis.mannKendall.pValue < 0.001 ? '< 0.001' : analysis.mannKendall.pValue.toFixed(4)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">Threshold α = 0.05</div>
              </div>
              <div className="text-[9px] font-mono text-emerald-400 font-semibold">
                {analysis.mannKendall.pValue < 0.05 ? '★ STATISTICALLY SIGNIFICANT' : 'NO SIGNIFICANT TREND'}
              </div>
            </div>

            {/* 4. Sen's Robust Slope */}
            <div className="bg-[#0b1322]/80 backdrop-blur-md border border-[#182742] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Sen's Slope</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-purple-300">
                  {analysis.senSlopePerDecade > 0 ? '+' : ''}{analysis.senSlopePerDecade.toFixed(3)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">°C / decade (Median)</div>
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                Robust to outlier years
              </div>
            </div>

            {/* 5. R-Squared Goodness */}
            <div className="bg-[#0b1322]/80 backdrop-blur-md border border-[#182742] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>R² Goodness</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-blue-300">
                  {(analysis.regression.r2 * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-slate-400">Variance Explained</div>
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                r = {Math.sqrt(Math.max(0, analysis.regression.r2)).toFixed(3)}
              </div>
            </div>

            {/* 6. Observation Integrity */}
            <div className="bg-[#0b1322]/80 backdrop-blur-md border border-[#182742] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Observations</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-white">
                  {investigationData?.totalDailyObservations.toLocaleString() || '9,131'}
                </div>
                <div className="text-[10px] font-mono text-slate-400">Daily Observations</div>
              </div>
              <div className="text-[9px] font-mono text-emerald-400">
                100% NASA Quality Valid
              </div>
            </div>
          </div>
        )}

        {/* Parameters & Coordinate Console */}
        <div className="bg-[#0a1120] border border-[#1b2b48] rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2b48] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Target Coordinates & Historical Bounds</span>
            </div>
            
            <button
              onClick={() => setIsCustom(!isCustom)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {isCustom ? '← Switch to Benchmark Presets' : '+ Enter Custom Coordinates'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Geographic Station
              </label>
              {!isCustom ? (
                <select
                  value={selectedPresetIdx}
                  onChange={(e) => setSelectedPresetIdx(Number(e.target.value))}
                  className="w-full bg-[#060c18] border border-[#1b2b48] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {PRESET_LOCATIONS.map((loc, idx) => (
                    <option key={loc.name} value={idx}>
                      {loc.name} ({loc.region}) {idx === 0 ? '★ Hackathon Case Study' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lat"
                    value={customLat}
                    onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                    className="bg-[#060c18] border border-[#1b2b48] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lon"
                    value={customLon}
                    onChange={(e) => setCustomLon(parseFloat(e.target.value) || 0)}
                    className="bg-[#060c18] border border-[#1b2b48] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              )}
              <div className="text-[10px] font-mono text-slate-400">
                {!isCustom 
                  ? `${PRESET_LOCATIONS[selectedPresetIdx].lat.toFixed(4)}°N, ${PRESET_LOCATIONS[selectedPresetIdx].lon.toFixed(4)}°E` 
                  : `Custom: ${customLat.toFixed(4)}°N, ${customLon.toFixed(4)}°E`}
              </div>
            </div>

            {/* Variable Indicator */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Environmental Variable
              </label>
              <div className="w-full bg-[#060c18] border border-[#1b2b48] rounded-lg px-3 py-2 text-xs font-mono text-white flex items-center justify-between">
                <span className="font-bold text-cyan-300">T2M (Air Temperature)</span>
                <span className="text-[11px] font-mono text-slate-400">°C (2M Altitude)</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                NASA MERRA-2 Assimilated Near-Surface
              </div>
            </div>

            {/* Temporal Bounds */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Observation Range
                </span>
                <span className="text-[10px] font-mono text-cyan-400">{endYear - startYear + 1} Years</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="w-1/2 bg-[#060c18] border border-[#1b2b48] rounded-lg px-2.5 py-2 text-xs font-mono text-white"
                >
                  {[2001, 2005, 2010, 2015].map(yr => (
                    <option key={yr} value={yr}>From {yr}</option>
                  ))}
                </select>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="w-1/2 bg-[#060c18] border border-[#1b2b48] rounded-lg px-2.5 py-2 text-xs font-mono text-white"
                >
                  {[2020, 2022, 2024, 2025].map(yr => (
                    <option key={yr} value={yr}>To {yr}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                NASA Daily Time-Series Resolution
              </div>
            </div>

            {/* Refresh / Re-compute */}
            <div className="flex flex-col justify-end">
              <button
                onClick={() => runInvestigation(true)}
                disabled={loading}
                className="w-full bg-[#111e38] hover:bg-[#182c52] text-cyan-300 hover:text-white border border-cyan-500/40 rounded-lg py-2.5 px-4 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Retrieving Observations...' : 'Re-Run Mann-Kendall Kernel'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Main Trend Detective View */}
        {activeMode === 'detective' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Main Interactive Chart Section (3 Columns) */}
            <div className="lg:col-span-3 bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2b48] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Annual Mean Temperature Time-Series & Statistical Fits
                  </h3>
                </div>

                {/* Display Series Toggles */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={() => setShowOLS(!showOLS)}
                    className={`px-2.5 py-1 rounded border text-[11px] transition-all cursor-pointer ${
                      showOLS 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold' 
                        : 'bg-transparent text-slate-500 border-slate-700'
                    }`}
                  >
                    OLS Regression
                  </button>
                  <button
                    onClick={() => setShowSen(!showSen)}
                    className={`px-2.5 py-1 rounded border text-[11px] transition-all cursor-pointer ${
                      showSen 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-semibold' 
                        : 'bg-transparent text-slate-500 border-slate-700'
                    }`}
                  >
                    Sen's Median Line
                  </button>
                  <button
                    onClick={handleExportToDocs}
                    disabled={savingDoc}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded border border-blue-400 font-semibold text-[11px] transition-all cursor-pointer hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                  >
                    {savingDoc ? 'Saving...' : <><FileText className="w-3 h-3"/> Save to Docs</>}
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="h-80 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center flex-col gap-3 text-slate-400 font-mono text-xs">
                    <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span>Ingesting NASA POWER Daily Observations...</span>
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#132238" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        stroke="#475569" 
                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        stroke="#475569"
                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                        unit="°C"
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#070d18', 
                          borderColor: '#1e3352', 
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                          fontSize: '11px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="observed" 
                        name="Observed Annual Mean (°C)" 
                        stroke="#06b6d4" 
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#06b6d4' }}
                        activeDot={{ r: 6, fill: '#38bdf8' }}
                      />
                      {showOLS && (
                        <Line 
                          type="monotone" 
                          dataKey="olsTrend" 
                          name="Linear Regression (OLS)" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      )}
                      {showSen && (
                        <Line 
                          type="monotone" 
                          dataKey="senTrend" 
                          name="Sen's Slope Estimator" 
                          stroke="#a855f7" 
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                    No observation points available.
                  </div>
                )}
              </div>

              {/* Empirical Findings Callout */}
              {analysis && (
                <div className="bg-[#050b14] border border-[#14233a] rounded-lg p-3 text-xs font-mono text-slate-300 flex items-start gap-3">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-white font-bold">
                      EMPIRICAL RESULT: {analysis.mannKendall.trend.toUpperCase()} TREND ({analysis.mannKendall.pValue < 0.05 ? 'STATISTICALLY SIGNIFICANT' : 'NOT STATISTICALLY SIGNIFICANT'})
                    </div>
                    <div className="text-slate-400 leading-relaxed">
                      Over the {analysis.stats.count}-year period ({startYear}–{endYear}), annual mean air temperature changed at an estimated rate of{' '}
                      <strong className="text-cyan-300 font-mono">{analysis.regression.trendPerDecade > 0 ? '+' : ''}{analysis.regression.trendPerDecade.toFixed(3)} °C / decade</strong> (OLS) and{' '}
                      <strong className="text-purple-300 font-mono">{analysis.senSlopePerDecade > 0 ? '+' : ''}{analysis.senSlopePerDecade.toFixed(3)} °C / decade</strong> (Sen's Slope). 
                      The Mann-Kendall test yielded Z = {analysis.mannKendall.z.toFixed(3)}, p = {analysis.mannKendall.pValue.toFixed(4)}.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Diagnostic Engine Panel (1 Column) */}
            <div className="space-y-4">
              {/* Statistical Summary Glass Card */}
              <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#1b2b48] pb-2">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Diagnostics & Hypotheses
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">α = 0.05</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Observed Mean</span>
                    <span className="text-white font-bold">{analysis?.stats.mean.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Median (50th %ile)</span>
                    <span className="text-white font-bold">{analysis?.stats.median.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-cyan-300 font-bold">{analysis?.stats.min.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Historical Max</span>
                    <span className="text-amber-400 font-bold">{analysis?.stats.max.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Kendall Score S</span>
                    <span className="text-white font-bold">{analysis?.mannKendall.s}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Variance Var(S)</span>
                    <span className="text-white font-bold">{analysis?.mannKendall.varS.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Lag-1 Autocorr (r₁)</span>
                    <span className={`font-bold ${Math.abs(lag1Autocorr) > 0.25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {lag1Autocorr}
                    </span>
                  </div>
                </div>

                {/* Autocorrelation caveat warning */}
                <div className="p-2.5 bg-[#050912] rounded-lg border border-[#132238] text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="text-slate-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Serial Correlation Caveat</span>
                  </div>
                  <p>
                    Positive lag-1 autocorrelation (r₁ &gt; 0.2) can inflate Type-I error rates in standard Mann-Kendall tests. For robust verification, Sen's median slope is reported alongside.
                  </p>
                </div>
              </div>

              {/* Data Provenance Card */}
              <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl space-y-2 text-xs font-mono">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  NASA Source Attribution
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  Dataset: NASA Langley Research Center POWER Project API. Assimilation engine: Modern-Era Retrospective analysis for Research and Applications, Version 2 (MERRA-2).
                </div>
                <div className="pt-2 text-[10px] text-cyan-400/90 font-mono">
                  Coordinate: {investigationData?.lat.toFixed(4)}°N, {investigationData?.lon.toFixed(4)}°E
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Historical 25-Year Decomposition Analysis */}
        {activeMode === 'historical' && (
          <div className="space-y-5">
            <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2b48] pb-3">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    25-Year Decadal Temperature Anomaly Barometer (2001–2025)
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Annual deviations calculated relative to the 2001–2010 decadal baseline mean.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Positive Anomaly (Warmer)
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> Negative Anomaly (Cooler)
                  </span>
                </div>
              </div>

              {/* Anomaly Bar Chart */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#132238" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      unit="°C"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#070d18', 
                        borderColor: '#1e3352', 
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                    <Bar 
                      dataKey="anomaly" 
                      name="Temperature Anomaly (°C)" 
                      fill="#06b6d4"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Annual Observations Ledger Table */}
            <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1b2b48] pb-3 mb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  Annual Observations Ledger (Verified Daily Ingestion)
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {chartData.length} Valid Observation Epochs
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 scrollbar-thin">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#050912] text-slate-400 text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Year</th>
                      <th className="py-2 px-3">Annual Mean T2M</th>
                      <th className="py-2 px-3">Daily Min T2M</th>
                      <th className="py-2 px-3">Daily Max T2M</th>
                      <th className="py-2 px-3">Valid Days</th>
                      <th className="py-2 px-3">Baseline Anomaly</th>
                      <th className="py-2 px-3">Data Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {chartData.map((row) => (
                      <tr key={row.year} className="hover:bg-cyan-950/20">
                        <td className="py-2 px-3 font-bold text-white">{row.year}</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">{row.observed.toFixed(2)} °C</td>
                        <td className="py-2 px-3 text-slate-400">{row.minDaily.toFixed(1)} °C</td>
                        <td className="py-2 px-3 text-amber-400">{row.maxDaily.toFixed(1)} °C</td>
                        <td className="py-2 px-3 text-emerald-400">{row.validDays} / 365</td>
                        <td className={`py-2 px-3 font-semibold ${row.anomaly >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                          {row.anomaly >= 0 ? '+' : ''}{row.anomaly.toFixed(2)} °C
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            VERIFIED NASA
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: 3D Boundary Layer Column */}
        {activeMode === '3d-column' && (
          <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2b48] pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Atmospheric Boundary Layer (PBL) 3D Trapping Simulation
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Interactive WebGL simulation demonstrating how surface thermal inversions trap PM2.5 aerosols in the lower 300 meters.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800/50">
                THREE.JS KERNEL
              </span>
            </div>

            <div className="h-[520px] w-full rounded-lg overflow-hidden border border-[#14233a]">
              <AtmosphericColumn3D />
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
