import crypto from 'crypto';
import type {
  AnalysisRecord,
  DecisionAuditEntry,
  AlertEventItem,
  ReportArchiveItem,
  SettingsState,
  ForecastHourData,
  TelemetrySnapshot,
} from '../types/backendTypes.ts';

// Initial Analyses
const INITIAL_ANALYSES: AnalysisRecord[] = [
  {
    id: 'ANL-2026-104',
    title: 'North Campus Feeder #04 Evening Peak Mitigation',
    substationZone: 'North Campus · Interconnect #04',
    createdAt: 'Oct 28, 2026 · 14:20',
    status: 'Completed',
    modelUsed: 'Gemini 3.8 Flash + Solver',
    isIllustrativeDemo: true,
    scenarioNotes:
      'Evaluate 17:00–21:00 time-of-use peak tariff window with concurrent HVAC chiller staging and 18 kW EV fleet arrival.',
    feederCapKw: 160,
    bessReserveFloorPct: 20,
    tariffWindow: '17:00 – 21:00 Peak TOU ($0.42/kWh)',
    ambientTempC: 33,
    includeEvFleet: true,
    executiveSummary:
      'Unmitigated feeder demand is projected to reach 186.2 kW at 19:00, exceeding the 160.0 kW soft transformer rating by 26.2 kW. Scheduling a 38.2 kW LFP battery discharge from 18:15 to 20:45 combined with pre-cooling Zone 2 chillers at 15:30 holds net feeder import to 148.0 kW while maintaining a 24% battery state-of-charge floor.',
    unmitigatedPeakKw: 186.2,
    mitigatedPeakKw: 148.0,
    bessDischargeKw: 38.2,
    estimatedDailyDeltaUsd: 342.2,
    uncertaintyRangeKw: '±6.4 kW (15-min rolling thermal & irradiance band)',
    hourlySeries: [
      { hour: '00:00', baselineKw: 68, mitigatedKw: 68, solarKw: 0, socPct: 62 },
      { hour: '04:00', baselineKw: 62, mitigatedKw: 62, solarKw: 0, socPct: 60 },
      { hour: '08:00', baselineKw: 114, mitigatedKw: 102, solarKw: 32, socPct: 68 },
      { hour: '12:00', baselineKw: 148, mitigatedKw: 94, solarKw: 96, socPct: 86 },
      { hour: '15:00', baselineKw: 156, mitigatedKw: 138, solarKw: 68, socPct: 92 },
      { hour: '17:00', baselineKw: 168, mitigatedKw: 144, solarKw: 18, socPct: 84 },
      { hour: '19:00', baselineKw: 186.2, mitigatedKw: 148.0, solarKw: 0, socPct: 48 },
      { hour: '21:00', baselineKw: 154, mitigatedKw: 139, solarKw: 0, socPct: 26 },
      { hour: '23:00', baselineKw: 98, mitigatedKw: 108, solarKw: 0, socPct: 38 },
    ],
    factors: [
      {
        name: '19:00 HVAC & EV Coincidence',
        direction: 'Increases risk',
        contribution: '+28.4 kW at 19:00',
        explanation:
          'Ambient temperature of 33°C sustains chiller compressor load into early evening while fleet chargers initiate at 18:15.',
      },
      {
        name: 'BESS Rack #02 Peak Shaving',
        direction: 'Reduces peak',
        contribution: '-38.2 kW (18:15–20:45)',
        explanation:
          'Discharging 95.5 kWh across the 2.5-hour window trims net utility import below the 160 kW soft ceiling.',
      },
      {
        name: 'Midday Solar PV Recharge',
        direction: 'Stabilizes reserve',
        contribution: '+96.0 kW peak PV at 12:30',
        explanation:
          'Surplus rooftop generation charges storage from 60% to 92% SoC prior to the evening tariff window.',
      },
      {
        name: 'Peak TOU Tariff Multiplier',
        direction: 'Tariff exposure',
        contribution: '$0.42/kWh vs $0.11 off-peak',
        explanation:
          'Energy consumed during the 4-hour evening window accounts for 61% of total daily electricity spend.',
      },
    ],
    limitations: [
      'Solar irradiance projections assume clear sky conditions after 14:00; convective cloud cover would reduce pre-charge by up to 18 kWh.',
      'EV fleet arrival estimate is based on typical Wednesday commuter telemetry; uncoordinated Level 2 charging may increase peak by 9 kW.',
      'BESS cell thermal limits assume HVAC enclosure operates continuously at 22°C ambient.',
    ],
    humanDecision: {
      status: 'Approved for schedule',
      reviewer: 'Elena Vance (Lead Grid Architect)',
      note: 'Verified transformer thermal headroom and 20% BESS reserve floor before peak window.',
      decidedAt: 'Oct 28, 2026 · 14:22 UTC',
    },
  },
  {
    id: 'ANL-2026-103',
    title: 'East Science Complex Feeder #02 Chiller Staging',
    substationZone: 'East Science Complex · Feeder #02',
    createdAt: 'Oct 28, 2026 · 11:05',
    status: 'Review required',
    modelUsed: 'Gemini 3.8 Flash + Solver',
    isIllustrativeDemo: true,
    scenarioNotes: 'Critical peak demand response study under 36°C heat dome advisory.',
    feederCapKw: 175,
    bessReserveFloorPct: 25,
    tariffWindow: '16:00 – 21:00 Critical Peak ($0.58/kWh)',
    ambientTempC: 36,
    includeEvFleet: false,
    executiveSummary:
      'Extreme thermal loading pushes East Science Feeder to 214 kW unmitigated peak at 17:45. Prescribes 45.5 kW BESS discharge combined with 1.5°C HVAC deadband relaxation.',
    unmitigatedPeakKw: 214.0,
    mitigatedPeakKw: 168.5,
    bessDischargeKw: 45.5,
    estimatedDailyDeltaUsd: 485.0,
    uncertaintyRangeKw: '±8.2 kW',
    hourlySeries: [
      { hour: '00:00', baselineKw: 80, mitigatedKw: 80, solarKw: 0, socPct: 70 },
      { hour: '08:00', baselineKw: 130, mitigatedKw: 120, solarKw: 40, socPct: 75 },
      { hour: '12:00', baselineKw: 170, mitigatedKw: 110, solarKw: 110, socPct: 95 },
      { hour: '17:00', baselineKw: 214, mitigatedKw: 168.5, solarKw: 15, socPct: 52 },
      { hour: '21:00', baselineKw: 165, mitigatedKw: 145, solarKw: 0, socPct: 28 },
    ],
    factors: [
      {
        name: 'Chiller Peak Load',
        direction: 'Increases risk',
        contribution: '+48 kW at 17:00',
        explanation: 'Heat dome forces triple chiller compressors into continuous duty.',
      },
      {
        name: 'BESS Dispatch Strategy B',
        direction: 'Reduces peak',
        contribution: '-45.5 kW peak trim',
        explanation: 'Aggressive discharge holds net interconnect within 175 kW capacity.',
      },
    ],
    limitations: [
      'Chiller setpoint adjustment requires Facility Operations sign-off.',
    ],
  },
];

