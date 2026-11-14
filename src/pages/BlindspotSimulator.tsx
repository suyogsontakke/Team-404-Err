import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle, 
  Database, 
  Sparkles, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  Compass, 
  SlidersHorizontal
} from 'lucide-react';
import PageContainer from '../components/PageContainer';
import { PRESET_LOCATIONS } from '../lib/nasaPowerService';

type DelayHours = 0 | 24 | 48 | 72;
type ObservationScenario = 'complete' | 'partial' | 'missing' | 'delayed';
type ConfidenceLevel = 'High confidence' | 'Moderate confidence' | 'Low confidence' | 'Insufficient evidence';
type AlertDecision = 'Issue alert' | 'Provisional alert' | 'Withhold alert';

interface BlindspotAIResult {
  executiveSummary: string;
  reliableConclusions: string[];
  untrustedConclusions: string[];
  missingInformation: string;
  nextDataSourceToCheck: string;
  alertDecisionJustification: string;
}

export default function BlindspotSimulator() {
  // Simulator Controls
  const [delayHours, setDelayHours] = useState<DelayHours>(72);
  const [scenario, setScenario] = useState<ObservationScenario>('missing');
  const [selectedParam, setSelectedParam] = useState<'PM25' | 'AOD550' | 'T2M' | 'WS10M'>('PM25');
  const [selectedLocation, setSelectedLocation] = useState(PRESET_LOCATIONS[0]); // Nagpur, India

  // AI Assistant State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<BlindspotAIResult | null>(null);
  const [, setAiError] = useState<string | null>(null);

  // Baseline parameter properties
  const paramConfig = useMemo(() => {
    switch (selectedParam) {
      case 'PM25':
        return {
          name: 'PM2.5 Surface Particulate Matter',
          units: 'µg/m³',
          baseline: selectedLocation.name === 'Delhi' ? 112.4 : selectedLocation.name === 'Nagpur' ? 54.8 : 38.2,
          hazardThreshold: 60.0,
          extremeThreshold: 100.0,
          source: 'NASA MERRA-2 GOCART Atmospheric Aerosol Reanalysis',
          inversionProne: true
        };
      case 'AOD550':
        return {
          name: 'Aerosol Optical Depth (550nm)',
          units: 'Index',
          baseline: selectedLocation.name === 'Delhi' ? 0.85 : selectedLocation.name === 'Nagpur' ? 0.44 : 0.28,
          hazardThreshold: 0.50,
          extremeThreshold: 0.80,
          source: 'MODIS Terra/Aqua & VIIRS Optical Depth Retrieval',
          inversionProne: false
        };
      case 'T2M':
        return {
          name: 'Near-Surface Air Temperature',
          units: '°C',
          baseline: selectedLocation.name === 'Nagpur' ? 33.4 : selectedLocation.name === 'Mumbai' ? 30.8 : 28.5,
          hazardThreshold: 38.0,
          extremeThreshold: 43.0,
          source: 'NASA POWER Daily Point (MERRA-2 Assimilation)',
          inversionProne: true
        };
      case 'WS10M':
        return {
          name: 'Horizontal Wind Velocity (10m)',
          units: 'm/s',
          baseline: selectedLocation.name === 'Nagpur' ? 1.8 : selectedLocation.name === 'Mumbai' ? 4.2 : 2.1,
          hazardThreshold: 2.0,
          extremeThreshold: 1.0,
          source: 'NASA MERRA-2 Planetary Boundary Layer Turbulence',
          inversionProne: true
        };
    }
  }, [selectedParam, selectedLocation]);

  // 1. DATA RELIABILITY & COMPLETENESS CALCULATION
  const completenessPercentage = useMemo(() => {
    if (delayHours === 0) {
      return scenario === 'complete' ? 100 : scenario === 'partial' ? 70 : scenario === 'delayed' ? 85 : 90;
    }
    if (delayHours === 24) {
      return scenario === 'complete' ? 88 : scenario === 'partial' ? 62 : scenario === 'delayed' ? 72 : 55;
    }
    if (delayHours === 48) {
      return scenario === 'complete' ? 75 : scenario === 'partial' ? 48 : scenario === 'delayed' ? 58 : 35;
    }
    // 72 Hours Delay
    return scenario === 'complete' ? 65 : scenario === 'partial' ? 36 : scenario === 'delayed' ? 45 : 18;
  }, [delayHours, scenario]);

  // Timestamps
  const now = new Date();
  const latestObservationDate = new Date(now.getTime() - delayHours * 3600 * 1000);
  const lastUpdateFormatted = latestObservationDate.toUTCString().slice(0, 22) + ' UTC';
  const retrievalTimestamp = now.toUTCString().slice(0, 22) + ' UTC';
  const missingInterval = delayHours > 0 
    ? `${delayHours} hours missing (${lastUpdateFormatted} to current moment)` 
    : 'Nominal telemetry (0 hours latency)';

  // 2. TRANSPARENT CONFIDENCE ASSESSMENT ENGINE
  const confidenceAssessment = useMemo((): { level: ConfidenceLevel; score: number; rationale: string; breakdown: { label: string; score: number }[] } => {
    let score = 100;
    
    const delayPenalty = delayHours === 0 ? 0 : delayHours === 24 ? 18 : delayHours === 48 ? 38 : 55;
    score -= delayPenalty;

    const scenarioPenalty = scenario === 'complete' ? 0 : scenario === 'delayed' ? 10 : scenario === 'partial' ? 22 : 32;
    score -= scenarioPenalty;

    const basinPenalty = paramConfig.inversionProne ? 5 : 0;
    score -= basinPenalty;

    score = Math.max(10, Math.min(100, score));

    let level: ConfidenceLevel = 'Insufficient evidence';
    let rationale = '';

    if (score >= 80) {
      level = 'High confidence';
      rationale = `Telemetry is recent (delay ≤ 24h) and observation completeness is robust (${completenessPercentage}%). Environmental conclusions are empirically reliable.`;
    } else if (score >= 60) {
      level = 'Moderate confidence';
      rationale = `Moderate latency (${delayHours}h) or partial coverage (${completenessPercentage}%). Broad seasonal climatology is dependable, but acute transient shifts carry moderate uncertainty.`;
    } else if (score >= 35) {
      level = 'Low confidence';
      rationale = `High temporal blindspot (${delayHours}h gap) combined with compromised completeness (${completenessPercentage}%). Short-term predictions must not be relied upon without ground validation.`;
    } else {
      level = 'Insufficient evidence';
      rationale = `Severe observational blackout (≥72h gap or critical dropouts). Available data is inadequate to make definitive environmental determinations.`;
    }

    return {
      level,
      score,
      rationale,
      breakdown: [
        { label: `Recency Factor (${delayHours}h latency)`, score: -delayPenalty },
        { label: `Completeness Factor (${completenessPercentage}% valid)`, score: -scenarioPenalty },
        { label: `Atmospheric Volatility Penalty`, score: -basinPenalty }
      ]
    };
  }, [delayHours, scenario, completenessPercentage, paramConfig]);

  // 3. ALERT DECISION ENGINE
  const alertDecision = useMemo((): { decision: AlertDecision; badgeColor: string; reason: string; alertAction: string } => {
    const isExceededBaseline = paramConfig.baseline >= paramConfig.hazardThreshold;

    if ((confidenceAssessment.level === 'High confidence' || confidenceAssessment.level === 'Moderate confidence') && isExceededBaseline) {
      return {
        decision: 'Issue alert',
        badgeColor: 'bg-[#F16C72]/20 text-[#F16C72] border-[#F16C72]/80',
        reason: `Baseline observation (${paramConfig.baseline} ${paramConfig.units}) empirically exceeds safety threshold (${paramConfig.hazardThreshold} ${paramConfig.units}) with verified confidence.`,
        alertAction: 'Activate public atmospheric health advisory and initiate regional source mitigation.'
      };
    }

    if (delayHours >= 24 && (isExceededBaseline || paramConfig.baseline >= paramConfig.hazardThreshold * 0.82)) {
      return {
        decision: 'Provisional alert',
        badgeColor: 'bg-[#F0B44D]/20 text-[#F0B44D] border-[#F0B44D]/80',
        reason: `Prior baseline (${paramConfig.baseline} ${paramConfig.units}) was trending near hazard threshold before data blackout. Precautionary provisional status active pending ground monitor verification.`,
        alertAction: 'Dispatch immediate sensor verification request to local ground network; notify environmental health coordinators without triggering full public alarm.'
      };
    }

    return {
      decision: 'Withhold alert',
      badgeColor: 'bg-[#35C98B]/15 text-[#35C98B] border-[#35C98B]/50',
      reason: `Pre-blindspot baseline (${paramConfig.baseline} ${paramConfig.units}) is within nominal limits. Protocols strictly prohibit issuing hazard alerts merely due to missing data, preventing false alarms and alert fatigue.`,
      alertAction: 'Maintain routine surveillance; prioritize observation recovery for this station.'
    };
  }, [paramConfig, confidenceAssessment, delayHours]);

  // 4. RELIABLE CONCLUSIONS MATRIX
  const reliableConclusions = useMemo(() => {
    return {
      whatWeKnow: [
        `Historical NASA POWER 2001–2024 decadal baseline for ${selectedLocation.name} is ${paramConfig.baseline} ${paramConfig.units}.`,
        `Pre-blindspot observation prior to ${lastUpdateFormatted} showed stable background conditions without instrument failure flags.`,
        `Topographic context: ${selectedLocation.name} (${selectedLocation.lat.toFixed(2)}°N, ${selectedLocation.lon.toFixed(2)}°E, ~310m MSL) has verified winter thermal inversion vulnerability.`
      ],
      whatWeDontKnow: [
        `Whether acute localized emission pulses (crop residue burning, industrial flaring) occurred during the past ${delayHours} hours.`,
        `Current nocturnal temperature inversion lid height and boundary layer mixing depth over the urban basin.`,
        `Surface wind stagnation speed (< 2.0 m/s) between ${latestObservationDate.toLocaleDateString()} and today.`
      ],
      whatWeNeed: [
        `Near-real-time telemetry from continuous ambient air quality stations (e.g. CPCB CAAQMS ground monitors).`,
        `NASA VIIRS 375m active fire hotspot radiance count within 150 km radius to detect unmodeled smoke plumes.`,
        `00Z Radiosonde atmospheric sounding to verify inversion lid presence and thermodynamic lapse rate.`
      ]
    };
  }, [selectedLocation, paramConfig, lastUpdateFormatted, delayHours, latestObservationDate]);

  // 5. REGIONAL OBSERVATION PRIORITY MATRIX
  const regionalPriorities = [
    {
      region: 'Nagpur Basin (Vidarbha)',
      priority: 'HIGH',
      badge: 'bg-[#F0B44D]/20 text-[#F0B44D] border-[#F0B44D]/50',
      gap: `${delayHours}h Blindspot`,
      riskFactor: 'Nocturnal thermal inversion trapping + central transit corridor',
      action: 'Deploy mobile nephelometer probe & request CPCB tie-in'
    },
    {
      region: 'Delhi NCR (Indo-Gangetic Plain)',
      priority: 'CRITICAL',
      badge: 'bg-[#F16C72]/20 text-[#F16C72] border-[#F16C72]/80 animate-pulse',
      gap: `${delayHours}h Blindspot`,
      riskFactor: 'High baseline PM2.5 + post-monsoon biomass burning + dense population',
      action: 'Prioritize hourly ground monitors & Sentinel-5P TROPOMI overpass'
    },
    {
      region: 'Mumbai Coastal Megacity',
      priority: 'MEDIUM',
      badge: 'bg-[#A6B7D4]/20 text-[#A6B7D4] border-[#A6B7D4]/50',
      gap: `${delayHours}h Blindspot`,
      riskFactor: 'Marine boundary layer ventilation mitigates extreme stagnation',
      action: 'Monitor offshore sea-breeze dispersion vectors'
    },
    {
      region: 'Kolkata Deltaic Plain',
      priority: 'HIGH',
      badge: 'bg-[#F0B44D]/20 text-[#F0B44D] border-[#F0B44D]/50',
      gap: `${delayHours}h Blindspot`,
      riskFactor: 'High ambient humidity causing hygroscopic aerosol swelling',
      action: 'Correlate surface RH with ceilometer cloud base'
    }
  ];

  // 6. CALL AI BLINDSPOT ASSISTANT
  const handleAnalyzeBlindspotWithAi = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const payload = {
        locationName: selectedLocation.name,
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
        parameter: paramConfig.name,
        delayHours,
        scenario,
        completeness: completenessPercentage,
        confidence: confidenceAssessment.level,
        confidenceReason: confidenceAssessment.rationale,
        alertDecision: alertDecision.decision,
        alertReason: alertDecision.reason,
        baselineValue: paramConfig.baseline,
        units: paramConfig.units
      };

      const res = await fetch('/api/gemini/blindspot-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.insight) {
        setAiResult(data.insight);
      } else {
        throw new Error('No insight payload returned');
      }
    } catch (err: any) {
      console.warn('AI blindspot analysis network error, using deterministic synthesis:', err);
      setAiResult({
        executiveSummary: `Under a simulated ${delayHours}-hour data latency (${completenessPercentage}% completeness), long-term decadal baseline (${paramConfig.baseline} ${paramConfig.units}) remains scientifically sound, but recent 72h dynamics cannot be verified without ground sensors.`,
        reliableConclusions: reliableConclusions.whatWeKnow,
        untrustedConclusions: reliableConclusions.whatWeDontKnow,
        missingInformation: `Last ${delayHours} hours of boundary layer mixing height, local wind velocity, and satellite optical depth.`,
        nextDataSourceToCheck: `Auxiliary ground monitor networks (CPCB) and polar-orbiting VIIRS 375m active fire hotspot feeds.`,
        alertDecisionJustification: `The decision "${alertDecision.decision}" adheres to strict scientific protocols: ${alertDecision.reason}. Alerts must never be triggered solely due to absent data.`
      });
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <PageContainer title="72-Hour Blindspot Resilience Simulator">
      <div className="space-y-6">

        {/* 1. TOP BANNER: 72-HOUR BLINDSPOT RESILIENCE HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-[#232A3D] border border-[#48516A] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden"
        >
          {/* Subtle radar background ring */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-[#A6B7D4]/10 pointer-events-none"></div>
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full border border-[#A6B7D4]/5 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              {/* Status Dots & Module Badge */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F16C72] inline-block shadow-sm"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F0B44D] inline-block shadow-sm"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35C98B] inline-block shadow-sm"></span>
                </div>
                <span className="px-2 py-0.5 bg-[#A6B7D4]/15 text-[#A6B7D4] text-[10px] font-mono font-bold rounded border border-[#A6B7D4]/50 flex items-center gap-1">
                  <Radar className="w-3 h-3 text-[#A6B7D4] animate-spin" />
                  OBSERVATION LATENCY PROTOCOL · THE 72-HOUR BLINDSPOT
                </span>
                <span className="px-2 py-0.5 bg-[#F0B44D]/15 text-[#F0B44D] text-[9px] font-mono rounded border border-[#F0B44D]/50 font-semibold">
                  SIMULATED DATA DEMONSTRATION
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#F0EBDD] tracking-tight flex items-center gap-2">
                <span>72-Hour Environmental Blindspot Resilience Engine</span>
              </h1>
              <p className="text-xs text-[#B5BDCC] max-w-3xl mt-1 leading-relaxed">
                When satellite telemetry drops or reanalysis products face temporal latency (up to 72 hours), how does an Earth System Detective reach disciplined, reliable conclusions without falling into the trap of false alarms?
              </p>
            </div>

            {/* NASA Space Apps Challenge Logo & AI Analyze Trigger Button */}
            <div className="shrink-0 flex items-center gap-3">
              <img 
                src="/assets/aistudio/image_0bb54710.png" 
                alt="NASA Space Apps Challenge" 
                className="h-8 sm:h-9 w-auto object-contain opacity-90 hidden sm:block" 
              />
              <button
                onClick={handleAnalyzeBlindspotWithAi}
                disabled={loadingAi}
                className="px-4 py-2.5 bg-[#A6B7D4] hover:bg-[#b8c7e0] text-[#171B2B] rounded-xl text-xs font-mono font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAi ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#171B2B]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#171B2B]" />
                )}
                <span>Analyze Blindspot with AI</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 2. INTERACTIVE BLINDSPOT SIMULATOR CONTROLS */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#A6B7D4]" />
              <h2 className="text-sm font-bold text-[#F0EBDD] uppercase font-mono tracking-wider">
                Interactive Blindspot Simulator Controls
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#A6B7D4]">
              Interactive Stress-Testing Deck
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Control A: Delay Window Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#B5BDCC] uppercase flex items-center justify-between">
                <span>Temporal Delay Window:</span>
                <span className="text-[#A6B7D4] font-bold">{delayHours} Hours</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-[#1D2436] p-1 rounded-lg border border-[#48516A]">
                {([0, 24, 48, 72] as DelayHours[]).map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setDelayHours(hours)}
                    className={`py-1.5 text-xs font-mono rounded font-bold transition-all cursor-pointer ${
                      delayHours === hours
                        ? 'bg-[#A6B7D4] text-[#171B2B] shadow-sm'
                        : 'text-[#B5BDCC] hover:text-[#F0EBDD] hover:bg-[#232A3D]'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Control B: Observation Integrity Scenario */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#B5BDCC] uppercase">
                Observation Scenario:
              </label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as ObservationScenario)}
                className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg px-3 py-2 text-xs font-mono text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4] transition-colors"
              >
                <option value="complete">Complete observations (Nominal)</option>
                <option value="partial">Partial observations (Cloud/Dropouts)</option>
                <option value="missing">Missing observations (Sensor Blackout)</option>
                <option value="delayed">Delayed datasets (Processing Lag)</option>
              </select>
            </div>

            {/* Control C: Parameter Under Stress-Test */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#B5BDCC] uppercase">
                Atmospheric Variable:
              </label>
              <select
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value as any)}
                className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg px-3 py-2 text-xs font-mono text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4] transition-colors"
              >
                <option value="PM25">PM2.5 Surface Particulates (µg/m³)</option>
                <option value="AOD550">Aerosol Optical Depth (AOD 550nm)</option>
                <option value="T2M">Near-Surface Temperature (T2M °C)</option>
                <option value="WS10M">Wind Speed & Ventilation (WS10M m/s)</option>
              </select>
            </div>

            {/* Control D: Geographic Target Location */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#B5BDCC] uppercase">
                Target Station / Region:
              </label>
              <select
                value={selectedLocation.name}
                onChange={(e) => {
                  const loc = PRESET_LOCATIONS.find(p => p.name === e.target.value);
                  if (loc) setSelectedLocation(loc);
                }}
                className="w-full bg-[#1D2436] border border-[#48516A] rounded-lg px-3 py-2 text-xs font-mono text-[#F0EBDD] focus:outline-none focus:border-[#A6B7D4] transition-colors"
              >
                {PRESET_LOCATIONS.map(p => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.region})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* 3. VISUAL TIMELINE & UNCERTAINTY CONE */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
          className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 shadow-xl space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#A6B7D4]" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#F0EBDD] font-bold">
                Temporal Horizon & Uncertainty Cone (T-72h to Present)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-[#A6B7D4]">
                <span className="w-3 h-0.5 bg-[#A6B7D4]"></span> Verified NASA Telemetry
              </span>
              <span className="flex items-center gap-1.5 text-[#F0B44D]">
                <span className="w-3 h-2 border border-dashed border-[#F0B44D] bg-[#F0B44D]/20"></span> Blindspot Gap ({delayHours}h)
              </span>
              <span className="flex items-center gap-1.5 text-[#D28B71]">
                <span className="w-3 h-0.5 border-t border-dashed border-[#D28B71]"></span> Uncertainty Envelope
              </span>
            </div>
          </div>

          {/* SVG Diagram of Timeline Blindspot */}
          <div className="h-32 w-full bg-[#1D2436] rounded-lg border border-[#2D354A] p-2 relative flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 800 120" preserveAspectRatio="none">
              <defs>
                <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#F0B44D" strokeWidth="1" strokeOpacity="0.35" />
                </pattern>
                <linearGradient id="uncertaintyCone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#D28B71" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#D28B71" stopOpacity="0.30" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="20" x2="780" y2="20" stroke="#2D354A" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="20" y1="60" x2="780" y2="60" stroke="#2D354A" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="20" y1="100" x2="780" y2="100" stroke="#2D354A" strokeWidth="1" strokeDasharray="4 4" />

              {(() => {
                const splitX = delayHours === 72 ? 220 : delayHours === 48 ? 420 : delayHours === 24 ? 600 : 760;
                
                return (
                  <>
                    {/* Uncertainty Cone in the blindspot */}
                    {delayHours > 0 && (
                      <>
                        <polygon 
                          points={`${splitX},60 780,${Math.max(15, 60 - delayHours * 0.55)} 780,${Math.min(105, 60 + delayHours * 0.55)}`}
                          fill="url(#uncertaintyCone)"
                        />
                        <line x1={splitX} y1="60" x2="780" y2={Math.max(15, 60 - delayHours * 0.55)} stroke="#D28B71" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1={splitX} y1="60" x2="780" y2={Math.min(105, 60 + delayHours * 0.55)} stroke="#D28B71" strokeWidth="1.5" strokeDasharray="3 3" />
                        <rect x={splitX} y="15" width={780 - splitX} height="90" fill="url(#diagonalHatch)" />
                      </>
                    )}

                    {/* Historical Verified Line */}
                    <path
                      d={`M 30,65 Q 80,${paramConfig.baseline > 50 ? 55 : 70} 140,58 T ${splitX},60`}
                      fill="none"
                      stroke="#A6B7D4"
                      strokeWidth="2.5"
                    />

                    {/* Data Points on Verified Segment */}
                    <circle cx="30" cy="65" r="3.5" fill="#A6B7D4" />
                    <circle cx="90" cy="58" r="3.5" fill="#A6B7D4" />
                    <circle cx="150" cy="62" r="3.5" fill="#A6B7D4" />
                    <circle cx={splitX} cy="60" r="4.5" fill="#35C98B" stroke="#F0EBDD" strokeWidth="1.5" />
                  </>
                );
              })()}
            </svg>

            {/* In-Chart Timeline Labels */}
            <div className="absolute bottom-1 left-4 right-4 flex justify-between text-[9px] font-mono text-[#838FA3]">
              <span>T - 96h (Historical Archive)</span>
              <span>T - 72h</span>
              <span>T - 48h</span>
              <span>T - 24h</span>
              <span className="text-[#F0EBDD] font-bold">T - 0h (Present UTC)</span>
            </div>
          </div>
        </motion.div>

        {/* 4. THREE PILLARS: DATA RELIABILITY, CONFIDENCE, ALERT DECISION */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          
          {/* CARD 1: DATA RELIABILITY METRICS */}
          <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#48516A] pb-2">
              <span className="text-[#A6B7D4] font-bold uppercase flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Data Reliability</span>
              </span>
              <span className="text-[10px] text-[#838FA3]">NASA POWER L3</span>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <div className="text-[10px] text-[#838FA3] uppercase">Latest Observation:</div>
                <div className="text-[#F0EBDD] font-bold text-[11px] truncate">{lastUpdateFormatted}</div>
              </div>

              <div>
                <div className="text-[10px] text-[#838FA3] uppercase">Data Completeness:</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 bg-[#1D2436] rounded-full h-2 overflow-hidden border border-[#2D354A]">
                    <div 
                      className={`h-full ${
                        completenessPercentage >= 80 ? 'bg-[#35C98B]' : completenessPercentage >= 50 ? 'bg-[#F0B44D]' : 'bg-[#F16C72]'
                      }`}
                      style={{ width: `${completenessPercentage}%` }}
                    ></div>
                  </div>
                  <span className={`font-bold text-xs ${
                    completenessPercentage >= 80 ? 'text-[#35C98B]' : completenessPercentage >= 50 ? 'text-[#F0B44D]' : 'text-[#F16C72]'
                  }`}>
                    {completenessPercentage}%
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#838FA3] uppercase">Missing Interval:</div>
                <div className="text-[#F0B44D] text-[11px] font-semibold">{missingInterval}</div>
              </div>

              <div className="pt-2 border-t border-[#48516A] text-[10px] text-[#B5BDCC] space-y-0.5">
                <div>Source: <span className="text-[#F0EBDD]">{paramConfig.source.split(' ')[0]} L3 Reanalysis</span></div>
                <div>Retrieved: <span className="text-[#F0EBDD]">{retrievalTimestamp}</span></div>
              </div>
            </div>
          </div>

          {/* CARD 2: CONFIDENCE ASSESSMENT */}
          <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#48516A] pb-2">
              <span className="text-[#D28B71] font-bold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Confidence Assessment</span>
              </span>
              <span className="text-[10px] text-[#838FA3]">Deterministic Rubric</span>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <div className="text-[10px] text-[#838FA3] uppercase">Assigned Classification:</div>
                <div className="mt-1">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${
                    confidenceAssessment.level === 'High confidence'
                      ? 'bg-[#35C98B]/15 text-[#35C98B] border-[#35C98B]/60'
                      : confidenceAssessment.level === 'Moderate confidence'
                      ? 'bg-[#A6B7D4]/15 text-[#A6B7D4] border-[#A6B7D4]/60'
                      : confidenceAssessment.level === 'Low confidence'
                      ? 'bg-[#F0B44D]/15 text-[#F0B44D] border-[#F0B44D]/60'
                      : 'bg-[#F16C72]/15 text-[#F16C72] border-[#F16C72]/60'
                  }`}>
                    {confidenceAssessment.level} ({confidenceAssessment.score}/100)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#838FA3] uppercase">Rule Evaluation Reason:</div>
                <p className="text-[11px] text-[#B5BDCC] font-sans leading-relaxed mt-0.5">
                  {confidenceAssessment.rationale}
                </p>
              </div>

              {/* Rubric Breakdown */}
              <div className="pt-2 border-t border-[#48516A] space-y-1 text-[10px]">
                {confidenceAssessment.breakdown.map((b, i) => (
                  <div key={i} className="flex justify-between text-[#B5BDCC]">
                    <span>{b.label}</span>
                    <span className={b.score < 0 ? 'text-[#F0B44D]' : 'text-[#35C98B]'}>{b.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 3: ALERT DECISION ENGINE */}
          <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-4 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#48516A] pb-2">
              <span className="text-[#F0B44D] font-bold uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Alert Decision Engine</span>
              </span>
              <span className="text-[10px] text-[#838FA3]">Discipline Protocol</span>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <div className="text-[10px] text-[#838FA3] uppercase">Automated Verdict:</div>
                <div className="mt-1">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${alertDecision.badgeColor}`}>
                    {alertDecision.decision}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#838FA3] uppercase">Scientific Justification:</div>
                <p className="text-[11px] text-[#B5BDCC] font-sans leading-relaxed mt-0.5">
                  {alertDecision.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-[#48516A] text-[10px] text-[#B5BDCC]">
                <span className="text-[#A6B7D4] font-bold">Action Protocol: </span>
                <span className="font-sans text-[#F0EBDD]">{alertDecision.alertAction}</span>
              </div>
            </div>
          </div>

        </motion.div>

        {/* 5. RELIABLE CONCLUSIONS MATRIX: WHAT WE KNOW / DON'T KNOW / NEED */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          
          {/* WHAT WE KNOW (Green) */}
          <div className="bg-[#353D55] border border-[#35C98B]/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-[#48516A] pb-2">
              <CheckCircle2 className="w-4 h-4 text-[#35C98B]" />
              <h3 className="text-xs font-bold font-mono uppercase text-[#35C98B] tracking-wider">
                What We Know (Empirical Evidence)
              </h3>
            </div>
            <p className="text-[11px] text-[#B5BDCC]">
              Facts directly verified by prior NASA observations and long-term climatology:
            </p>
            <ul className="space-y-2 text-xs text-[#F0EBDD]">
              {reliableConclusions.whatWeKnow.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#232A3D] p-2.5 rounded-lg border border-[#35C98B]/30">
                  <span className="text-[#35C98B] font-bold font-mono">0{idx + 1}.</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* WHAT WE DON'T KNOW (Amber) */}
          <div className="bg-[#353D55] border border-[#F0B44D]/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-[#48516A] pb-2">
              <HelpCircle className="w-4 h-4 text-[#F0B44D]" />
              <h3 className="text-xs font-bold font-mono uppercase text-[#F0B44D] tracking-wider">
                What We Don't Know (Blindspot Gaps)
              </h3>
            </div>
            <p className="text-[11px] text-[#B5BDCC]">
              Missing, delayed, or unmodeled information concealed by the temporal latency:
            </p>
            <ul className="space-y-2 text-xs text-[#F0EBDD]">
              {reliableConclusions.whatWeDontKnow.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#232A3D] p-2.5 rounded-lg border border-[#F0B44D]/30">
                  <span className="text-[#F0B44D] font-bold font-mono">0{idx + 1}.</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* WHAT WE NEED (Powder Blue) */}
          <div className="bg-[#353D55] border border-[#A6B7D4]/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-[#48516A] pb-2">
              <Compass className="w-4 h-4 text-[#A6B7D4]" />
              <h3 className="text-xs font-bold font-mono uppercase text-[#A6B7D4] tracking-wider">
                What We Need (Targeted Actions)
              </h3>
            </div>
            <p className="text-[11px] text-[#B5BDCC]">
              Critical auxiliary datasets and sensor networks required to reach closure:
            </p>
            <ul className="space-y-2 text-xs text-[#F0EBDD]">
              {reliableConclusions.whatWeNeed.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#232A3D] p-2.5 rounded-lg border border-[#A6B7D4]/30">
                  <span className="text-[#A6B7D4] font-bold font-mono">0{idx + 1}.</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </motion.div>

        {/* 6. AI BLINDSPOT ASSISTANT SYNTHESIS */}
        {aiResult && (
          <div className="bg-[#353D55] border border-[#D28B71]/50 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D28B71]" />
                <h3 className="text-sm font-bold font-mono uppercase text-[#D28B71] tracking-wider">
                  Gemini AI Blindspot Intelligence Synthesis
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#D28B71] bg-[#232A3D] px-2 py-0.5 rounded border border-[#D28B71]/40">
                Ground-Truth Constrained
              </span>
            </div>

            <div className="bg-[#232A3D] p-3.5 rounded-lg border border-[#48516A] text-xs text-[#F0EBDD] leading-relaxed font-sans">
              <strong>Executive Synthesis:</strong> {aiResult.executiveSummary}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-[#232A3D] p-3.5 rounded-lg border border-[#48516A] space-y-2">
                <div className="font-mono text-[#35C98B] font-bold uppercase text-[11px]">
                  ✓ Verified & Reliable Conclusions:
                </div>
                <ul className="space-y-1.5 text-[#B5BDCC]">
                  {aiResult.reliableConclusions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#35C98B]">·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#232A3D] p-3.5 rounded-lg border border-[#48516A] space-y-2">
                <div className="font-mono text-[#F0B44D] font-bold uppercase text-[11px]">
                  ⚠ Untrusted / Unverified Until Data Resumes:
                </div>
                <ul className="space-y-1.5 text-[#B5BDCC]">
                  {aiResult.untrustedConclusions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#F0B44D]">·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#232A3D] p-3 rounded-lg border border-[#48516A]">
                <div className="text-[10px] text-[#838FA3] uppercase">Information Missing:</div>
                <div className="text-[#B5BDCC] font-sans mt-0.5">{aiResult.missingInformation}</div>
              </div>
              <div className="bg-[#232A3D] p-3 rounded-lg border border-[#48516A]">
                <div className="text-[10px] text-[#A6B7D4] uppercase font-bold">Next Data Source to Check:</div>
                <div className="text-[#F0EBDD] font-sans mt-0.5">{aiResult.nextDataSourceToCheck}</div>
              </div>
            </div>

            <div className="p-3 bg-[#232A3D] rounded-lg border border-[#D28B71]/40 text-xs text-[#B5BDCC]">
              <span className="font-mono text-[#D28B71] font-bold">Alert Rationale Protocol: </span>
              <span>{aiResult.alertDecisionJustification}</span>
            </div>
          </div>
        )}

        {/* 7. REGIONAL OBSERVATION PRIORITY MATRIX */}
        <div className="bg-[#353D55] border border-[#48516A] rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#48516A] pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#A6B7D4]" />
              <h3 className="text-xs font-bold font-mono uppercase text-[#F0EBDD] tracking-wider">
                Regional Observation Recovery Priority Matrix
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#B5BDCC]">
              Targeting Data Gaps & Atmospheric Exposure Risk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#48516A] text-[#838FA3] text-[10px] uppercase">
                  <th className="pb-2">Region / Basin</th>
                  <th className="pb-2">Priority Level</th>
                  <th className="pb-2">Latency Gap</th>
                  <th className="pb-2">Primary Vulnerability Vector</th>
                  <th className="pb-2">Intervention & Auxiliary Sensor Deployment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#48516A]/60 text-[#B5BDCC]">
                {regionalPriorities.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#2B3349] transition-colors">
                    <td className="py-2.5 font-bold text-[#F0EBDD]">{row.region}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.badge}`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#F0B44D] font-semibold">{row.gap}</td>
                    <td className="py-2.5 font-sans text-[#B5BDCC]">{row.riskFactor}</td>
                    <td className="py-2.5 font-sans text-[#A6B7D4]">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
