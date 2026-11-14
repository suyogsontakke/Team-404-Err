/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Compass,
  Sliders,
  Play,
  Pause,
  Clock,
  Globe2,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { 
  PRESET_LOCATIONS, 
  NASA_PARAMETERS, 
  fetchNasaLocationData, 
  LocationDataResult 
} from '../lib/nasaPowerService';
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
    map.flyTo(center, map.getZoom(), { duration: 1.0 });
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

type ProjectionMode = 'flat' | 'satellite' | 'globe';

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

  const [activeLayer, setActiveLayer] = useState<'T2M' | 'PM25' | 'PRECTOTCORR' | 'WIND' | 'AOD'>('PM25');
  const [layerOpacity, setLayerOpacity] = useState<number>(80);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [telemetryData, setTelemetryData] = useState<LocationDataResult | null>(null);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);

  // Fetch telemetry
  useEffect(() => {
    let active = true;
    fetchNasaLocationData(selectedLocation.lat, selectedLocation.lon, 2018, 2024, 'PM25')
      .then(res => {
        if (active) setTelemetryData(res);
      })
      .catch(console.error);
    return () => { active = false; };
  }, [selectedLocation.lat, selectedLocation.lon]);

  // Timeline playback
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const timer = setInterval(() => {
      setSelectedYear(y => y >= 2025 ? 2001 : y + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlayingTimeline]);

  const handleMapClick = (lat: number, lon: number) => {
    setSelectedLocation({
      name: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
      lat,
      lon
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = PRESET_LOCATIONS.find(loc => 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.region.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      setSelectedLocation({ name: matched.name, lat: matched.lat, lon: matched.lon });
    } else {
      const parts = searchQuery.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setSelectedLocation({ name: `${parts[0].toFixed(2)}°N, ${parts[1].toFixed(2)}°E`, lat: parts[0], lon: parts[1] });
      }
    }
  };

  const layerOptions = [
    { key: 'PM25', label: 'PM2.5 Particulate', units: 'µg/m³', range: '0 - 150 µg/m³', color: '#F16C72' },
    { key: 'T2M', label: 'Surface Temperature', units: '°C', range: '-10 - 45 °C', color: '#F0B44D' },
    { key: 'PRECTOTCORR', label: 'Precipitation Scavenging', units: 'mm/d', range: '0 - 30 mm/d', color: '#8296B5' },
    { key: 'WIND', label: 'Wind Velocity', units: 'm/s', range: '0 - 15 m/s', color: '#A6B7D4' },
    { key: 'AOD', label: 'Aerosol Optical Depth', units: 'Index', range: '0 - 2.5', color: '#35C98B' }
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#171B2B] text-[#F0EBDD] font-sans overflow-hidden">
      
      {/* Top Toolbar: Search, Projection Toggles & Coordinates */}
      <div className="h-12 border-b border-[#48516A] bg-[#232A3D] px-4 flex items-center justify-between text-xs gap-3 shrink-0 z-20">
        
        {/* Left: View Mode / Projection Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-[#1D2436] border border-[#48516A] rounded-lg font-mono">
          <button
            onClick={() => setProjection('flat')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              projection === 'flat' 
                ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' 
                : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
            }`}
          >
            2D Map
          </button>
          <button
            onClick={() => setProjection('satellite')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              projection === 'satellite' 
                ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' 
                : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setProjection('globe')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              projection === 'globe' 
                ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' 
                : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
            }`}
          >
            3D Globe
          </button>
        </div>

        {/* Center: Search Coordinates or Station */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#838FA3]" />
          <input 
            type="text"
            placeholder="Search station or coordinates (e.g. Nagpur, 21.14, 79.08)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg pl-9 pr-20 py-1.5 text-xs text-[#F0EBDD] placeholder-[#838FA3] focus:outline-none focus:border-[#A6B7D4] font-mono"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-[#232A3D] hover:bg-[#2B3349] text-[#A6B7D4] border border-[#48516A] rounded text-[11px] font-mono font-medium cursor-pointer"
          >
            Go
          </button>
        </form>

        {/* Right: Active Location Indicator */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#B5BDCC] hidden sm:inline">{selectedLocation.name}</span>
          <span className="text-[#838FA3] hidden sm:inline">·</span>
          <span className="text-[#A6B7D4] font-medium">
            {selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lon.toFixed(2)}°E
          </span>
          <button
            onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              isLayersPanelOpen 
                ? 'bg-[#353D55] text-[#A6B7D4] border-[#A6B7D4]' 
                : 'bg-[#1D2436] text-[#B5BDCC] border-[#48516A] hover:text-[#F0EBDD]'
            }`}
            title="Toggle Environmental Layer Controls"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Layers</span>
          </button>
        </div>

      </div>

      {/* Main Canvas Viewport with Optional Collapsible Side Controls */}
      <div className="flex-1 relative overflow-hidden flex">
        
        {/* Docked / Collapsible Left Control Deck */}
        {isLayersPanelOpen && (
          <aside 
            aria-label="Environmental layer controls and station selection"
            className="w-72 bg-[#232A3D] border-r border-[#48516A] p-3 flex flex-col justify-between gap-3 shrink-0 z-20 overflow-y-auto"
          >
            <div className="space-y-3">
              {/* Target Location Card */}
              <div className="bg-[#353D55] border border-[#48516A] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#B5BDCC] uppercase font-semibold">Active Station</span>
                  <span className="text-[9px] font-mono text-[#35C98B] bg-[#1D2436] px-1.5 py-0.2 rounded border border-[#48516A]">
                    PROBE ONLINE
                  </span>
                </div>
                <div className="font-bold text-sm text-[#F0EBDD] font-space truncate">{selectedLocation.name}</div>
                <div className="text-[11px] font-mono text-[#B5BDCC]">
                  {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E
                </div>

                {/* Quick Station Selector Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#2D354A]">
                  {PRESET_LOCATIONS.slice(0, 4).map(loc => (
                    <button
                      key={loc.name}
                      onClick={() => setSelectedLocation({ name: loc.name, lat: loc.lat, lon: loc.lon })}
                      className={`px-2 py-1 text-[11px] rounded font-mono transition-colors text-left truncate cursor-pointer ${
                        selectedLocation.name === loc.name 
                          ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' 
                          : 'bg-[#232A3D] text-[#B5BDCC] hover:text-[#F0EBDD] border border-[#48516A]'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Environmental Layer Selector */}
              <div className="bg-[#353D55] border border-[#48516A] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-[#B5BDCC] uppercase font-semibold">Atmospheric Layer</span>
                  <span className="text-[10px] font-mono text-[#A6B7D4] font-medium">{activeLayer}</span>
                </div>

                <div className="space-y-1.5">
                  {layerOptions.map(layer => (
                    <button
                      key={layer.key}
                      onClick={() => setActiveLayer(layer.key as any)}
                      className={`w-full p-2 rounded-md border text-left transition-colors flex items-center justify-between cursor-pointer ${
                        activeLayer === layer.key 
                          ? 'bg-[#232A3D] border-[#A6B7D4] text-[#F0EBDD]' 
                          : 'bg-[#1D2436] border-[#48516A] text-[#B5BDCC] hover:text-[#F0EBDD]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-medium text-[#F0EBDD] truncate">{layer.label}</div>
                        <div className="text-[10px] font-mono text-[#B5BDCC]">{layer.range}</div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: layer.color }}></span>
                    </button>
                  ))}
                </div>

                {/* Layer Opacity Slider */}
                <div className="pt-2 border-t border-[#2D354A] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#B5BDCC]">
                    <span>Layer Opacity</span>
                    <span className="text-[#F0EBDD] font-bold">{layerOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={layerOpacity}
                    onChange={(e) => setLayerOpacity(Number(e.target.value))}
                    className="w-full h-1 bg-[#48516A] rounded appearance-none accent-[#A6B7D4] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions: Jump to Deep Investigation */}
            <div className="space-y-2 pt-2 border-t border-[#48516A]">
              <button
                onClick={() => navigate(`/trend-detective?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&param=${activeLayer}`)}
                className="w-full py-2 px-3 bg-[#A6B7D4] hover:bg-[#B8C6DF] text-[#171B2B] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Launch Trend Detective</span>
              </button>
            </div>
          </aside>
        )}

        {/* Center Canvas Viewport */}
        <div className="flex-1 h-full w-full relative z-0">
          {projection === 'globe' ? (
            <div className="w-full h-full bg-[#171B2B]">
              <EarthObservatory3D
                initialLocationName={selectedLocation.name}
                onLocationSelect={(loc) => setSelectedLocation({ name: loc.name, lat: loc.lat, lon: loc.lon })}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full min-h-[450px]">
              <MapContainer 
                center={[selectedLocation.lat, selectedLocation.lon]} 
                zoom={5} 
                className="h-full w-full min-h-[450px] z-10"
                style={{ height: '100%', width: '100%' }}
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
                    <div className="text-xs font-sans text-[#F0EBDD] p-1">
                      <strong className="text-sm font-bold text-[#F0EBDD]">{selectedLocation.name}</strong><br />
                      <span className="font-mono text-[11px] text-[#B5BDCC]">
                        {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E
                      </span>
                      <div className="mt-2 pt-1 border-t border-[#48516A]">
                        <button
                          onClick={() => navigate(`/trend-detective?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`)}
                          className="px-2.5 py-1 bg-[#A6B7D4] text-[#171B2B] rounded text-[11px] font-bold cursor-pointer"
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

      </div>

      {/* Bottom Timeline Playback Scrubber */}
      <div className="h-11 bg-[#232A3D] border-t border-[#48516A] px-4 flex items-center justify-between z-20 text-xs shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#F0EBDD]">
            <Compass className="w-3.5 h-3.5 text-[#A6B7D4]" />
            <span>{selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E</span>
          </div>
          <span className="text-[#838FA3] hidden sm:inline">|</span>
          <span className="text-[#B5BDCC] hidden sm:inline">
            Elevation: <span className="text-[#F0EBDD]">{telemetryData?.elevationMeters || 310} m MSL</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className="p-1.5 rounded bg-[#1D2436] hover:bg-[#2B3349] text-[#A6B7D4] border border-[#48516A] transition-colors cursor-pointer"
            title={isPlayingTimeline ? 'Pause Playback' : 'Play Timeline (2001–2025)'}
          >
            {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[#838FA3] text-[10px]">2001</span>
          <input 
            type="range" 
            min="2001" 
            max="2025" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-32 sm:w-64 h-1 bg-[#48516A] rounded appearance-none cursor-pointer accent-[#A6B7D4]" 
          />
          <span className="text-[#F0EBDD] font-bold">{selectedYear}</span>
          <span className="text-[#838FA3] text-[10px]">2025</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-[#B5BDCC] text-[11px]">
          <Clock className="w-3.5 h-3.5 text-[#A6B7D4]" />
          <span>NASA POWER Assimilation (2001–2025)</span>
        </div>
      </div>

    </div>
  );
}