// Initial Audit Log
const INITIAL_AUDIT_LOG: DecisionAuditEntry[] = [
  {
    id: 'AUD-8412',
    workspace: 'Editorial Report (ANL-2026-104)',
    screenId: 'results',
    decision: 'APPROVED',
    scheduleWindow: '17:00 – 21:00 Peak TOU ($0.42/kWh)',
    operatorNote:
      'Verified transformer thermal headroom and 20% BESS reserve floor before peak window.',
    inputSnapshot: 'North Campus · Interconnect #04 · Cap 160 kW',
    impactSummary: 'Peak 186.4 kW → 148.2 kW (−$342/day)',
    recommendedAction: 'Pre-charge BESS 11:00–15:30; discharge 38.2 kW 17:15–20:30',
    engineSource: 'gemini-3.8-flash',
    timestamp: '14:22 UTC',
  },
  {
    id: 'AUD-8390',
    workspace: 'AI Workspace (ANL-2026-103)',
    screenId: 'workspace',
    decision: 'SCHEDULED',
    scheduleWindow: '16:00 – 21:00 Critical Peak ($0.58/kWh)',
    operatorNote:
      'Flagged for facility engineer review prior to Lab Wing B chiller stage-down.',
    inputSnapshot: 'East Science Complex · Feeder #02 · Cap 175 kW',
    impactSummary: 'Peak 214.0 kW → 168.5 kW (−$485/day)',
    recommendedAction: 'Stage BESS 45.5 kW + 1.5°C HVAC deadband shift',
    engineSource: 'gemini-3.8-flash',
    timestamp: '11:05 UTC',
  },
];

