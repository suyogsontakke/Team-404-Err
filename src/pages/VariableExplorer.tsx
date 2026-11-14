import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cardEntranceVariants, containerStaggerVariants } from '../lib/animationVariants';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  ArrowRight, 
  ShieldCheck, 
  Info, 
  Sparkles, 
  Wind, 
  CloudRain, 
  Droplets, 
  Thermometer, 
  Sun, 
  Database, 
  Activity, 
  MapPin, 
  Search,
  CheckCircle2,
  X,
  Compass,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import PageContainer from '../components/PageContainer';
import { PRESET_LOCATIONS } from '../lib/nasaPowerService';

interface EnvironmentalLayer {
  id: string;
  name: string;
  variableKey: string;
  units: string;
  category: 'Air Quality & Aerosols' | 'Thermal & Boundary Layer' | 'Hydrometeorology & Cleansing';
  sensor: string;
  platform: string;
  resolution: string;
  temporalCoverage: string;
  nominalRange: string;
  thresholds: { label: string; value: string; color: string }[];
  gradient: string;
  legendTicks: string[];
  description: string;
  boundaryPhysics: string;
  healthImpact: string;
  defaultOpacity: number;
  isActive: boolean;
  isGriddedSpatial: boolean;
}

const INITIAL_LAYERS: EnvironmentalLayer[] = [
  {
    id: 'pm25',
    name: 'PM2.5 Surface Particulate Matter Column',
    variableKey: 'PM25',
    units: 'µg/m³',
    category: 'Air Quality & Aerosols',
    sensor: 'MODIS Aqua/Terra & Ground Photometer Assimilation',
    platform: 'NASA MERRA-2 Atmospheric Reanalysis',
    resolution: '0.5° × 0.625° Grid (~50 km)',
    temporalCoverage: '2001–2025 Daily Continuous',
    nominalRange: '0 to 350+ µg/m³',
    thresholds: [
      { label: 'Good (WHO Target)', value: '0 - 15 µg/m³', color: '#10b981' },
      { label: 'Moderate', value: '15 - 35 µg/m³', color: '#eab308' },
      { label: 'Unhealthy', value: '35 - 75 µg/m³', color: '#f97316' },
      { label: 'Severe Inversion', value: '> 75 µg/m³', color: '#ef4444' }
    ],
    gradient: 'linear-gradient(to right, #10b981 0%, #84cc16 20%, #eab308 40%, #f97316 60%, #ef4444 80%, #7e22ce 100%)',
    legendTicks: ['0', '15', '35', '75', '150+'],
    description: 'Fine respirable particulate matter with aerodynamic diameter ≤ 2.5 µm. Penetrates deeply into pulmonary alveoli and systemic arterial circulation.',
    boundaryPhysics: 'Accumulation is heavily controlled by thermal boundary layer dynamics. Nocturnal radiation cooling creates strong temperature inversion lids, trapping emissions in a shallow 150m surface layer.',
    healthImpact: 'WHO Guideline: 5 µg/m³ annual mean; 15 µg/m³ 24-hr mean. Extended exposure induces chronic cardiopulmonary mortality and systemic inflammation.',
    defaultOpacity: 85,
    isActive: true,
    isGriddedSpatial: true
  },
  {
    id: 'aod',
    name: 'Aerosol Optical Depth (AOD at 550nm)',
    variableKey: 'AOD550',
    units: 'Index (0.0 to 2.5)',
    category: 'Air Quality & Aerosols',
    sensor: 'MODIS, VIIRS, MISR & AERONET Sunphotometers',
    platform: 'NASA GMAO Atmospheric Aerosol Group',
    resolution: '0.5° × 0.625° Grid',
    temporalCoverage: '2001–2025 Daily',
    nominalRange: '0.02 to 2.50',
    thresholds: [
      { label: 'Clean Atmosphere', value: '< 0.10', color: '#06b6d4' },
      { label: 'Moderate Haze', value: '0.10 - 0.35', color: '#eab308' },
      { label: 'Dense Smog / Dust', value: '0.35 - 0.70', color: '#f97316' },
      { label: 'Extreme Smoke Plume', value: '> 0.70', color: '#dc2626' }
    ],
    gradient: 'linear-gradient(to right, #06b6d4 0%, #3b82f6 30%, #eab308 60%, #f97316 80%, #dc2626 100%)',
    legendTicks: ['0.0', '0.2', '0.5', '1.0', '2.5'],
    description: 'Dimensionless integral extinction coefficient of solar radiation at 550 nm across the entire vertical atmospheric column from ground to top-of-atmosphere.',
    boundaryPhysics: 'Direct proxy for total columnar particulate loading. High AOD combined with low boundary layer height signals hazardous ground-level PM2.5 concentrations.',
    healthImpact: 'Values above 0.40 correlate with substantial visibility reduction (< 3 km) and acute respiratory discomfort across urban basins.',
    defaultOpacity: 70,
    isActive: true,
    isGriddedSpatial: true
  },
  {
    id: 't2m',
    name: 'Near-Surface Air Temperature (T2M)',
    variableKey: 'T2M',
    units: '°C',
    category: 'Thermal & Boundary Layer',
    sensor: 'AIRS / CERES Sounders & Radiosonde In-Situ Array',
    platform: 'NASA POWER MERRA-2 Modern Assimilation',
    resolution: '0.5° × 0.625° Grid (~50 km)',
    temporalCoverage: '1981–2025 Daily Continuous',
    nominalRange: '-40 °C to +52 °C',
    thresholds: [
      { label: 'Sub-Zero', value: '< 0 °C', color: '#38bdf8' },
      { label: 'Temperate', value: '10 - 24 °C', color: '#10b981' },
      { label: 'Warm Subtropical', value: '25 - 34 °C', color: '#f59e0b' },
      { label: 'Extreme Heatwave', value: '> 40 °C', color: '#ef4444' }
    ],
    gradient: 'linear-gradient(to right, #0284c7 0%, #06b6d4 25%, #10b981 50%, #f59e0b 75%, #ef4444 100%)',
    legendTicks: ['-10°', '5°', '20°', '32°', '45°+'],
    description: 'Ambient kinetic temperature at 2 meters above terrain surface, representing the thermodynamic baseline of surface-atmosphere energy exchange.',
    boundaryPhysics: 'Drives thermal buoyancy convection and diurnal planetary boundary layer (PBL) expansion. In inland basins (Nagpur), extreme summer heating elevates PBL to 3,000m while winter cooling suppresses it to <200m.',
    healthImpact: 'Heat stress and thermal exhaustion indices scale exponentially when T2M exceeds 38°C with concurrent relative humidity > 50%.',
    defaultOpacity: 80,
    isActive: true,
    isGriddedSpatial: true
  },
  {
    id: 'ws10m',
    name: 'Atmospheric Wind Speed & Horizontal Dispersion (WS10M)',
    variableKey: 'WS10M',
    units: 'm/s',
    category: 'Thermal & Boundary Layer',
    sensor: 'Scatterometer Satellite Array & Coastal Doppler Radars',
    platform: 'MERRA-2 Planetary Boundary Layer Turbulence Module',
    resolution: '0.5° × 0.625° Grid',
    temporalCoverage: '2001–2025 Daily',
    nominalRange: '0.2 to 28.0 m/s',
    thresholds: [
      { label: 'Stagnant Calm (Hazardous)', value: '< 2.0 m/s', color: '#ef4444' },
      { label: 'Light Breeze', value: '2.0 - 4.5 m/s', color: '#f59e0b' },
      { label: 'Moderate Ventilation', value: '4.5 - 8.0 m/s', color: '#10b981' },
      { label: 'High Atmospheric Advection', value: '> 8.0 m/s', color: '#06b6d4' }
    ],
    gradient: 'linear-gradient(to right, #ef4444 0%, #f59e0b 30%, #10b981 65%, #06b6d4 100%)',
    legendTicks: ['0', '2', '5', '8', '15+'],
    description: 'Horizontal wind velocity magnitude 10 meters above surface. The primary meteorological driver of horizontal particulate advection and ventilation.',
    boundaryPhysics: 'Wind speeds below 2.0 m/s induce atmospheric stagnation crises. When horizontal transport is muted and vertical mixing is blocked, local PM2.5 accumulates at over 15 µg/m³ per hour.',
    healthImpact: 'Stagnant winds (<2 m/s) coincide with 84% of extreme particulate pollution emergencies recorded across continental plains.',
    defaultOpacity: 65,
    isActive: true,
    isGriddedSpatial: true
  },
  {
    id: 'prectotcorr',
    name: 'Precipitation Scavenging & Wet Deposition (PRECTOTCORR)',
    variableKey: 'PRECTOTCORR',
    units: 'mm/day',
    category: 'Hydrometeorology & Cleansing',
    sensor: 'GPM (Global Precipitation Measurement) & TRMM Ku/Ka Radar',
    platform: 'MERRA-2 Bias-Corrected GPCP V2.3 Assimilation',
    resolution: '0.5° × 0.625° Grid',
    temporalCoverage: '2001–2025 Daily',
    nominalRange: '0.0 to 95.0 mm/day',
    thresholds: [
      { label: 'Zero Rain (Dry Atmosphere)', value: '0 mm/day', color: '#94a3b8' },
      { label: 'Light Shower', value: '0.1 - 5 mm/day', color: '#38bdf8' },
      { label: 'Moderate Rain (Washout Active)', value: '5 - 20 mm/day', color: '#0284c7' },
      { label: 'Intense Monsoonal Deluge', value: '> 25 mm/day', color: '#6366f1' }
    ],
    gradient: 'linear-gradient(to right, #334155 0%, #38bdf8 30%, #0284c7 65%, #6366f1 100%)',
    legendTicks: ['0', '2', '10', '25', '50+'],
    description: 'Daily precipitation rate representing the most effective natural tropospheric scrubbing mechanism for water-soluble aerosols and fine particulate matter.',
    boundaryPhysics: 'Wet scavenging (rainout within clouds and washout below clouds) removes up to 75% of atmospheric PM2.5 mass within 4 hours of convective precipitation onset.',
    healthImpact: 'Post-monsoon seasonal transitions frequently see air quality improve from Severe to Good within 24 hours of sustained rainfall.',
    defaultOpacity: 75,
    isActive: true,
    isGriddedSpatial: true
  },
  {
    id: 'rh2m',
    name: 'Relative Humidity & Hygroscopic Aerosol Growth (RH2M)',
    variableKey: 'RH2M',
    units: '%',
    category: 'Hydrometeorology & Cleansing',
    sensor: 'AIRS Sounder Infrared Profiler',
    platform: 'NASA MERRA-2 Humidity Engine',
    resolution: '0.5° × 0.625° Grid',
    temporalCoverage: '2001–2025 Daily',
    nominalRange: '8% to 100%',
    thresholds: [
      { label: 'Arid / Dry', value: '< 30%', color: '#f59e0b' },
      { label: 'Optimal Human Comfort', value: '40 - 60%', color: '#10b981' },
      { label: 'High Moisture (Hygroscopic Swelling)', value: '70 - 85%', color: '#06b6d4' },
      { label: 'Saturated Fog / Smog Formation', value: '> 90%', color: '#8b5cf6' }
    ],
    gradient: 'linear-gradient(to right, #f59e0b 0%, #10b981 35%, #06b6d4 70%, #8b5cf6 100%)',
    legendTicks: ['10%', '35%', '60%', '80%', '100%'],
    description: 'Ratio of water vapor partial pressure to saturation vapor pressure at 2m height.',
    boundaryPhysics: 'When RH exceeds 70%, deliquescent sulfate and nitrate particles absorb atmospheric moisture, swelling rapidly in diameter and transitioning from PM1.0 into light-scattering PM2.5.',
    healthImpact: 'High humidity combined with elevated PM2.5 produces toxic acidic aerosol droplets that aggravate bronchial asthma and COPD.',
    defaultOpacity: 60,
    isActive: true,
    isGriddedSpatial: true
  },
  {
    id: 'allsky_kt',
    name: 'Atmospheric Clearness Index (ALLSKY_KT)',
    variableKey: 'ALLSKY_KT',
    units: 'Fraction (0.0 to 1.0)',
    category: 'Air Quality & Aerosols',
    sensor: 'CERES Satellite Radiometer & Solar Pyranometer Grid',
    platform: 'NASA POWER Surface Radiation Budget (SRB)',
    resolution: '0.5° × 0.625° Grid',
    temporalCoverage: '2001–2025 Daily',
    nominalRange: '0.08 to 0.82',
    thresholds: [
      { label: 'Opaque Smog / Overcast', value: '< 0.30', color: '#64748b' },
      { label: 'Moderate Transmissivity', value: '0.30 - 0.55', color: '#eab308' },
      { label: 'Clear Sky Irradiance', value: '> 0.65', color: '#10b981' }
    ],
    gradient: 'linear-gradient(to right, #475569 0%, #64748b 30%, #eab308 70%, #facc15 100%)',
    legendTicks: ['0.1', '0.3', '0.5', '0.7', '0.8+'],
    description: 'Ratio of downwelling surface global solar irradiance to extraterrestrial solar irradiance at the top of the atmospheric column.',
    boundaryPhysics: 'Directly sensitive to aerosol extinction and cloud optical depth. Persistent drops in Kt under cloud-free conditions confirm heavy aerosol pollution.',
    healthImpact: 'Dimming of surface ultraviolet radiation alters photo-chemical smog generation and reduces natural vitamin D synthesis.',
    defaultOpacity: 50,
    isActive: false,
    isGriddedSpatial: true
  },
  {
    id: 'gwettop',
    name: 'Top-Layer Soil Moisture & Dust Resuspension (GWETTOP)',
    variableKey: 'GWETTOP',
    units: 'Fraction (0.0 to 1.0)',
    category: 'Hydrometeorology & Cleansing',
    sensor: 'SMAP (Soil Moisture Active Passive) & AMSR-2',
    platform: 'MERRA-2 Catchment Land Surface Model',
    resolution: '0.5° × 0.625° Grid',
    temporalCoverage: '2001–2025 Daily',
    nominalRange: '0.02 to 0.98',
    thresholds: [
      { label: 'Hyper-Arid (Dust Risk High)', value: '< 0.15', color: '#ef4444' },
      { label: 'Dry Surface', value: '0.15 - 0.35', color: '#f59e0b' },
      { label: 'Adequate Moisture', value: '0.35 - 0.70', color: '#10b981' },
      { label: 'Saturated Soil', value: '> 0.70', color: '#06b6d4' }
    ],
    gradient: 'linear-gradient(to right, #b45309 0%, #d97706 30%, #10b981 70%, #06b6d4 100%)',
    legendTicks: ['0.0', '0.2', '0.4', '0.7', '1.0'],
    description: 'Volumetric soil moisture in top 5 cm surface crust, dictating aeolian dust emission thresholds and surface latent heat flux.',
    boundaryPhysics: 'When topsoil moisture drops below 0.15, aerodynamic shear stress easily lofts mineral dust into the boundary layer, massively spiking local PM10 and PM2.5.',
    healthImpact: 'Mineral dust plumes carry silica and trace fungal spores, triggering severe allergic rhinitis and desert lung syndrome.',
    defaultOpacity: 50,
    isActive: false,
    isGriddedSpatial: true
  }
];

