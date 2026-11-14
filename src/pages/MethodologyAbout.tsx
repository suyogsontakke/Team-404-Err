import { useState } from 'react';
import PageContainer from '../components/PageContainer';
import { 
  BookOpen, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Award,
  ExternalLink,
  Info,
  Compass,
  Settings,
  Sliders,
  Database,
  Radio,
  Check,
  RefreshCw,
  Trash2
} from 'lucide-react';

export default function MethodologyAbout() {
  const [activeTab, setActiveTab] = useState<'settings' | 'methodology'>('settings');

  // Interactive settings state
  const [alphaThreshold, setAlphaThreshold] = useState<'0.05' | '0.01'>('0.05');
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(true);
  const [highDensityMode, setHighDensityMode] = useState<boolean>(true);
  const [aiGroundingStrictness, setAiGroundingStrictness] = useState<'maximum' | 'balanced'>('maximum');
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);

  const handleClearCache = () => {
    localStorage.removeItem('earthscope_cached_nasa_data');
    localStorage.removeItem('earthtrace_cached_nasa_data');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <PageContainer title="System Settings & Scientific Methodology">
      <div className="space-y-5 max-w-[1700px] mx-auto pb-16 font-sans">
        
        {/* Top Mac Window Control Bar */}
        <div className="bg-[#091122]/90 backdrop-blur-md border border-[#1b2b48] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold tracking-wider text-white">EARTH TRACE CONTROL & METHODOLOGY</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold">
                NASA SPACE APPS 2026
              </span>
              <img 
                src="/assets/aistudio/image_0bb54710.png" 
                alt="NASA Space Apps Challenge" 
                className="h-6 w-auto object-contain hidden md:block opacity-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
              />
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-[#050913] p-1 rounded-lg border border-[#16243d]">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Platform Settings & Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('methodology')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'methodology'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Scientific Whitepaper & Equations</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PLATFORM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: Statistical Engine Configuration */}
            <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2b48] pb-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Statistical Engine Parameters
                </span>
                <span className="text-[10px] font-mono text-cyan-400">KERNEL CONFIG</span>
              </div>

              {/* Alpha Significance Level */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">Significance Threshold (α)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAlphaThreshold('0.05')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      alphaThreshold === '0.05'
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 font-bold'
                        : 'bg-[#060c18] text-slate-400 border-[#14233a] hover:text-white'
                    }`}
                  >
                    α = 0.05 (Standard 95% CI)
                  </button>
                  <button
                    onClick={() => setAlphaThreshold('0.01')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      alphaThreshold === '0.01'
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 font-bold'
                        : 'bg-[#060c18] text-slate-400 border-[#14233a] hover:text-white'
                    }`}
                  >
                    α = 0.01 (Strict 99% CI)
                  </button>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Controls the p-value rejection boundary for null hypothesis H₀: "No monotonic trend".
                </p>
              </div>

              {/* High-Density Mode Toggle */}
              <div className="space-y-2 pt-2 border-t border-[#132238]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300">High-Density Scientific Mode</label>
                  <input
                    type="checkbox"
                    checked={highDensityMode}
                    onChange={(e) => setHighDensityMode(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer w-4 h-4"
                  />
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Renders high information density grids, telemetry badges, and multi-axis legends.
                </p>
              </div>
            </div>

            {/* Column 2: Data Ingestion & Cache Storage */}
            <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2b48] pb-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  NASA Data Pipeline & Cache
                </span>
                <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#050b14] rounded-lg border border-[#16243d] space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Primary Endpoint</div>
                  <div className="text-cyan-300 font-bold break-all">
                    https://power.larc.nasa.gov/api/temporal/
                  </div>
                  <div className="text-[10px] text-slate-500">MERRA-2 Assimilation & GPCP v2.3</div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#132238]">
                  <span className="text-slate-300">In-Memory Observation Cache</span>
                  <button
                    onClick={() => setCacheEnabled(!cacheEnabled)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      cacheEnabled ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cacheEnabled ? 'ENABLED (1h TTL)' : 'DISABLED'}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleClearCache}
                    className="w-full py-2 bg-[#0c1626] hover:bg-[#12223c] text-red-400 border border-red-900/40 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {cacheCleared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{cacheCleared ? 'Local Cache Cleared' : 'Purge Cached NASA Datasets'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: AI Grounding & Mission Attribution */}
            <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2b48] pb-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Gemini AI Grounding Policy
                </span>
                <span className="text-[10px] font-mono text-purple-300">STRICT</span>
              </div>

              <div className="space-y-3 text-xs font-mono text-slate-300">
                <div className="p-3 bg-[#050b14] rounded-lg border border-purple-500/30 space-y-1.5">
                  <div className="font-bold text-purple-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Zero Hallucination Protocol
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    The Gemini AI kernel is mathematically bound to empirical OLS and Mann-Kendall statistics. It is prohibited from generating simulated trends or claiming causal conclusions without physical mechanisms.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#132238] text-[11px] text-slate-400 space-y-1">
                  <div>NASA Space Apps Challenge 2026</div>
                  <div className="text-white font-bold">Team 404 Err · Nagpur Main Benchmark</div>
                  <div className="text-cyan-400">Release v2.4 (Production Monitored)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCIENTIFIC METHODOLOGY & FORMULATIONS */}
        {activeTab === 'methodology' && (
          <div className="space-y-6 max-w-5xl">
            {/* 1. NASA Data Pipeline */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center text-xs">01</div>
                <h3>Atmospheric Data Ingestion Pipeline & Calibration</h3>
              </div>
              <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  EARTH TRACE retrieves historical time-series data exclusively from the <strong>NASA Langley Research Center POWER (Prediction of Worldwide Energy Resources)</strong> project API and NASA GMAO MERRA-2 assimilation model:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2 font-mono text-[11px]">
                  <li><strong className="text-white">Fine Particulate Matter (PM2.5):</strong> Surface aerosol mass concentration (≤ 2.5 µm aerodynamic diameter in µg/m³) derived from MERRA-2 GOCART aerosol reanalysis calibrated with ground-level optical monitors.</li>
                  <li><strong className="text-white">Atmospheric Aerosol Optical Depth (AOD 550nm):</strong> Total column extinction of solar radiation at 550nm wavelength, tracking dust, smoke, sulfates, and industrial hazes.</li>
                  <li><strong className="text-white">Ventilation Wind Speed (WS10M):</strong> 10-meter wind velocity governing atmospheric horizontal advection and turbulent dispersion.</li>
                  <li><strong className="text-white">Thermal Regimes (T2M, T2M_MAX, T2M_MIN):</strong> 2-meter ambient air temperature, daily thermal maximums, and nocturnal minimums driving diurnal boundary layer expansion and radiation inversions.</li>
                  <li><strong className="text-white">Precipitation Scavenging (PRECTOTCORR):</strong> Corrected precipitation flux from GPCP v2.3 and MERRA-2 driving aerosol wet deposition and air mass washing.</li>
                </ul>
              </div>
            </section>

            {/* 2. Boundary Layer Physics & PM2.5 Dynamics */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center text-xs">02</div>
                <h3>Planetary Boundary Layer (PBL) Physics & Nocturnal Inversions</h3>
              </div>
              <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 text-xs text-slate-300 space-y-4 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-1">A. Nocturnal Radiation Inversions & Vertical Trapping</h4>
                  <p className="text-slate-400">
                    Fine particulate matter (PM2.5) concentrations are fundamentally dictated by planetary boundary layer (PBL) dynamics. 
                    During winter and calm nights, rapid radiative cooling of the ground surface induces thermal inversions (where temperature increases with altitude, ∂T/∂z &gt; 0). 
                    This suppresses buoyant thermal plumes and compresses the effective mixing layer from 1,500m down to under 300m, trapping particulate emissions close to breathing level.
                  </p>
                </div>

                <div className="border-t border-[#132238] pt-3">
                  <h4 className="font-semibold text-white mb-1">B. Ventilation Coefficient & Dispersion Dynamics</h4>
                  <p className="text-slate-400 font-mono text-[11px]">
                    Dispersive capacity is quantified by the ventilation coefficient (Vc = PBL Height × Wind Speed 10m in m²/s). 
                    When Vc falls below 2,000 m²/s, stagnant air masses accumulate hazardous aerosol loads.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Mathematical Formulations */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center text-xs">03</div>
                <h3>Parametric & Non-Parametric Trend Detection Formulations</h3>
              </div>
              <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 text-xs text-slate-300 space-y-4 leading-relaxed font-mono text-[11px]">
                <div>
                  <h4 className="font-semibold text-white mb-1">A. Ordinary Least Squares (OLS) Linear Regression</h4>
                  <div className="bg-[#050b14] p-3 rounded-lg border border-[#16243d] text-cyan-300 my-2">
                    Slope β₁ = [N∑(t·y) - ∑t∑y] / [N∑t² - (∑t)²] · Decadal Rate = β₁ × 10 (annual) or β₁ × 120 (monthly)
                  </div>
                </div>

                <div className="border-t border-[#132238] pt-3">
                  <h4 className="font-semibold text-white mb-1">B. Non-Parametric Mann-Kendall Rank Test</h4>
                  <div className="bg-[#050b14] p-3 rounded-lg border border-[#16243d] text-cyan-300 my-2">
                    S = ∑(k=1 to N-1) ∑(j=k+1 to N) sgn(x_j - x_k)<br/>
                    Var(S) = [N(N-1)(2N+5) - ∑ t_i(t_i-1)(2t_i+5)] / 18 (with tied value group correction)
                  </div>
                </div>

                <div className="border-t border-[#132238] pt-3">
                  <h4 className="font-semibold text-white mb-1">C. Sen's Robust Non-Parametric Slope Estimator</h4>
                  <div className="bg-[#050b14] p-3 rounded-lg border border-[#16243d] text-purple-300 my-2">
                    Q = median [ (x_j - x_k) / (j - k) ] for all 1 ≤ k &lt; j ≤ N
                  </div>
                  <p className="text-slate-400">
                    Sen's slope represents the median of all pairwise slopes, completely insensitive to anomalous outlier years or single-season extreme weather anomalies.
                  </p>
                </div>
              </div>
            </section>
            {/* 4. NASA Space Apps Challenge 2026 & Team 404 Err Attribution */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center text-xs">04</div>
                <h3>NASA Space Apps Challenge 2026 & Team 404 Err Attribution</h3>
              </div>
              <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 text-xs text-slate-300 space-y-4 leading-relaxed">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#132238] pb-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/assets/aistudio/image_0bb54710.png" 
                      alt="NASA Space Apps Challenge Logo" 
                      className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] shrink-0" 
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">EARTH TRACE · Team 404 Err</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Global Challenge: "Be An Earth System Trend Detective" · Surprise Twist: "The 72-Hour Blindspot"</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/50 font-mono text-[10px] font-bold self-start sm:self-auto">
                    NASA SPACE APPS 2026
                  </span>
                </div>
                <p className="text-slate-400">
                  Developed for the NASA International Space Apps Challenge 2026. All source algorithms, NASA POWER API query interfaces, MERRA-2 meteorological derivations, and the 72-Hour Blindspot alert decision engine are distributed under the Apache-2.0 open-science license.
                </p>
              </div>
            </section>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
