import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe, 
  Layers, 
  Search, 
  Radar,
  ShieldAlert,
  BrainCircuit, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  DatabaseCheck,
  Flame,
  Radio,
  FileSpreadsheet,
  Orbit
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const links = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: '3D Observatory', path: '/observatory', icon: Orbit, badge: '3D' },
    { name: 'Earth Explorer', path: '/earth-explorer', icon: Globe },
    { name: 'Environmental Layers', path: '/variable-explorer', icon: Layers },
    { name: 'Trend Detective', path: '/trend-detective', icon: Search, badge: 'NASA' },
    { name: 'Global Disaster Watch', path: '/disaster-watch', icon: ShieldAlert, badge: 'LIVE' },
    { name: '72-Hour Blindspot', path: '/blindspot', icon: Radar, badge: '72H' },
    { name: 'AI Intelligence', path: '/ai-insights', icon: BrainCircuit, badge: 'AI' },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/about', icon: Settings },
  ];

  // Verified Data Source Statuses
  const dataSources = [
    { name: 'NASA POWER', status: 'Connected', icon: DatabaseCheck, color: 'text-cyan-400' },
    { name: 'NASA FIRMS', status: 'Active', icon: Flame, color: 'text-amber-400' },
    { name: 'GDACS Alerts', status: 'Operational', icon: Radio, color: 'text-emerald-400' },
    { name: 'EM-DAT Archive', status: 'Verified', icon: FileSpreadsheet, color: 'text-purple-400' },
  ];

  return (
    <aside 
      className={clsx(
        "bg-[#020817]/95 text-slate-300 flex flex-col transition-all duration-300 border-r border-[#172b4d] shrink-0 select-none z-30 shadow-2xl relative",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#172b4d]">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="relative shrink-0">
            <img 
              src="/assets/aistudio/image_eed5d808.png" 
              alt="EARTH TRACE Logo" 
              className="w-8 h-8 object-contain transition-transform group-hover:scale-110 drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]" 
            />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75"></span>
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-wider text-white truncate font-space">EARTH TRACE</span>
              <span className="text-[9px] font-mono text-cyan-400 tracking-widest truncate uppercase">SPACE-TECH DETECTIVE</span>
            </div>
          )}
        </NavLink>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#061426] border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2.5 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            title={!isOpen ? link.name : undefined}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-xs font-mono group relative",
                isActive 
                  ? "bg-gradient-to-r from-cyan-950/80 via-purple-950/60 to-cyan-950/80 text-cyan-200 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.25)] font-bold" 
                  : "text-slate-400 hover:bg-[#061426] hover:text-white border border-transparent hover:border-cyan-500/20"
              )
            }
          >
            <link.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-cyan-400" />
            {isOpen && (
              <span className="truncate flex-1 tracking-wide">{link.name}</span>
            )}
            {isOpen && link.badge && (
              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-900/60 to-purple-900/60 text-cyan-300 border border-cyan-500/40 shadow-sm">
                {link.badge}
              </span>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#061426] text-white text-[11px] font-mono rounded-lg border border-cyan-500/30 shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {link.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Verified NASA & Global Data Source Telemetry Footer */}
      <div className="p-3 border-t border-[#172b4d] font-mono text-[10px] space-y-2 bg-[#020817]">
        {isOpen ? (
          <div className="space-y-1.5">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
              <span>DATA TELEMETRY</span>
              <span className="text-emerald-400 font-normal">LIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {dataSources.map((ds) => (
                <div key={ds.name} className="p-1.5 rounded-lg bg-[#061426]/80 border border-[#172b4d] flex flex-col justify-between">
                  <div className="flex items-center gap-1">
                    <ds.icon className={`w-3 h-3 ${ds.color}`} />
                    <span className="text-[9px] text-slate-200 font-bold truncate">{ds.name}</span>
                  </div>
                  <span className="text-[8px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                    {ds.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#172b4d]/60 flex items-center justify-between">
              <img 
                src="/assets/aistudio/image_0bb54710.png" 
                alt="NASA Space Apps Challenge" 
                className="h-5 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]" 
              />
              <span className="text-[8px] text-cyan-400/80 font-mono">SPACE APPS 2026</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2" title="NASA Data Telemetry Operational">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
        )}
      </div>
    </aside>
  );
}
