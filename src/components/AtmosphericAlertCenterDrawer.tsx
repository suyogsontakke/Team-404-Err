/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Sliders, 
  Flame, 
  AlertTriangle, 
  Info, 
  Check, 
  CheckCheck, 
  Trash2, 
  Plus, 
  Volume2, 
  VolumeX, 
  Radio, 
  Download, 
  RotateCcw, 
  Activity, 
  Compass, 
  Zap, 
  SlidersHorizontal,
  Search,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  AtmosphericRule, 
  AtmosphericBreachEvent, 
  AtmosphericStationReading, 
  AlertSeverity, 
  AlertCondition,
  AlertFilterOptions 
} from '../lib/atmosphericAlertTypes';
import { PRESET_LOCATIONS } from '../lib/nasaPowerService';
import { DEFAULT_ATMOSPHERIC_RULES } from '../services/atmosphericAlertService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rules: AtmosphericRule[];
  breaches: AtmosphericBreachEvent[];
  liveReadings: AtmosphericStationReading[];
  onToggleRule: (ruleId: string) => void;
  onUpdateRule: (rule: AtmosphericRule) => void;
  onAddRule: (rule: Omit<AtmosphericRule, 'id'>) => void;
  onDeleteRule: (ruleId: string) => void;
  onResetRules: () => void;
  onAcknowledgeBreach: (breachId: string) => void;
  onAcknowledgeAll: () => void;
  onClearBreaches: () => void;
  onSelectLayer: (variableKey: string) => void;
  onOpenTrend: (variableKey: string) => void;
  onTriggerSimulation: (type: 'pm25_inversion' | 'stagnation_calm' | 'heatwave' | 'dense_smog', stationName?: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onRequestDesktopPermission: () => void;
}

