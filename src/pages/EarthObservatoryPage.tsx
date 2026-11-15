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
    <div className="relative w-full h-[calc(100dvh-6.5rem)] min-h-[520px] bg-[#171B2B] text-[#F0EBDD] overflow-hidden rounded-xl sm:rounded-2xl border border-[#48516A] shadow-2xl">
      {/* 3D Scene Viewport (Full Bleed) */}
      <EarthObservatory3D
        initialLocationName={currentLocation.name}
        onLocationSelect={setCurrentLocation}
        fullBleed={true}
        className="w-full h-full"
      />

      {/* Floating Header Bar */}
      <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 w-[94%] sm:w-auto justify-center">
        <div className="bg-[#232A3D] border border-[#48516A] rounded-full px-3 sm:px-4 py-1.5 flex items-center justify-between sm:justify-center gap-2 sm:gap-3 shadow-2xl pointer-events-auto max-w-full">
          <button
            type="button"
            onClick={() => navigate('/earth-explorer')}
            className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-mono text-[#A6B7D4] hover:text-[#F0EBDD] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to 2D</span>
          </button>
          <span className="text-[#48516A]">|</span>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-[#F0EBDD] tracking-wide truncate">
            <Orbit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A6B7D4] shrink-0" />
            <span className="truncate">3D SATELLITE OBSERVATORY</span>
          </div>
          <span className="text-[#48516A] hidden md:inline">|</span>
          <span className="hidden md:inline-block text-[10px] font-mono text-[#35C98B] bg-[#35C98B]/15 px-2 py-0.5 rounded border border-[#35C98B]/40 shrink-0">
            60 FPS PROCEDURAL PBR
          </span>
        </div>
      </div>
    </div>
  );
}
