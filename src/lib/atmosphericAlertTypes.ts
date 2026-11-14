/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AlertSeverity = 'critical' | 'warning' | 'advisory';

export type AlertCondition = '>' | '<' | '>=' | '<=';

export interface AtmosphericRule {
  id: string;
  variableKey: string;
  variableName: string;
  condition: AlertCondition;
  thresholdValue: number;
  units: string;
  severity: AlertSeverity;
  title: string;
  rationale: string;
  enabled: boolean;
  soundEnabled: boolean;
  desktopNotification: boolean;
  targetStation: string; // 'ALL' or specific station name like 'Nagpur'
  cooldownSeconds?: number; // Minimum seconds between alerts for this rule (default 30s)
}

export interface AtmosphericBreachEvent {
  id: string;
  ruleId: string;
  variableKey: string;
  variableName: string;
  locationName: string;
  lat: number;
  lon: number;
  currentValue: number;
  thresholdValue: number;
  condition: AlertCondition;
  units: string;
  severity: AlertSeverity;
  title: string;
  boundaryPhysicsExplanation: string;
  timestamp: number; // Date.now()
  formattedTime: string;
  acknowledged: boolean;
  dismissedFromToast?: boolean;
}

export interface AtmosphericStationReading {
  locationName: string;
  region: string;
  lat: number;
  lon: number;
  timestamp: number;
  metrics: {
    PM25: number;
    AOD550: number;
    T2M: number;
    WS10M: number;
    PRECTOTCORR: number;
    RH2M: number;
    ALLSKY_KT: number;
    GWETTOP: number;
  };
}

export interface AlertFilterOptions {
  severity: 'ALL' | AlertSeverity;
  status: 'ALL' | 'active' | 'acknowledged';
  variableKey: 'ALL' | string;
  search: string;
}
