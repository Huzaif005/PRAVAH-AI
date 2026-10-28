import type {
  ScreenId,
  WorkspaceStage,
  ValidationIssue,
  WorkspaceMetricDelta,
  WorkspaceEvidenceItem,
  WorkspaceAnalysisRequest,
  WorkspaceAnalysisResponse,
  DecisionType,
  DecisionAuditEntry,
  AnalysisFactor,
  AnalysisRecord,
} from '../../src/types.ts';

export type {
  ScreenId,
  WorkspaceStage,
  ValidationIssue,
  WorkspaceMetricDelta,
  WorkspaceEvidenceItem,
  WorkspaceAnalysisRequest,
  WorkspaceAnalysisResponse,
  DecisionType,
  DecisionAuditEntry,
  AnalysisFactor,
  AnalysisRecord,
};

export interface TelemetrySnapshot {
  substationId: string;
  feederId: string;
  loadKw: number;
  solarKw: number;
  netDemandKw: number;
  bessSocPct: number;
  bessPowerKw: number;
  gridFrequencyHz: number;
  feederVoltageV: number;
  ambientTempC: number;
  transformerHeadroomKw: number;
  status: 'nominal' | 'warning' | 'critical';
  timestamp: string;
}

export interface ForecastHourData {
  hour: string;
  loadKw: string;
  solarKw: string;
  netDemand: string;
  riskLevel: 'Normal' | 'Moderate' | 'Critical';
  strategy: string;
  variance: string;
  isCriticalRow?: boolean;
}

export interface AlertEventItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  badgeLabel: string;
  time: string;
  event: string;
  subsystem: string;
  automatedAction: string;
  actionColor: string;
  controlType: 'simulate' | 'inspect' | 'resolved' | 'completed';
  acknowledged?: boolean;
}

export interface ReportArchiveItem {
  id: string;
  name: string;
  date: string;
  size: string;
  format: 'PDF' | 'CSV';
  period: string;
  facility: string;
  savings: string;
  co2: string;
  peakReduction: string;
  selfConsumption: string;
}

export interface SettingsState {
  operatorName: string;
  operatorTitle: string;
  operatorEmail: string;
  substationCallsign: string;
  defaultModel: 'gemini-3.8-flash' | 'deterministic-solver';
  defaultFeederCapKw: number;
  defaultReserveFloorPct: number;
  timezoneDisplay: string;
  requireDualSignoffOverKw: number;
  sessionTimeoutMinutes: number;
  enforceImmutableAuditNote: boolean;
  scadaEndpointUrl: string;
  weatherFeedEnabled: boolean;
  utilityTariffSyncEnabled: boolean;
  telemetryRetentionDays: string;
  includeIllustrativeTagOnExports: boolean;
}

export interface SimulationRequest {
  preset: string;
  demandVal: number;
  solarVal: number;
  tempVal: number;
  socVal: number;
  gridOnline: boolean;
  tariffVal: number;
  contingency: 'none' | 'ev' | 'cloud' | 'trip';
}

export interface SimulationResponse {
  unmitigatedPeakKw: number;
  mitigatedPeakKw: number;
  bessDischargeKw: number;
  effectiveSoCPct: number;
  transformerThermalLoadPct: number;
  estimatedCostPerDayUsd: number;
  costSavingsPerDayUsd: number;
  warningAlerts: string[];
  hourlySeries: {
    hour: string;
    baselineKw: number;
    mitigatedKw: number;
    solarKw: number;
    socPct: number;
  }[];
}
