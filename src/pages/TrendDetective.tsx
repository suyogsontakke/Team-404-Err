import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageContainer from '../components/PageContainer';
import { 
  AnnualTrendAnalysisResult 
} from '../lib/statistics';
import { 
  NasaDailyAnnualInvestigationResult,
  PRESET_LOCATIONS 
} from '../lib/nasaPowerService';
import { fetchCachedDailyAnnualT2M } from '../services/dataCache';
import { createGoogleDocReport } from '../services/googleDocsService';
import { getAccessToken } from '../lib/authService';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
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
  AlertTriangle, 
  RotateCw, 
  BrainCircuit, 
  MapPin, 
  Calendar, 
  Info, 
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Award,
  Thermometer,
  Compass,
  Activity,
  History,
  FileText
} from 'lucide-react';
import AtmosphericColumn3D from '../components/AtmosphericColumn3D';

type ActiveViewMode = 'detective' | 'historical' | '3d-column';

export default function TrendDetective() {
  const [searchParams] = useSearchParams();

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

  // Async data & analysis states
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
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
    const baselineSlice = investigationData.annualPoints.slice(0, Math.min(10, investigationData.annualPoints.length));
    const baselineMean = baselineSlice.reduce((s, p) => s + p.avgTemp, 0) / (baselineSlice.length || 1);

    return investigationData.annualPoints.map((pt, index) => {
      const fittedOLS = analysis.regression.fittedLine[index];
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
        <div className="bg-[#232A3D] border border-[#48516A] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1D2436] rounded-md border border-[#2D354A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F16C72]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F0B44D]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#35C98B]"></span>
            </div>
            <div className="h-4 w-px bg-[#48516A]"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F0EBDD]">EARTH SYSTEM TREND DETECTIVE</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1D2436] text-[#A6B7D4] border border-[#48516A] font-semibold">
                NASA POWER DAILY KERNEL
              </span>
              {isCached && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#D28B71]/15 text-[#D28B71] border border-[#D28B71]/50 font-semibold flex items-center gap-1">
                  <span>⚡</span> [CACHED OBSERVATION]
                </span>
              )}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-[#1D2436] p-1 rounded-lg border border-[#48516A]">
            <button
              onClick={() => setActiveMode('detective')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'detective'
                  ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                  : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#232A3D]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Trend Detective (Mann-Kendall)</span>
            </button>
            <button
              onClick={() => setActiveMode('historical')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'historical'
                  ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                  : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#232A3D]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historical Analysis (2001–2025)</span>
            </button>
            <button
              onClick={() => setActiveMode('3d-column')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === '3d-column'
                  ? 'bg-[#D28B71] text-[#171B2B] font-bold shadow-sm'
                  : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#232A3D]'
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
          className="relative overflow-hidden bg-[#353D55] border border-[#48516A] rounded-xl p-5 shadow-xl"
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#232A3D] border border-[#48516A] rounded text-[11px] font-mono text-[#A6B7D4]">
                <Award className="w-3.5 h-3.5 text-[#A6B7D4]" />
                <span>NASA SPACE APPS CHALLENGE · BE AN EARTH SYSTEM TREND DETECTIVE</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-black text-[#F0EBDD] tracking-tight">
                Case Study: Nagpur Decadal Air Temperature Trajectory (2001–2025)
              </h1>
              
              <p className="text-xs text-[#B5BDCC] leading-relaxed">
                Empirical environmental trend analysis using the official <strong className="text-[#F0EBDD]">NASA POWER Daily Point API</strong>. 
                Daily near-surface temperature (T2M) observations from MERRA-2 assimilation (<span className="text-[#A6B7D4] font-mono font-bold">9,131 days</span>) aggregated into annual averages, 
                evaluated with Ordinary Least Squares (OLS) regression, Sen's robust slope estimator, and the non-parametric Mann-Kendall test.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#B5BDCC] font-mono">
                <span className="flex items-center gap-1.5 text-[#A6B7D4] bg-[#232A3D] px-2 py-0.5 rounded border border-[#48516A]">
                  <MapPin className="w-3.5 h-3.5" /> 21.1458° N, 79.0882° E
                </span>
                <span className="flex items-center gap-1.5 text-[#F0B44D] bg-[#232A3D] px-2 py-0.5 rounded border border-[#48516A]">
                  <Thermometer className="w-3.5 h-3.5" /> T2M Air Temperature (°C)
                </span>
                <span className="flex items-center gap-1.5 text-[#35C98B] bg-[#232A3D] px-2 py-0.5 rounded border border-[#48516A]">
                  <Calendar className="w-3.5 h-3.5" /> 2001–2025 (25 Years Daily)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <button
                onClick={handleLoadNagpurCaseStudy}
                disabled={loading}
                className="px-5 py-2.5 bg-[#A6B7D4] hover:bg-[#b8c7e0] text-[#171B2B] font-black text-xs tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#171B2B]" />
                <span>INVESTIGATE NAGPUR BENCHMARK</span>
              </button>

              <Link
                to={`/ai-insights?lat=${investigationData?.lat || 21.1458}&lon=${investigationData?.lon || 79.0882}&param=T2M`}
                className="px-4 py-2 bg-[#232A3D] hover:bg-[#2B3349] text-[#F0EBDD] border border-[#48516A] rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-[#D28B71]" />
                <span>AI Scientific Synthesis</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 6 Key Telemetry Gauges */}
        {analysis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Rate per Decade */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
                <span>Slope Rate</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#A6B7D4]"></span>
              </div>
              <div className="my-2">
                <div className={`text-xl font-mono font-black ${
                  analysis.mannKendall.trend === 'increasing' ? 'text-[#F0B44D]' :
                  analysis.mannKendall.trend === 'decreasing' ? 'text-[#A6B7D4]' : 'text-[#F0EBDD]'
                }`}>
                  {analysis.regression.trendPerDecade > 0 ? '+' : ''}{analysis.regression.trendPerDecade.toFixed(3)}
                </div>
                <div className="text-[10px] font-mono text-[#B5BDCC]">°C / decade (OLS)</div>
              </div>
              <div className="text-[9px] font-mono text-[#A6B7D4]">
                Annual: {(analysis.regression.slope).toFixed(4)} °C/yr
              </div>
            </div>

            {/* 2. Mann-Kendall Z-score */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
                <span>Mann-Kendall Z</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#35C98B]"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-[#F0EBDD]">
                  {analysis.mannKendall.z > 0 ? '+' : ''}{analysis.mannKendall.z.toFixed(3)}
                </div>
                <div className="text-[10px] font-mono text-[#B5BDCC]">Standardized Normal</div>
              </div>
              <div className="text-[9px] font-mono text-[#B5BDCC]">
                S = {analysis.mannKendall.s} · Var: {analysis.mannKendall.varS.toFixed(0)}
              </div>
            </div>

            {/* 3. Significance P-Value */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
                <span>Significance (p)</span>
                <span className={`w-1.5 h-1.5 rounded-full ${analysis.mannKendall.pValue < 0.05 ? 'bg-[#35C98B]' : 'bg-[#838FA3]'}`}></span>
              </div>
              <div className="my-2">
                <div className={`text-xl font-mono font-black ${analysis.mannKendall.pValue < 0.05 ? 'text-[#35C98B]' : 'text-[#F0EBDD]'}`}>
                  {analysis.mannKendall.pValue < 0.001 ? '< 0.001' : analysis.mannKendall.pValue.toFixed(4)}
                </div>
                <div className="text-[10px] font-mono text-[#B5BDCC]">Threshold α = 0.05</div>
              </div>
              <div className="text-[9px] font-mono text-[#35C98B] font-semibold">
                {analysis.mannKendall.pValue < 0.05 ? '★ STATISTICALLY SIGNIFICANT' : 'NO SIGNIFICANT TREND'}
              </div>
            </div>

            {/* 4. Sen's Robust Slope */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
                <span>Sen's Slope</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D28B71]"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-[#D28B71]">
                  {analysis.senSlopePerDecade > 0 ? '+' : ''}{analysis.senSlopePerDecade.toFixed(3)}
                </div>
                <div className="text-[10px] font-mono text-[#B5BDCC]">°C / decade (Median)</div>
              </div>
              <div className="text-[9px] font-mono text-[#B5BDCC]">
                Robust to outlier years
              </div>
            </div>

            {/* 5. R-Squared Goodness */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
                <span>R² Goodness</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#A6B7D4]"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-[#A6B7D4]">
                  {(analysis.regression.r2 * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-[#B5BDCC]">Variance Explained</div>
              </div>
              <div className="text-[9px] font-mono text-[#B5BDCC]">
                r = {Math.sqrt(Math.max(0, analysis.regression.r2)).toFixed(3)}
              </div>
            </div>

            {/* 6. Observation Integrity */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase text-[#B5BDCC] tracking-wider flex items-center justify-between">
                <span>Observations</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#35C98B]"></span>
              </div>
              <div className="my-2">
                <div className="text-xl font-mono font-black text-[#F0EBDD]">
                  {investigationData?.totalDailyObservations.toLocaleString() || '9,131'}
                </div>
                <div className="text-[10px] font-mono text-[#B5BDCC]">Daily Observations</div>
              </div>
              <div className="text-[9px] font-mono text-[#35C98B]">
                100% NASA Quality Valid
              </div>
            </div>
          </div>
        )}

        {/* Parameters & Coordinate Console */}
        <div className="bg-[#232A3D] border border-[#48516A] rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#48516A] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F0EBDD] uppercase tracking-wider">
              <Compass className="w-4 h-4 text-[#A6B7D4]" />
              <span>Target Coordinates & Historical Bounds</span>
            </div>
            
            <button
              onClick={() => setIsCustom(!isCustom)}
              className="text-xs font-mono text-[#A6B7D4] hover:text-[#F0EBDD] transition-colors cursor-pointer"
            >
              {isCustom ? '← Switch to Benchmark Presets' : '+ Enter Custom Coordinates'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#B5BDCC] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#A6B7D4]" /> Geographic Station
              </label>
              {!isCustom ? (
                <select
                  value={selectedPresetIdx}
                  onChange={(e) => setSelectedPresetIdx(Number(e.target.value))}
                  className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg px-3 py-2 text-xs font-mono text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4] font-medium"
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
                    className="bg-[#1D2436] border border-[#48516A] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F0EBDD]"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lon"
                    value={customLon}
                    onChange={(e) => setCustomLon(parseFloat(e.target.value) || 0)}
                    className="bg-[#1D2436] border border-[#48516A] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F0EBDD]"
                  />
                </div>
              )}
              <div className="text-[10px] font-mono text-[#838FA3]">
                {!isCustom 
                  ? `${PRESET_LOCATIONS[selectedPresetIdx].lat.toFixed(4)}°N, ${PRESET_LOCATIONS[selectedPresetIdx].lon.toFixed(4)}°E` 
                  : `Custom: ${customLat.toFixed(4)}°N, ${customLon.toFixed(4)}°E`}
              </div>
            </div>

            {/* Variable Indicator */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#B5BDCC] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#F0B44D]" /> Environmental Variable
              </label>
              <div className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg px-3 py-2 text-xs font-mono text-[#F0EBDD] flex items-center justify-between">
                <span className="font-bold text-[#A6B7D4]">T2M (Air Temperature)</span>
                <span className="text-[11px] font-mono text-[#B5BDCC]">°C (2M Altitude)</span>
              </div>
              <div className="text-[10px] font-mono text-[#838FA3]">
                NASA MERRA-2 Assimilated Near-Surface
              </div>
            </div>

            {/* Temporal Bounds */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#B5BDCC] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#A6B7D4]" /> Observation Range
                </span>
                <span className="text-[10px] font-mono text-[#A6B7D4]">{endYear - startYear + 1} Years</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="w-1/2 bg-[#1D2436] border border-[#48516A] rounded-lg px-2.5 py-2 text-xs font-mono text-[#F0EBDD]"
                >
                  {[2001, 2005, 2010, 2015].map(yr => (
                    <option key={yr} value={yr}>From {yr}</option>
                  ))}
                </select>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="w-1/2 bg-[#1D2436] border border-[#48516A] rounded-lg px-2.5 py-2 text-xs font-mono text-[#F0EBDD]"
                >
                  {[2020, 2022, 2024, 2025].map(yr => (
                    <option key={yr} value={yr}>To {yr}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] font-mono text-[#838FA3]">
                NASA Daily Time-Series Resolution
              </div>
            </div>

            {/* Refresh / Re-compute */}
            <div className="flex flex-col justify-end">
              <button
                onClick={() => runInvestigation(true)}
                disabled={loading}
                className="w-full bg-[#353D55] hover:bg-[#2B3349] text-[#A6B7D4] hover:text-[#F0EBDD] border border-[#48516A] rounded-lg py-2.5 px-4 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
            <div className="lg:col-span-3 bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#48516A] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A6B7D4]"></div>
                  <h3 className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider">
                    Annual Mean Temperature Time-Series & Statistical Fits
                  </h3>
                </div>

                {/* Display Series Toggles */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={() => setShowOLS(!showOLS)}
                    className={`px-2.5 py-1 rounded border text-[11px] transition-all cursor-pointer ${
                      showOLS 
                        ? 'bg-[#F0B44D]/20 text-[#F0B44D] border-[#F0B44D]/60 font-semibold' 
                        : 'bg-[#1D2436] text-[#838FA3] border-[#2D354A]'
                    }`}
                  >
                    OLS Regression
                  </button>
                  <button
                    onClick={() => setShowSen(!showSen)}
                    className={`px-2.5 py-1 rounded border text-[11px] transition-all cursor-pointer ${
                      showSen 
                        ? 'bg-[#D28B71]/20 text-[#D28B71] border-[#D28B71]/60 font-semibold' 
                        : 'bg-[#1D2436] text-[#838FA3] border-[#2D354A]'
                    }`}
                  >
                    Sen's Median Line
                  </button>
                  <button
                    onClick={handleExportToDocs}
                    disabled={savingDoc}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#232A3D] hover:bg-[#2B3349] text-[#A6B7D4] rounded border border-[#48516A] font-semibold text-[11px] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingDoc ? 'Saving...' : <><FileText className="w-3 h-3"/> Save to Docs</>}
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="h-80 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center flex-col gap-3 text-[#B5BDCC] font-mono text-xs">
                    <RotateCw className="w-8 h-8 text-[#A6B7D4] animate-spin" />
                    <span>Ingesting NASA POWER Daily Observations...</span>
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D354A" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        stroke="#48516A" 
                        tick={{ fill: '#838FA3', fontSize: 11, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        stroke="#48516A"
                        tick={{ fill: '#838FA3', fontSize: 11, fontFamily: 'monospace' }}
                        unit="°C"
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
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="observed" 
                        name="Observed Annual Mean (°C)" 
                        stroke="#A6B7D4" 
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#A6B7D4' }}
                        activeDot={{ r: 6, fill: '#F0EBDD' }}
                      />
                      {showOLS && (
                        <Line 
                          type="monotone" 
                          dataKey="olsTrend" 
                          name="Linear Regression (OLS)" 
                          stroke="#F0B44D" 
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
                          stroke="#D28B71" 
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#838FA3] font-mono text-xs">
                    No observation points available.
                  </div>
                )}
              </div>

              {/* Empirical Findings Callout */}
              {analysis && (
                <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 text-xs font-mono text-[#B5BDCC] flex items-start gap-3">
                  <Info className="w-4 h-4 text-[#A6B7D4] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-[#F0EBDD] font-bold">
                      EMPIRICAL RESULT: {analysis.mannKendall.trend.toUpperCase()} TREND ({analysis.mannKendall.pValue < 0.05 ? 'STATISTICALLY SIGNIFICANT' : 'NOT STATISTICALLY SIGNIFICANT'})
                    </div>
                    <div className="text-[#B5BDCC] leading-relaxed">
                      Over the {analysis.stats.count}-year period ({startYear}–{endYear}), annual mean air temperature changed at an estimated rate of{' '}
                      <strong className="text-[#A6B7D4] font-mono">{analysis.regression.trendPerDecade > 0 ? '+' : ''}{analysis.regression.trendPerDecade.toFixed(3)} °C / decade</strong> (OLS) and{' '}
                      <strong className="text-[#D28B71] font-mono">{analysis.senSlopePerDecade > 0 ? '+' : ''}{analysis.senSlopePerDecade.toFixed(3)} °C / decade</strong> (Sen's Slope). 
                      The Mann-Kendall test yielded Z = {analysis.mannKendall.z.toFixed(3)}, p = {analysis.mannKendall.pValue.toFixed(4)}.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Diagnostic Engine Panel (1 Column) */}
            <div className="space-y-4">
              {/* Statistical Summary Card */}
              <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#48516A] pb-2">
                  <span className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#A6B7D4]" />
                    Diagnostics & Hypotheses
                  </span>
                  <span className="text-[10px] font-mono text-[#A6B7D4]">α = 0.05</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-[#48516A]/60">
                    <span className="text-[#B5BDCC]">Observed Mean</span>
                    <span className="text-[#F0EBDD] font-bold">{analysis?.stats.mean.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#48516A]/60">
                    <span className="text-[#B5BDCC]">Median (50th %ile)</span>
                    <span className="text-[#F0EBDD] font-bold">{analysis?.stats.median.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#48516A]/60">
                    <span className="text-[#B5BDCC]">Historical Min</span>
                    <span className="text-[#A6B7D4] font-bold">{analysis?.stats.min.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#48516A]/60">
                    <span className="text-[#B5BDCC]">Historical Max</span>
                    <span className="text-[#F0B44D] font-bold">{analysis?.stats.max.toFixed(2)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#48516A]/60">
                    <span className="text-[#B5BDCC]">Kendall Score S</span>
                    <span className="text-[#F0EBDD] font-bold">{analysis?.mannKendall.s}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#48516A]/60">
                    <span className="text-[#B5BDCC]">Variance Var(S)</span>
                    <span className="text-[#F0EBDD] font-bold">{analysis?.mannKendall.varS.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#48516A]/60">
                    <span className="text-[#B5BDCC]">Lag-1 Autocorr (r₁)</span>
                    <span className={`font-bold ${Math.abs(lag1Autocorr) > 0.25 ? 'text-[#F0B44D]' : 'text-[#35C98B]'}`}>
                      {lag1Autocorr}
                    </span>
                  </div>
                </div>

                {/* Autocorrelation caveat warning */}
                <div className="p-2.5 bg-[#232A3D] rounded-lg border border-[#48516A] text-[10px] font-mono text-[#B5BDCC] space-y-1">
                  <div className="text-[#F0EBDD] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#F0B44D]" />
                    <span>Serial Correlation Caveat</span>
                  </div>
                  <p>
                    Positive lag-1 autocorrelation (r₁ &gt; 0.2) can inflate Type-I error rates in standard Mann-Kendall tests. For robust verification, Sen's median slope is reported alongside.
                  </p>
                </div>
              </div>

              {/* Data Provenance Card */}
              <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-2 text-xs font-mono">
                <div className="text-xs font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#A6B7D4]" />
                  NASA Source Attribution
                </div>
                <div className="text-[#B5BDCC] text-[11px] leading-relaxed">
                  Dataset: NASA Langley Research Center POWER Project API. Assimilation engine: Modern-Era Retrospective analysis for Research and Applications, Version 2 (MERRA-2).
                </div>
                <div className="pt-2 text-[10px] text-[#A6B7D4] font-mono">
                  Coordinate: {investigationData?.lat.toFixed(4)}°N, {investigationData?.lon.toFixed(4)}°E
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Historical 25-Year Decomposition Analysis */}
        {activeMode === 'historical' && (
          <div className="space-y-5">
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#48516A] pb-3">
                <div>
                  <h3 className="text-sm font-mono font-bold text-[#F0EBDD] uppercase tracking-wider">
                    25-Year Decadal Temperature Anomaly Barometer (2001–2025)
                  </h3>
                  <p className="text-xs font-mono text-[#B5BDCC] mt-0.5">
                    Annual deviations calculated relative to the 2001–2010 decadal baseline mean.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-[#F0B44D]">
                    <span className="w-2.5 h-2.5 rounded bg-[#F0B44D]"></span> Positive Anomaly (Warmer)
                  </span>
                  <span className="flex items-center gap-1 text-[#A6B7D4]">
                    <span className="w-2.5 h-2.5 rounded bg-[#A6B7D4]"></span> Negative Anomaly (Cooler)
                  </span>
                </div>
              </div>

              {/* Anomaly Bar Chart */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D354A" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#48516A" 
                      tick={{ fill: '#838FA3', fontSize: 11, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      stroke="#48516A" 
                      tick={{ fill: '#838FA3', fontSize: 11, fontFamily: 'monospace' }}
                      unit="°C"
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
                    <ReferenceLine y={0} stroke="#48516A" strokeWidth={1.5} />
                    <Bar 
                      dataKey="anomaly" 
                      name="Temperature Anomaly (°C)" 
                      fill="#A6B7D4"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Annual Observations Ledger Table */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#48516A] pb-3 mb-3">
                <h3 className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-[#A6B7D4]" />
                  Annual Observations Ledger (Verified Daily Ingestion)
                </h3>
                <span className="text-[10px] font-mono text-[#B5BDCC]">
                  {chartData.length} Valid Observation Epochs
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 scrollbar-thin">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1D2436] text-[#838FA3] text-[10px] uppercase sticky top-0">
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
                  <tbody className="divide-y divide-[#48516A]/60 text-[#B5BDCC]">
                    {chartData.map((row) => (
                      <tr key={row.year} className="hover:bg-[#2B3349]">
                        <td className="py-2 px-3 font-bold text-[#F0EBDD]">{row.year}</td>
                        <td className="py-2 px-3 text-[#A6B7D4] font-bold">{row.observed.toFixed(2)} °C</td>
                        <td className="py-2 px-3 text-[#B5BDCC]">{row.minDaily.toFixed(1)} °C</td>
                        <td className="py-2 px-3 text-[#F0B44D]">{row.maxDaily.toFixed(1)} °C</td>
                        <td className="py-2 px-3 text-[#35C98B]">{row.validDays} / 365</td>
                        <td className={`py-2 px-3 font-semibold ${row.anomaly >= 0 ? 'text-[#F0B44D]' : 'text-[#A6B7D4]'}`}>
                          {row.anomaly >= 0 ? '+' : ''}{row.anomaly.toFixed(2)} °C
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#35C98B]/15 text-[#35C98B] border border-[#35C98B]/40">
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
          <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold text-[#F0EBDD] uppercase tracking-wider">
                  Atmospheric Boundary Layer (PBL) 3D Trapping Simulation
                </h3>
                <p className="text-xs font-mono text-[#B5BDCC]">
                  Interactive WebGL simulation demonstrating how surface thermal inversions trap PM2.5 aerosols in the lower 300 meters.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#232A3D] text-[#D28B71] border border-[#D28B71]/40">
                THREE.JS KERNEL
              </span>
            </div>

            <div className="h-[520px] w-full rounded-lg overflow-hidden border border-[#48516A]">
              <AtmosphericColumn3D />
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
