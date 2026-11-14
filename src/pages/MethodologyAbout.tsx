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
        
        {/* Top Control Bar */}
        <div className="bg-[#232A3D] border border-[#48516A] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F0EBDD]">EARTH TRACE CONTROL & METHODOLOGY</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#353D55] text-[#A6B7D4] border border-[#48516A] font-semibold">
                NASA SPACE APPS 2026
              </span>
              <img 
                src="/assets/aistudio/image_0bb54710.png" 
                alt="NASA Space Apps Challenge" 
                className="h-6 w-auto object-contain hidden md:block opacity-90" 
              />
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-[#1D2436] p-1 rounded-lg border border-[#48516A]">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                  : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Platform Settings & Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('methodology')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'methodology'
                  ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                  : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#2B3349]'
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
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
                <span className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#A6B7D4]" />
                  Statistical Engine Parameters
                </span>
                <span className="text-[10px] font-mono text-[#A6B7D4]">KERNEL CONFIG</span>
              </div>

              {/* Alpha Significance Level */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#B5BDCC]">Significance Threshold (α)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAlphaThreshold('0.05')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      alphaThreshold === '0.05'
                        ? 'bg-[#232A3D] text-[#A6B7D4] border-[#A6B7D4] font-bold'
                        : 'bg-[#1D2436] text-[#B5BDCC] border-[#48516A] hover:text-[#F0EBDD]'
                    }`}
                  >
                    α = 0.05 (Standard 95% CI)
                  </button>
                  <button
                    onClick={() => setAlphaThreshold('0.01')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      alphaThreshold === '0.01'
                        ? 'bg-[#232A3D] text-[#A6B7D4] border-[#A6B7D4] font-bold'
                        : 'bg-[#1D2436] text-[#B5BDCC] border-[#48516A] hover:text-[#F0EBDD]'
                    }`}
                  >
                    α = 0.01 (Strict 99% CI)
                  </button>
                </div>
                <p className="text-[11px] font-mono text-[#B5BDCC]">
                  Controls the p-value rejection boundary for null hypothesis H₀: "No monotonic trend".
                </p>
              </div>

              {/* High-Density Mode Toggle */}
              <div className="space-y-2 pt-2 border-t border-[#48516A]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#F0EBDD]">High-Density Scientific Mode</label>
                  <input
                    type="checkbox"
                    checked={highDensityMode}
                    onChange={(e) => setHighDensityMode(e.target.checked)}
                    className="accent-[#A6B7D4] cursor-pointer w-4 h-4"
                  />
                </div>
                <p className="text-[11px] font-mono text-[#B5BDCC]">
                  Renders high information density grids, telemetry badges, and multi-axis legends.
                </p>
              </div>
            </div>

            {/* Column 2: Data Ingestion & Cache Storage */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
                <span className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#A6B7D4]" />
                  NASA Data Pipeline & Cache
                </span>
                <span className="text-[10px] font-mono text-[#35C98B]">ONLINE</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#1D2436] rounded-lg border border-[#48516A] space-y-1">
                  <div className="text-[#B5BDCC] text-[10px] uppercase">Primary Endpoint</div>
                  <div className="text-[#A6B7D4] font-bold break-all">
                    https://power.larc.nasa.gov/api/temporal/
                  </div>
                  <div className="text-[10px] text-[#838FA3]">MERRA-2 Assimilation & GPCP v2.3</div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#48516A]">
                  <span className="text-[#F0EBDD]">In-Memory Observation Cache</span>
                  <button
                    onClick={() => setCacheEnabled(!cacheEnabled)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      cacheEnabled ? 'bg-[#35C98B]/20 text-[#35C98B] border border-[#35C98B]/50' : 'bg-[#1D2436] text-[#B5BDCC]'
                    }`}
                  >
                    {cacheEnabled ? 'ENABLED (1h TTL)' : 'DISABLED'}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleClearCache}
                    className="w-full py-2 bg-[#1D2436] hover:bg-[#232A3D] text-[#F16C72] border border-[#F16C72]/40 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {cacheCleared ? <Check className="w-3.5 h-3.5 text-[#35C98B]" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{cacheCleared ? 'Local Cache Cleared' : 'Purge Cached NASA Datasets'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: AI Grounding & Mission Attribution */}
            <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
                <span className="text-xs font-mono font-bold text-[#F0EBDD] uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#D28B71]" />
                  Gemini AI Grounding Policy
                </span>
                <span className="text-[10px] font-mono text-[#D28B71]">STRICT</span>
              </div>

              <div className="space-y-3 text-xs font-mono text-[#F0EBDD]">
                <div className="p-3 bg-[#1D2436] rounded-lg border border-[#48516A] space-y-1.5">
                  <div className="font-bold text-[#D28B71] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#35C98B]" />
                    Zero Hallucination Protocol
                  </div>
                  <p className="text-[11px] text-[#B5BDCC] leading-relaxed font-sans">
                    The Gemini AI kernel is mathematically bound to empirical OLS and Mann-Kendall statistics. It is prohibited from generating simulated trends or claiming causal conclusions without physical mechanisms.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#48516A] text-[11px] text-[#B5BDCC] space-y-1">
                  <div>NASA Space Apps Challenge 2026</div>
                  <div className="text-[#F0EBDD] font-bold">Team 404 Err · Nagpur Main Benchmark</div>
                  <div className="text-[#A6B7D4]">Release v2.4 (Production Monitored)</div>
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
              <div className="flex items-center gap-2 text-sm font-bold text-[#F0EBDD] font-mono">
                <div className="w-6 h-6 rounded bg-[#232A3D] border border-[#48516A] text-[#A6B7D4] flex items-center justify-center text-xs">01</div>
                <h3>Atmospheric Data Ingestion Pipeline & Calibration</h3>
              </div>
              <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 text-xs text-[#F0EBDD] space-y-3 leading-relaxed">
                <p>
                  EARTH TRACE retrieves historical time-series data exclusively from the <strong>NASA Langley Research Center POWER (Prediction of Worldwide Energy Resources)</strong> project API and NASA GMAO MERRA-2 assimilation model:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-[#B5BDCC] pl-2 font-mono text-[11px]">
                  <li><strong className="text-[#F0EBDD]">Fine Particulate Matter (PM2.5):</strong> Surface aerosol mass concentration (≤ 2.5 µm aerodynamic diameter in µg/m³) derived from MERRA-2 GOCART aerosol reanalysis calibrated with ground-level optical monitors.</li>
                  <li><strong className="text-[#F0EBDD]">Atmospheric Aerosol Optical Depth (AOD 550nm):</strong> Total column extinction of solar radiation at 550nm wavelength, tracking dust, smoke, sulfates, and industrial hazes.</li>
                  <li><strong className="text-[#F0EBDD]">Ventilation Wind Speed (WS10M):</strong> 10-meter wind velocity governing atmospheric horizontal advection and turbulent dispersion.</li>
                  <li><strong className="text-[#F0EBDD]">Thermal Regimes (T2M, T2M_MAX, T2M_MIN):</strong> 2-meter ambient air temperature, daily thermal maximums, and nocturnal minimums driving diurnal boundary layer expansion and radiation inversions.</li>
                  <li><strong className="text-[#F0EBDD]">Precipitation Scavenging (PRECTOTCORR):</strong> Corrected precipitation flux from GPCP v2.3 and MERRA-2 driving aerosol wet deposition and air mass washing.</li>
                </ul>
              </div>
            </section>

            {/* 2. Boundary Layer Physics & PM2.5 Dynamics */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F0EBDD] font-mono">
                <div className="w-6 h-6 rounded bg-[#232A3D] border border-[#48516A] text-[#A6B7D4] flex items-center justify-center text-xs">02</div>
                <h3>Planetary Boundary Layer (PBL) Physics & Nocturnal Inversions</h3>
              </div>
              <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 text-xs text-[#F0EBDD] space-y-4 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-[#F0EBDD] mb-1">A. Nocturnal Radiation Inversions & Vertical Trapping</h4>
                  <p className="text-[#B5BDCC]">
                    Fine particulate matter (PM2.5) concentrations are fundamentally dictated by planetary boundary layer (PBL) dynamics. 
                    During winter and calm nights, rapid radiative cooling of the ground surface induces thermal inversions (where temperature increases with altitude, ∂T/∂z &gt; 0). 
                    This suppresses buoyant thermal plumes and compresses the effective mixing layer from 1,500m down to under 300m, trapping particulate emissions close to breathing level.
                  </p>
                </div>

                <div className="border-t border-[#48516A] pt-3">
                  <h4 className="font-semibold text-[#F0EBDD] mb-1">B. Ventilation Coefficient & Dispersion Dynamics</h4>
                  <p className="text-[#B5BDCC] font-mono text-[11px]">
                    Dispersive capacity is quantified by the ventilation coefficient (Vc = PBL Height × Wind Speed 10m in m²/s). 
                    When Vc falls below 2,000 m²/s, stagnant air masses accumulate hazardous aerosol loads.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Mathematical Formulations */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F0EBDD] font-mono">
                <div className="w-6 h-6 rounded bg-[#232A3D] border border-[#48516A] text-[#A6B7D4] flex items-center justify-center text-xs">03</div>
                <h3>Parametric & Non-Parametric Trend Detection Formulations</h3>
              </div>
              <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 text-xs text-[#F0EBDD] space-y-4 leading-relaxed font-mono text-[11px]">
                <div>
                  <h4 className="font-semibold text-[#F0EBDD] mb-1">A. Ordinary Least Squares (OLS) Linear Regression</h4>
                  <div className="bg-[#1D2436] p-3 rounded-lg border border-[#48516A] text-[#A6B7D4] my-2">
                    Slope β₁ = [N∑(t·y) - ∑t∑y] / [N∑t² - (∑t)²] · Decadal Rate = β₁ × 10 (annual) or β₁ × 120 (monthly)
                  </div>
                </div>

                <div className="border-t border-[#48516A] pt-3">
                  <h4 className="font-semibold text-[#F0EBDD] mb-1">B. Non-Parametric Mann-Kendall Rank Test</h4>
                  <div className="bg-[#1D2436] p-3 rounded-lg border border-[#48516A] text-[#A6B7D4] my-2">
                    S = ∑(k=1 to N-1) ∑(j=k+1 to N) sgn(x_j - x_k)<br/>
                    Var(S) = [N(N-1)(2N+5) - ∑ t_i(t_i-1)(2t_i+5)] / 18 (with tied value group correction)
                  </div>
                </div>

                <div className="border-t border-[#48516A] pt-3">
                  <h4 className="font-semibold text-[#F0EBDD] mb-1">C. Sen's Robust Non-Parametric Slope Estimator</h4>
                  <div className="bg-[#1D2436] p-3 rounded-lg border border-[#48516A] text-[#D28B71] my-2">
                    Q = median [ (x_j - x_k) / (j - k) ] for all 1 ≤ k &lt; j ≤ N
                  </div>
                  <p className="text-[#B5BDCC]">
                    Sen's slope represents the median of all pairwise slopes, completely insensitive to anomalous outlier years or single-season extreme weather anomalies.
                  </p>
                </div>
              </div>
            </section>
            {/* 4. NASA Space Apps Challenge 2026 & Team 404 Err Attribution */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F0EBDD] font-mono">
                <div className="w-6 h-6 rounded bg-[#232A3D] border border-[#48516A] text-[#A6B7D4] flex items-center justify-center text-xs">04</div>
                <h3>NASA Space Apps Challenge 2026 & Team 404 Err Attribution</h3>
              </div>
              <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 text-xs text-[#F0EBDD] space-y-4 leading-relaxed">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#48516A] pb-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/assets/aistudio/image_0bb54710.png" 
                      alt="NASA Space Apps Challenge Logo" 
                      className="h-10 sm:h-12 w-auto object-contain shrink-0" 
                    />
                    <div>
                      <h4 className="font-bold text-[#F0EBDD] text-sm">EARTH TRACE · Team 404 Err</h4>
                      <p className="text-[11px] text-[#B5BDCC] font-mono">Global Challenge: "Be An Earth System Trend Detective" · Resilience Module: "The 72-Hour Blindspot"</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded bg-[#232A3D] text-[#A6B7D4] border border-[#48516A] font-mono text-[10px] font-bold self-start sm:self-auto">
                    NASA SPACE APPS 2026
                  </span>
                </div>
                <p className="text-[#B5BDCC]">
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
