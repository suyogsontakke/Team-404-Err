/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Menu,
  Sparkles
} from 'lucide-react';
import { PRESET_LOCATIONS } from '../lib/nasaPowerService';

interface HeaderProps {
  onToggleAi?: () => void;
  onToggleMobileSidebar?: () => void;
  selectedLocation?: { name: string; lat: number; lon: number };
  onSelectLocation?: (loc: typeof PRESET_LOCATIONS[0]) => void;
}

export default function Header({ onToggleAi, onToggleMobileSidebar, selectedLocation }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString().slice(17, 22) + ' UTC');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 22) + ' UTC');
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    const match = PRESET_LOCATIONS.find(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.region.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (match) {
      navigate(`/dashboard?lat=${match.lat}&lon=${match.lon}&name=${encodeURIComponent(match.name)}`);
    } else {
      navigate(`/earth-explorer?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const activeLocName = selectedLocation?.name || 'Nagpur, India';
  const activeLocCoords = selectedLocation 
    ? `${selectedLocation.lat.toFixed(4)}°N, ${selectedLocation.lon.toFixed(4)}°E` 
    : '21.1458°N, 79.0882°E';

  return (
    <header className="h-14 bg-[#171B2B] text-[#F0EBDD] flex items-center justify-between px-4 sm:px-6 border-b border-[#48516A] shrink-0 relative z-40 select-none font-sans">
      
      {/* 1. Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#232A3D] rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <img 
            src="/assets/aistudio/image_eed5d808.png" 
            alt="EARTH TRACE Logo" 
            className="h-8 md:h-8.5 w-auto object-contain shrink-0" 
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 leading-tight">
              <span className="font-extrabold text-sm tracking-wide text-[#F0EBDD] font-space">EARTH TRACE</span>
              <span className="text-[10px] font-mono text-[#B5BDCC] hidden sm:inline">
                · Earth Observation
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Center: Global Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-sm mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#838FA3]" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stations, coordinates, or hazards..."
            className="w-full bg-[#232A3D] border border-[#48516A] rounded-lg py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-[#A6B7D4] text-[#F0EBDD] placeholder-[#838FA3] font-sans transition-colors"
          />
        </form>
      </div>

      {/* 3. Right: Location Tag, Telemetry Status & Assistant Shortcut */}
      <div className="flex items-center gap-3 text-xs">
        
        {/* Selected Geographical Location */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#232A3D] border border-[#48516A] rounded-lg text-[#B5BDCC]">
          <MapPin className="w-3.5 h-3.5 text-[#A6B7D4] shrink-0" />
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="text-xs font-semibold text-[#F0EBDD] truncate">{activeLocName}</span>
            <span className="text-[#838FA3]">·</span>
            <span className="text-[11px] font-mono text-[#B5BDCC]">{activeLocCoords}</span>
          </div>
        </div>

        {/* NASA Telemetry Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#232A3D] border border-[#48516A] rounded-lg text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#35C98B]"></span>
          <span className="text-[#F0EBDD] font-medium">NASA POWER</span>
          <span className="text-[#838FA3]">·</span>
          <span className="text-[#B5BDCC] font-mono">{currentTime}</span>
        </div>

        {/* AI Intelligence Shortcut */}
        <button
          onClick={() => {
            if (onToggleAi) {
              onToggleAi();
            } else {
              navigate('/ai-insights');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232A3D] hover:bg-[#353D55] border border-[#48516A] hover:border-[#A6B7D4] text-[#F0EBDD] rounded-lg text-xs font-medium transition-colors cursor-pointer"
          title="Open AI Earth Intelligence Co-Pilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#A6B7D4]" />
          <span className="hidden sm:inline">AI Analysis</span>
        </button>
      </div>

    </header>
  );
}
