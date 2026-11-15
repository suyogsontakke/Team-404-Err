import { useRef, useEffect, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { PRESET_LOCATIONS, PresetLocation } from '../lib/nasaPowerService';
import { Layers, MapPin, Sparkles } from 'lucide-react';

interface ReactGlobeViewerProps {
  selectedLocation: { name: string; lat: number; lon: number };
  onSelectLocation: (loc: PresetLocation) => void;
  activeLayer: string;
  layerOpacity: number;
  className?: string;
}

export default function ReactGlobeViewer({
  selectedLocation,
  onSelectLocation,
  activeLayer,
  layerOpacity,
  className = ''
}: ReactGlobeViewerProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [globeReady, setGlobeReady] = useState(false);

  // Center globe on selected location whenever it changes
  useEffect(() => {
    if (globeRef.current && selectedLocation) {
      globeRef.current.pointOfView(
        { lat: selectedLocation.lat, lng: selectedLocation.lon, altitude: 2.2 },
        1200
      );
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (globeRef.current) {
      // Configure controls
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.6;
        controls.enableZoom = true;
      }
      setGlobeReady(true);
    }
  }, []);

  // Format data points for react-globe.gl based on PRESET_LOCATIONS and activeLayer
  const globeData = PRESET_LOCATIONS.map((loc) => {
    // Generate sample meteorological/atmospheric metric based on layer
    let val = 45;
    let color = '#35C98B';
    if (activeLayer === 'PM25') {
      val = Math.floor(Math.abs(Math.sin(loc.lat) * 80) + 20);
      color = val > 60 ? '#F16C72' : '#F0B44D';
    } else if (activeLayer === 'T2M') {
      val = Math.floor(Math.abs(Math.cos(loc.lon) * 25) + 12);
      color = val > 30 ? '#F16C72' : '#F0B44D';
    } else if (activeLayer === 'PRECTOTCORR') {
      val = Math.floor(Math.abs(Math.sin(loc.lat * loc.lon) * 15));
      color = '#4C8DFF';
    } else if (activeLayer === 'WIND') {
      val = Number((Math.abs(Math.sin(loc.lat) * 6) + 2).toFixed(1));
      color = '#16C7D9';
    } else {
      val = Number((Math.abs(Math.cos(loc.lat) * 0.8) + 0.2).toFixed(2));
      color = '#35C98B';
    }

    return {
      lat: loc.lat,
      lng: loc.lon,
      size: 0.8 + (val / 100) * 0.6,
      color: color,
      name: loc.name,
      region: loc.region,
      elevation: 0.15,
      value: val,
      preset: loc
    };
  });

  return (
    <div className={`relative w-full h-full bg-[#080D18] select-none overflow-hidden ${className}`}>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Atmosphere layer
        atmosphereColor="#38bdf8"
        atmosphereAltitude={0.22}

        // Data Points (HTML or Rings)
        htmlElementsData={globeData}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlAltitude={(d: any) => d.elevation}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          const isSelected = d.name === selectedLocation.name;
          el.innerHTML = `
            <div style="cursor: pointer; transform: translate(-50%, -50%); font-family: monospace; display: flex; align-items: center; gap: 4px; background: rgba(18, 29, 45, 0.9); border: 1px solid ${isSelected ? '#38bdf8' : '#48516A'}; padding: 4px 8px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: all 0.2s;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${d.color}; display: inline-block;"></span>
              <span style="color: #F0EBDD; font-size: 11px; font-weight: bold; white-space: nowrap;">${d.name}</span>
              <span style="color: #8D9BB0; font-size: 10px; white-space: nowrap;">${d.value}</span>
            </div>
          `;
          el.onclick = () => onSelectLocation(d.preset);
          return el;
        }}

        // Hex / Rings Layer
        ringsData={globeData}
        ringLat={(d: any) => d.lat}
        ringLng={(d: any) => d.lng}
        ringColor={(d: any) => () => d.color}
        ringMaxRadius={(d: any) => 3 + (d.value / 20)}
        ringPropagationSpeed={2.5}
        ringRepeatPeriod={800}

        onGlobeClick={(latLng: { lat: number; lng: number }) => {
          // Find closest preset or select coordinates
          const closest = PRESET_LOCATIONS.reduce((prev, curr) => {
            const distPrev = Math.hypot(prev.lat - latLng.lat, prev.lon - latLng.lng);
            const distCurr = Math.hypot(curr.lat - latLng.lat, curr.lon - latLng.lng);
            return distCurr < distPrev ? curr : prev;
          }, PRESET_LOCATIONS[0]);
          onSelectLocation(closest);
        }}
      />

      {/* Interactive HUD Overlay */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="bg-[#121D2D]/90 backdrop-blur border border-[#48516A] rounded-xl px-3 py-2 shadow-xl flex items-center gap-2.5 font-mono text-xs text-[#E8EEF7]">
          <Sparkles className="w-4 h-4 text-[#16C7D9]" />
          <div>
            <div className="font-bold tracking-wider">REACT-GLOBE.GL 3D WEBGL ENGINE</div>
            <div className="text-[10px] text-[#8D9BB0]">Active Layer: <span className="text-[#16C7D9] font-bold">{activeLayer}</span> · Opacity: {layerOpacity}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
