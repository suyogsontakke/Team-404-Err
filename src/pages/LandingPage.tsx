import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Search, 
  BrainCircuit, 
  ArrowRight, 
  Database, 
  Wind, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  CloudRain,
  Radar,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  Zap,
  Info,
  ShieldAlert,
  Compass,
  FileText,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import AtmosphericGlobe3D from '../components/AtmosphericGlobe3D';
import AtmosphericColumn3D from '../components/AtmosphericColumn3D';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'mission' | 'architecture' | 'team'>('mission');

  // 4 Featured Cards requested in Section 9
  const mainFeatureCards = [
    {
      id: 'earth-explorer',
      title: 'Earth Explorer',
      path: '/earth-explorer',
      icon: Globe,
      badge: 'INTERACTIVE MAP',
      color: 'border-[#48516A] text-[#A6B7D4]',
      glow: '',
      desc: 'Interactive 2D/3D world visualization for sampling surface temperatures, precipitation, soil moisture, vegetation indices, and regional microclimates with real NASA observation backing.',
      features: ['Interactive 3D Globe & 2D Canvas', 'Coordinate Probe Sampling', 'Environmental Layer Controls', 'Historical Data Timeline']
    },
    {
      id: 'blindspot',
      title: '72-Hour Blindspot',
      path: '/blindspot',
      icon: Radar,
      badge: 'SIMULATION ENGINE',
      color: 'border-[#F0B44D]/40 text-[#F0B44D]',
      glow: '',
      desc: 'Disciplined latency decision engine simulating 0h to 72h observation dropouts. Calculates data completeness, confidence tiers, and prevents false alarm disaster panic.',
      features: ['0h–72h Delay Scrubber', 'Data Completeness Index', 'What We Know / Need Matrix', 'Alert Decision Protocol']
    },
    {
      id: 'disaster-watch',
      title: 'Global Disaster Watch',
      path: '/disaster-watch',
      icon: ShieldAlert,
      badge: 'WORLD HAZARDS',
      color: 'border-[#F16C72]/40 text-[#F16C72]',
      glow: '',
      desc: 'Worldwide environmental risk monitoring integrating GDACS multi-hazard alerts, INFORM Risk Index, EM-DAT disaster history, and NASA FIRMS fire telemetry.',
      features: ['INFORM Risk Ratings', 'GDACS Real-Time Alerts', 'EM-DAT Historical Records', 'Hazard Category Filters']
    },
    {
      id: 'ai-insights',
      title: 'AI Earth Intelligence',
      path: '/ai-insights',
      icon: BrainCircuit,
      badge: 'GEMINI AI',
      color: 'border-[#D28B71]/40 text-[#D28B71]',
      glow: '',
      desc: 'Grounded Gemini AI assistant translating statistical p-values, trends, country risk profiles, and data gaps into plain-language scientific explanations.',
      features: ['Empirical Result Grounding', 'Country Hazard Explanations', 'Disaster Pattern Analysis', 'Data Limitation Boundary']
    }
  ];

  const allSections = [
    ...mainFeatureCards,
    {
      id: 'dashboard',
      title: 'Overview Cockpit Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: 'COCKPIT',
      color: 'border-[#48516A] text-[#A6B7D4]',
      glow: '',
      desc: 'Mission control overview dashboard with interactive map, multi-layer toggles, 25-year timeline playback, and real-time telemetry gauges.',
      features: ['Interactive Global Map', 'Timeline Playback', 'Telemetry Gauges', 'AI Co-Pilot Bar']
    },
    {
      id: 'variable-explorer',
      title: 'Environmental Layers Deck',
      path: '/variable-explorer',
      icon: Layers,
      badge: 'LAYERS',
      color: 'border-[#48516A] text-[#A6B7D4]',
      glow: '',
      desc: 'Multi-layer spectral inspector for Surface Temperature, Precipitation, NDVI, Soil Moisture, Ocean Temp, PM2.5, and Aerosol Optical Depth.',
      features: ['Opacity & Spectral Controls', 'Physical Units & Definitions', 'Sensor Lineage', 'Atmospheric Physics']
    },
    {
      id: 'trend-detective',
      title: 'Trend Detective Engine',
      path: '/trend-detective',
      icon: Search,
      badge: 'STATISTICS',
      color: 'border-[#48516A] text-[#A6B7D4]',
      glow: '',
      desc: 'Non-parametric Mann-Kendall rank correlation test with tied variance corrections, Sen’s median slope estimator, and OLS trajectory calculations.',
      features: ['Mann-Kendall Test', 'Sen’s Non-Parametric Slope', 'Decadal Change Rate', '95% Confidence Bounds']
    },
    {
      id: 'reports',
      title: 'Reports & Data Dossiers',
      path: '/reports',
      icon: FileText,
      badge: 'EXPORTS',
      color: 'border-[#35C98B]/40 text-[#35C98B]',
      glow: '',
      desc: 'Publication-ready technical memorandums, PDF formats, high-resolution chart graphics, and RFC-4180 CSV dataset exports.',
      features: ['Technical Memo Export', 'High-Res Graphics', 'RFC-4180 CSV Download', 'Citation Key']
    }
  ];

  return (
    <div className="min-h-screen bg-[#171B2B] text-[#F0EBDD] flex flex-col justify-between selection:bg-[#A6B7D4]/20 selection:text-[#F0EBDD] font-sans bg-scientific-grid">
      
      {/* Top Editorial Header */}
      <header className="border-b border-[#48516A] bg-[#171B2B]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/assets/aistudio/image_eed5d808.png" 
                alt="EARTH TRACE Logo" 
                className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-[#F0EBDD] tracking-wider font-space">EARTH TRACE</span>
                  <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-[#232A3D] text-[#A6B7D4] border border-[#48516A] font-bold">
                    NASA 2026
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#B5BDCC] tracking-widest uppercase hidden md:block">
                  SPACE-TECH EARTH INTELLIGENCE
                </span>
              </div>
            </Link>

            {/* Official NASA Space Apps Challenge Partner Logo */}
            <div className="h-7 w-px bg-[#48516A] hidden sm:block"></div>
            <img 
              src="/assets/aistudio/image_0bb54710.png" 
              alt="NASA Space Apps Challenge" 
              className="h-6 sm:h-7 w-auto object-contain hidden sm:block opacity-90 hover:opacity-100 transition-opacity" 
            />
          </div>

          {/* Quick Section Nav Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-mono text-[#B5BDCC]">
            <Link to="/dashboard" className="hover:text-[#F0EBDD] transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5 text-[#A6B7D4]" />
              <span>Overview</span>
            </Link>
            <Link to="/earth-explorer" className="hover:text-[#F0EBDD] transition-colors">Explorer</Link>
            <Link 
              to="/disaster-watch" 
              className="px-2.5 py-1 rounded-lg bg-[#F16C72]/15 text-[#F16C72] border border-[#F16C72]/40 hover:bg-[#F16C72]/25 transition-colors flex items-center gap-1 font-bold"
            >
              <ShieldAlert className="w-3 h-3 text-[#F16C72]" />
              <span>Disaster Watch</span>
            </Link>
            <Link to="/trend-detective" className="hover:text-[#F0EBDD] transition-colors">Trend Detective</Link>
            <Link 
              to="/blindspot" 
              className="px-2.5 py-1 rounded-lg bg-[#F0B44D]/15 text-[#F0B44D] border border-[#F0B44D]/40 hover:bg-[#F0B44D]/25 transition-colors flex items-center gap-1 font-bold"
            >
              <Radar className="w-3 h-3 text-[#F0B44D]" />
              <span>72h Blindspot</span>
            </Link>
            <Link to="/ai-insights" className="hover:text-[#F0EBDD] transition-colors flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5 text-[#D28B71]" />
              <span>AI Intelligence</span>
            </Link>
          </nav>

          {/* Direct CTA */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/earth-explorer"
              className="px-4 py-2 text-xs font-bold text-[#171B2B] bg-[#A6B7D4] hover:bg-[#B8C6DF] rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer font-mono"
            >
              <span>EXPLORE EARTH</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#171B2B]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-20 flex-1 w-full">
        
        {/* ======================================================== */}
        {/* HERO SECTION: SEE A BRIGHTER PLANET (Section 9 Requirement) */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          
          {/* Left Column: Headline & Action Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6"
          >
            
            {/* NASA Space Apps Partner Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <img 
                src="/assets/aistudio/image_0bb54710.png" 
                alt="NASA Space Apps Challenge Logo" 
                className="h-10 sm:h-12 w-auto object-contain shrink-0" 
              />
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="px-3 py-1 rounded bg-[#232A3D] border border-[#48516A] text-[#A6B7D4] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A6B7D4]"></span>
                  NASA Space Apps Challenge 2026
                </span>
                <span className="px-3 py-1 rounded bg-[#1D2436] border border-[#48516A] text-[#B5BDCC]">
                  Team 404 Err
                </span>
              </div>
            </div>

            {/* Required Headline: SEE A BRIGHTER PLANET */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#F0EBDD] tracking-tight leading-none font-space">
              SEE A BRIGHTER
              <span className="block text-[#A6B7D4] mt-1">
                PLANET.
              </span>
            </h1>

            {/* Required Subtitle */}
            <p className="text-sm sm:text-base text-[#B5BDCC] leading-relaxed max-w-2xl">
              Explore environmental trends, detect risks, and understand what's changing on our planet using real Earth observation data.
            </p>

            {/* Required Buttons: EXPLORE EARTH & DISCOVER FEATURES */}
            <div className="flex flex-wrap items-center gap-4 pt-2 font-mono">
              <Link
                to="/earth-explorer"
                className="px-6 py-3.5 text-xs sm:text-sm font-bold text-[#171B2B] bg-[#A6B7D4] hover:bg-[#B8C6DF] rounded-xl transition-all shadow-md flex items-center gap-2.5 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-[#171B2B]" />
                <span>EXPLORE EARTH</span>
                <ArrowRight className="w-4 h-4 text-[#171B2B]" />
              </Link>

              <a
                href="#features-section"
                className="px-6 py-3.5 text-xs sm:text-sm font-bold text-[#F0EBDD] hover:text-[#F0EBDD] bg-[#232A3D] hover:bg-[#353D55] border border-[#D28B71]/60 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#D28B71]" />
                <span>DISCOVER FEATURES</span>
              </a>
            </div>

            {/* Ground-Truth Telemetry Specs */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#48516A] font-mono text-xs">
              <div className="p-3 bg-[#232A3D] rounded-xl border border-[#48516A]">
                <div className="text-[10px] text-[#B5BDCC] uppercase">Primary Data</div>
                <div className="text-[#A6B7D4] font-bold mt-0.5">NASA POWER</div>
                <div className="text-[10px] text-[#838FA3]">2001–2025 Reanalysis</div>
              </div>
              <div className="p-3 bg-[#232A3D] rounded-xl border border-[#48516A]">
                <div className="text-[10px] text-[#B5BDCC] uppercase">Hazards & Risk</div>
                <div className="text-[#F16C72] font-bold mt-0.5">GDACS & EM-DAT</div>
                <div className="text-[10px] text-[#838FA3]">Real-Time Alerts</div>
              </div>
              <div className="p-3 bg-[#232A3D] rounded-xl border border-[#48516A]">
                <div className="text-[10px] text-[#B5BDCC] uppercase">Blindspot Engine</div>
                <div className="text-[#F0B44D] font-bold mt-0.5">72-Hour Latency</div>
                <div className="text-[10px] text-[#35C98B]">Zero False Alarms</div>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Interactive 3D Earth Globe Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-5 h-[380px] sm:h-[450px] bg-[#232A3D] border border-[#48516A] rounded-2xl shadow-2xl relative overflow-hidden flex items-center justify-center"
          >
            <AtmosphericGlobe3D className="w-full h-full" />
            
            {/* Floating HUD Telemetry Callout */}
            <div className="absolute top-3 left-3 bg-[#1D2436]/95 border border-[#48516A] rounded-xl px-3 py-1.5 backdrop-blur font-mono text-[10px] text-[#F0EBDD] flex items-center gap-2 pointer-events-none shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#A6B7D4]"></span>
              <span>EARTH OBSERVATION ORBITAL CANVAS · 3D</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-[#1D2436]/95 border border-[#48516A] rounded-lg px-2.5 py-1 backdrop-blur font-mono text-[9px] text-[#B5BDCC] pointer-events-none">
              Drag to Rotate · Scroll to Zoom
            </div>
          </motion.div>

        </section>

        {/* ======================================================== */}
        {/* 4 FEATURE CARDS (Section 9 Requirement)                 */}
        {/* ======================================================== */}
        <section id="features-section" className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#48516A] pb-4">
            <div>
              <div className="text-xs font-mono uppercase text-[#A6B7D4] tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D28B71]" />
                <span>Core Capabilities</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight mt-1 font-space">
                Core Planetary Intelligence Features
              </h2>
            </div>
            <p className="text-xs text-[#B5BDCC] max-w-md">
              Four dedicated modules engineered to monitor, analyze, and communicate Earth observation dynamics with mathematical rigor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {mainFeatureCards.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`bg-[#353D55] border ${item.color} hover:border-[#A6B7D4] rounded-2xl p-6 transition-all duration-300 group flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl bg-[#232A3D] border border-[#48516A] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <item.icon className="w-6 h-6 text-[#A6B7D4]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded bg-[#232A3D] text-[#A6B7D4] border border-[#48516A]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#F0EBDD] group-hover:text-[#A6B7D4] transition-colors font-space">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#B5BDCC] leading-relaxed font-sans">
                    {item.desc}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-[#48516A] font-mono text-[10px] text-[#B5BDCC]">
                    {item.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A6B7D4]"></span>
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-[#A6B7D4] group-hover:text-[#F0EBDD] flex items-center justify-between pt-3 border-t border-[#48516A] group-hover:translate-x-1 transition-transform">
                  <span>LAUNCH MODULE</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* COMPREHENSIVE PLATFORM DEEP-DIVE                         */}
        {/* ======================================================== */}
        <section className="bg-[#232A3D] border border-[#48516A] rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#48516A] pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#A6B7D4] uppercase tracking-wider">
                <Info className="w-4 h-4 text-[#D28B71]" />
                <span>Mission Deep-Dive</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight font-space">
                About EARTH TRACE & Scientific Philosophy
              </h2>
              <p className="text-xs sm:text-sm text-[#B5BDCC] max-w-2xl leading-relaxed">
                Why standard environmental dashboards fail, and how EARTH TRACE provides non-parametric planetary diagnostics grounded in atmospheric physics.
              </p>
            </div>

            {/* Section Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#1D2436] rounded-xl border border-[#48516A] font-mono text-xs">
              <button
                onClick={() => setActiveTab('mission')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'mission' ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
                }`}
              >
                The Mission
              </button>
              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'architecture' ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
                }`}
              >
                Engine Architecture
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'team' ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
                }`}
              >
                Team 404 Err
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'mission' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-[#353D55] rounded-xl border border-[#48516A] space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#232A3D] border border-[#48516A] flex items-center justify-center text-[#A6B7D4]">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#F0EBDD] font-space">1. Real NASA Earth Observations</h3>
                <p className="text-xs text-[#B5BDCC] leading-relaxed font-sans">
                  Unlike platforms that display synthetic mock data or decorative heatmaps, EARTH TRACE directly connects to the <strong className="text-[#F0EBDD]">NASA POWER Daily Point API</strong> and <strong className="text-[#F0EBDD]">MERRA-2 Global Reanalysis</strong>. Every temperature, precipitation, aerosol, and wind metric originates from verified satellite assimilations.
                </p>
              </div>

              <div className="p-5 bg-[#353D55] rounded-xl border border-[#48516A] space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#232A3D] border border-[#48516A] flex items-center justify-center text-[#D28B71]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#F0EBDD] font-space">2. Non-Parametric Mathematical Rigor</h3>
                <p className="text-xs text-[#B5BDCC] leading-relaxed font-sans">
                  Environmental data is skewed and prone to weather outliers. EARTH TRACE implements the <strong className="text-[#F0EBDD]">Mann-Kendall Rank Correlation Test</strong> with tied-group variance corrections and <strong className="text-[#F0EBDD]">Sen’s Median Slope</strong>, ensuring conclusions are mathematically sound.
                </p>
              </div>

              <div className="p-5 bg-[#353D55] rounded-xl border border-[#48516A] space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#232A3D] border border-[#48516A] flex items-center justify-center text-[#F0B44D]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#F0EBDD] font-space">3. Zero False Alarm Discipline</h3>
                <p className="text-xs text-[#B5BDCC] leading-relaxed font-sans">
                  Through the <strong className="text-[#F0EBDD]">72-Hour Blindspot</strong> system, EARTH TRACE treats observational latency with scientific humility. When orbital updates are delayed or incomplete, it withholds hazard alarms instead of panicking.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-4 bg-[#353D55] rounded-xl border border-[#48516A] space-y-2">
                <div className="text-[10px] text-[#A6B7D4] font-bold uppercase">Layer 01 · Ingestion</div>
                <div className="text-sm font-bold text-[#F0EBDD] font-space">NASA POWER Daily API</div>
                <p className="text-[11px] text-[#B5BDCC] font-sans">
                  Retrieves multi-decadal 2-meter air temperature (T2M), daily precipitation, surface winds, and PM2.5 daily point observations.
                </p>
              </div>

              <div className="p-4 bg-[#353D55] rounded-xl border border-[#48516A] space-y-2">
                <div className="text-[10px] text-[#D28B71] font-bold uppercase">Layer 02 · Math Core</div>
                <div className="text-sm font-bold text-[#F0EBDD] font-space">Mann-Kendall & Sen’s Slope</div>
                <p className="text-[11px] text-[#B5BDCC] font-sans">
                  Calculates rank statistic S, corrected variance Var(S), standardized Z-score, exact p-values, and decadal trend slope.
                </p>
              </div>

              <div className="p-4 bg-[#353D55] rounded-xl border border-[#48516A] space-y-2">
                <div className="text-[10px] text-[#F0B44D] font-bold uppercase">Layer 03 · Latency Resilience</div>
                <div className="text-sm font-bold text-[#F0EBDD] font-space">72-Hour Blindspot Engine</div>
                <p className="text-[11px] text-[#B5BDCC] font-sans">
                  Calculates completeness percentages, assigns confidence tiers (High/Mod/Low/Insufficient), and governs alert issuance.
                </p>
              </div>

              <div className="p-4 bg-[#353D55] rounded-xl border border-[#48516A] space-y-2">
                <div className="text-[10px] text-[#A6B7D4] font-bold uppercase">Layer 04 · Synthesis</div>
                <div className="text-sm font-bold text-[#F0EBDD] font-space">Grounded Gemini Co-Pilot</div>
                <p className="text-[11px] text-[#B5BDCC] font-sans">
                  Gemini Flash model prompted strictly with calculated statistics and sensor metadata.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-6 bg-[#353D55] rounded-xl border border-[#48516A] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#48516A] pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src="/assets/aistudio/image_0bb54710.png" 
                    alt="NASA Space Apps Challenge" 
                    className="h-10 sm:h-12 w-auto object-contain shrink-0" 
                  />
                  <div>
                    <h3 className="text-lg font-bold text-[#F0EBDD] font-space">Team 404 Err · NASA Space Apps Challenge 2026</h3>
                    <p className="text-xs text-[#B5BDCC]">
                      Challenge: "Be An Earth System Trend Detective" · Resilience Module: "The 72-Hour Blindspot"
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#B5BDCC] leading-relaxed font-sans">
                Team 404 Err engineered EARTH TRACE as a full-stack, scientific-grade analytical solution delivering an uncompromising standard of data integrity: every visualization is verifiable, every statistical test is documented, and every alert decision is transparently defended.
              </p>
            </div>
          )}

        </section>

        {/* ======================================================== */}
        {/* ALL SECTIONS PORTAL                                      */}
        {/* ======================================================== */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#48516A] pb-4">
            <div>
              <div className="text-xs font-mono uppercase text-[#A6B7D4] tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D28B71]" />
                <span>Full Navigation Matrix</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight mt-1 font-space">
                Explore All Earth Trace Sections
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allSections.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className="bg-[#232A3D] border border-[#48516A] hover:border-[#A6B7D4] rounded-xl p-5 transition-all duration-200 group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <item.icon className="w-5 h-5 text-[#A6B7D4] group-hover:scale-105 transition-transform" />
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#1D2436] text-[#B5BDCC] border border-[#48516A] font-bold uppercase">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#F0EBDD] group-hover:text-[#A6B7D4] transition-colors font-space">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#B5BDCC] leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="text-[11px] font-mono font-bold text-[#A6B7D4] group-hover:text-[#F0EBDD] flex items-center justify-between pt-2 border-t border-[#48516A]">
                  <span>OPEN MODULE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3D ATMOSPHERIC SIMULATION */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#48516A] pb-3">
            <div>
              <div className="text-xs font-mono uppercase text-[#A6B7D4] tracking-wider">Interactive 3D Physical Simulation</div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F0EBDD] tracking-tight font-space">
                Planetary Boundary Layer & Inversion Column
              </h2>
            </div>
          </div>

          <AtmosphericColumn3D />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#48516A] bg-[#171B2B] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B5BDCC] font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <img 
              src="/assets/aistudio/image_eed5d808.png" 
              alt="EARTH TRACE Logo" 
              className="h-7 w-auto object-contain opacity-90" 
            />
            <div className="h-4 w-px bg-[#48516A] hidden sm:block"></div>
            <img 
              src="/assets/aistudio/image_0bb54710.png" 
              alt="NASA Space Apps Challenge" 
              className="h-6 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity" 
            />
            <span className="text-[#B5BDCC]">EARTH TRACE · Team 404 Err for NASA Space Apps Challenge 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-[#F0EBDD] transition-colors">Methodology</Link>
            <Link to="/reports" className="hover:text-[#F0EBDD] transition-colors">Reports</Link>
            <Link to="/blindspot" className="hover:text-[#F0B44D] transition-colors">72h Blindspot</Link>
            <a 
              href="https://power.larc.nasa.gov/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#F0EBDD] transition-colors flex items-center gap-1"
            >
              <span>NASA POWER</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