export default function AtmosphericAlertCenterDrawer({
  isOpen,
  onClose,
  rules,
  breaches,
  liveReadings,
  onToggleRule,
  onUpdateRule,
  onAddRule,
  onDeleteRule,
  onResetRules,
  onAcknowledgeBreach,
  onAcknowledgeAll,
  onClearBreaches,
  onSelectLayer,
  onOpenTrend,
  onTriggerSimulation,
  isMuted,
  onToggleMute,
  isStreaming,
  onToggleStreaming,
  onRequestDesktopPermission
}: Props) {
  const [activeTab, setActiveTab] = useState<'breaches' | 'rules' | 'probes'>('breaches');
  const [filter, setFilter] = useState<AlertFilterOptions>({
    severity: 'ALL',
    status: 'ALL',
    variableKey: 'ALL',
    search: ''
  });
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);

  // New Rule Form State
  const [newRuleVar, setNewRuleVar] = useState('PM25');
  const [newRuleCondition, setNewRuleCondition] = useState<AlertCondition>('>');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(55);
  const [newRuleSeverity, setNewRuleSeverity] = useState<AlertSeverity>('warning');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleRationale, setNewRuleRationale] = useState('');
  const [newRuleStation, setNewRuleStation] = useState('ALL');

  if (!isOpen) return null;

  // Filter breaches
  const filteredBreaches = breaches.filter(b => {
    if (filter.severity !== 'ALL' && b.severity !== filter.severity) return false;
    if (filter.status === 'active' && b.acknowledged) return false;
    if (filter.status === 'acknowledged' && !b.acknowledged) return false;
    if (filter.variableKey !== 'ALL' && b.variableKey !== filter.variableKey) return false;
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.locationName.toLowerCase().includes(q) ||
        b.variableKey.toLowerCase().includes(q) ||
        b.boundaryPhysicsExplanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unacknowledgedCount = breaches.filter(b => !b.acknowledged).length;
  const criticalCount = breaches.filter(b => !b.acknowledged && b.severity === 'critical').length;

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const varMeta: Record<string, { name: string; units: string }> = {
      PM25: { name: 'PM2.5 Surface Particulate Matter', units: 'µg/m³' },
      AOD550: { name: 'Aerosol Optical Depth (550nm)', units: 'Index' },
      T2M: { name: 'Near-Surface Air Temperature', units: '°C' },
      WS10M: { name: 'Atmospheric Wind Speed', units: 'm/s' },
      PRECTOTCORR: { name: 'Precipitation Scavenging', units: 'mm/day' },
      RH2M: { name: 'Relative Humidity', units: '%' },
      ALLSKY_KT: { name: 'Atmospheric Clearness Index', units: 'Fraction' },
      GWETTOP: { name: 'Top-Layer Soil Moisture', units: 'Fraction' }
    };

    const meta = varMeta[newRuleVar] || { name: newRuleVar, units: '' };

    onAddRule({
      variableKey: newRuleVar,
      variableName: meta.name,
      condition: newRuleCondition,
      thresholdValue: Number(newRuleThreshold),
      units: meta.units,
      severity: newRuleSeverity,
      title: newRuleTitle.trim() || `${newRuleVar} Threshold Exceedance (${newRuleCondition} ${newRuleThreshold} ${meta.units})`,
      rationale: newRuleRationale.trim() || `Real-time atmospheric telemetry breached empirical safety baseline at ${newRuleStation === 'ALL' ? 'monitored stations' : newRuleStation}.`,
      enabled: true,
      soundEnabled: true,
      desktopNotification: newRuleSeverity === 'critical',
      targetStation: newRuleStation,
      cooldownSeconds: 25
    });

    // Reset and close
    setNewRuleTitle('');
    setNewRuleRationale('');
    setShowAddRuleModal(false);
  };

  const handleExportCSV = () => {
    if (breaches.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Formatted Time', 'Severity', 'Station', 'Variable', 'Observed Value', 'Condition', 'Threshold', 'Unit', 'Status', 'Physics Explanation'];
    const rows = breaches.map(b => [
      b.id,
      b.timestamp,
      `"${b.formattedTime}"`,
      b.severity,
      `"${b.locationName}"`,
      b.variableKey,
      b.currentValue,
      b.condition,
      b.thresholdValue,
      `"${b.units}"`,
      b.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE',
      `"${b.boundaryPhysicsExplanation.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EARTH_TRACE_Atmospheric_Breaches_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Real-time atmospheric breach notification hub"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
    >
      {/* Sliding HUD Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full max-w-2xl bg-[#171B2B] border-l border-[#48516A] h-full flex flex-col shadow-2xl relative text-[#F0EBDD]"
      >
        
        {/* TOP HUD BAR */}
        <div className="p-4 bg-[#232A3D] border-b border-[#48516A] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#353D55] border border-[#64718A] text-[#A6B7D4] relative">
              <Bell className="w-5 h-5" />
              {unacknowledgedCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#F16C72] text-[#171B2B] font-mono text-[9px] font-bold rounded-full animate-pulse border border-[#F16C72]">
                  {unacknowledgedCount}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#A6B7D4] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Radio className={`w-3 h-3 ${isStreaming ? 'text-[#35C98B] animate-pulse' : 'text-[#838FA3]'}`} />
                  {isStreaming ? 'LIVE TELEMETRY STREAM' : 'STREAM PAUSED'}
                </span>
                <span className="text-[#838FA3] font-mono text-[10px]">· MERRA-2 L3</span>
              </div>
              <h2 className="text-base font-bold text-[#F0EBDD] tracking-tight flex items-center gap-2">
                <span>Atmospheric Breach Notification Center</span>
              </h2>
            </div>
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={onToggleStreaming}
              title={isStreaming ? "Pause Live Telemetry Stream" : "Resume Live Stream"}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isStreaming 
                  ? 'bg-[#35C98B]/20 border-[#35C98B]/50 text-[#35C98B]' 
                  : 'bg-[#1D2436] border-[#48516A] text-[#B5BDCC]'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleMute}
              title={isMuted ? "Unmute Alert Chime" : "Mute Alert Chime"}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                !isMuted 
                  ? 'bg-[#353D55] border-[#64718A] text-[#A6B7D4]' 
                  : 'bg-[#1D2436] border-[#48516A] text-[#838FA3]'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-[#1D2436] hover:bg-[#353D55] border border-[#48516A] text-[#B5BDCC] hover:text-[#F0EBDD] rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION & SIMULATION TRIGGER STRIP */}
        <div className="bg-[#232A3D] border-b border-[#2D354A] px-4 pt-3 pb-2 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 bg-[#1D2436] p-1 rounded-xl border border-[#48516A]">
              <button
                onClick={() => setActiveTab('breaches')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'breaches'
                    ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                    : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Breach Feed</span>
                {unacknowledgedCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    activeTab === 'breaches' ? 'bg-[#171B2B] text-[#F0EBDD]' : 'bg-[#F16C72]/30 text-[#F16C72]'
                  }`}>
                    {unacknowledgedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                    : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Threshold Rules</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  activeTab === 'rules' ? 'bg-[#171B2B] text-[#F0EBDD]' : 'bg-[#353D55] text-[#B5BDCC]'
                }`}>
                  {rules.filter(r => r.enabled).length}/{rules.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('probes')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'probes'
                    ? 'bg-[#A6B7D4] text-[#171B2B] font-bold shadow-sm'
                    : 'text-[#B5BDCC] hover:text-[#F0EBDD]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Live Probes</span>
                <span className="w-2 h-2 rounded-full bg-[#35C98B] animate-pulse"></span>
              </button>
            </div>

            {/* Test Simulation Quick Triggers */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#B5BDCC] uppercase hidden sm:inline">
                Simulate:
              </span>
              <button
                onClick={() => onTriggerSimulation('pm25_inversion')}
                title="Inject Inversion PM2.5 Spike (>85 µg/m³)"
                className="px-2 py-1 bg-[#F16C72]/15 hover:bg-[#F16C72]/25 border border-[#F16C72]/50 text-[#F16C72] font-mono text-[10px] rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Flame className="w-3 h-3 text-[#F16C72]" />
                <span>PM2.5 Spike</span>
              </button>
              <button
                onClick={() => onTriggerSimulation('stagnation_calm')}
                title="Inject Calm Stagnation (<1.5 m/s)"
                className="px-2 py-1 bg-[#F0B44D]/15 hover:bg-[#F0B44D]/25 border border-[#F0B44D]/50 text-[#F0B44D] font-mono text-[10px] rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3 text-[#F0B44D]" />
                <span>Wind Stagnation</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: BREACHES FEED */}
        {activeTab === 'breaches' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Filter & Action Toolbar */}
            <div className="bg-[#232A3D] border border-[#48516A] rounded-xl p-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#838FA3] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search breaches by station, variable, or physics..."
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-[#F0EBDD] placeholder-[#838FA3] focus:outline-none focus:border-[#A6B7D4]"
                  />
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
                  {unacknowledgedCount > 0 && (
                    <button
                      onClick={onAcknowledgeAll}
                      className="px-2.5 py-1 bg-[#35C98B]/20 hover:bg-[#35C98B]/30 border border-[#35C98B]/50 text-[#35C98B] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Acknowledge All</span>
                    </button>
                  )}
                  <button
                    onClick={handleExportCSV}
                    disabled={breaches.length === 0}
                    className="px-2.5 py-1 bg-[#353D55] hover:bg-[#48516A] border border-[#48516A] text-[#F0EBDD] rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Export Breaches CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                  {breaches.length > 0 && (
                    <button
                      onClick={onClearBreaches}
                      className="p-1 hover:text-[#F16C72] text-[#838FA3] transition-colors"
                      title="Clear Breach History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pills Filters */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#2D354A] text-[11px] font-mono">
                <span className="text-[#838FA3]">Severity:</span>
                {(['ALL', 'critical', 'warning', 'advisory'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFilter(prev => ({ ...prev, severity: sev }))}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      filter.severity === sev 
                        ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' 
                        : 'bg-[#1D2436] text-[#B5BDCC] hover:text-[#F0EBDD] border border-[#2D354A]'
                    }`}
                  >
                    {sev.toUpperCase()}
                  </button>
                ))}

                <span className="text-[#838FA3] ml-2">Status:</span>
                {(['ALL', 'active', 'acknowledged'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setFilter(prev => ({ ...prev, status: st }))}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      filter.status === st 
                        ? 'bg-[#A6B7D4] text-[#171B2B] font-bold' 
                        : 'bg-[#1D2436] text-[#B5BDCC] hover:text-[#F0EBDD] border border-[#2D354A]'
                    }`}
                  >
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Breaches List */}
            {filteredBreaches.length === 0 ? (
              <div className="bg-[#232A3D] border border-[#48516A] rounded-xl p-8 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-[#35C98B] mx-auto opacity-70" />
                <h4 className="text-sm font-bold text-[#F0EBDD]">No Atmospheric Breaches Recorded</h4>
                <p className="text-xs text-[#B5BDCC] max-w-md mx-auto">
                  All active satellite telemetry readings are currently within nominal thresholds. You can trigger a simulated breach using the quick actions above to test alert firing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBreaches.map((breach) => {
                  const isCritical = breach.severity === 'critical';
                  const isWarning = breach.severity === 'warning';

                  return (
                    <div
                      key={breach.id}
                      className={`bg-[#232A3D] border rounded-xl p-4 transition-all relative overflow-hidden ${
                        !breach.acknowledged
                          ? isCritical
                            ? 'border-[#F16C72]/70 shadow-lg ring-1 ring-[#F16C72]/20'
                            : isWarning
                              ? 'border-[#F0B44D]/70 shadow-lg ring-1 ring-[#F0B44D]/20'
                              : 'border-[#A6B7D4]/70 shadow-lg ring-1 ring-[#A6B7D4]/20'
                          : 'border-[#2D354A] opacity-80'
                      }`}
                    >
                      {/* Left Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isCritical ? 'bg-[#F16C72]' : isWarning ? 'bg-[#F0B44D]' : 'bg-[#A6B7D4]'
                      }`} />

                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                              isCritical 
                                ? 'bg-[#F16C72]/20 text-[#F16C72] border-[#F16C72]/40' 
                                : isWarning 
                                  ? 'bg-[#F0B44D]/20 text-[#F0B44D] border-[#F0B44D]/40' 
                                  : 'bg-[#A6B7D4]/20 text-[#A6B7D4] border-[#A6B7D4]/40'
                            }`}>
                              {breach.severity}
                            </span>

                            <span className="font-mono text-xs font-bold text-[#A6B7D4] bg-[#1D2436] px-1.5 py-0.5 rounded border border-[#48516A]">
                              {breach.variableKey}
                            </span>

                            <span className="text-xs font-semibold text-[#F0EBDD] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#B5BDCC]" />
                              <span>{breach.locationName}</span>
                            </span>

                            <span className="text-[10px] font-mono text-[#838FA3] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{breach.formattedTime}</span>
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#F0EBDD] pt-1">
                            {breach.title}
                          </h4>

                          {/* Measured Metric vs Threshold */}
                          <div className="flex items-baseline gap-2 font-mono text-xs">
                            <span className="text-[#B5BDCC]">Observed Value:</span>
                            <span className={`font-extrabold text-sm ${
                              isCritical ? 'text-[#F16C72]' : isWarning ? 'text-[#F0B44D]' : 'text-[#A6B7D4]'
                            }`}>
                              {breach.currentValue} {breach.units}
                            </span>
                            <span className="text-[#838FA3]">
                              (Limit: {breach.condition} {breach.thresholdValue} {breach.units})
                            </span>
                          </div>

                          {/* Physics Commentary */}
                          <p className="text-xs text-[#B5BDCC] leading-relaxed font-sans bg-[#1D2436] p-2.5 rounded-lg border border-[#2D354A] mt-2">
                            {breach.boundaryPhysicsExplanation}
                          </p>
                        </div>

                        {/* Status / Acknowledge */}
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {!breach.acknowledged ? (
                            <button
                              onClick={() => onAcknowledgeBreach(breach.id)}
                              className="px-2.5 py-1 bg-[#35C98B]/20 hover:bg-[#35C98B]/30 border border-[#35C98B]/60 text-[#35C98B] rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Acknowledge</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-[#838FA3] bg-[#1D2436] px-2 py-0.5 rounded border border-[#2D354A] flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#35C98B]" />
                              <span>Acknowledged</span>
                            </span>
                          )}

                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            <button
                              onClick={() => {
                                onSelectLayer(breach.variableKey);
                                onClose();
                              }}
                              className="text-[#A6B7D4] hover:text-[#F0EBDD] underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Layer</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[#838FA3]">·</span>
                            <button
                              onClick={() => {
                                onOpenTrend(breach.variableKey);
                                onClose();
                              }}
                              className="text-[#D28B71] hover:text-[#F0EBDD] underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Trend</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: THRESHOLD RULES CONFIGURATION */}
        {activeTab === 'rules' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Header with New Rule & Reset Actions */}
            <div className="bg-[#232A3D] border border-[#48516A] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#F0EBDD] font-mono uppercase tracking-wider">
                  Configured Atmospheric Threshold Rules
                </h4>
                <p className="text-[11px] text-[#B5BDCC]">
                  Rules actively evaluated against real-time MERRA-2 sensor streams.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setShowAddRuleModal(true)}
                  className="px-3 py-1.5 bg-[#A6B7D4] hover:bg-[#B8C6DF] text-[#171B2B] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Rule</span>
                </button>
                <button
                  onClick={onResetRules}
                  className="px-2.5 py-1.5 bg-[#1D2436] hover:bg-[#353D55] border border-[#48516A] text-[#B5BDCC] hover:text-[#F0EBDD] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Restore NASA & WHO Default Rules"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Desktop Notification Banner */}
            <div className="bg-[#353D55] border border-[#64718A] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#A6B7D4] shrink-0" />
                <span className="text-[#F0EBDD]">
                  Enable OS Desktop Notifications for critical atmospheric alerts.
                </span>
              </div>
              <button
                onClick={onRequestDesktopPermission}
                className="px-2.5 py-1 bg-[#A6B7D4] hover:bg-[#B8C6DF] text-[#171B2B] font-bold font-mono rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                Request Permission
              </button>
            </div>

            {/* Rules List */}
            <div className="space-y-3">
              {rules.map((rule) => {
                const isCritical = rule.severity === 'critical';
                const isWarning = rule.severity === 'warning';

                return (
                  <div
                    key={rule.id}
                    className={`border rounded-xl p-4 transition-all ${
                      rule.enabled 
                        ? 'border-[#48516A] bg-[#232A3D]' 
                        : 'border-[#2D354A] opacity-60 bg-[#1D2436]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Enable/Disable Toggle */}
                          <label className="relative inline-flex items-center cursor-pointer mr-1">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => onToggleRule(rule.id)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-[#1D2436] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#F0EBDD] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#F0EBDD] after:border-[#B5BDCC] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#A6B7D4]"></div>
                          </label>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            isCritical 
                              ? 'bg-[#F16C72]/20 text-[#F16C72] border-[#F16C72]/40' 
                              : isWarning 
                                ? 'bg-[#F0B44D]/20 text-[#F0B44D] border-[#F0B44D]/40' 
                                : 'bg-[#A6B7D4]/20 text-[#A6B7D4] border-[#A6B7D4]/40'
                          }`}>
                            {rule.severity}
                          </span>

                          <span className="font-mono text-xs font-bold text-[#A6B7D4] bg-[#1D2436] px-1.5 py-0.5 rounded border border-[#48516A]">
                            {rule.variableKey}
                          </span>

                          <span className="text-[11px] font-mono text-[#B5BDCC]">
                            Station: <strong className="text-[#F0EBDD]">{rule.targetStation}</strong>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#F0EBDD] pt-1">
                          {rule.title}
                        </h4>

                        {/* Interactive Threshold Number Adjuster */}
                        <div className="flex items-center gap-2 font-mono text-xs pt-1">
                          <span className="text-[#B5BDCC]">Trigger Threshold:</span>
                          <span className="font-bold text-[#F0EBDD]">{rule.condition}</span>
                          <input
                            type="number"
                            step={rule.variableKey === 'AOD550' || rule.variableKey === 'ALLSKY_KT' ? '0.05' : '1'}
                            value={rule.thresholdValue}
                            onChange={(e) => onUpdateRule({
                              ...rule,
                              thresholdValue: parseFloat(e.target.value) || 0
                            })}
                            className="w-20 bg-[#1D2436] border border-[#48516A] rounded px-2 py-0.5 text-[#A6B7D4] font-bold focus:outline-none focus:border-[#A6B7D4] text-center"
                          />
                          <span className="text-[#B5BDCC]">{rule.units}</span>
                        </div>

                        <p className="text-xs text-[#B5BDCC] leading-relaxed font-sans pt-1">
                          {rule.rationale}
                        </p>
                      </div>

                      {/* Rule Settings Toggles (Sound & Desktop & Delete) */}
                      <div className="flex items-center gap-2 text-xs font-mono self-end sm:self-start">
                        <button
                          onClick={() => onUpdateRule({ ...rule, soundEnabled: !rule.soundEnabled })}
                          title={rule.soundEnabled ? "Mute alert chime for this rule" : "Enable chime for this rule"}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            rule.soundEnabled 
                              ? 'bg-[#353D55] border-[#64718A] text-[#A6B7D4]' 
                              : 'bg-[#1D2436] border-[#2D354A] text-[#838FA3]'
                          }`}
                        >
                          {rule.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => onUpdateRule({ ...rule, desktopNotification: !rule.desktopNotification })}
                          title={rule.desktopNotification ? "Disable desktop popups" : "Enable desktop popups"}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            rule.desktopNotification 
                              ? 'bg-[#D28B71]/20 border-[#D28B71]/50 text-[#D28B71]' 
                              : 'bg-[#1D2436] border-[#2D354A] text-[#838FA3]'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>

                        {rule.id.startsWith('rule-') && !DEFAULT_ATMOSPHERIC_RULES.some(d => d.id === rule.id) && (
                          <button
                            onClick={() => onDeleteRule(rule.id)}
                            className="p-1.5 bg-[#F16C72]/15 hover:bg-[#F16C72]/25 border border-[#F16C72]/40 text-[#F16C72] rounded-lg transition-colors cursor-pointer"
                            title="Delete Custom Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 3: LIVE SENSOR PROBES TABLE */}
        {activeTab === 'probes' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            <div className="bg-[#232A3D] border border-[#48516A] rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#35C98B] animate-pulse"></span>
                <span className="font-bold text-[#F0EBDD]">Live Multi-Sensor Atmospheric Grid</span>
              </div>
              <span className="text-[#B5BDCC] text-[11px]">Continuous MERRA-2 Fluctuation Tick</span>
            </div>

            <div className="bg-[#232A3D] border border-[#48516A] rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1D2436] border-b border-[#48516A] text-[#B5BDCC] text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Reference Station</th>
                      <th className="p-3 text-right">PM2.5 (µg/m³)</th>
                      <th className="p-3 text-right">AOD (550nm)</th>
                      <th className="p-3 text-right">Temp (°C)</th>
                      <th className="p-3 text-right">Wind (m/s)</th>
                      <th className="p-3 text-right">RH (%)</th>
                      <th className="p-3 text-right">Rain (mm)</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D354A]">
                    {liveReadings.map((reading) => {
                      const m = reading.metrics;
                      const hasPMSpike = m.PM25 > 75;
                      const hasWindStagnation = m.WS10M < 2.0;
                      const hasHeatwave = m.T2M > 40;
                      const isBreached = hasPMSpike || hasWindStagnation || hasHeatwave;

                      return (
                        <tr 
                          key={reading.locationName}
                          className={`hover:bg-[#2B3349] transition-colors ${
                            isBreached ? 'bg-[#F16C72]/10' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-bold text-[#F0EBDD]">{reading.locationName}</div>
                            <div className="text-[10px] text-[#838FA3]">{reading.region}</div>
                          </td>

                          {/* PM2.5 */}
                          <td className={`p-3 text-right font-bold ${
                            m.PM25 > 75 ? 'text-[#F16C72] animate-pulse' : m.PM25 > 35 ? 'text-[#F0B44D]' : 'text-[#35C98B]'
                          }`}>
                            {m.PM25.toFixed(1)}
                          </td>

                          {/* AOD */}
                          <td className={`p-3 text-right ${m.AOD550 > 0.7 ? 'text-[#F0B44D] font-bold' : 'text-[#F0EBDD]'}`}>
                            {m.AOD550.toFixed(2)}
                          </td>

                          {/* Temp */}
                          <td className={`p-3 text-right ${m.T2M > 40 ? 'text-[#F16C72] font-bold' : 'text-[#F0EBDD]'}`}>
                            {m.T2M.toFixed(1)}°
                          </td>

                          {/* Wind */}
                          <td className={`p-3 text-right ${m.WS10M < 2.0 ? 'text-[#F16C72] font-bold' : 'text-[#A6B7D4]'}`}>
                            {m.WS10M.toFixed(1)}
                          </td>

                          {/* RH */}
                          <td className={`p-3 text-right ${m.RH2M > 88 ? 'text-[#D28B71] font-bold' : 'text-[#F0EBDD]'}`}>
                            {m.RH2M}%
                          </td>

                          {/* Rain */}
                          <td className="p-3 text-right text-[#F0EBDD]">
                            {m.PRECTOTCORR.toFixed(1)}
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            {isBreached ? (
                              <span className="px-1.5 py-0.5 bg-[#F16C72]/20 text-[#F16C72] border border-[#F16C72]/50 rounded text-[9px] font-bold">
                                BREACH
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-[#35C98B]/20 text-[#35C98B] border border-[#35C98B]/50 rounded text-[9px] font-bold">
                                NOMINAL
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* MODAL: ADD CUSTOM THRESHOLD RULE */}
        {showAddRuleModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-6 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#232A3D] border border-[#64718A] rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
                <h3 className="text-sm font-bold text-[#F0EBDD] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#A6B7D4]" />
                  <span>Create Custom Atmospheric Rule</span>
                </h3>
                <button 
                  onClick={() => setShowAddRuleModal(false)}
                  className="text-[#B5BDCC] hover:text-[#F0EBDD]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs font-mono">
                {/* Variable Selector */}
                <div>
                  <label className="text-[#B5BDCC] block mb-1">Target Atmospheric Variable</label>
                  <select
                    value={newRuleVar}
                    onChange={(e) => setNewRuleVar(e.target.value)}
                    className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg p-2 text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4]"
                  >
                    <option value="PM25">PM2.5 Surface Particulate Matter (µg/m³)</option>
                    <option value="AOD550">Aerosol Optical Depth AOD (Index)</option>
                    <option value="T2M">Near-Surface Air Temperature (°C)</option>
                    <option value="WS10M">Atmospheric Wind Speed (m/s)</option>
                    <option value="PRECTOTCORR">Precipitation Scavenging (mm/day)</option>
                    <option value="RH2M">Relative Humidity (%)</option>
                    <option value="ALLSKY_KT">Atmospheric Clearness Index (Fraction)</option>
                    <option value="GWETTOP">Top-Layer Soil Moisture (Fraction)</option>
                  </select>
                </div>

                {/* Condition & Numerical Threshold */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#B5BDCC] block mb-1">Condition</label>
                    <select
                      value={newRuleCondition}
                      onChange={(e) => setNewRuleCondition(e.target.value as AlertCondition)}
                      className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg p-2 text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4]"
                    >
                      <option value=">">Exceeds (&gt;)</option>
                      <option value="<">Falls Below (&lt;)</option>
                      <option value=">=">Greater or Equal (&gt;=)</option>
                      <option value="<=">Less or Equal (&lt;=)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#B5BDCC] block mb-1">Threshold Value</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newRuleThreshold}
                      onChange={(e) => setNewRuleThreshold(parseFloat(e.target.value))}
                      className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg p-2 text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4]"
                    />
                  </div>
                </div>

                {/* Severity & Target Station */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#B5BDCC] block mb-1">Alert Severity</label>
                    <select
                      value={newRuleSeverity}
                      onChange={(e) => setNewRuleSeverity(e.target.value as AlertSeverity)}
                      className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg p-2 text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4]"
                    >
                      <option value="critical">Critical Hazard (Red)</option>
                      <option value="warning">Warning / Elevated (Amber)</option>
                      <option value="advisory">Advisory Notice (Powder Blue)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#B5BDCC] block mb-1">Target Station</label>
                    <select
                      value={newRuleStation}
                      onChange={(e) => setNewRuleStation(e.target.value)}
                      className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg p-2 text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4]"
                    >
                      <option value="ALL">All Stations (Global)</option>
                      {PRESET_LOCATIONS.map(l => (
                        <option key={l.name} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[#B5BDCC] block mb-1">Alert Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Urban Basin High PM2.5 Accumulation"
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg p-2 text-[#F0EBDD] placeholder-[#838FA3] focus:outline-none focus:border-[#A6B7D4]"
                  />
                </div>

                {/* Rationale */}
                <div>
                  <label className="text-[#B5BDCC] block mb-1">Atmospheric Physics Rationale</label>
                  <textarea
                    rows={2}
                    placeholder="Scientific explanation of the boundary layer or meteorological mechanism..."
                    value={newRuleRationale}
                    onChange={(e) => setNewRuleRationale(e.target.value)}
                    className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg p-2 text-[#F0EBDD] placeholder-[#838FA3] focus:outline-none focus:border-[#A6B7D4] font-sans"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#48516A]">
                  <button
                    type="button"
                    onClick={() => setShowAddRuleModal(false)}
                    className="px-3 py-1.5 bg-[#1D2436] hover:bg-[#353D55] text-[#B5BDCC] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#A6B7D4] hover:bg-[#B8C6DF] text-[#171B2B] font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
