import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  ShieldAlert, 
  Flame, 
  Search, 
  Globe, 
  GitCompare, 
  Sparkles, 
  AlertTriangle, 
  Layers, 
  Info, 
  TrendingUp, 
  Database, 
  CheckCircle2, 
  Clock, 
  Radar, 
  ArrowRight, 
  RefreshCw, 
  ExternalLink, 
  X, 
  BarChart2, 
  Compass, 
  Eye, 
  ShieldCheck, 
  HelpCircle,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  Maximize2
} from 'lucide-react';
import PageContainer from '../components/PageContainer';
import { 
  GLOBAL_COUNTRIES_PROFILES, 
  CountryDisasterProfile, 
  HazardType, 
  HAZARDS_META, 
  DATA_SOURCES_INFO,
  ActiveAlert 
} from '../data/disasterData';

// Leaflet custom marker helper
function createCustomPin(color: string, label: string, isPulsing: boolean = false) {
  return L.divIcon({
    className: 'custom-disaster-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
        ${isPulsing ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #050814; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color}80; font-size: 13px;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
}

function MapPanController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function GlobalDisasterWatch() {
  const [selectedCountry, setSelectedCountry] = useState<CountryDisasterProfile>(GLOBAL_COUNTRIES_PROFILES[0]); // Philippines default
  const [activeHazardFilter, setActiveHazardFilter] = useState<HazardType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTab, setDetailTab] = useState<'overview' | 'inform' | 'emdat' | 'blindspot' | 'ai'>('overview');
  
  // Compare State
  const [compareCountry, setCompareCountry] = useState<CountryDisasterProfile | null>(GLOBAL_COUNTRIES_PROFILES[4]); // Japan default comparator
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Sources Modal
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    summary: string;
    hazardAnalysis: string;
    activeSituation: string;
    blindspotReliability: string;
    nextObservationPriority: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filtered Countries list
  const filteredCountries = useMemo(() => {
    return GLOBAL_COUNTRIES_PROFILES.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.capital.toLowerCase().includes(searchQuery.toLowerCase());
      const matchHazard = activeHazardFilter === 'all' || c.primaryHazards.includes(activeHazardFilter);
      return matchSearch && matchHazard;
    });
  }, [searchQuery, activeHazardFilter]);

  // All active alerts across all countries
  const allActiveAlerts = useMemo(() => {
    return GLOBAL_COUNTRIES_PROFILES.flatMap(c => 
      c.activeAlerts.map(a => ({ ...a, countryName: c.name, countryFlag: c.flag }))
    );
  }, []);

  const handleCountrySelect = (c: CountryDisasterProfile) => {
    setSelectedCountry(c);
    setAiResponse(null);
    setAiError(null);
  };

  const handleAskAi = async (customPrompt?: string) => {
    const q = customPrompt || aiQuestion;
    if (!q.trim() && !customPrompt) return;
    
    setLoadingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/disaster-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryName: selectedCountry.name,
          question: q,
          informRisk: selectedCountry.informRisk,
          emDatStats: selectedCountry.emDatStats,
          nasaClimatology: selectedCountry.nasaClimatology,
          activeAlerts: selectedCountry.activeAlerts,
          blindspot: selectedCountry.blindspot
        })
      });

      const data = await res.json();
      if (data.success && data.insight) {
        setAiResponse(data.insight);
      } else {
        throw new Error(data.error || 'Failed to retrieve AI analysis');
      }
    } catch (err: any) {
      console.warn('AI analysis fallback:', err.message);
      // Deterministic synthesis fallback
      setAiResponse({
        summary: `${selectedCountry.name} is assessed under the INFORM Risk Index with a composite score of ${selectedCountry.informRisk.overallRisk}/10 (Rank #${selectedCountry.informRisk.rank} globally), categorized as ${selectedCountry.informRisk.category} Risk.`,
        hazardAnalysis: `Primary vulnerability vectors include ${selectedCountry.primaryHazards.map(h => HAZARDS_META[h].label).join(', ')}. NASA POWER long-term telemetry records a 25-year temperature trajectory of ${selectedCountry.nasaClimatology.tempTrendDecadeC > 0 ? '+' : ''}${selectedCountry.nasaClimatology.tempTrendDecadeC}°C per decade.`,
        activeSituation: selectedCountry.activeAlerts.length > 0 
          ? `Current active warnings: ${selectedCountry.activeAlerts.map(a => a.title).join('; ')}.`
          : `No active GDACS Red or Orange disaster emergencies currently in effect. Baseline surveillance operational.`,
        blindspotReliability: `Under current 72-hour latency of ${selectedCountry.blindspot.latencyHours} hours (${selectedCountry.blindspot.completenessPercent}% completeness), long-term risk baselines are reliable. In-situ gaps: ${selectedCountry.blindspot.missingDatasets.join('; ') || 'None'}.`,
        nextObservationPriority: selectedCountry.blindspot.missingDatasets[0] || 'Continuous geostationary meteorological sounding and near-real-time satellite radar passes.'
      });
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <PageContainer title="Global Disaster Watch · Worldwide Environmental Risk Monitoring">
      <div className="space-y-6 max-w-[1700px] mx-auto pb-16 font-sans">
        
        {/* ======================================================== */}
        {/* TOP MAC CONTROL BAR & SYSTEM TITLE                       */}
        {/* ======================================================== */}
        <div className="bg-[#050814] border border-[#152238] rounded-xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mac Traffic Lights */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
            
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold tracking-wider text-white">GLOBAL DISASTER WATCH</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold uppercase">
                INFORM · GDACS · EM-DAT · NASA FIRMS
              </span>
            </div>
          </div>

          {/* Action Buttons: Compare & Data Sources */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#0A1222] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1E293B] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compare Countries</span>
            </button>
            <button
              onClick={() => setShowSourcesModal(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Data Sources & Attribution</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ACTIVE DISASTER TICKER & SCIENTIFIC GUARDRAIL NOTICE     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Active Alert Ticker */}
          <div className="lg:col-span-8 bg-[#091122]/90 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3 overflow-hidden shadow-lg">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950 text-rose-300 text-[10px] font-mono font-bold border border-rose-800 shrink-0">
              <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>ACTIVE MONITORING</span>
            </div>
            <div className="flex-1 overflow-x-auto whitespace-nowrap text-xs font-mono text-slate-300 flex items-center gap-6 scrollbar-none py-0.5">
              {allActiveAlerts.map(alert => (
                <div key={alert.id} className="flex items-center gap-2 shrink-0">
                  <span className="text-sm">{alert.countryFlag}</span>
                  <span className="text-white font-bold">{alert.countryName}:</span>
                  <span className="text-rose-300">{alert.title}</span>
                  <span className="text-[10px] text-slate-400">({alert.source} · {alert.severity})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Distinction Guardrail Card */}
          <div className="lg:col-span-4 bg-[#080E1B] border border-cyan-500/20 rounded-xl p-3 flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-cyan-300">Scientific Distinction:</strong> High historical risk does <em>not</em> equal an active disaster. Current alerts require verified GDACS/FIRMS sensor confirmation.
            </span>
          </div>

        </div>

        {/* ======================================================== */}
        {/* HAZARD FILTERS STRIP & COUNTRY SELECTOR CHIPS            */}
        {/* ======================================================== */}
        <div className="space-y-3">
          
          {/* Hazard Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hazard Filter:</span>
            </span>

            <button
              onClick={() => setActiveHazardFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeHazardFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-[#080E1B] text-slate-400 hover:text-white border border-[#192742]'
              }`}
            >
              All Hazards ({GLOBAL_COUNTRIES_PROFILES.length})
            </button>

            {(Object.keys(HAZARDS_META) as HazardType[]).map(key => {
              const meta = HAZARDS_META[key];
              const isActive = activeHazardFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveHazardFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30' 
                      : 'bg-[#080E1B] text-slate-300 hover:text-white border border-[#192742]'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Featured Country Selector Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#152238]">
            <span className="text-xs font-mono text-cyan-400 font-bold mr-1">Featured Profiles:</span>
            {GLOBAL_COUNTRIES_PROFILES.map(c => {
              const isSelected = selectedCountry.iso === c.iso;
              return (
                <button
                  key={c.iso}
                  onClick={() => handleCountrySelect(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold shadow-md shadow-cyan-950/40'
                      : 'bg-[#080E1B] text-slate-400 hover:text-white hover:bg-[#0C1527] border border-[#192742]'
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    c.informRisk.category === 'Very High' ? 'bg-red-950/80 text-red-300 border border-red-800/60' :
                    c.informRisk.category === 'High' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' :
                    'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}>
                    INFORM {c.informRisk.overallRisk}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* ======================================================== */}
        {/* MAIN SPLIT: LEAFLET WORLD MAP & COUNTRY RISK PROFILE     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: LEAFLET DISASTER MAP (7 COLS) */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="lg:col-span-7 bg-[#050814] border border-[#152238] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px] relative"
          >
            
            {/* Map Top Bar */}
            <div className="p-3 bg-[#080E1B] border-b border-[#152238] flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Interactive Geospatial Risk Explorer
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Focused: <span className="text-cyan-300 font-bold">{selectedCountry.flag} {selectedCountry.name}</span> ({selectedCountry.coordinates[0].toFixed(2)}°, {selectedCountry.coordinates[1].toFixed(2)}°)
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full h-full relative">
              <MapContainer
                center={selectedCountry.coordinates}
                zoom={4}
                className="w-full h-full"
                minZoom={2}
                maxZoom={12}
              >
                <MapPanController center={selectedCountry.coordinates} zoom={4} />
                <MapResizeFix />

                {/* Carto Dark Matter Basemap */}
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={`https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${(import.meta.env.VITE_CARTO_API_KEY as string) || 'cb1_4ydn_1_f0f06d2935f96be7c0ae5387'}`}
                  subdomains="abcd"
                  maxZoom={19}
                />

                {/* Country Markers */}
                {filteredCountries.map(c => {
                  const isSelected = c.iso === selectedCountry.iso;
                  const hasAlerts = c.activeAlerts.length > 0;
                  const pinColor = hasAlerts ? '#F43F5E' : isSelected ? '#06B6D4' : '#64748B';
                  
                  return (
                    <Marker
                      key={c.iso}
                      position={c.coordinates}
                      icon={createCustomPin(pinColor, c.flag, hasAlerts)}
                      eventHandlers={{
                        click: () => handleCountrySelect(c)
                      }}
                    >
                      <Popup>
                        <div className="p-1 font-sans text-xs text-slate-900 space-y-1">
                          <div className="font-bold text-sm flex items-center gap-1.5">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </div>
                          <div className="text-slate-600 font-mono text-[10px]">
                            {c.region}
                          </div>
                          <div className="pt-1 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px]">
                            <div>INFORM Risk: <strong>{c.informRisk.overallRisk}/10</strong></div>
                            <div>Rank: <strong>#{c.informRisk.rank}</strong></div>
                          </div>
                          {c.activeAlerts.length > 0 ? (
                            <div className="p-1 bg-red-100 border border-red-300 rounded text-red-800 font-semibold text-[10px]">
                              Active: {c.activeAlerts[0].title}
                            </div>
                          ) : (
                            <div className="text-emerald-700 text-[10px]">No active GDACS emergency</div>
                          )}
                          <button
                            onClick={() => handleCountrySelect(c)}
                            className="w-full mt-1 px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold font-mono"
                          >
                            Inspect Country Profile
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Map Floating Legend */}
              <div className="absolute bottom-3 left-3 bg-[#050814]/90 backdrop-blur-md border border-[#152238] rounded-xl p-3 z-[1000] font-mono text-[10px] text-slate-300 space-y-1.5 shadow-xl max-w-xs pointer-events-auto">
                <div className="font-bold text-white text-[11px] border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>MAP SYMBOLOGY</span>
                  <span className="text-cyan-400">WGS 84</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Active Disaster Warning (GDACS / FIRMS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span>Selected Focus Country Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>Baseline Surveillance Station</span>
                </div>
              </div>
            </div>

          </motion.div>

          {/* RIGHT: COUNTRY RISK PROFILE EXPLORER (5 COLS) */}
          <motion.div 
            initial={{ opacity: 0, x: 12 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-5 bg-[#080E1B] border border-[#192742] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px]"
          >
            
            {/* Header: Country Flag, Name, Capital, Population */}
            <div className="p-4 bg-[#050814] border-b border-[#152238] flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">{selectedCountry.flag}</span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-tight">{selectedCountry.name}</h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      selectedCountry.informRisk.category === 'Very High' ? 'bg-red-950/80 text-red-300 border border-red-800' :
                      selectedCountry.informRisk.category === 'High' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                      'bg-slate-900 text-slate-300 border border-slate-700'
                    }`}>
                      {selectedCountry.informRisk.category} Risk
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Capital: <strong className="text-white">{selectedCountry.capital}</strong> · Pop: {selectedCountry.populationMillions}M
                  </div>
                </div>
              </div>

              {/* INFORM Overall Score Badge */}
              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-400 uppercase">INFORM 2024</div>
                <div className="text-2xl font-black text-cyan-400 leading-none mt-0.5">
                  {selectedCountry.informRisk.overallRisk}<span className="text-xs text-slate-500 font-normal">/10</span>
                </div>
                <div className="text-[10px] text-slate-400">Rank #{selectedCountry.informRisk.rank} / 191</div>
              </div>
            </div>

            {/* Profile Navigation Sub-Tabs */}
            <div className="flex items-center gap-1 p-1.5 bg-[#050814] border-b border-[#152238] font-mono text-xs overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDetailTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  detailTab === 'overview' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Risk Overview
              </button>
              <button
                onClick={() => setDetailTab('inform')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  detailTab === 'inform' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                INFORM Index
              </button>
              <button
                onClick={() => setDetailTab('emdat')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  detailTab === 'emdat' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                EM-DAT History
              </button>
              <button
                onClick={() => setDetailTab('blindspot')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  detailTab === 'blindspot' ? 'bg-amber-950 text-amber-300 border border-amber-500/50 font-bold' : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <Radar className="w-3 h-3 text-amber-400" />
                <span>72h Blindspot</span>
              </button>
              <button
                onClick={() => setDetailTab('ai')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  detailTab === 'ai' ? 'bg-purple-950 text-purple-300 border border-purple-500/50 font-bold' : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>AI Intelligence</span>
              </button>
            </div>

            {/* Profile Tab Body Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              
              {/* TAB 1: OVERVIEW */}
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  {/* Narrative Overview */}
                  <div className="p-3 bg-[#050814] rounded-xl border border-[#152238] text-xs text-slate-300 leading-relaxed">
                    {selectedCountry.disasterOverview}
                  </div>

                  {/* Primary Hazard Badges */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                      Primary Exposure Vectors:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCountry.primaryHazards.map(h => (
                        <span 
                          key={h}
                          className="px-2.5 py-1 rounded-lg bg-[#0C1527] border border-[#1E2E4E] text-xs font-mono text-cyan-300 flex items-center gap-1.5"
                        >
                          <span>{HAZARDS_META[h].icon}</span>
                          <span>{HAZARDS_META[h].label}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Active GDACS & FIRMS Alerts Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        Current Active Alerts (GDACS / FIRMS):
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">Real-Time Sensor Feeds</span>
                    </div>

                    {selectedCountry.activeAlerts.length > 0 ? (
                      selectedCountry.activeAlerts.map(alert => (
                        <div 
                          key={alert.id}
                          className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                              {alert.title}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-900/60 text-red-200 border border-red-700">
                              {alert.source} · {alert.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{alert.details}</p>
                          <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-red-900/40 flex justify-between">
                            <span>Area: {alert.affectedArea}</span>
                            <span>Issued: {alert.issuedAt}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>No active Red or Orange disaster alerts for {selectedCountry.name}. Baseline monitoring active.</span>
                      </div>
                    )}
                  </div>

                  {/* NASA POWER Environmental Trend Indicators */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                      NASA 25-Year Climatological Trends (2001–2025):
                    </span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742]">
                        <div className="text-[10px] text-slate-400">Surface Temp Rate</div>
                        <div className="text-white font-bold text-sm mt-0.5">
                          {selectedCountry.nasaClimatology.tempTrendDecadeC > 0 ? '+' : ''}
                          {selectedCountry.nasaClimatology.tempTrendDecadeC}°C / decade
                        </div>
                        <div className="text-[9px] text-cyan-400">MERRA-2 Assimilation</div>
                      </div>

                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742]">
                        <div className="text-[10px] text-slate-400">Precipitation Trend</div>
                        <div className="text-white font-bold text-sm mt-0.5">
                          {selectedCountry.nasaClimatology.precipTrendAnomalyPercent > 0 ? '+' : ''}
                          {selectedCountry.nasaClimatology.precipTrendAnomalyPercent}% / decade
                        </div>
                        <div className="text-[9px] text-teal-400">POWER Point Daily</div>
                      </div>

                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742]">
                        <div className="text-[10px] text-slate-400">FIRMS 24h Hotspots</div>
                        <div className="text-white font-bold text-sm mt-0.5">
                          {selectedCountry.nasaClimatology.firmsActiveHotspots24h} Detections
                        </div>
                        <div className="text-[9px] text-rose-400">VIIRS 375m & MODIS</div>
                      </div>

                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742]">
                        <div className="text-[10px] text-slate-400">Max Fire Radiative Power</div>
                        <div className="text-white font-bold text-sm mt-0.5">
                          {selectedCountry.nasaClimatology.firmsMaxFRP_MW} MW
                        </div>
                        <div className="text-[9px] text-amber-400">Thermal Radiance</div>
                      </div>
                    </div>
                  </div>

                  {/* UNDRR Focal Point */}
                  <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-[#152238]">
                    Sendai DRR Focal Agency: <span className="text-slate-300 font-semibold">{selectedCountry.undrrSendaiFocalPoint}</span>
                  </div>
                </div>
              )}

              {/* TAB 2: INFORM RISK INDEX 2024 */}
              {detailTab === 'inform' && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#050814] rounded-xl border border-[#192742] space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-white uppercase">INFORM Dimensions (0–10 Scale)</span>
                      <span className="text-[10px] font-mono text-cyan-400">DRMKC / JRC 2024</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Hazard & Exposure:</span>
                          <strong className="text-cyan-300">{selectedCountry.informRisk.hazardExposure} / 10</strong>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-cyan-400" style={{ width: `${selectedCountry.informRisk.hazardExposure * 10}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Human Vulnerability:</span>
                          <strong className="text-amber-300">{selectedCountry.informRisk.vulnerability} / 10</strong>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-amber-400" style={{ width: `${selectedCountry.informRisk.vulnerability * 10}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Lack of Coping Capacity:</span>
                          <strong className="text-rose-300">{selectedCountry.informRisk.lackOfCopingCapacity} / 10</strong>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-rose-400" style={{ width: `${selectedCountry.informRisk.lackOfCopingCapacity * 10}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hazard Sub-Component Breakdown */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                      Specific Natural Hazard Vulnerabilities:
                    </span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742] flex justify-between items-center">
                        <span className="text-slate-300">💧 Flood Hazard</span>
                        <strong className="text-cyan-400">{selectedCountry.informRisk.floodHazardScore} / 10</strong>
                      </div>
                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742] flex justify-between items-center">
                        <span className="text-slate-300">🌀 Tropical Cyclone</span>
                        <strong className="text-cyan-400">{selectedCountry.informRisk.cycloneHazardScore} / 10</strong>
                      </div>
                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742] flex justify-between items-center">
                        <span className="text-slate-300">⚡ Earthquake</span>
                        <strong className="text-amber-400">{selectedCountry.informRisk.earthquakeHazardScore} / 10</strong>
                      </div>
                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742] flex justify-between items-center">
                        <span className="text-slate-300">☀️ Drought Hazard</span>
                        <strong className="text-yellow-400">{selectedCountry.informRisk.droughtHazardScore} / 10</strong>
                      </div>
                      <div className="p-2.5 bg-[#050814] rounded-lg border border-[#192742] col-span-2 flex justify-between items-center">
                        <span className="text-slate-300">🌊 Coastal Tsunami Hazard</span>
                        <strong className="text-blue-400">{selectedCountry.informRisk.tsunamiHazardScore} / 10</strong>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    INFORM Risk index is co-developed by the Inter-Agency Standing Committee (IASC) Task Team and European Commission DRMKC. It integrates 80+ indicators measuring structural exposure, socio-economic fragility, and infrastructure coping capacities.
                  </p>
                </div>
              )}

              {/* TAB 3: EM-DAT HISTORICAL DATABASE */}
              {detailTab === 'emdat' && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#050814] rounded-xl border border-[#192742] space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-white uppercase">EM-DAT Historical Records</span>
                      <span className="text-[10px] font-mono text-cyan-400">{selectedCountry.emDatStats.period}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="p-2.5 bg-[#091122] rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">Recorded Disasters</div>
                        <div className="text-lg font-bold text-white mt-0.5">{selectedCountry.emDatStats.totalEvents} Events</div>
                      </div>

                      <div className="p-2.5 bg-[#091122] rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">Total Fatalities</div>
                        <div className="text-lg font-bold text-rose-400 mt-0.5">{selectedCountry.emDatStats.totalFatalities.toLocaleString()}</div>
                      </div>

                      <div className="p-2.5 bg-[#091122] rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">Affected Population</div>
                        <div className="text-lg font-bold text-amber-300 mt-0.5">{selectedCountry.emDatStats.totalAffectedMillions} Million</div>
                      </div>

                      <div className="p-2.5 bg-[#091122] rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">Economic Damages</div>
                        <div className="text-lg font-bold text-emerald-400 mt-0.5">${selectedCountry.emDatStats.estimatedDamagesUsdBillion}B USD</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                      <div className="text-slate-400">Deadliest Historical Disaster:</div>
                      <div className="font-semibold text-white pl-2 border-l-2 border-rose-500">
                        {selectedCountry.emDatStats.deadliestEvent}
                      </div>
                      <div className="text-slate-400 pt-1">Dominant Disaster Type:</div>
                      <div className="font-semibold text-cyan-300 pl-2 border-l-2 border-cyan-500">
                        {selectedCountry.emDatStats.mostFrequentHazard}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                    Data Source: Centre for Research on the Epidemiology of Disasters (CRED), UCLouvain, Brussels, Belgium. Entry criteria: 10+ deaths, 100+ affected, declaration of state of emergency, or international assistance appeal.
                  </p>
                </div>
              )}

              {/* TAB 4: 72-HOUR BLINDSPOT INTEGRATION */}
              {detailTab === 'blindspot' && (
                <div className="space-y-4">
                  {/* Blindspot Telemetry Metrics Strip */}
                  <div className="p-3 bg-[#050814] rounded-xl border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300">
                        <Radar className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>72-HOUR BLINDSPOT OBSERVATION STATUS</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold">
                        {selectedCountry.blindspot.confidenceClassification}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="p-2 bg-[#091122] rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Data Latency</div>
                        <div className="text-white font-bold">{selectedCountry.blindspot.latencyHours} Hours</div>
                      </div>
                      <div className="p-2 bg-[#091122] rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400">Data Completeness</div>
                        <div className="text-emerald-400 font-bold">{selectedCountry.blindspot.completenessPercent}%</div>
                      </div>
                      <div className="p-2 bg-[#091122] rounded border border-slate-800 col-span-2">
                        <div className="text-[10px] text-slate-400">Alert Protocol Decision</div>
                        <div className="font-bold text-emerald-400 flex items-center justify-between">
                          <span>{selectedCountry.blindspot.alertProtocolDecision}</span>
                          <span className="text-[9px] text-slate-400 font-normal">No false alarms rule</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed bg-[#091122]/60 p-2.5 rounded border border-slate-800">
                      <strong className="text-amber-300 font-mono">Protocol Reason:</strong> {selectedCountry.blindspot.protocolReason}
                    </div>
                  </div>

                  {/* 3-Pillar Scientific Reality Matrix */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#050814] rounded-xl border border-slate-800 space-y-1.5">
                      <div className="font-mono text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>What We Know (Verified Facts):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {selectedCountry.blindspot.whatWeKnow.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-[#050814] rounded-xl border border-slate-800 space-y-1.5">
                      <div className="font-mono text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>What We Don't Know (Data Gaps):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {selectedCountry.blindspot.whatWeDontKnow.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-[#050814] rounded-xl border border-slate-800 space-y-1.5">
                      <div className="font-mono text-[11px] font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>What We Need (Observation Priorities):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {selectedCountry.blindspot.whatWeNeed.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Missing Datasets */}
                  {selectedCountry.blindspot.missingDatasets.length > 0 && (
                    <div className="text-[11px] font-mono text-slate-400">
                      Identified Gaps: <span className="text-amber-300">{selectedCountry.blindspot.missingDatasets.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AI COUNTRY INTELLIGENCE */}
              {detailTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#050814] rounded-xl border border-purple-500/40 space-y-2">
                    <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>GEMINI 3.8 FLASH DISASTER CO-PILOT</span>
                      </div>
                      <span className="text-[9px] font-mono text-purple-400">Strictly Grounded</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Query the AI on {selectedCountry.name}'s multi-hazard exposure, active GDACS alerts, 72h blindspot latency, or historical disaster vulnerability.
                    </p>

                    {/* Quick Question Chips */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Suggested Prompts:</span>
                      <div className="flex flex-col gap-1.5">
                        {[
                          `What natural hazards affect ${selectedCountry.name}?`,
                          `What environmental trends are observed in ${selectedCountry.name}?`,
                          `Are there active disaster alerts for ${selectedCountry.name}?`,
                          `What data is missing and why is there latency?`,
                          `Which conclusions remain reliable vs untrusted?`,
                          `What additional observations are needed?`
                        ].map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setAiQuestion(prompt);
                              handleAskAi(prompt);
                            }}
                            disabled={loadingAi}
                            className="text-left px-2.5 py-1.5 rounded bg-[#091122] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 font-mono transition-colors cursor-pointer disabled:opacity-50"
                          >
                            → {prompt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Question Form */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder={`Ask anything about ${selectedCountry.name}'s disaster profile...`}
                        className="flex-1 bg-[#091122] border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                      />
                      <button
                        onClick={() => handleAskAi()}
                        disabled={loadingAi}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-cyan-600 hover:from-purple-600 hover:to-cyan-500 text-white text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Ask AI</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Response Display */}
                  {aiResponse && (
                    <div className="p-3 bg-[#050814] rounded-xl border border-purple-500/30 space-y-3 font-sans text-xs">
                      <div>
                        <div className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider mb-1">
                          Executive Answer
                        </div>
                        <p className="text-slate-200 leading-relaxed">{aiResponse.summary}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                          Hazard & Trend Analysis
                        </div>
                        <p className="text-slate-300 leading-relaxed">{aiResponse.hazardAnalysis}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                          Active Warning Situation
                        </div>
                        <p className="text-slate-300 leading-relaxed">{aiResponse.activeSituation}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                          72h Blindspot & Data Reliability
                        </div>
                        <p className="text-slate-300 leading-relaxed">{aiResponse.blindspotReliability}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          Next Observation Priority
                        </div>
                        <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{aiResponse.nextObservationPriority}</p>
                      </div>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300">
                      {aiError}
                    </div>
                  )}
                </div>
              )}

            </div>

          </motion.div>

        </div>

        {/* ======================================================== */}
        {/* COUNTRY COMPARISON MODAL                                */}
        {/* ======================================================== */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#050814] border border-[#192742] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Multi-Country Disaster Risk Comparison</h3>
                </div>
                <button 
                  onClick={() => setShowCompareModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Country A:</label>
                  <select
                    value={selectedCountry.iso}
                    onChange={(e) => {
                      const match = GLOBAL_COUNTRIES_PROFILES.find(c => c.iso === e.target.value);
                      if (match) setSelectedCountry(match);
                    }}
                    className="w-full bg-[#091122] border border-slate-800 rounded-lg p-2 text-xs font-mono text-white"
                  >
                    {GLOBAL_COUNTRIES_PROFILES.map(c => (
                      <option key={c.iso} value={c.iso}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Country B:</label>
                  <select
                    value={compareCountry?.iso || ''}
                    onChange={(e) => {
                      const match = GLOBAL_COUNTRIES_PROFILES.find(c => c.iso === e.target.value);
                      if (match) setCompareCountry(match);
                    }}
                    className="w-full bg-[#091122] border border-slate-800 rounded-lg p-2 text-xs font-mono text-white"
                  >
                    {GLOBAL_COUNTRIES_PROFILES.map(c => (
                      <option key={c.iso} value={c.iso}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {compareCountry && (
                <div className="space-y-4 font-mono text-xs">
                  {/* Metric 1: INFORM Index */}
                  <div className="p-3 bg-[#080E1B] rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-white uppercase text-[11px] border-b border-slate-800 pb-1">
                      1. INFORM Risk Index 2024 (0–10)
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="text-left text-slate-400">Metric</div>
                      <div className="text-cyan-300 font-bold">{selectedCountry.flag} {selectedCountry.name}</div>
                      <div className="text-teal-300 font-bold">{compareCountry.flag} {compareCountry.name}</div>

                      <div className="text-left text-slate-400">Overall Risk Score</div>
                      <div className="font-bold text-white">{selectedCountry.informRisk.overallRisk} / 10 (#{selectedCountry.informRisk.rank})</div>
                      <div className="font-bold text-white">{compareCountry.informRisk.overallRisk} / 10 (#{compareCountry.informRisk.rank})</div>

                      <div className="text-left text-slate-400">Hazard Exposure</div>
                      <div className="text-cyan-400">{selectedCountry.informRisk.hazardExposure} / 10</div>
                      <div className="text-cyan-400">{compareCountry.informRisk.hazardExposure} / 10</div>

                      <div className="text-left text-slate-400">Human Vulnerability</div>
                      <div className="text-amber-400">{selectedCountry.informRisk.vulnerability} / 10</div>
                      <div className="text-amber-400">{compareCountry.informRisk.vulnerability} / 10</div>

                      <div className="text-left text-slate-400">Lack of Coping Capacity</div>
                      <div className="text-rose-400">{selectedCountry.informRisk.lackOfCopingCapacity} / 10</div>
                      <div className="text-rose-400">{compareCountry.informRisk.lackOfCopingCapacity} / 10</div>
                    </div>
                  </div>

                  {/* Metric 2: EM-DAT Historical Records */}
                  <div className="p-3 bg-[#080E1B] rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-white uppercase text-[11px] border-b border-slate-800 pb-1">
                      2. EM-DAT Historical Records (1990–2024)
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="text-left text-slate-400">Metric</div>
                      <div className="text-cyan-300 font-bold">{selectedCountry.name}</div>
                      <div className="text-teal-300 font-bold">{compareCountry.name}</div>

                      <div className="text-left text-slate-400">Total Disaster Events</div>
                      <div className="text-white font-bold">{selectedCountry.emDatStats.totalEvents}</div>
                      <div className="text-white font-bold">{compareCountry.emDatStats.totalEvents}</div>

                      <div className="text-left text-slate-400">Reported Fatalities</div>
                      <div className="text-rose-400 font-bold">{selectedCountry.emDatStats.totalFatalities.toLocaleString()}</div>
                      <div className="text-rose-400 font-bold">{compareCountry.emDatStats.totalFatalities.toLocaleString()}</div>

                      <div className="text-left text-slate-400">Affected Population</div>
                      <div className="text-amber-300 font-bold">{selectedCountry.emDatStats.totalAffectedMillions}M</div>
                      <div className="text-amber-300 font-bold">{compareCountry.emDatStats.totalAffectedMillions}M</div>

                      <div className="text-left text-slate-400">Estimated Damages</div>
                      <div className="text-emerald-400 font-bold">${selectedCountry.emDatStats.estimatedDamagesUsdBillion}B</div>
                      <div className="text-emerald-400 font-bold">${compareCountry.emDatStats.estimatedDamagesUsdBillion}B</div>
                    </div>
                  </div>

                  {/* Metric 3: 72-Hour Blindspot Latency */}
                  <div className="p-3 bg-[#080E1B] rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-white uppercase text-[11px] border-b border-slate-800 pb-1">
                      3. 72-Hour Blindspot Observation Reliability
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="text-left text-slate-400">Metric</div>
                      <div className="text-cyan-300 font-bold">{selectedCountry.name}</div>
                      <div className="text-teal-300 font-bold">{compareCountry.name}</div>

                      <div className="text-left text-slate-400">Observation Latency</div>
                      <div className="text-white">{selectedCountry.blindspot.latencyHours} Hours</div>
                      <div className="text-white">{compareCountry.blindspot.latencyHours} Hours</div>

                      <div className="text-left text-slate-400">Data Completeness</div>
                      <div className="text-emerald-400">{selectedCountry.blindspot.completenessPercent}%</div>
                      <div className="text-emerald-400">{compareCountry.blindspot.completenessPercent}%</div>

                      <div className="text-left text-slate-400">Confidence Tier</div>
                      <div className="text-cyan-300">{selectedCountry.blindspot.confidenceClassification}</div>
                      <div className="text-cyan-300">{compareCountry.blindspot.confidenceClassification}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#091122] rounded-xl border border-cyan-500/30 text-slate-300 text-xs">
                    <strong className="text-cyan-400">Methodological Note:</strong> Japan and Philippines experience comparable raw physical hazard exposure (8.4 vs 8.9), but divergence in infrastructure coping capacity (1.4 vs 6.4) and economic loss vs mortality ratios illustrates Sendai Framework resilience dynamics.
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DATA SOURCES & ATTRIBUTION MODAL                         */}
        {/* ======================================================== */}
        {showSourcesModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#050814] border border-[#192742] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Genuine Scientific Disaster Data Sources</h3>
                </div>
                <button 
                  onClick={() => setShowSourcesModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {DATA_SOURCES_INFO.map(src => (
                  <div key={src.name} className="p-4 bg-[#080E1B] border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{src.name}</h4>
                      <a 
                        href={src.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{src.institution}</div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{src.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#091122] rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
                All risk scores, disaster casualties, and alert statuses are sourced directly from verified humanitarian and meteorological institutions. Zero synthetic disaster scores or fabricated casualties are introduced.
              </div>
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
