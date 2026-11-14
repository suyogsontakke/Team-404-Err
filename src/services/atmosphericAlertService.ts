/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AtmosphericRule,
  AtmosphericBreachEvent,
  AtmosphericStationReading,
  AlertSeverity,
  AlertCondition
} from '../lib/atmosphericAlertTypes';
import { PRESET_LOCATIONS } from '../lib/nasaPowerService';

const RULES_STORAGE_KEY = 'earthtrace_atmospheric_rules_v1';
const BREACHES_STORAGE_KEY = 'earthtrace_breach_events_v1';
const SOUND_MUTED_STORAGE_KEY = 'earthtrace_alert_sound_muted_v1';

export const DEFAULT_ATMOSPHERIC_RULES: AtmosphericRule[] = [
  {
    id: 'rule-pm25-severe-inversion',
    variableKey: 'PM25',
    variableName: 'PM2.5 Surface Particulate Matter',
    condition: '>',
    thresholdValue: 75.0,
    units: 'µg/m³',
    severity: 'critical',
    title: 'Severe Inversion Particulate Trapping',
    rationale: 'Nocturnal radiation cooling creates a shallow thermal inversion lid (< 150m), trapping respirable particulates in toxic concentrations.',
    enabled: true,
    soundEnabled: true,
    desktopNotification: true,
    targetStation: 'ALL',
    cooldownSeconds: 25
  },
  {
    id: 'rule-ws10m-stagnation',
    variableKey: 'WS10M',
    variableName: 'Atmospheric Wind Speed',
    condition: '<',
    thresholdValue: 2.0,
    units: 'm/s',
    severity: 'critical',
    title: 'Atmospheric Ventilation Stagnation Crisis',
    rationale: 'Calm horizontal winds below 2.0 m/s extinguish horizontal advective transport, inducing rapid local pollutant accumulation.',
    enabled: true,
    soundEnabled: true,
    desktopNotification: true,
    targetStation: 'ALL',
    cooldownSeconds: 25
  },
  {
    id: 'rule-aod550-dense-smog',
    variableKey: 'AOD550',
    variableName: 'Aerosol Optical Depth (550nm)',
    condition: '>',
    thresholdValue: 0.70,
    units: 'Index',
    severity: 'warning',
    title: 'Dense Aerosol Column Extinction Plume',
    rationale: 'Total columnar optical extinction exceeds 0.70, signaling heavy biomass smoke, agricultural residue burns, or industrial aerosol loading.',
    enabled: true,
    soundEnabled: true,
    desktopNotification: false,
    targetStation: 'ALL',
    cooldownSeconds: 25
  },
  {
    id: 'rule-t2m-heatwave',
    variableKey: 'T2M',
    variableName: 'Near-Surface Air Temperature',
    condition: '>',
    thresholdValue: 40.0,
    units: '°C',
    severity: 'warning',
    title: 'Extreme Thermal Buoyancy & Heatwave',
    rationale: 'Kinetic air temperature exceeds 40°C. Promotes rapid thermal convection, exacerbates photochemical ozone precursors, and triggers heat stress.',
    enabled: true,
    soundEnabled: true,
    desktopNotification: false,
    targetStation: 'ALL',
    cooldownSeconds: 30
  },
  {
    id: 'rule-rh2m-hygroscopic-swelling',
    variableKey: 'RH2M',
    variableName: 'Relative Humidity',
    condition: '>',
    thresholdValue: 88.0,
    units: '%',
    severity: 'warning',
    title: 'Aerosol Deliquescence & Secondary Acid Fog',
    rationale: 'Relative humidity exceeds 88%, causing inorganic sulfate/nitrate particulates to absorb water vapor and swell into light-scattering toxic smog.',
    enabled: true,
    soundEnabled: false,
    desktopNotification: false,
    targetStation: 'ALL',
    cooldownSeconds: 30
  },
  {
    id: 'rule-pm25-unhealthy',
    variableKey: 'PM25',
    variableName: 'PM2.5 Surface Particulate Matter',
    condition: '>',
    thresholdValue: 35.0,
    units: 'µg/m³',
    severity: 'advisory',
    title: 'Elevated Particulate Exposure (WHO Target Breach)',
    rationale: 'Particulate concentration breaches the WHO 24-hr interim target (35 µg/m³), posing risks for pediatric and geriatric populations.',
    enabled: true,
    soundEnabled: false,
    desktopNotification: false,
    targetStation: 'ALL',
    cooldownSeconds: 20
  },
  {
    id: 'rule-prectotcorr-washout',
    variableKey: 'PRECTOTCORR',
    variableName: 'Precipitation Scavenging',
    condition: '>',
    thresholdValue: 20.0,
    units: 'mm/day',
    severity: 'advisory',
    title: 'Intense Wet Scavenging Washout Active',
    rationale: 'Monsoonal downpour scrubbing particulate mass from the tropospheric column; expect sharp post-rain PM2.5 drops.',
    enabled: false,
    soundEnabled: false,
    desktopNotification: false,
    targetStation: 'ALL',
    cooldownSeconds: 40
  }
];

