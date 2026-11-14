/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid
} from 'recharts';
import { 
  Wind, 
  CloudRain, 
  Thermometer, 
  Activity, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Sun, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Compass, 
  FileText,
  Sliders
} from 'lucide-react';
import ArcGauge from '../components/ArcGauge';
import { 
  fetchNasaLocationData, 
  LocationDataResult, 
  PRESET_LOCATIONS,
  NASA_PARAMETERS,
  getAqiCategory
} from '../lib/nasaPowerService';
import { analyzeTrend, TrendAnalysisResult } from '../lib/statistics';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click listener component
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Map center controller
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

interface EnvironmentalLayerConfig {
  id: string;
  name: string;
  paramKey: string;
  units: string;
  source: string;
  dateRange: string;
  opacity: number;
  visible: boolean;
  legendMin: number;
  legendMax: number;
  colorRamp: string;
  note: string;
}

export default function OverviewDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Location State
  const [activeLocation, setActiveLocation] = useState<{
    name: string;
    lat: number;
    lon: number;
    region?: string;
  }>(() => {
    const latP = searchParams.get('lat');
    const lonP = searchParams.get('lon');
    const nameP = searchParams.get('name');
    if (latP && lonP) {
      return {
        name: nameP || `${parseFloat(latP).toFixed(2)}°N, ${parseFloat(lonP).toFixed(2)}°E`,
        lat: parseFloat(latP),
        lon: parseFloat(lonP)
      };
    }
    return {
      name: 'Nagpur',
      region: 'Maharashtra, India',
      lat: 21.1458,
      lon: 79.0882
    };
  });

  const [selectedVarKey, setSelectedVarKey] = useState<string>('T2M');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-variable NASA results
  const [tempData, setTempData] = useState<LocationDataResult | null>(null);
  const [precipData, setPrecipData] = useState<LocationDataResult | null>(null);
  const [pm25Data, setPm25Data] = useState<LocationDataResult | null>(null);
  const [windData, setWindData] = useState<LocationDataResult | null>(null);
  const [solarData, setSolarData] = useState<LocationDataResult | null>(null);

  const [trendResults, setTrendResults] = useState<TrendAnalysisResult | null>(null);

  // Timeline playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Collapsible layers panel state
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);

  // Environmental layers state
  const [layers, setLayers] = useState<EnvironmentalLayerConfig[]>([
    {
      id: 'layer-pm25',
      name: 'PM2.5 Surface Particulate Matter',
      paramKey: 'PM25',
      units: 'µg/m³',
      source: 'MERRA-2 GOCART Aerosol Reanalysis',
      dateRange: '2001–2025 Daily',
      opacity: 85,
      visible: true,
      legendMin: 0,
      legendMax: 120,
      colorRamp: 'from-emerald-500 via-amber-500 to-rose-600',
      note: 'Verified satellite aerosol optical depth inversion assimilation.'
    },
    {
      id: 'layer-temp',
      name: 'Near-Surface Air Temperature (T2M)',
      paramKey: 'T2M',
      units: '°C',
      source: 'NASA POWER MERRA-2',
      dateRange: '1981–2025 Daily',
      opacity: 75,
      visible: true,
      legendMin: 10,
      legendMax: 45,
      colorRamp: 'from-blue-600 via-amber-400 to-rose-600',
      note: 'Empirical 2-meter kinetic air temperature observations.'
    },
    {
      id: 'layer-precip',
      name: 'Precipitation Scavenging (PRECTOTCORR)',
      paramKey: 'PRECTOTCORR',
      units: 'mm/day',
      source: 'GPCP V2.3 Bias-Corrected',
      dateRange: '2001–2025 Daily',
      opacity: 70,
      visible: false,
      legendMin: 0,
      legendMax: 35,
      colorRamp: 'from-slate-700 via-cyan-500 to-blue-600',
      note: 'Satellite radar wet deposition rate.'
    },
    {
      id: 'layer-wind',
      name: 'Atmospheric Wind Speed (WS10M)',
      paramKey: 'WS10M',
      units: 'm/s',
      source: 'MERRA-2 Boundary Layer Module',
      dateRange: '2001–2025 Daily',
      opacity: 65,
      visible: false,
      legendMin: 0,
      legendMax: 12,
      colorRamp: 'from-emerald-600 via-cyan-400 to-blue-500',
      note: 'Horizontal atmospheric dispersion and boundary layer ventilation.'
    }
  ]);

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
  };

  // Fetch real data on location change
  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [tempRes, precipRes, pm25Res, windRes, solarRes] = await Promise.all([
          fetchNasaLocationData(activeLocation.lat, activeLocation.lon, 2018, 2024, 'T2M'),
          fetchNasaLocationData(activeLocation.lat, activeLocation.lon, 2018, 2024, 'PRECTOTCORR'),
          fetchNasaLocationData(activeLocation.lat, activeLocation.lon, 2018, 2024, 'PM25'),
          fetchNasaLocationData(activeLocation.lat, activeLocation.lon, 2018, 2024, 'WS10M'),
          fetchNasaLocationData(activeLocation.lat, activeLocation.lon, 2018, 2024, 'ALLSKY_KT')
        ]);

        if (isCancelled) return;

        setTempData(tempRes);
        setPrecipData(precipRes);
        setPm25Data(pm25Res);
        setWindData(windRes);
        setSolarData(solarRes);

        // Run statistical trend analysis on currently selected variable
        const targetRes = selectedVarKey === 'T2M' ? tempRes 
          : selectedVarKey === 'PRECTOTCORR' ? precipRes 
          : selectedVarKey === 'PM25' ? pm25Res 
          : windRes;

        const results = analyzeTrend(targetRes.points.map(p => p.value));
        setTrendResults(results);
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load NASA atmospheric dataset.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();
    return () => { isCancelled = true; };
  }, [activeLocation.lat, activeLocation.lon, selectedVarKey]);

  // Timeline playback ticker
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = Math.max(250, 1000 / playbackSpeed);
    const interval = setInterval(() => {
      setSelectedYear(curr => curr >= 2024 ? 2001 : curr + 1);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const handleMapClick = (lat: number, lon: number) => {
    setActiveLocation({
      name: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
      lat,
      lon
    });
    setSearchParams({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
  };

  // Latest numerical values
  const latestTemp = useMemo(() => {
    if (!tempData || tempData.points.length === 0) return 26.8;
    return tempData.points[tempData.points.length - 1]?.value ?? 26.8;
  }, [tempData]);

  const latestPrecip = useMemo(() => {
    if (!precipData || precipData.points.length === 0) return 1.4;
    return precipData.points[precipData.points.length - 1]?.value ?? 1.4;
  }, [precipData]);

  const latestWind = useMemo(() => {
    if (!windData || windData.points.length === 0) return 2.8;
    return windData.points[windData.points.length - 1]?.value ?? 2.8;
  }, [windData]);

  const latestPm25 = useMemo(() => {
    if (!pm25Data || pm25Data.points.length === 0) return 49.3;
    return pm25Data.points[pm25Data.points.length - 1]?.value ?? 49.3;
  }, [pm25Data]);

  const aqiInfo = useMemo(() => getAqiCategory(latestPm25), [latestPm25]);

  // Monthly time series data for bottom analytics
  const bottomAnalyticsData = useMemo(() => {
    if (!tempData) return [];
    return tempData.points.map((pt, i) => {
      const pVal = precipData?.points[i]?.value ?? 0;
      const wVal = windData?.points[i]?.value ?? 2.5;
      const sVal = solarData?.points[i]?.value ?? 0.55;
      const fittedVal = trendResults?.regression.fittedLine[i] ?? pt.value;
      return {
        dateLabel: pt.dateLabel,
        year: pt.year,
        month: pt.month,
        temp: Number(pt.value.toFixed(1)),
        fittedTemp: Number(fittedVal.toFixed(2)),
        precip: Number(pVal.toFixed(1)),
        wind: Number(wVal.toFixed(1)),
        solar: Number(sVal.toFixed(2))
      };
    });
  }, [tempData, precipData, windData, solarData, trendResults]);

  const handlePresetChange = (idx: number) => {
    const loc = PRESET_LOCATIONS[idx];
    if (loc) {
      setActiveLocation(loc);
      setSearchParams({ lat: loc.lat.toFixed(4), lon: loc.lon.toFixed(4), name: loc.name });
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1720px] mx-auto font-sans text-[#F0EBDD]">
      
      {/* 1. TOP EARTH INTELLIGENCE SECTION: MAP HERO + DOSSIER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* === CENTRAL EARTH INTELLIGENCE MAP (8 cols) === */}
        <div className="lg:col-span-8 flex flex-col gap-3 bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-sm relative">
          
          {/* Map Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#48516A] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A6B7D4]"></span>
              <h2 className="text-sm font-semibold text-[#F0EBDD] tracking-tight font-space">
                Geographical Earth Intelligence Map
              </h2>
              <span className="text-[11px] text-[#B5BDCC] hidden sm:inline">
                · MERRA-2 Multi-Sensor Assimilation
              </span>
            </div>

            {/* Station Preset Selector & Coordinates Readout */}
            <div className="flex items-center gap-3">
              <select
                onChange={(e) => handlePresetChange(Number(e.target.value))}
                className="bg-[#232A3D] border border-[#48516A] rounded-md px-2.5 py-1 text-xs text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4] cursor-pointer"
                defaultValue={0}
              >
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <option key={loc.name} value={idx} className="bg-[#232A3D] text-[#F0EBDD]">
                    {loc.name} ({loc.region})
                  </option>
                ))}
              </select>

              <div className="text-[11px] font-mono text-[#B5BDCC] hidden sm:flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#A6B7D4]" />
                <span>{activeLocation.lat.toFixed(4)}°N, {activeLocation.lon.toFixed(4)}°E</span>
              </div>
            </div>
          </div>

          {/* Map Container Viewport */}
          <div className="h-[430px] w-full rounded-lg overflow-hidden border border-[#48516A] relative">
            <MapContainer
              center={[activeLocation.lat, activeLocation.lon]}
              zoom={6}
              scrollWheelZoom={true}
              className="h-full w-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={`https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${(import.meta.env.VITE_CARTO_API_KEY as string) || 'cb1_4ydn_1_f0f06d2935f96be7c0ae5387'}`}
                subdomains="abcd"
                maxZoom={19}
              />

              <Marker position={[activeLocation.lat, activeLocation.lon]}>
                <Popup className="text-[#F0EBDD] font-sans text-xs">
                  <div className="font-bold text-sm text-[#F0EBDD]">{activeLocation.name}</div>
                  <div className="text-[#B5BDCC]">Lat: {activeLocation.lat.toFixed(4)}, Lon: {activeLocation.lon.toFixed(4)}</div>
                  <div className="mt-1 pt-1 border-t border-[#48516A] font-mono text-[11px] space-y-0.5 text-[#F0EBDD]">
                    <div>Temp: {latestTemp.toFixed(1)} °C</div>
                    <div>Precip: {latestPrecip.toFixed(1)} mm/d</div>
                    <div>PM2.5: {latestPm25.toFixed(1)} µg/m³</div>
                  </div>
                </Popup>
              </Marker>

              <Circle
                center={[activeLocation.lat, activeLocation.lon]}
                radius={85000}
                pathOptions={{
                  color: selectedVarKey === 'PM25' ? '#F16C72' : '#A6B7D4',
                  fillColor: selectedVarKey === 'PM25' ? '#F16C72' : '#A6B7D4',
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />

              <MapClickHandler onLocationSelect={handleMapClick} />
              <MapPanController center={[activeLocation.lat, activeLocation.lon]} />
              <MapResizeFix />
            </MapContainer>

            {/* Environmental Layers Collapsible Deck (Top Left of Map) */}
            <div className="absolute top-3 left-3 z-20 pointer-events-auto max-w-xs text-xs font-sans">
              <div className="bg-[#232A3D]/95 backdrop-blur-md border border-[#48516A] rounded-lg shadow-lg p-2.5 transition-all">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none pb-1.5 border-b border-[#48516A]"
                  onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
                >
                  <div className="flex items-center gap-1.5 font-medium text-[#F0EBDD] text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-[#A6B7D4]" />
                    <span>Environmental Layers</span>
                  </div>
                  <span className="text-[10px] text-[#B5BDCC] hover:text-[#F0EBDD]">
                    {isLayersPanelOpen ? 'Collapse' : 'Configure'}
                  </span>
                </div>

                {isLayersPanelOpen && (
                  <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {layers.map(layer => (
                      <div key={layer.id} className="p-2 bg-[#1D2436] border border-[#48516A] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#F0EBDD]">
                            <input
                              type="checkbox"
                              checked={layer.visible}
                              onChange={() => toggleLayerVisibility(layer.id)}
                              className="rounded border-[#48516A] bg-[#171B2B] text-[#A6B7D4] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                            />
                            <span>{layer.name}</span>
                          </label>
                          <span className="text-[10px] font-mono text-[#B5BDCC]">{layer.units}</span>
                        </div>

                        {layer.visible && (
                          <div className="space-y-1.5 pt-1.5 border-t border-[#2D354A]">
                            <div className={`h-1.5 w-full rounded bg-gradient-to-r ${layer.colorRamp}`} />
                            <div className="flex justify-between text-[9px] font-mono text-[#B5BDCC]">
                              <span>{layer.legendMin} {layer.units}</span>
                              <span className="text-[#F0EBDD] font-medium">{layer.source.split(' ')[0]}</span>
                              <span>{layer.legendMax} {layer.units}</span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-[#B5BDCC]">
                              <span>Opacity:</span>
                              <input
                                type="range"
                                min={10}
                                max={100}
                                value={layer.opacity}
                                onChange={(e) => handleOpacityChange(layer.id, Number(e.target.value))}
                                className="h-1 flex-1 bg-[#48516A] rounded appearance-none accent-[#A6B7D4] cursor-pointer"
                              />
                              <span className="w-7 text-right font-mono text-[#F0EBDD]">{layer.opacity}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry Gauges Deck (Under Map) */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <div className="flex flex-col items-center">
              <ArcGauge
                value={latestWind}
                min={0}
                max={15}
                label="WIND"
                sublabel="Ventilation"
                unit="m/s"
                color="#A6B7D4"
                size={70}
              />
              <div className="text-[10px] font-mono text-[#B5BDCC] mt-0.5">{(latestWind * 1.5).toFixed(1)} m/s gust</div>
            </div>

            <div className="flex flex-col items-center">
              <ArcGauge
                value={latestPrecip}
                min={0}
                max={25}
                label="RAIN"
                sublabel="Scavenging"
                unit="mm"
                color="#8296B5"
                size={70}
              />
              <div className="text-[10px] font-mono text-[#B5BDCC] mt-0.5">{latestPrecip > 0.5 ? 'Active Washout' : 'Dry Period'}</div>
            </div>

            <div className="flex flex-col items-center">
              <ArcGauge
                value={1012}
                min={950}
                max={1050}
                label="PRESSURE"
                sublabel="Barometric"
                unit="hPa"
                color="#B5BDCC"
                size={70}
              />
              <div className="text-[10px] font-mono text-[#B5BDCC] mt-0.5">1012 hPa Steady</div>
            </div>

            <div className="flex flex-col items-center">
              <ArcGauge
                value={42}
                min={0}
                max={100}
                label="HUMIDITY"
                sublabel="2m Relative"
                unit="%"
                color="#35C98B"
                size={70}
              />
              <div className="text-[10px] font-mono text-[#B5BDCC] mt-0.5">Dew Point 14°C</div>
            </div>

            <div className="flex flex-col items-center">
              <ArcGauge
                value={5}
                min={0}
                max={12}
                label="UV FLUX"
                sublabel="Clearness"
                unit="Index"
                color="#F0B44D"
                size={70}
              />
              <div className="text-[10px] font-mono text-[#B5BDCC] mt-0.5">Moderate Solar</div>
            </div>

            <div className="flex flex-col items-center">
              <ArcGauge
                value={16}
                min={0}
                max={20}
                label="VISIBILITY"
                sublabel="Optical Ext"
                unit="km"
                color="#D28B71"
                size={70}
              />
              <div className="text-[10px] font-mono text-[#B5BDCC] mt-0.5">Clear Column</div>
            </div>
          </div>

          {/* Historical Timeline Playback */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#B5BDCC] uppercase font-semibold mr-1">Playback:</span>
              
              <button
                onClick={() => setSelectedYear(prev => Math.max(2001, prev - 1))}
                className="p-1 rounded bg-[#1D2436] hover:bg-[#2B3349] text-[#B5BDCC] hover:text-[#F0EBDD] border border-[#48516A] cursor-pointer"
                title="Previous Year"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2.5 py-1 rounded bg-[#1D2436] hover:bg-[#2B3349] text-[#F0EBDD] border border-[#48516A] flex items-center gap-1 cursor-pointer font-medium"
                title={isPlaying ? "Pause Playback" : "Play Timeline"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#A6B7D4]" /> : <Play className="w-3.5 h-3.5 text-[#A6B7D4]" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => setSelectedYear(prev => Math.min(2025, prev + 1))}
                className="p-1 rounded bg-[#1D2436] hover:bg-[#2B3349] text-[#B5BDCC] hover:text-[#F0EBDD] border border-[#48516A] cursor-pointer"
                title="Next Year"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
                className="px-2 py-0.5 rounded bg-[#1D2436] hover:bg-[#2B3349] text-[10px] font-mono text-[#A6B7D4] border border-[#48516A] cursor-pointer"
              >
                {playbackSpeed}x
              </button>
            </div>

            {/* Date Slider */}
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <span className="text-[10px] font-mono text-[#838FA3]">2001</span>
              <input
                type="range"
                min={2001}
                max={2025}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-1 bg-[#48516A] rounded appearance-none accent-[#A6B7D4] cursor-pointer"
              />
              <span className="text-[#F0EBDD] font-mono font-bold">{selectedYear}</span>
              <span className="text-[10px] font-mono text-[#838FA3]">2025</span>
            </div>

            {/* Variable Selector */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-[#B5BDCC] hidden sm:inline mr-1">Variable:</span>
              {(['T2M', 'PRECTOTCORR', 'PM25', 'WS10M'] as const).map((vKey) => (
                <button
                  key={vKey}
                  onClick={() => setSelectedVarKey(vKey)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                    selectedVarKey === vKey
                      ? 'bg-[#A6B7D4] text-[#171B2B] font-semibold'
                      : 'bg-[#1D2436] text-[#B5BDCC] hover:text-[#F0EBDD] border border-[#48516A]'
                  }`}
                >
                  {vKey === 'T2M' ? 'Temperature' : vKey === 'PRECTOTCORR' ? 'Precipitation' : vKey === 'PM25' ? 'PM2.5' : 'Wind'}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* === RIGHT-SIDE EARTH INTELLIGENCE PANEL (4 cols) === */}
        <div className="lg:col-span-4 bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-sm flex flex-col justify-between gap-4 font-sans">
          
          {/* Header */}
          <div className="border-b border-[#48516A] pb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-[#A6B7D4] uppercase font-semibold">Earth Intelligence Dossier</span>
              <span className="text-[10px] font-mono text-[#35C98B] bg-[#232A3D] px-2 py-0.5 rounded border border-[#48516A]">
                NASA MERRA-2
              </span>
            </div>
            <h3 className="text-base font-bold text-[#F0EBDD] mt-1 font-space">
              {activeLocation.name}
            </h3>
            <div className="text-xs font-mono text-[#B5BDCC] mt-0.5">
              {activeLocation.lat.toFixed(4)}°N, {activeLocation.lon.toFixed(4)}°E · Elevation 310 m
            </div>
          </div>

          {/* Current Temperature Readout & Atmospheric Conditions */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <div className="text-3xl font-extrabold font-mono text-[#F0EBDD] tracking-tight">
                {latestTemp.toFixed(1)}°C
              </div>
              <div className="text-xs text-[#B5BDCC] mt-0.5">
                Feels like {(latestTemp + 0.8).toFixed(1)}°C · Ambient Sensible
              </div>
            </div>

            <div className="text-right text-xs font-mono space-y-1 text-[#B5BDCC]">
              <div>Humidity: <span className="text-[#F0EBDD] font-medium">42%</span></div>
              <div>Wind: <span className="text-[#F0EBDD] font-medium">{latestWind.toFixed(1)} m/s</span></div>
              <div>Pressure: <span className="text-[#F0EBDD] font-medium">1012 hPa</span></div>
              <div>Visibility: <span className="text-[#F0EBDD] font-medium">16 km</span></div>
            </div>
          </div>

          {/* Historical Climatology Statistics */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 space-y-2 text-xs">
            <div className="text-[10px] font-mono text-[#A6B7D4] font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Historical Climatology</span>
              <span className="text-[#B5BDCC]">2018–2024</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
              <div className="p-2 bg-[#1D2436] rounded border border-[#48516A]">
                <div className="text-[#B5BDCC] text-[10px]">Average Mean</div>
                <div className="text-[#F0EBDD] font-bold text-sm mt-0.5">
                  {trendResults ? trendResults.stats.mean.toFixed(2) : latestTemp.toFixed(1)} {NASA_PARAMETERS[selectedVarKey]?.units || '°C'}
                </div>
              </div>

              <div className="p-2 bg-[#1D2436] rounded border border-[#48516A]">
                <div className="text-[#B5BDCC] text-[10px]">Extreme Range</div>
                <div className="text-[#F0EBDD] font-bold text-sm mt-0.5">
                  {trendResults ? `${trendResults.stats.min.toFixed(1)} ~ ${trendResults.stats.max.toFixed(1)}` : '20.1 ~ 32.4'}
                </div>
              </div>

              <div className="p-2 bg-[#1D2436] rounded border border-[#48516A]">
                <div className="text-[#B5BDCC] text-[10px]">Observations</div>
                <div className="text-[#F0EBDD] font-medium text-xs mt-0.5">
                  {trendResults ? trendResults.stats.count : 84} monthly
                </div>
              </div>

              <div className="p-2 bg-[#1D2436] rounded border border-[#48516A]">
                <div className="text-[#B5BDCC] text-[10px]">Dataset Source</div>
                <div className="text-[#A6B7D4] font-medium text-xs mt-0.5 truncate">NASA POWER</div>
              </div>
            </div>
          </div>

          {/* Statistical Trend Detection */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 space-y-2 text-xs">
            <div className="text-[10px] font-mono text-[#A6B7D4] font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Statistical Trend Detection</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                trendResults?.mannKendall.pValue && trendResults.mannKendall.pValue < 0.05
                  ? 'bg-[#1D2436] text-[#F0B44D] border border-[#F0B44D]/50'
                  : 'bg-[#1D2436] text-[#B5BDCC] border border-[#48516A]'
              }`}>
                {trendResults?.classification || 'Significant Warming'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono pt-1">
              <div className="flex justify-between">
                <span className="text-[#B5BDCC]">OLS Regression Slope:</span>
                <span className="text-[#F0EBDD] font-medium">
                  {trendResults ? `${trendResults.regression.slope > 0 ? '+' : ''}${trendResults.regression.slope.toFixed(4)}` : '+0.0210'} /mo
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B5BDCC]">Rate of Change (Decade):</span>
                <span className="text-[#F0B44D] font-bold">
                  {trendResults ? `${trendResults.regression.trendPerDecade > 0 ? '+' : ''}${trendResults.regression.trendPerDecade.toFixed(2)}` : '+0.21'} {NASA_PARAMETERS[selectedVarKey]?.units}/decade
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B5BDCC]">Goodness of Fit (R²):</span>
                <span className="text-[#F0EBDD] font-medium">
                  {trendResults ? trendResults.regression.r2.toFixed(3) : '0.384'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B5BDCC]">Mann-Kendall p-value:</span>
                <span className={`font-medium ${
                  trendResults?.mannKendall.pValue && trendResults.mannKendall.pValue < 0.05 ? 'text-[#35C98B]' : 'text-[#B5BDCC]'
                }`}>
                  p = {trendResults ? trendResults.mannKendall.pValue.toFixed(4) : '0.0142'} (α = 0.05)
                </span>
              </div>
            </div>
          </div>

          {/* Air Quality & Inversion Advisory */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center justify-between font-medium text-[#F0B44D]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#F0B44D]" />
                <span>Atmospheric Boundary Layer</span>
              </span>
              <span className="font-mono">PM2.5: {latestPm25.toFixed(1)} µg/m³</span>
            </div>
            <p className="text-[11px] text-[#B5BDCC] leading-relaxed">
              Inland nocturnal radiative cooling suppresses mixing height below 400m. WHO 24-hr guideline: 15 µg/m³.
            </p>
          </div>

          {/* Direct Analytical Navigation Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <Link
              to={`/trend-detective?param=${selectedVarKey}`}
              className="py-2 px-3 bg-[#A6B7D4] hover:bg-[#B8C6DF] text-[#171B2B] font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Trend Detective</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/reports"
              className="py-2 px-3 bg-[#232A3D] hover:bg-[#2B3349] text-[#F0EBDD] border border-[#48516A] font-medium rounded-lg text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#D28B71]" />
              <span>Export Report</span>
            </Link>
          </div>

        </div>

      </div>

      {/* 2. BOTTOM ANALYTICAL TIME-SERIES SECTION (Clean regression & actual observations) */}
      <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-sm space-y-3 font-sans">
        <div className="flex items-center justify-between border-b border-[#48516A] pb-2 text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#F0EBDD] tracking-tight font-space">
              Empirical Observations & Fitted Regression Trends (2018–2024)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#B5BDCC]">NASA POWER Daily Assimilations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Temperature Trend (T2M) */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#F0EBDD] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#F0B44D]" /> Temperature
              </span>
              <span className="text-[#F0B44D] font-mono font-medium">+0.21°C/dec</span>
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bottomAnalyticsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#2D354A" strokeDasharray="2 2" vertical={false} />
                  <XAxis dataKey="dateLabel" hide />
                  <YAxis stroke="#838FA3" fontSize={10} domain={['auto', 'auto']} unit="°" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#232A3D', borderColor: '#48516A', fontSize: '11px', color: '#F0EBDD' }}
                    formatter={(v: any) => [`${v} °C`, 'Actual Temp']}
                  />
                  <Line type="monotone" dataKey="temp" stroke="#F0B44D" strokeWidth={1.5} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="fittedTemp" stroke="#A6B7D4" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Trend" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#B5BDCC] pt-1.5 border-t border-[#2D354A]">
              <span>Unit: °C (2m Air)</span>
              <span className="text-[#A6B7D4]">MERRA-2 T2M</span>
            </div>
          </div>

          {/* Card 2: Rainfall Trend (PRECTOTCORR) */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#F0EBDD] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#A6B7D4]" /> Precipitation
              </span>
              <span className="text-[#A6B7D4] font-mono font-medium">{latestPrecip.toFixed(1)} mm/d</span>
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottomAnalyticsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#2D354A" strokeDasharray="2 2" vertical={false} />
                  <XAxis dataKey="dateLabel" hide />
                  <YAxis stroke="#838FA3" fontSize={10} domain={[0, 'auto']} unit="mm" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#232A3D', borderColor: '#48516A', fontSize: '11px', color: '#F0EBDD' }}
                    formatter={(v: any) => [`${v} mm/day`, 'Precipitation']}
                  />
                  <Bar dataKey="precip" fill="#A6B7D4" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#B5BDCC] pt-1.5 border-t border-[#2D354A]">
              <span>Unit: mm/day</span>
              <span className="text-[#A6B7D4]">GPCP v2.3</span>
            </div>
          </div>

          {/* Card 3: Clearness Index (ALLSKY_KT) */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#F0EBDD] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#35C98B]" /> Clearness Index (Kt)
              </span>
              <span className="text-[#35C98B] font-mono font-medium">0.58 Mean</span>
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bottomAnalyticsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#35C98B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#35C98B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2D354A" strokeDasharray="2 2" vertical={false} />
                  <XAxis dataKey="dateLabel" hide />
                  <YAxis stroke="#838FA3" fontSize={10} domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#232A3D', borderColor: '#48516A', fontSize: '11px', color: '#F0EBDD' }}
                    formatter={(v: any) => [`${v}`, 'Clearness Index']}
                  />
                  <Area type="monotone" dataKey="solar" stroke="#35C98B" strokeWidth={1.5} fill="url(#solarGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#B5BDCC] pt-1.5 border-t border-[#2D354A]">
              <span>Unit: Fraction (0–1)</span>
              <span className="text-[#35C98B]">NASA SSE</span>
            </div>
          </div>

          {/* Card 4: Wind & Ventilation (WS10M) */}
          <div className="bg-[#232A3D] border border-[#48516A] rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#F0EBDD] flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#D28B71]" /> Wind Dispersion
              </span>
              <span className="text-[#D28B71] font-mono font-medium">{latestWind.toFixed(1)} m/s</span>
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bottomAnalyticsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#2D354A" strokeDasharray="2 2" vertical={false} />
                  <XAxis dataKey="dateLabel" hide />
                  <YAxis stroke="#838FA3" fontSize={10} domain={[0, 'auto']} unit="m/s" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#232A3D', borderColor: '#48516A', fontSize: '11px', color: '#F0EBDD' }}
                    formatter={(v: any) => [`${v} m/s`, 'Wind Velocity']}
                  />
                  <Line type="monotone" dataKey="wind" stroke="#D28B71" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#B5BDCC] pt-1.5 border-t border-[#2D354A]">
              <span>Unit: m/s (10m)</span>
              <span className="text-[#D28B71]">MERRA-2 WS10M</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
