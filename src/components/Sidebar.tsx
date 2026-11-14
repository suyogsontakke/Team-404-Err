/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
    { name: 'NASA POWER', status: 'Connected', icon: DatabaseCheck, color: 'text-[#A6B7D4]' },
    { name: 'NASA FIRMS', status: 'Active', icon: Flame, color: 'text-[#F0B44D]' },
    { name: 'GDACS Alerts', status: 'Operational', icon: Radio, color: 'text-[#35C98B]' },
    { name: 'EM-DAT Archive', status: 'Verified', icon: FileSpreadsheet, color: 'text-[#D28B71]' },
  ];

  return (
    <aside 
      className={clsx(
        "bg-[#171B2B] text-[#B5BDCC] flex flex-col transition-all duration-300 border-r border-[#48516A] shrink-0 select-none z-30 relative",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#48516A]">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden group">
          <img 
            src="/assets/aistudio/image_eed5d808.png" 
            alt="EARTH TRACE Logo" 
            className="w-8 h-8 object-contain shrink-0" 
          />
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-wide text-[#F0EBDD] truncate font-space">EARTH TRACE</span>
              <span className="text-[10px] font-mono text-[#838FA3] tracking-wider truncate uppercase">Observation Platform</span>
            </div>
          )}
        </NavLink>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-[#B5BDCC] hover:text-[#F0EBDD] p-1.5 rounded-lg hover:bg-[#232A3D] border border-transparent hover:border-[#48516A] transition-colors cursor-pointer"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4 text-[#B5BDCC]" /> : <ChevronRight className="w-4 h-4 text-[#B5BDCC]" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            title={!isOpen ? link.name : undefined}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs font-medium group relative",
                isActive 
                  ? "bg-[#353D55] text-[#F0EBDD] border-l-2 border-[#A6B7D4] font-semibold" 
                  : "text-[#B5BDCC] hover:bg-[#232A3D] hover:text-[#F0EBDD]"
              )
            }
          >
            <link.icon className="w-4 h-4 shrink-0 transition-colors text-[#B5BDCC] group-hover:text-[#A6B7D4]" />
            {isOpen && (
              <span className="truncate flex-1">{link.name}</span>
            )}
            {isOpen && link.badge && (
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#232A3D] text-[#A6B7D4] border border-[#48516A]">
                {link.badge}
              </span>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#232A3D] text-[#F0EBDD] text-xs font-sans rounded-md border border-[#48516A] shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {link.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Verified NASA & Global Data Source Status */}
      <div className="p-3 border-t border-[#48516A] text-[11px] space-y-2 bg-[#171B2B]">
        {isOpen ? (
          <div className="space-y-1.5">
            <div className="text-[10px] text-[#838FA3] uppercase font-semibold tracking-wider flex items-center justify-between">
              <span>Data Telemetry</span>
              <span className="text-[#35C98B] font-mono text-[9px]">Operational</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {dataSources.map((ds) => (
                <div key={ds.name} className="p-1.5 rounded-md bg-[#232A3D] border border-[#48516A] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <ds.icon className={`w-3 h-3 ${ds.color}`} />
                    <span className="text-[10px] text-[#F0EBDD] font-medium truncate">{ds.name}</span>
                  </div>
                  <span className="text-[9px] text-[#B5BDCC] flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35C98B]"></span>
                    {ds.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#48516A] flex items-center justify-between">
              <img 
                src="/assets/aistudio/image_0bb54710.png" 
                alt="NASA Space Apps Challenge" 
                className="h-4.5 w-auto object-contain opacity-75" 
              />
              <span className="text-[9px] text-[#838FA3] font-mono">SPACE APPS 2026</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2" title="NASA Data Telemetry Operational">
            <span className="w-2 h-2 rounded-full bg-[#35C98B]"></span>
          </div>
        )}
      </div>
    </aside>
  );
}