// Audio synthesizer using Web Audio API
class AtmosphericAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playAlert(severity: AlertSeverity) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (severity === 'critical') {
        // High-priority 3-tone pulsed warning (880Hz -> 1046Hz -> 1318Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1318, now + 0.22);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);
      } else if (severity === 'warning') {
        // Double electronic sonar ping (659Hz -> 880Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659, now);
        osc.frequency.setValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.10, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Subtle low-profile acoustic chime (523Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.exponentialRampToValueAtTime(659, now + 0.15);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio playback fails gracefully if user hasn't interacted or unsupported
    }
  }
}

export const alertAudio = new AtmosphericAudioSynthesizer();

export class AtmosphericAlertManager {
  private rules: AtmosphericRule[] = [];
  private breaches: AtmosphericBreachEvent[] = [];
  private isSoundMuted: boolean = false;
  private lastAlertTimestamps: Map<string, number> = new Map();

  constructor() {
    this.loadRules();
    this.loadBreaches();
    this.loadMuteState();
  }

  // --- Rule Management ---
  getRules(): AtmosphericRule[] {
    return [...this.rules];
  }

  loadRules(): AtmosphericRule[] {
    try {
      const stored = localStorage.getItem(RULES_STORAGE_KEY);
      if (stored) {
        this.rules = JSON.parse(stored);
      } else {
        this.rules = [...DEFAULT_ATMOSPHERIC_RULES];
        this.saveRules();
      }
    } catch {
      this.rules = [...DEFAULT_ATMOSPHERIC_RULES];
    }
    return this.rules;
  }