export default function VariableExplorer() {
  const navigate = useNavigate();
  const [layers, setLayers] = useState<EnvironmentalLayer[]>(INITIAL_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('pm25');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testLocation, setTestLocation] = useState(PRESET_LOCATIONS[0]); // Nagpur default

  const activeLayer = layers.find(l => l.id === selectedLayerId) || layers[0];
  const activeCount = layers.filter(l => l.isActive).length;

  // Toggle layer visibility
  const toggleLayerActive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLayers(prev => prev.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l));
  };

  // Update layer opacity
  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };

  // Reset all layers
  const clearAllLayers = () => {
    setLayers(prev => prev.map(l => ({ ...l, isActive: false })));
  };

  const activateAllLayers = () => {
    setLayers(prev => prev.map(l => ({ ...l, isActive: true })));
  };

  // Filtered layers
  const filteredLayers = layers.filter(l => {
    const matchesCat = categoryFilter === 'ALL' || l.category === categoryFilter;
    const matchesQuery = !searchQuery.trim() || 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.variableKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.sensor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <PageContainer title="Environmental Layers Control">
      <div className="space-y-5">

        {/* 1. TOP MAC-STYLE TELEMETRY CONTROL BAR (Inspired by Ref 2 & 3) */}
        <motion.div 
          variants={cardEntranceVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#050814] border border-[#152238] rounded-xl p-4 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Cyber Grid Glow */}
          <div className="absolute inset-0 bg-radial from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            {/* Left: Window Dots & Header */}
            <div className="flex items-center gap-3">
              {/* Mac Traffic Lights */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-red-500/90 inline-block shadow-sm"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/90 inline-block shadow-sm"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block shadow-sm"></span>
              </div>

              <div className="h-5 w-px bg-[#1e2f4d] hidden sm:block"></div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    NASA Earth Observing System (EOS)
                  </span>
                  <span className="px-1.5 py-0.5 bg-cyan-950/80 text-cyan-300 text-[9px] font-mono rounded border border-cyan-700/60 font-semibold">
                    ACTIVE LAYERS: {activeCount} / {layers.length}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                  <span>Environmental & Atmospheric Layers Deck</span>
                  <span className="text-xs font-mono font-normal text-slate-400 hidden sm:inline">
                    · Multi-Sensor Satellite Blending Engine
                  </span>
                </h1>
              </div>
            </div>

            {/* Right: Quick Actions & Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <button
                onClick={activateAllLayers}
                className="px-2.5 py-1.5 bg-[#091122] hover:bg-[#0e1a35] text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
              >
                Enable All
              </button>
              <button
                onClick={clearAllLayers}
                className="px-2.5 py-1.5 bg-[#091122] hover:bg-[#0e1a35] text-slate-400 hover:text-white border border-[#1a2844] rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <Link
                to="/earth-explorer"
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-slate-950" />
                <span>View on Geospatial Map</span>
              </Link>
            </div>
          </div>

          {/* Sub-toolbar: Search & Category Tabs */}
          <div className="mt-4 pt-3 border-t border-[#152238] flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search atmospheric layers, sensors, or units..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#081020] border border-[#192742] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Layers (8)' },
                { id: 'Air Quality & Aerosols', label: 'Air Quality & PM2.5' },
                { id: 'Thermal & Boundary Layer', label: 'Thermal & Winds' },
                { id: 'Hydrometeorology & Cleansing', label: 'Hydrology & Rain' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                      : 'bg-[#081020] text-slate-400 hover:text-white hover:bg-[#0c1830] border border-[#152238]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 2. MAIN WORKSPACE: DUAL SPLIT (LAYER CARDS DECK & DEEP DIVE TELEMETRY) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: INTERACTIVE LAYER STACK (Matching Ref 2 & 3) */}
          <motion.div 
            variants={cardEntranceVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Selectable Layer Deck</span>
              </span>
              <span>{filteredLayers.length} Available</span>
            </div>

            <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {filteredLayers.map((layer) => {
                const isSelected = layer.id === activeLayer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`rounded-xl border p-3.5 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#091328] border-cyan-500/80 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-500/30'
                        : 'bg-[#060b18] border-[#14213d] hover:border-[#1e345e] hover:bg-[#081022]'
                    }`}
                  >
                    {/* Active Layer Side Accent Strip */}
                    {layer.isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-emerald-400"></div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-800/60">
                            {layer.variableKey}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase truncate">
                            {layer.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white tracking-tight mt-1 truncate">
                          {layer.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                          <span>Unit: <strong className="text-white">{layer.units}</strong></span>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold">{layer.platform.split(' ')[0]} L3</span>
                        </div>
                      </div>

                      {/* On/Off Toggle Switch */}
                      <button
                        onClick={(e) => toggleLayerActive(layer.id, e)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 border ${
                          layer.isActive
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-600/60 hover:bg-emerald-900'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                        title={layer.isActive ? "Hide Layer" : "Show Layer"}
                      >
                        {layer.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Gradient Color Ramp Bar Preview */}
                    <div className="mt-3 space-y-1">
                      <div 
                        className="h-2 rounded-full w-full opacity-90 shadow-inner"
                        style={{ background: layer.gradient }}
                      ></div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>{layer.legendTicks[0]}</span>
                        <span>{layer.legendTicks[Math.floor(layer.legendTicks.length / 2)]}</span>
                        <span>{layer.legendTicks[layer.legendTicks.length - 1]}</span>
                      </div>
                    </div>

                    {/* Opacity Control Slider (matching IntMap & Meteo Ref 2 & 3) */}
                    {layer.isActive && (
                      <div className="mt-2.5 pt-2 border-t border-[#152238] flex items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                          <span>Opacity</span>
                        </span>
                        <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={layer.defaultOpacity}
                            onChange={(e) => setLayerOpacity(layer.id, parseInt(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="font-bold text-white w-7 text-right">
                            {layer.defaultOpacity}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT COLUMN: DEEP DIVE SPECIFICATION & ATMOSPHERIC COUPLING */}
          <motion.div 
            variants={cardEntranceVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-4"
          >
            
            {/* Active Layer Dossier Card */}
            <div className="bg-[#050814] border border-[#152238] rounded-xl p-5 shadow-2xl space-y-5 relative">
              
              {/* Header with Title & Quick Investigation Button */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#152238] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                      {activeLayer.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      IDENTIFIER: {activeLayer.variableKey}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeLayer.name}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                    {activeLayer.description}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/trend-detective?param=${activeLayer.variableKey}`)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-cyan-950/60 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-slate-950" />
                    <span>Investigate Trend</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </button>

                  <button
                    onClick={() => navigate(`/ai-insights?param=${activeLayer.variableKey}`)}
                    className="px-3.5 py-1.5 bg-[#091122] hover:bg-[#0f1b34] text-purple-300 border border-purple-500/40 font-mono text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>AI Climate Intelligence</span>
                  </button>
                </div>
              </div>

              {/* Technical Specifications Matrix (Ref 1 & 3) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-[#080f1e] p-3 rounded-lg border border-[#17253d]">
                  <div className="text-[10px] uppercase text-slate-500">Physical Unit</div>
                  <div className="text-sm font-bold text-white mt-0.5">{activeLayer.units}</div>
                </div>
                <div className="bg-[#080f1e] p-3 rounded-lg border border-[#17253d]">
                  <div className="text-[10px] uppercase text-slate-500">Nominal Range</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">{activeLayer.nominalRange}</div>
                </div>
                <div className="bg-[#080f1e] p-3 rounded-lg border border-[#17253d]">
                  <div className="text-[10px] uppercase text-slate-500">Native Resolution</div>
                  <div className="text-xs font-bold text-cyan-300 mt-1 truncate">{activeLayer.resolution}</div>
                </div>
                <div className="bg-[#080f1e] p-3 rounded-lg border border-[#17253d]">
                  <div className="text-[10px] uppercase text-slate-500">Observing Sensors</div>
                  <div className="text-xs text-slate-300 mt-0.5 font-sans truncate">{activeLayer.sensor}</div>
                </div>
                <div className="bg-[#080f1e] p-3 rounded-lg border border-[#17253d]">
                  <div className="text-[10px] uppercase text-slate-500">Assimilation Engine</div>
                  <div className="text-xs text-slate-300 mt-0.5 font-sans truncate">{activeLayer.platform}</div>
                </div>
                <div className="bg-[#080f1e] p-3 rounded-lg border border-[#17253d]">
                  <div className="text-[10px] uppercase text-slate-500">Temporal Period</div>
                  <div className="text-xs text-emerald-400 mt-0.5">{activeLayer.temporalCoverage}</div>
                </div>
              </div>

              {/* Spectral Legend & Severity Scale Bar (matching Reference 3 & 4) */}
              <div className="bg-[#080f1e] p-4 rounded-lg border border-[#17253d] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Spectral Measurement Color Ramp</span>
                  </span>
                  <span className="text-slate-400">Scale: {activeLayer.units}</span>
                </div>

                <div className="space-y-1.5">
                  <div 
                    className="h-3.5 rounded-lg w-full shadow-md"
                    style={{ background: activeLayer.gradient }}
                  ></div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold px-0.5">
                    {activeLayer.legendTicks.map((tick, i) => (
                      <span key={i}>{tick}</span>
                    ))}
                  </div>
                </div>

                {/* Level Categorization Tiles (Ref 1 Amoy levels) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {activeLayer.thresholds.map((t, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#060b14] border border-[#17253d] p-2 rounded text-left font-mono"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                        <span className="text-[10px] text-slate-300 font-bold truncate">{t.label}</span>
                      </div>
                      <div className="text-[11px] font-bold text-white mt-0.5">{t.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atmospheric Boundary Layer Dynamics Callout */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Boundary Layer Dynamics & Atmospheric Physics</span>
                </h4>
                <div className="bg-[#080f1e] p-4 rounded-lg border border-[#17253d] text-xs text-slate-300 leading-relaxed font-sans">
                  {activeLayer.boundaryPhysics}
                </div>
              </div>

              {/* Public Health & Scientific Guidance */}
              <div className="bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 border border-emerald-500/30 p-4 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wider">
                    Scientific & Public Health Benchmark
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeLayer.healthImpact}
                  </p>
                </div>
              </div>

            </div>

            {/* Quick Test Station Inspector (Nagpur vs Global) */}
            <div className="bg-[#050814] border border-[#152238] rounded-xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Probe Layer at Reference Atmospheric Stations</span>
                </span>
                <span className="text-slate-500 text-[10px]">NASA POWER In-Situ Grid</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_LOCATIONS.slice(0, 4).map(loc => (
                  <button
                    key={loc.name}
                    onClick={() => setTestLocation(loc)}
                    className={`p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer ${
                      testLocation.name === loc.name
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-950/60'
                        : 'bg-[#080f1e] border-[#17253d] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] text-cyan-400 font-bold uppercase">{loc.region}</div>
                    <div className="text-xs font-bold text-white truncate">{loc.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </motion.div>

        </div>

      </div>
    </PageContainer>
  );
}
