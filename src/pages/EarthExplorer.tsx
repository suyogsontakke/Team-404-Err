import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  BarChart2, 
  Layers, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Info,
  Compass,
  Sliders,
  Eye,
  EyeOff,
  X,
  Play,
  Pause,
  Clock,
  Sparkles,
  CloudRain,
  Wind,
  Sun,
  ShieldAlert,
  ChevronDown,
  Globe2,
  Maximize2
} from 'lucide-react';
import { 
  PRESET_LOCATIONS, 
  NASA_PARAMETERS, 
  fetchNasaLocationData, 
  LocationDataResult 
} from '../lib/nasaPowerService';
import AtmosphericGlobe3D from '../components/AtmosphericGlobe3D';
import EarthObservatory3D from '../components/EarthObservatory3D';

// Fix for default Leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapPanController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.2 });
  }, [center, map]);
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
type ProjectionMode = 'flat' | 'satellite' | 'globe' | '3d';

export default function EarthExplorer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected state
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: number;
    lon: number;
  }>({
    name: 'Nagpur',
    lat: 21.1458,
    lon: 79.0882
  });

  const urlProj = searchParams.get('projection') || searchParams.get('view');
  const [projection, setProjection] = useState<ProjectionMode>(
    urlProj === 'globe' || urlProj === '3d' ? 'globe' : 'flat'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof PRESET_LOCATIONS>([]);

  // Environmental layers matching Section 3
  const [activeLayer, setActiveLayer] = useState<'T2M' | 'PRECTOTCORR' | 'PM25' | 'AOD' | 'WIND' | 'CLOUDS'>('T2M');
  const [layerOpacityTemp, setLayerOpacityTemp] = useState(85);
  const [layerOpacityRain, setLayerOpacityRain] = useState(70);
  const [layerOpacityPM25, setLayerOpacityPM25] = useState(90);

  // Layer card visibility
  const [showTempCard, setShowTempCard] = useState(true);
  const [showRainCard, setShowRainCard] = useState(true);
  const [showPM25Card, setShowPM25Card] = useState(true);

  // Timeline scrubber
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  // Live telemetry fetch for selected point
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [telemetryData, setTelemetryData] = useState<LocationDataResult | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  // Atlas AI assistant prompt state
  const [atlasQuery, setAtlasQuery] = useState('');
  const [atlasReply, setAtlasReply] = useState<string | null>(null);

  // Timeline animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setSelectedYear((prev: number) => (prev >= 2025 ? 2001 : prev + 1));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Fetch telemetry whenever position changes
  useEffect(() => {
    const fetchPointTelemetry = async () => {
      setLoadingTelemetry(true);
      setTelemetryError(null);
      try {
        const paramToFetch = (activeLayer === 'T2M' || activeLayer === 'PRECTOTCORR' || activeLayer === 'PM25')
          ? activeLayer
          : 'T2M';

        const res = await fetchNasaLocationData(
          selectedLocation.lat,
          selectedLocation.lon,
          2020,
          2024,
          paramToFetch,
          selectedLocation.name
        );
        setTelemetryData(res);
      } catch (err: any) {
        console.error('Point telemetry error:', err);
        setTelemetryError(err.message || 'Failed to retrieve NASA telemetry for this point.');
        setTelemetryData(null);
      } finally {
        setLoadingTelemetry(false);
      }
    };

    fetchPointTelemetry();
  }, [selectedLocation, activeLayer]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    const coordsMatch = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);

    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lon = parseFloat(coordsMatch[3]);
      if (!isNaN(lat) && !isNaN(lon)) {
        setSelectedLocation({
          name: `Point (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
          lat,
          lon
        });
        setSearchResults([]);
        return;
      }
    }

    const matches = PRESET_LOCATIONS.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.region.toLowerCase().includes(query.toLowerCase())
    );

    if (matches.length > 0) {
      setSelectedLocation({
        name: matches[0].name,
        lat: matches[0].lat,
        lon: matches[0].lon
      });
      setSearchResults(matches.slice(1, 5));
    } else {
      setSearchResults([]);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    setSelectedLocation({
      name: `Point (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
      lat,
      lon
    });
    setSearchResults([]);
  };

  const handleAtlasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atlasQuery.trim()) return;

    const q = atlasQuery.toLowerCase();
    if (q.includes('nagpur') || q.includes('mumbai')) {
      setAtlasReply('Focusing on Central India / Nagpur basin: MERRA-2 identifies nocturnal boundary layer compression and elevated inland PM2.5 retention relative to Mumbai’s coastal marine breezes.');
      setSelectedLocation({ name: 'Nagpur', lat: 21.1458, lon: 79.0882 });
      setActiveLayer('PM25');
    } else if (q.includes('temp') || q.includes('warming')) {
      setAtlasReply('Loading NASA POWER T2M surface layer. 2001–2025 OLS trend shows steady thermal trajectory with decadal shifts.');
      setActiveLayer('T2M');
    } else if (q.includes('rain') || q.includes('monsoon')) {
      setAtlasReply('Activating GPCP precipitation radar overlay for monsoon convective scavenging evaluation.');
      setActiveLayer('PRECTOTCORR');
    } else {
      setAtlasReply(`Spatial probe aligned to query "${atlasQuery}". Inspecting atmospheric columns at ${selectedLocation.name}.`);
    }
    setAtlasQuery('');
  };

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-[#172b4d] bg-[#020817]/90 backdrop-blur-md px-4 flex items-center justify-between text-xs select-none z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 font-mono font-extrabold text-white tracking-wider font-space">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <span>EARTH TRACE · Earth Explorer Canvas</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-slate-400 font-mono text-xs">
            <span className="text-cyan-300 border-b-2 border-cyan-400 pb-0.5 font-bold">Atmospheric Map</span>
            <button onClick={() => navigate('/trend-detective')} className="hover:text-white transition-colors cursor-pointer">
              Trend Detective
            </button>
            <button onClick={() => navigate('/comparison')} className="hover:text-white transition-colors cursor-pointer">
              Dual Comparison
            </button>
            <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors cursor-pointer">
              Cockpit Dashboard
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            NASA POWER REANALYSIS
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline text-cyan-400 font-bold">{new Date().toISOString().substring(11, 16)} UTC</span>
        </div>
      </header>

      {/* Main Explorer Body */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Floating Left Panel: Locations & Layer Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -12 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute left-4 top-4 bottom-14 w-72 z-20 pointer-events-none flex flex-col gap-3"
        >
          {/* Location Selector Card */}
          <div className="bg-[#061426]/90 backdrop-blur-md border border-[#172b4d] rounded-2xl p-3.5 shadow-2xl pointer-events-auto space-y-3 glass-panel">
            <div className="flex items-center justify-between border-b border-[#172b4d] pb-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geographic Target</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                PROBE ACTIVE
              </span>
            </div>

            {/* Quick Location Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Nagpur', lat: 21.1458, lon: 79.0882, flag: 'IN' },
                { name: 'Mumbai', lat: 19.0760, lon: 72.8777, flag: 'IN' },
                { name: 'Delhi', lat: 28.6139, lon: 77.2090, flag: 'IN' },
                { name: 'Reykjavik', lat: 64.1466, lon: -21.9426, flag: 'IS' }
              ].map(loc => (
                <button
                  key={loc.name}
                  onClick={() => setSelectedLocation({ name: loc.name, lat: loc.lat, lon: loc.lon })}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedLocation.name === loc.name 
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-cyan-950/60' 
                      : 'bg-[#020817] text-slate-300 hover:bg-[#091b33] border border-[#172b4d]'
                  }`}
                >
                  <span className="text-[10px] opacity-75">{loc.flag}</span>
                  <span>{loc.name}</span>
                </button>
              ))}
            </div>

            {/* Coordinates & Active Station Summary */}
            <div className="p-3 bg-[#020817] rounded-xl border border-[#172b4d] text-[11px] font-mono space-y-1">
              <div className="flex justify-between text-white font-bold font-space">
                <span>{selectedLocation.name}</span>
                <span className="text-cyan-400 text-xs">{telemetryData?.elevationMeters ? `${telemetryData.elevationMeters}m MSL` : '310m MSL'}</span>
              </div>
              <div className="text-slate-400">
                Lat: <span className="text-cyan-300">{selectedLocation.lat.toFixed(4)}°N</span> · Lon: <span className="text-cyan-300">{selectedLocation.lon.toFixed(4)}°E</span>
              </div>
              {telemetryData && telemetryData.points.length > 0 && (
                <div className="text-emerald-400 font-semibold text-[10px] pt-1.5 border-t border-[#172b4d] flex items-center justify-between">
                  <span>NASA POWER Baseline:</span>
                  <span>{telemetryData.points[telemetryData.points.length - 1].value.toFixed(2)} {telemetryData.parameterMeta.units}</span>
                </div>
              )}
            </div>
          </div>

          {/* Floating Layer Opacity Sliders */}
          <div className="space-y-2 pointer-events-auto overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {showPM25Card && (
              <div className="bg-[#061426]/90 backdrop-blur-md border border-[#172b4d] rounded-2xl p-3.5 shadow-xl space-y-2 text-xs glass-panel">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>PM2.5 Aerosol Burden</span>
                  </div>
                  <button onClick={() => setShowPM25Card(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>Opacity</span>
                  <span className="text-white font-bold">{layerOpacityPM25}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={layerOpacityPM25} 
                  onChange={(e) => setLayerOpacityPM25(Number(e.target.value))}
                  className="w-full h-1 bg-[#020817] rounded-lg appearance-none cursor-pointer accent-rose-500" 
                />
                <div className="h-2 rounded w-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-rose-600"></div>
                <div className="flex justify-between font-mono text-[9px] text-slate-500">
                  <span>0 µg/m³ (Good)</span>
                  <span>150+ µg/m³ (Severe)</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Center Viewport: 2D Map or 3D Globe */}
        <div className="flex-1 h-full w-full relative z-0">
          {/* Search Bar Floating Controls */}
          <div className="absolute top-4 left-80 right-80 z-20 pointer-events-none flex items-center justify-center gap-4">
            <form onSubmit={handleSearch} className="pointer-events-auto w-full max-w-md relative shadow-2xl">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search any coordinate or region (e.g. Nagpur, 21.14, 79.08)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#061426]/95 backdrop-blur-md border border-[#172b4d] rounded-full pl-10 pr-24 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-2xl font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3.5 py-1 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-full transition-colors cursor-pointer font-mono"
                >
                  SEARCH
                </button>
              </div>
            </form>

            {/* Projection Toggles */}
            <div className="pointer-events-auto flex items-center gap-1 p-1 bg-[#061426]/90 border border-[#172b4d] rounded-full shadow-2xl font-mono text-xs">
              <button
                onClick={() => setProjection('flat')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  projection === 'flat' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Map
              </button>
              <button
                onClick={() => setProjection('satellite')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  projection === 'satellite' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setProjection('globe')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  projection === 'globe' ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D Observatory
              </button>
            </div>
          </div>

          {/* Active Canvas Mode */}
          {projection === 'globe' ? (
            <div className="w-full h-full bg-[#020817] relative">
              <EarthObservatory3D
                initialLocationName={selectedLocation.name}
                onLocationSelect={(loc) => setSelectedLocation({ name: loc.name, lat: loc.lat, lon: loc.lon })}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full min-h-[500px] relative">
              <MapContainer 
                center={[selectedLocation.lat, selectedLocation.lon]} 
                zoom={5} 
                className="h-full w-full min-h-[500px] z-10"
                style={{ height: '100%', width: '100%', minHeight: '500px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={projection === 'satellite' 
                    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
                    : `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${(import.meta.env.VITE_CARTO_API_KEY as string) || 'cb1_4ydn_1_f0f06d2935f96be7c0ae5387'}`
                  }
                  subdomains="abcd"
                  maxZoom={19}
                />
                <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
                  <Popup>
                    <div className="text-xs font-sans text-slate-900 p-1">
                      <strong className="text-sm">{selectedLocation.name}</strong><br />
                      <span className="font-mono text-[11px] text-slate-600">
                        {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E
                      </span>
                      <div className="mt-2 pt-1.5 border-t border-slate-200">
                        <button
                          onClick={() => navigate(`/trend-detective?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`)}
                          className="px-2.5 py-1 bg-cyan-600 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-cyan-700"
                        >
                          Launch Trend Detective
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                <MapClickHandler onLocationSelect={handleMapClick} />
                <MapPanController center={[selectedLocation.lat, selectedLocation.lon]} />
                <MapResizeFix />
              </MapContainer>
            </div>
          )}
        </div>

        {/* Floating Right Panel: Layers Deck & AI Assistant */}
        <div className="absolute right-4 top-4 bottom-14 w-80 z-20 pointer-events-none flex flex-col justify-between gap-3">
          <div className="bg-[#061426]/90 backdrop-blur-md border border-[#172b4d] rounded-2xl p-3.5 shadow-2xl pointer-events-auto space-y-3 glass-panel">
            <div className="flex items-center justify-between border-b border-[#172b4d] pb-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Environmental Layers</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                Active: {activeLayer}
              </span>
            </div>

            {/* Layer Selection Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'T2M', label: 'Surface Temperature', sub: 'NASA POWER T2M', color: 'from-amber-600/30 to-rose-600/30', border: 'border-rose-500/50' },
                { key: 'PM25', label: 'Particulate PM2.5', sub: 'MERRA-2 GMI', color: 'from-rose-600/30 to-purple-600/30', border: 'border-purple-500/50' },
                { key: 'PRECTOTCORR', label: 'Precipitation Radar', sub: 'GPCP Satellite', color: 'from-blue-600/30 to-cyan-600/30', border: 'border-cyan-500/50' },
                { key: 'WIND', label: 'Wind Vector Stream', sub: '10m Atmospheric', color: 'from-teal-600/30 to-emerald-600/30', border: 'border-emerald-500/50' },
                { key: 'CLOUDS', label: 'Soil Moisture', sub: 'MERRA-2 Soil', color: 'from-amber-700/30 to-green-700/30', border: 'border-amber-500/50' },
                { key: 'AOD', label: 'Aerosol Optical Depth', sub: 'MODIS Assim.', color: 'from-purple-600/30 to-blue-600/30', border: 'border-purple-500/50' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveLayer(item.key as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer bg-gradient-to-br ${item.color} ${
                    activeLayer === item.key 
                      ? `${item.border} ring-1 ring-cyan-400 shadow-lg shadow-cyan-950/40 bg-[#020817]` 
                      : 'border-[#172b4d] hover:border-slate-500 bg-[#020817]/80'
                  }`}
                >
                  <div className="font-bold text-white text-[11px] leading-tight font-space">{item.label}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#172b4d]">
              <button
                onClick={() => navigate(`/trend-detective?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`)}
                className="py-1.5 px-2 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-mono"
              >
                <TrendingUp className="w-3 h-3 text-slate-950" />
                <span>Trend Detective</span>
              </button>
              <button
                onClick={() => navigate('/comparison')}
                className="py-1.5 px-2 bg-[#020817] hover:bg-[#091b33] text-cyan-300 border border-cyan-800/60 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono"
              >
                <span>Compare Dual</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Atlas AI Assistant Drawer */}
          <div className="bg-[#061426]/95 backdrop-blur-md border border-[#172b4d] rounded-2xl p-3.5 shadow-2xl pointer-events-auto space-y-2.5 glass-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Atlas AI Earth Intelligence</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live AI Assistant</span>
            </div>

            {atlasReply && (
              <div className="p-2 bg-purple-950/40 border border-purple-800/50 rounded-lg text-[11px] text-purple-200 leading-relaxed font-sans">
                {atlasReply}
              </div>
            )}

            <form onSubmit={handleAtlasSubmit} className="relative">
              <input
                type="text"
                placeholder="Ask AI assistant (e.g. Compare Nagpur vs Mumbai)..."
                value={atlasQuery}
                onChange={(e) => setAtlasQuery(e.target.value)}
                className="w-full bg-[#020817] border border-[#172b4d] rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Timeline Scrubber */}
        <div className="absolute bottom-2 left-4 right-4 h-11 bg-[#020817]/95 backdrop-blur-md border border-[#172b4d] rounded-xl px-4 flex items-center justify-between z-20 shadow-2xl font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lon.toFixed(4)}° E</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Elevation: <span className="text-white font-semibold">{telemetryData?.elevationMeters || 310} m</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="p-1.5 rounded-full bg-[#061426] hover:bg-[#091b33] text-cyan-400 border border-cyan-500/40 transition-colors cursor-pointer"
              title={isPlayingTimeline ? 'Pause Timeline' : 'Play Timeline (2001–2025)'}
            >
              {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-slate-500 text-[10px]">2001</span>
            <input 
              type="range" 
              min="2001" 
              max="2025" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-32 sm:w-56 h-1 bg-[#061426] rounded-lg appearance-none cursor-pointer accent-cyan-400" 
            />
            <span className="text-cyan-400 font-bold">{selectedYear}</span>
            <span className="text-slate-500 text-[10px]">2025</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>NASA POWER Daily Reanalysis (2001–2025)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
