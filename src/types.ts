export type ScreenId =
  | 'landing'
  | 'login'
  | 'signup'
  | 'onboarding'
  | 'overview'
  | 'workspace'
  | 'results'
  | 'history'
  | 'settings'
  | 'demand-forecast'
  | 'microgrid-simulator'
  | 'decision-lab'
  | 'alerts-and-events'
  | 'reports';

export type WorkspaceStage =
  | 'input'
  | 'validating'
  | 'executing'
  | 'results'
  | 'error'
  | 'empty'
  | 'decided';

export interface UserSession {
  fullName: string;
  email: string;
  role: string;
  organization: string;
  token?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  remediation: string;
  severity: 'error' | 'warning';
}

export interface WorkspaceMetricDelta {
  label: string;
  baseline: string;
  projected: string;
  delta: string;
  status: 'optimal' | 'warning' | 'critical';
}

export interface WorkspaceEvidenceItem {
  source: string;
  parameter: string;
  observation: string;
  confidence: string;
}

export interface WorkspaceAnalysisRequest {
  screenId: ScreenId;
  workspaceName: string;
  inputSummary: string;
  parameters: Record<string, string | number | boolean>;
  simulateFault?: boolean;
}

export interface WorkspaceAnalysisResponse {
  summary: string;
  recommendedAction: string;
  recommendedWindow: string;
  metrics: WorkspaceMetricDelta[];
  evidence: WorkspaceEvidenceItem[];
  engineSource: 'gemini-3.8-flash' | 'deterministic-solver';
  timestamp: string;
}

export type DecisionType = 'APPROVED' | 'SCHEDULED' | 'REJECTED';

export interface DecisionAuditEntry {
  id: string;
  workspace: string;
  screenId: ScreenId;
  decision: DecisionType;
  scheduleWindow: string;
  operatorNote: string;
  inputSnapshot: string;
  impactSummary: string;
  recommendedAction: string;
  engineSource: 'gemini-3.8-flash' | 'deterministic-solver';
  timestamp: string;
}

export interface AnalysisFactor {
  name: string;
  direction: 'Increases risk' | 'Reduces peak' | 'Stabilizes reserve' | 'Tariff exposure';
  contribution: string;
  explanation: string;
}

export interface AnalysisRecord {
  id: string;
  title: string;
  substationZone: string;
  createdAt: string;
  status: 'Completed' | 'Review required' | 'Draft' | 'Failed';
  modelUsed: 'Gemini 3.8 Flash + Solver' | 'Deterministic Load Solver';
  isIllustrativeDemo: boolean;
  // Input configuration
  scenarioNotes: string;
  feederCapKw: number;
  bessReserveFloorPct: number;
  tariffWindow: string;
  ambientTempC: number;
  includeEvFleet: boolean;
  // Computed / synthesized results
  executiveSummary: string;
  unmitigatedPeakKw: number;
  mitigatedPeakKw: number;
  bessDischargeKw: number;
  estimatedDailyDeltaUsd: number;
  uncertaintyRangeKw: string;
  hourlySeries: {
    hour: string;
    baselineKw: number;
    mitigatedKw: number;
    solarKw: number;
    socPct: number;
  }[];
  factors: AnalysisFactor[];
  limitations: string[];
  humanDecision?: {
    status: 'Approved for schedule' | 'Flagged for review' | 'Held';
    reviewer: string;
    note: string;
    decidedAt: string;
  };
}