// Initial Alerts
const INITIAL_ALERTS: AlertEventItem[] = [
  {
    id: 'evt-1',
    severity: 'critical',
    badgeLabel: 'Critical',
    time: '14:28:04',
    event: 'Peak Demand Threshold Exceeded (194.8 kW)',
    subsystem: 'Main Feeder #04',
    automatedAction: 'Discharge BESS-A at 42 kW (18:45)',
    actionColor: 'text-tertiary font-medium',
    controlType: 'simulate',
    acknowledged: false,
  },
  {
    id: 'evt-2',
    severity: 'warning',
    badgeLabel: 'Warning',
    time: '14:15:22',
    event: 'Solar Generation Drop (-38% Transient)',
    subsystem: 'Rooftop Array PV-02',
    automatedAction: 'BESS ramped +28 kW smoothing',
    actionColor: 'text-secondary font-medium',
    controlType: 'simulate',
    acknowledged: false,
  },
  {
    id: 'evt-3',
    severity: 'warning',
    badgeLabel: 'Warning',
    time: '13:50:11',
    event: 'Battery Reserve Near Floor (22% SOC)',
    subsystem: 'Storage Bank BESS-B',
    automatedAction: 'Diverted 18 kW solar to recharge',
    actionColor: 'text-primary font-medium',
    controlType: 'inspect',
    acknowledged: false,
  },
  {
    id: 'evt-4',
    severity: 'info',
    badgeLabel: 'Info',
    time: '13:12:00',
    event: 'Grid Peak Tariff Window Scheduled (17:00–21:00)',
    subsystem: 'Market Engine',
    automatedAction: 'Strategy A Locked',
    actionColor: 'text-secondary font-medium',
    controlType: 'resolved',
    acknowledged: true,
  },
  {
    id: 'evt-5',
    severity: 'info',
    badgeLabel: 'Resolved',
    time: '12:30:45',
    event: 'Thermal Pre-Cooling Cycle Initiated',
    subsystem: 'HVAC Chiller #01',
    automatedAction: 'Saved $142.00 (-26 kW peak)',
    actionColor: 'text-secondary font-medium',
    controlType: 'completed',
    acknowledged: true,
  },
];

// Initial Reports
const INITIAL_REPORTS: ReportArchiveItem[] = [
  {
    id: 'rep-1',
    name: 'Q3_Executive_Summary_North.pdf',
    date: 'Oct 01, 2026',
    size: '2.4 MB',
    format: 'PDF',
    period: 'Last 30 Days (Oct 1 - Oct 30)',
    facility: 'North Campus Microgrid (All Zones)',
    savings: '$18,420',
    co2: '14.2 Tons',
    peakReduction: '22.4%',
    selfConsumption: '94.8%',
  },
  {
    id: 'rep-2',
    name: 'Sept_Carbon_Audit_Log.csv',
    date: 'Sep 30, 2026',
    size: '840 KB',
    format: 'CSV',
    period: 'Last Quarter (Q3)',
    facility: 'North Campus Microgrid (All Zones)',
    savings: '$52,190',
    co2: '41.8 Tons',
    peakReduction: '24.1%',
    selfConsumption: '96.2%',
  },
  {
    id: 'rep-3',
    name: 'August_Peak_Shaving_Analysis.pdf',
    date: 'Sep 01, 2026',
    size: '1.8 MB',
    format: 'PDF',
    period: 'Last 7 Days (Oct 18 - Oct 24)',
    facility: 'Sector 4 Manufacturing Plant',
    savings: '$6,840',
    co2: '5.1 Tons',
    peakReduction: '19.8%',
    selfConsumption: '91.4%',
  },
];