  saveRules() {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(this.rules));
    } catch (e) {
      console.warn('Failed to save rules to localStorage:', e);
    }
  }

  toggleRule(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      this.saveRules();
      return rule.enabled;
    }
    return false;
  }

  updateRule(updatedRule: AtmosphericRule) {
    this.rules = this.rules.map(r => r.id === updatedRule.id ? updatedRule : r);
    this.saveRules();
  }

  addRule(newRule: Omit<AtmosphericRule, 'id'>): AtmosphericRule {
    const rule: AtmosphericRule = {
      ...newRule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    this.rules.push(rule);
    this.saveRules();
    return rule;
  }

  deleteRule(ruleId: string) {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.saveRules();
  }

  resetRulesToDefault(): AtmosphericRule[] {
    this.rules = [...DEFAULT_ATMOSPHERIC_RULES];
    this.saveRules();
    return this.rules;
  }

  // --- Sound & Notification Settings ---
  isMuted(): boolean {
    return this.isSoundMuted;
  }

  setMuted(muted: boolean) {
    this.isSoundMuted = muted;
    try {
      localStorage.setItem(SOUND_MUTED_STORAGE_KEY, String(muted));
    } catch {}
  }

  private loadMuteState() {
    try {
      const val = localStorage.getItem(SOUND_MUTED_STORAGE_KEY);
      this.isSoundMuted = val === 'true';
    } catch {
      this.isSoundMuted = false;
    }
  }

  requestDesktopPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied' as NotificationPermission);
  }

  // --- Breach Evaluation Engine ---
  evaluateReading(reading: AtmosphericStationReading): AtmosphericBreachEvent[] {
    const newBreaches: AtmosphericBreachEvent[] = [];
    const now = Date.now();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Check target station match
      if (rule.targetStation !== 'ALL' && rule.targetStation !== reading.locationName) {
        continue;
      }

      const val = (reading.metrics as any)[rule.variableKey];
      if (typeof val !== 'number' || isNaN(val)) continue;

      let breached = false;
      switch (rule.condition) {
        case '>':
          breached = val > rule.thresholdValue;
          break;
        case '<':
          breached = val < rule.thresholdValue;
          break;
        case '>=':
          breached = val >= rule.thresholdValue;
          break;
        case '<=':
          breached = val <= rule.thresholdValue;
          break;
      }

      if (breached) {
        const cooldownKey = `${rule.id}_${reading.locationName}`;
        const lastFired = this.lastAlertTimestamps.get(cooldownKey) || 0;
        const cooldownMs = (rule.cooldownSeconds || 25) * 1000;

        if (now - lastFired > cooldownMs) {
          this.lastAlertTimestamps.set(cooldownKey, now);

          const timeStr = new Date(now).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });

          const breachEvent: AtmosphericBreachEvent = {
            id: `breach-${now}-${Math.random().toString(36).substring(2, 6)}`,
            ruleId: rule.id,
            variableKey: rule.variableKey,
            variableName: rule.variableName,
            locationName: reading.locationName,
            lat: reading.lat,
            lon: reading.lon,
            currentValue: Number(val.toFixed(2)),
            thresholdValue: rule.thresholdValue,
            condition: rule.condition,
            units: rule.units,
            severity: rule.severity,
            title: rule.title,
            boundaryPhysicsExplanation: rule.rationale,
            timestamp: now,
            formattedTime: timeStr,
            acknowledged: false,
            dismissedFromToast: false
          };

          newBreaches.push(breachEvent);
          this.breaches.unshift(breachEvent);

          // Trigger Sound if enabled
          if (!this.isSoundMuted && rule.soundEnabled) {
            alertAudio.playAlert(rule.severity);
          }

          // Trigger Desktop Notification if permitted and enabled
          if (rule.desktopNotification && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`EARTH TRACE Alert: ${rule.title}`, {
                body: `${reading.locationName}: ${rule.variableKey} is ${val.toFixed(1)} ${rule.units} (${rule.condition} ${rule.thresholdValue} ${rule.units})`,
                icon: '/assets/aistudio/image_eed5d808.png'
              });
            } catch {}
          }
        }
      }
    }

    if (newBreaches.length > 0) {
      // Keep breaches history at a reasonable limit (latest 100)
      if (this.breaches.length > 100) {
        this.breaches = this.breaches.slice(0, 100);
      }
      this.saveBreaches();
    }

    return newBreaches;
  }

  // --- Breach Events History ---
  getBreaches(): AtmosphericBreachEvent[] {
    return [...this.breaches];
  }

  getActiveUnacknowledgedCount(): number {
    return this.breaches.filter(b => !b.acknowledged).length;
  }

  getCriticalCount(): number {
    return this.breaches.filter(b => !b.acknowledged && b.severity === 'critical').length;
  }

  acknowledgeBreach(breachId: string) {
    this.breaches = this.breaches.map(b => b.id === breachId ? { ...b, acknowledged: true } : b);
    this.saveBreaches();
  }

  acknowledgeAll() {
    this.breaches = this.breaches.map(b => ({ ...b, acknowledged: true }));
    this.saveBreaches();
  }

  dismissToast(breachId: string) {
    this.breaches = this.breaches.map(b => b.id === breachId ? { ...b, dismissedFromToast: true } : b);
  }

  clearBreachHistory() {
    this.breaches = [];
    this.saveBreaches();
  }

  loadBreaches(): AtmosphericBreachEvent[] {
    try {
      const stored = localStorage.getItem(BREACHES_STORAGE_KEY);
      if (stored) {
        this.breaches = JSON.parse(stored);
      }
    } catch {
      this.breaches = [];
    }
    return this.breaches;
  }

  saveBreaches() {
    try {
      localStorage.setItem(BREACHES_STORAGE_KEY, JSON.stringify(this.breaches));
    } catch (e) {
      console.warn('Failed to save breaches to localStorage:', e);
    }
  }

  // --- Manual Simulation Injection for Immediate Verification ---
  triggerSimulatedBreach(type: 'pm25_inversion' | 'stagnation_calm' | 'heatwave' | 'dense_smog', stationName = 'Nagpur'): AtmosphericBreachEvent {
    const loc = PRESET_LOCATIONS.find(l => l.name === stationName) || PRESET_LOCATIONS[0];
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let event: AtmosphericBreachEvent;

    switch (type) {
      case 'pm25_inversion':
        event = {
          id: `sim-pm25-${now}`,
          ruleId: 'rule-pm25-severe-inversion',
          variableKey: 'PM25',
          variableName: 'PM2.5 Surface Particulate Matter',
          locationName: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          currentValue: 88.4,
          thresholdValue: 75.0,
          condition: '>',
          units: 'µg/m³',
          severity: 'critical',
          title: 'Severe Inversion Particulate Trapping',
          boundaryPhysicsExplanation: 'Ground-based radiative cooling compressed the planetary boundary layer to 140m, creating a sealed thermal lid that trapped fine particulates.',
          timestamp: now,
          formattedTime: timeStr,
          acknowledged: false,
          dismissedFromToast: false
        };
        break;

      case 'stagnation_calm':
        event = {
          id: `sim-ws10m-${now}`,
          ruleId: 'rule-ws10m-stagnation',
          variableKey: 'WS10M',
          variableName: 'Atmospheric Wind Speed',
          locationName: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          currentValue: 1.1,
          thresholdValue: 2.0,
          condition: '<',
          units: 'm/s',
          severity: 'critical',
          title: 'Atmospheric Ventilation Stagnation Crisis',
          boundaryPhysicsExplanation: 'Near-surface horizontal winds stalled at 1.1 m/s, causing zero advective particle dispersion across the urban basin.',
          timestamp: now,
          formattedTime: timeStr,
          acknowledged: false,
          dismissedFromToast: false
        };
        break;

      case 'heatwave':
        event = {
          id: `sim-t2m-${now}`,
          ruleId: 'rule-t2m-heatwave',
          variableKey: 'T2M',
          variableName: 'Near-Surface Air Temperature',
          locationName: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          currentValue: 42.6,
          thresholdValue: 40.0,
          condition: '>',
          units: '°C',
          severity: 'warning',
          title: 'Extreme Thermal Buoyancy & Heatwave',
          boundaryPhysicsExplanation: 'Surface sensible heat flux peaked, elevating ambient kinetic air temperature to 42.6°C and accelerating photochemical ozone formation.',
          timestamp: now,
          formattedTime: timeStr,
          acknowledged: false,
          dismissedFromToast: false
        };
        break;

      case 'dense_smog':
      default:
        event = {
          id: `sim-aod-${now}`,
          ruleId: 'rule-aod550-dense-smog',
          variableKey: 'AOD550',
          variableName: 'Aerosol Optical Depth (550nm)',
          locationName: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          currentValue: 0.84,
          thresholdValue: 0.70,
          condition: '>',
          units: 'Index',
          severity: 'warning',
          title: 'Dense Aerosol Column Extinction Plume',
          boundaryPhysicsExplanation: 'Satellite column extinction indicates optical depth of 0.84, obscuring ground visibility below 2.5 km.',
          timestamp: now,
          formattedTime: timeStr,
          acknowledged: false,
          dismissedFromToast: false
        };
        break;
    }

    this.breaches.unshift(event);
    if (this.breaches.length > 100) this.breaches = this.breaches.slice(0, 100);
    this.saveBreaches();

    if (!this.isSoundMuted) {
      alertAudio.playAlert(event.severity);
    }

    return event;
  }
}

