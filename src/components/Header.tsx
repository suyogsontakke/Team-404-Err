import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  Clock, 
  Globe2, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowRight,
  Menu
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
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 22) + ' UTC');
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    // Check if matching preset
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
    <header className="h-14 bg-[#050814] text-slate-300 flex items-center justify-between px-4 border-b border-[#152238] shrink-0 relative z-40 select-none shadow-md font-sans">
      
      {/* 1. Left: Hamburger Menu & EARTH TRACE Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu */}
        <button 
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-[#152238] rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mac Traffic Lights (matching Ref Image) */}
        <div className="flex items-center gap-1.5 mr-1 hidden sm:flex">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block shadow-sm"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block shadow-sm"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shadow-sm"></span>
        </div>

        <Link to="/" className="flex items-center gap-2.5 group">
          <img 
            src="/assets/aistudio/image_eed5d808.png" 
            alt="EARTH TRACE Logo" 
            className="h-8 md:h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform drop-shadow-[0_0_10px_rgba(6,182,212,0.45)]" 
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-sm tracking-widest text-white group-hover:text-cyan-300 transition-colors">EARTH TRACE</span>
              <span className="px-1.5 py-0.5 bg-cyan-950/80 text-cyan-400 text-[8px] font-mono rounded border border-cyan-700/60 font-bold hidden sm:block">
                NASA
              </span>
            </div>
            <div className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-wider hidden md:block">
              Earth System Trend Detective
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Center: Global Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-sm mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full bg-[#091122] border border-[#192742] rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-cyan-500/80 text-slate-200 placeholder-slate-500 font-mono transition-colors"
          />
        </form>
      </div>

      {/* 3. Right: Location Tag, NASA Data Status & AI Assistant Shortcut */}
      <div className="flex items-center gap-3 font-mono text-xs">
        
        {/* Selected Geographical Location (as required in prompt) */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[#091122] border border-[#192742] rounded-lg text-slate-300">
          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[11px] font-bold text-white truncate">{activeLocName}</span>
            <span className="text-[9px] text-slate-500">{activeLocCoords}</span>
          </div>
        </div>

        {/* NASA DATA Indicator & Retrieval Status (as required in prompt) */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-[#091122] border border-[#192742] rounded-lg text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-400 font-bold">NASA DATA</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 hidden xl:inline">2001–2025 Daily Reanalysis</span>
          <span className="text-cyan-400 font-bold">{currentTime}</span>
        </div>

        {/* AI Assistant Shortcut Button (matching Reference "✦ AI Assistant") */}
        <button
          onClick={() => {
            if (onToggleAi) {
              onToggleAi();
            } else {
              navigate('/ai-insights');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-900/60 to-cyan-900/60 hover:from-purple-800/80 hover:to-cyan-800/80 border border-purple-500/40 text-purple-200 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Open AI Earth Intelligence Co-Pilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>

    </header>
  );
}