// Initial Settings
const INITIAL_SETTINGS: SettingsState = {
  operatorName: 'Elena Vance',
  operatorTitle: 'Lead Grid Architect',
  operatorEmail: 'e.vance@northcampus-grid.org',
  substationCallsign: 'NC-FEEDER-04',
  defaultModel: 'gemini-3.8-flash',
  defaultFeederCapKw: 160,
  defaultReserveFloorPct: 20,
  timezoneDisplay: 'UTC-05:00 (Eastern Operational Standard)',
  requireDualSignoffOverKw: 50,
  sessionTimeoutMinutes: 60,
  enforceImmutableAuditNote: true,
  scadaEndpointUrl: 'wss://scada-gateway.northcampus.internal:8443/dnp3',
  weatherFeedEnabled: true,
  utilityTariffSyncEnabled: true,
  telemetryRetentionDays: '365 days (Compliance Standard)',
  includeIllustrativeTagOnExports: true,
};

// Forecast Data (24h)
const FORECAST_DATA: ForecastHourData[] = [
  { hour: '00:00', loadKw: '64.2', solarKw: '0.0', netDemand: '64.2 kW', riskLevel: 'Normal', strategy: 'Night Baseload', variance: '±1.1%' },
  { hour: '04:00', loadKw: '58.8', solarKw: '0.0', netDemand: '58.8 kW', riskLevel: 'Normal', strategy: 'Night Baseload', variance: '±0.9%' },
  { hour: '08:00', loadKw: '112.5', solarKw: '+28.4', netDemand: '84.1 kW', riskLevel: 'Normal', strategy: 'Baseload Grid', variance: '±1.4%' },
  { hour: '12:00', loadKw: '144.0', solarKw: '+88.6', netDemand: '55.4 kW', riskLevel: 'Normal', strategy: 'Solar Charging Battery', variance: '±1.2%' },
  { hour: '15:00', loadKw: '152.0', solarKw: '+54.2', netDemand: '97.8 kW', riskLevel: 'Normal', strategy: 'Solar Smoothing', variance: '±1.5%' },
  { hour: '16:00', loadKw: '158.4', solarKw: '+32.0', netDemand: '126.4 kW', riskLevel: 'Moderate', strategy: 'Pre-Cooling Active', variance: '±1.6%' },
  { hour: '18:00', loadKw: '174.6', solarKw: '+6.2', netDemand: '168.4 kW', riskLevel: 'Moderate', strategy: 'BESS Ramp-Up', variance: '±1.3%' },
  { hour: '19:00', loadKw: '186.2', solarKw: '0.0', netDemand: '186.2 kW', riskLevel: 'Critical', strategy: 'Peak Shaving / Battery Discharge', variance: '±1.2%', isCriticalRow: true },
  { hour: '20:00', loadKw: '169.5', solarKw: '0.0', netDemand: '169.5 kW', riskLevel: 'Moderate', strategy: 'Peak Shaving Active', variance: '±1.5%' },
  { hour: '22:00', loadKw: '122.0', solarKw: '0.0', netDemand: '122.0 kW', riskLevel: 'Normal', strategy: 'Off-Peak Recovery', variance: '±1.0%' },
];

class MemoryStore {
  private analyses: AnalysisRecord[] = [...INITIAL_ANALYSES];
  private auditLog: DecisionAuditEntry[] = [...INITIAL_AUDIT_LOG];
  private alerts: AlertEventItem[] = [...INITIAL_ALERTS];
  private reports: ReportArchiveItem[] = [...INITIAL_REPORTS];
  private settings: SettingsState = { ...INITIAL_SETTINGS };
  private forecasts: ForecastHourData[] = [...FORECAST_DATA];
  private latestHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  // --- Analyses ---
  getAnalyses(): AnalysisRecord[] {
    return [...this.analyses];
  }