export const alertManager = new AtmosphericAlertManager();

// Telemetry Generator for Realistic Dynamic Atmospheric Readings
export function generateStationTelemetry(
  station: typeof PRESET_LOCATIONS[0],
  fluctuationMagnitude = 1.0,
  forceSpike?: 'pm25' | 'ws10m' | 't2m' | 'rh2m'
): AtmosphericStationReading {
  const basePM = station.baselinePM25 || 40;
  // Diurnal sinusoidal oscillation + pseudo-Brownian micro-turbulence
  const time = Date.now() / 10000;
  const diurnal = Math.sin(time) * 0.15;
  const noise = (Math.random() - 0.5) * 0.1 * fluctuationMagnitude;

  let pm25 = basePM * (1 + diurnal + noise);
  let ws10m = 3.8 + Math.cos(time * 0.8) * 1.5 + (Math.random() - 0.5) * 0.8;
  let t2m = 28.5 + Math.sin(time * 0.5) * 6.5 + (Math.random() - 0.5) * 1.2;
  let aod550 = Math.max(0.05, Math.min(2.0, (pm25 / 100) * 0.65 + Math.random() * 0.15));
  let rh2m = Math.max(15, Math.min(98, 62 + Math.cos(time * 0.6) * 22 + (Math.random() - 0.5) * 8));
  let prectotcorr = Math.random() > 0.85 ? Math.random() * 12.0 : 0.0;
  let allsky_kt = Math.max(0.15, Math.min(0.85, 0.68 - aod550 * 0.25 + (Math.random() - 0.5) * 0.08));
  let gwettop = Math.max(0.05, Math.min(0.95, 0.38 + (rh2m / 100) * 0.3 - (t2m / 50) * 0.15));

  if (forceSpike === 'pm25') {
    pm25 = Math.max(pm25, 82.5 + Math.random() * 25);
  } else if (forceSpike === 'ws10m') {
    ws10m = 0.8 + Math.random() * 0.8; // calm stagnation
  } else if (forceSpike === 't2m') {
    t2m = 41.5 + Math.random() * 3.5; // heatwave
  } else if (forceSpike === 'rh2m') {
    rh2m = 92.0 + Math.random() * 6.0; // acid fog
  }

  return {
    locationName: station.name,
    region: station.region,
    lat: station.lat,
    lon: station.lon,
    timestamp: Date.now(),
    metrics: {
      PM25: Number(pm25.toFixed(1)),
      AOD550: Number(aod550.toFixed(2)),
      T2M: Number(t2m.toFixed(1)),
      WS10M: Number(Math.max(0.1, ws10m).toFixed(1)),
      PRECTOTCORR: Number(prectotcorr.toFixed(1)),
      RH2M: Number(rh2m.toFixed(0)),
      ALLSKY_KT: Number(allsky_kt.toFixed(2)),
      GWETTOP: Number(gwettop.toFixed(2))
    }
  };
}
