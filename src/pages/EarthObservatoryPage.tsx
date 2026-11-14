import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EarthObservatory3D from '../components/EarthObservatory3D';
import { PRESET_LOCATIONS, PresetLocation } from '../lib/nasaPowerService';
import { Globe, ArrowLeft, MapPin, Sparkles, Orbit } from 'lucide-react';

export default function EarthObservatoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLoc = searchParams.get('location') || 'Nagpur';

  const [currentLocation, setCurrentLocation] = useState<PresetLocation>(() => {
    return PRESET_LOCATIONS.find(l => l.name.toLowerCase() === initialLoc.toLowerCase()) || PRESET_LOCATIONS[0];
  });

  return (
    <div className="relative w-full h-[calc(100vh-64px)] min-h-[600px] bg-[#171B2B] text-[#F0EBDD] overflow-hidden rounded-2xl border border-[#48516A] shadow-2xl">
      {/* 3D Scene Viewport (Full Bleed) */}
      <EarthObservatory3D
        initialLocationName={currentLocation.name}
        onLocationSelect={setCurrentLocation}
        fullBleed={true}
        className="w-full h-full"
      />

      {/* Floating Header Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-3">
        <div className="bg-[#232A3D]/95 border border-[#48516A] rounded-full px-4 py-1.5 flex items-center gap-3 shadow-2xl pointer-events-auto">
          <button
            onClick={() => navigate('/earth-explorer')}
            className="flex items-center gap-1.5 text-xs font-mono text-[#A6B7D4] hover:text-[#F0EBDD] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to 2D Atlas</span>
          </button>
          <span className="text-[#48516A]">|</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#F0EBDD] tracking-wide">
            <Orbit className="w-4 h-4 text-[#A6B7D4]" />
            <span>3D SATELLITE ORBITAL OBSERVATORY</span>
          </div>
          <span className="text-[#48516A]">|</span>
          <span className="text-[10px] font-mono text-[#35C98B] bg-[#35C98B]/15 px-2 py-0.5 rounded border border-[#35C98B]/40">
            60 FPS PROCEDURAL PBR
          </span>
        </div>
      </div>
    </div>
  );
}
