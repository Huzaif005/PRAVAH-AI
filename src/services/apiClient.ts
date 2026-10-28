import type {
  AnalysisRecord,
  DecisionAuditEntry,
  WorkspaceAnalysisRequest,
  WorkspaceAnalysisResponse,
} from '../types.ts';

const API_BASE = '/api';

export interface QuickMLTelemetryRow {
  timestamp: string;
  ambient_temp_c: number;
  humidity_pct: number;
  solar_irradiance_wm2: number;
}

export interface TransitionSignalItem {
  timestamp: string;
  hour: number;
  predictedDemandKw: number;
  gridMode: 'Renewable Storage Mode' | 'Main Grid Mode';
  criticalOverloadAlert: boolean;
  strategy: string;
  batterySocPct: number;
}

export interface QuickMLResponse {
  predictions: number[];
  signals: TransitionSignalItem[];
  count: number;
  status: string;
}

export interface LiveTelemetryResponse {
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

export class ApiClient {
  // --- Analyses ---
  static async getAnalyses(): Promise<AnalysisRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/analyses`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  static async getAnalysisById(id: string): Promise<AnalysisRecord | null> {
    try {
      const res = await fetch(`${API_BASE}/analyses/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }

  static async createAnalysis(record: AnalysisRecord): Promise<AnalysisRecord> {
    const res = await fetch(`${API_BASE}/analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`Failed to save analysis: HTTP ${res.status}`);
    return await res.json();
  }

  static async updateAnalysis(id: string, record: Partial<AnalysisRecord>): Promise<AnalysisRecord> {
    const res = await fetch(`${API_BASE}/analyses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`Failed to update analysis: HTTP ${res.status}`);
    return await res.json();
  }

  static async deleteAnalysis(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/analyses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete analysis: HTTP ${res.status}`);
  }

  // --- Governance & Audit ---
  static async getAuditLog(): Promise<DecisionAuditEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/governance/decisions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  static async recordDecision(entry: DecisionAuditEntry): Promise<DecisionAuditEntry> {
    const res = await fetch(`${API_BASE}/governance/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Failed to record decision: HTTP ${res.status}`);
    return await res.json();
  }

  // --- QuickML & Demand Forecasting ---
  static async predictQuickML(rows: QuickMLTelemetryRow[]): Promise<QuickMLResponse> {
    const res = await fetch(`${API_BASE}/quickml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: rows }),
    });
    if (!res.ok) throw new Error(`QuickML predict failed: HTTP ${res.status}`);
    return await res.json();
  }

  static async uploadCsvTelemetry(csvText: string): Promise<{
    totalRows: number;
    predictions: number[];
    signals: TransitionSignalItem[];
  }> {
    const res = await fetch(`${API_BASE}/telemetry/upload-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvText,
    });
    if (!res.ok) throw new Error(`CSV ingestion failed: HTTP ${res.status}`);
    return await res.json();
  }

  // --- Telemetry ---
  static async getLiveTelemetry(): Promise<LiveTelemetryResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/live`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // --- Alerts ---
  static async getAlerts(): Promise<unknown[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  static async acknowledgeAlert(id: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}/ack`, {
      method: 'POST',
    });
    return await res.json();
  }

  static async triggerAlertAction(id: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}/trigger`, {
      method: 'POST',
    });
    return await res.json();
  }
}