  getAnalysisById(id: string): AnalysisRecord | undefined {
    return this.analyses.find((a) => a.id === id);
  }

  createAnalysis(analysis: AnalysisRecord): AnalysisRecord {
    this.analyses = [analysis, ...this.analyses.filter((a) => a.id !== analysis.id)];
    return analysis;
  }

  updateAnalysis(id: string, updates: Partial<AnalysisRecord>): AnalysisRecord | null {
    const idx = this.analyses.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.analyses[idx] = { ...this.analyses[idx], ...updates };
    return this.analyses[idx];
  }

  deleteAnalysis(id: string): boolean {
    const lenBefore = this.analyses.length;
    this.analyses = this.analyses.filter((a) => a.id !== id);
    return this.analyses.length < lenBefore;
  }

  // --- Governance & Audit ---
  getAuditLog(): DecisionAuditEntry[] {
    return [...this.auditLog];
  }

  addAuditEntry(entry: DecisionAuditEntry): DecisionAuditEntry {
    const payload = JSON.stringify(entry);
    const newHash = crypto
      .createHash('sha256')
      .update(this.latestHash + payload)
      .digest('hex');
    this.latestHash = newHash;

    this.auditLog = [entry, ...this.auditLog];

    // If decision links to an analysis, update the analysis humanDecision status
    const analysisMatch = this.analyses.find((a) => entry.workspace.includes(a.id));
    if (analysisMatch) {
      analysisMatch.humanDecision = {
        status:
          entry.decision === 'APPROVED'
            ? 'Approved for schedule'
            : entry.decision === 'SCHEDULED'
            ? 'Approved for schedule'
            : 'Held',
        reviewer: this.settings.operatorName,
        note: entry.operatorNote,
        decidedAt: `Today · ${entry.timestamp}`,
      };
      analysisMatch.status = entry.decision === 'APPROVED' ? 'Completed' : 'Review required';
    }

    return entry;
  }

  // --- Alerts ---
  getAlerts(): AlertEventItem[] {
    return [...this.alerts];
  }

  acknowledgeAlert(id: string): AlertEventItem | null {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    alert.acknowledged = true;
    return alert;
  }

  triggerAlertAction(id: string): { alert: AlertEventItem; actionResult: string } | null {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    alert.controlType = 'completed';
    alert.actionColor = 'text-tertiary font-medium';
    return {
      alert,
      actionResult: `Dispatched protective command: "${alert.automatedAction}" successfully to substation relay controller.`,
    };
  }

  // --- Reports ---
  getReports(): ReportArchiveItem[] {
    return [...this.reports];
  }

  createReport(report: ReportArchiveItem): ReportArchiveItem {
    this.reports = [report, ...this.reports];
    return report;
  }

  // --- Settings ---
  getSettings(): SettingsState {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<SettingsState>): SettingsState {
    this.settings = { ...this.settings, ...newSettings };
    return { ...this.settings };
  }

  // --- Forecasts ---
  getForecasts(): ForecastHourData[] {
    return [...this.forecasts];
  }

  // --- Live Telemetry Snapshot ---
  getLiveTelemetry(): TelemetrySnapshot {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const randJitter = (Math.random() - 0.5) * 2;
    const load = +(186.2 + randJitter).toFixed(1);
    const solar = +(0.0).toFixed(1);
    const net = load;
    const soc = 48.0;

    return {
      substationId: 'SUB-NORTH-04',
      feederId: 'NC-FEEDER-04',
      loadKw: load,
      solarKw: solar,
      netDemandKw: net,
      bessSocPct: soc,
      bessPowerKw: 38.2,
      gridFrequencyHz: +(59.98 + (Math.random() - 0.5) * 0.04).toFixed(3),
      feederVoltageV: +(480.2 + (Math.random() - 0.5) * 1.5).toFixed(1),
      ambientTempC: 33.2,
      transformerHeadroomKw: +(160.0 - (load - 38.2)).toFixed(1),
      status: load > 180 ? 'critical' : load > 160 ? 'warning' : 'nominal',
      timestamp: timeStr,
    };
  }
}

export const store = new MemoryStore();
