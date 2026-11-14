/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Flame, 
  Info, 
  X, 
  Check, 
  ArrowRight, 
  Activity, 
  Compass,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';
import { AtmosphericBreachEvent } from '../lib/atmosphericAlertTypes';

interface Props {
  breaches: AtmosphericBreachEvent[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onSelectLayer: (variableKey: string) => void;
  onOpenTrend: (variableKey: string) => void;
  onOpenCenter: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function AtmosphericAlertToast({
  breaches,
  onAcknowledge,
  onDismiss,
  onSelectLayer,
  onOpenTrend,
  onOpenCenter,
  isMuted,
  onToggleMute
}: Props) {
  // Only show unacknowledged, undismissed breaches, up to 3 simultaneously
  const visibleBreaches = breaches
    .filter(b => !b.acknowledged && !b.dismissedFromToast)
    .slice(0, 3);

  if (visibleBreaches.length === 0) return null;

  return (
    <aside 
      aria-label="Real-time atmospheric breach notifications"
      className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-[420px] w-full pointer-events-none"
    >
      <AnimatePresence>
        {visibleBreaches.map((breach) => {
          const isCritical = breach.severity === 'critical';
          const isWarning = breach.severity === 'warning';

          const borderColor = isCritical 
            ? 'border-[#F16C72]/80 shadow-black/60 ring-1 ring-[#F16C72]/40' 
            : isWarning 
              ? 'border-[#F0B44D]/80 shadow-black/60 ring-1 ring-[#F0B44D]/40' 
              : 'border-[#A6B7D4]/80 shadow-black/60 ring-1 ring-[#A6B7D4]/40';

          const badgeBg = isCritical
            ? 'bg-[#F16C72]/20 text-[#F16C72] border-[#F16C72]/40'
            : isWarning
              ? 'bg-[#F0B44D]/20 text-[#F0B44D] border-[#F0B44D]/40'
              : 'bg-[#A6B7D4]/20 text-[#A6B7D4] border-[#A6B7D4]/40';

          return (
            <motion.div
              key={breach.id}
              initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto bg-[#232A3D]/95 backdrop-blur-xl border rounded-xl shadow-2xl p-4 overflow-hidden relative ${borderColor}`}
            >
              {/* Top Severity Strip */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isCritical 
                    ? 'bg-[#F16C72] animate-pulse' 
                    : isWarning 
                      ? 'bg-[#F0B44D]' 
                      : 'bg-[#A6B7D4]'
                }`}
              />

              {/* Header: Severity Badge + Station + Sound + Close */}
              <div className="flex items-center justify-between gap-2 mb-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border flex items-center gap-1 ${badgeBg}`}>
                    {isCritical ? (
                      <Flame className="w-3 h-3 text-[#F16C72] animate-pulse" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-3 h-3 text-[#F0B44D]" />
                    ) : (
                      <Info className="w-3 h-3 text-[#A6B7D4]" />
                    )}
                    <span>{breach.severity} Breach</span>
                  </span>

                  <span className="text-[11px] font-mono text-[#B5BDCC] font-semibold truncate max-w-[150px]">
                    {breach.locationName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[#B5BDCC]">
                  <span className="text-[10px] font-mono text-[#838FA3]">
                    {breach.formattedTime}
                  </span>
                  <button
                    onClick={onToggleMute}
                    title={isMuted ? "Unmute Alerts" : "Mute Alerts"}
                    className="p-1 hover:text-[#F0EBDD] rounded transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#838FA3]" /> : <Volume2 className="w-3.5 h-3.5 text-[#A6B7D4]" />}
                  </button>
                  <button
                    onClick={() => onDismiss(breach.id)}
                    className="p-1 hover:text-[#F0EBDD] text-[#B5BDCC] rounded transition-colors"
                    title="Dismiss Notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Breach Metric Display */}
              <div className="space-y-1 mb-2.5">
                <h4 className="text-sm font-bold text-[#F0EBDD] tracking-tight flex items-center justify-between gap-2">
                  <span>{breach.title}</span>
                  <span className="font-mono text-xs px-1.5 py-0.5 bg-[#1D2436] rounded border border-[#48516A] text-[#A6B7D4]">
                    {breach.variableKey}
                  </span>
                </h4>

                {/* Telemetry Numbers HUD */}
                <div className="flex items-baseline gap-2 font-mono text-xs pt-0.5">
                  <span className="text-[#B5BDCC]">Observed:</span>
                  <span className={`text-sm font-extrabold ${isCritical ? 'text-[#F16C72]' : isWarning ? 'text-[#F0B44D]' : 'text-[#A6B7D4]'}`}>
                    {breach.currentValue} {breach.units}
                  </span>
                  <span className="text-[#838FA3] font-bold">
                    {breach.condition} {breach.thresholdValue} {breach.units}
                  </span>
                </div>
              </div>

              {/* Atmospheric Physics Explanation */}
              <p className="text-[11px] text-[#B5BDCC] leading-relaxed font-sans line-clamp-2 bg-[#1D2436] p-2 rounded-lg border border-[#2D354A] mb-3">
                {breach.boundaryPhysicsExplanation}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2D354A] text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectLayer(breach.variableKey)}
                    className="px-2.5 py-1 bg-[#353D55] hover:bg-[#48516A] text-[#F0EBDD] border border-[#48516A] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3 h-3 text-[#A6B7D4]" />
                    <span>View Layer</span>
                  </button>
                  <button
                    onClick={() => onOpenTrend(breach.variableKey)}
                    className="px-2.5 py-1 bg-[#1D2436] hover:bg-[#2B3349] text-[#B5BDCC] hover:text-[#F0EBDD] border border-[#48516A] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Activity className="w-3 h-3 text-[#D28B71]" />
                    <span>Trend</span>
                  </button>
                </div>

                <button
                  onClick={() => onAcknowledge(breach.id)}
                  className="px-2.5 py-1 bg-[#35C98B]/20 hover:bg-[#35C98B]/30 text-[#35C98B] border border-[#35C98B]/50 rounded-lg transition-colors flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Acknowledge</span>
                </button>
              </div>

            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
}
