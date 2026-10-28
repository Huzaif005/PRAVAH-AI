import React, { useState } from 'react';
import { ScreenId, ValidationIssue, DecisionAuditEntry } from '../types';
import { WorkspacePipelinePanel } from './WorkspacePipelinePanel';

interface AlertsEventsScreenProps {
  onNavigate: (screen: ScreenId) => void;
  auditLog: DecisionAuditEntry[];
  onRecordDecision: (entry: DecisionAuditEntry) => void;
}

const CCTV_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBsddLePjoGocpmlUe4-y-68iVZiSShkeb0z8TBenYR7ZpVwaSSS5wdVsXuHu9LoUiH0I4Ho6hEv_UgizSJYVSy979q1vuFEpBNOkOtgpp9Pd8HYUxpbjzNwXChAk7JEQhERysr17n8AfW1JGvG0UIj3WyV5GLrQn_Fb7iTTN89Yg_ALPFCrZMu2TMW3wbvQDeSLl5Kb040aiZYAj22eb1fcGiuEbc9q6HyBhkbAlMsUEZ348NjFbs9';

interface AlertEventItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  badgeLabel: string;
  time: string;
  event: string;
  subsystem: string;
  automatedAction: string;
  actionColor: string;
  controlType: 'simulate' | 'inspect' | 'resolved' | 'completed';
}

const ALERTS_DATA: AlertEventItem[] = [
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
  },
];

export const AlertsEventsScreen: React.FC<AlertsEventsScreenProps> = ({
  onNavigate,
  auditLog,
  onRecordDecision,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [peakTriggerKw, setPeakTriggerKw] = useState<number>(175);
  const [acknowledgedAll, setAcknowledgedAll] = useState(false);

  // Stage 02 Validation Checks
  const validationIssues: ValidationIssue[] = [];
  if (peakTriggerKw < 140 || peakTriggerKw > 195) {
    validationIssues.push({
      field: 'Relay Peak Trigger (kW)',
      message: `${peakTriggerKw} kW is outside the safe protection relay operating band (140 kW – 195 kW).`,
      remediation: 'Set Relay Peak Trigger between 140 kW and 195 kW.',
      severity: 'error',
    });
  }

  const handleResetInputs = () => {
    setSeverityFilter('all');
    setSearchQuery('');
    setPeakTriggerKw(175);
  };

  const filteredEvents = ALERTS_DATA.filter((item) => {
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.event.toLowerCase().includes(q) ||
      item.subsystem.toLowerCase().includes(q) ||
      item.automatedAction.toLowerCase().includes(q) ||
      item.time.toLowerCase().includes(q);
    return matchesSeverity && matchesSearch;
  });

  const handleExportCsv = () => {
    const header = 'Severity,Time,Event,Subsystem,AutomatedAction\n';
    const rows = filteredEvents
      .map(
        (r) =>
          `"${r.badgeLabel}","${r.time}","${r.event}","${r.subsystem}","${r.automatedAction}"`
      )
      .join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + header + rows);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PRAVAAH_Alerts_Events.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin sm:p-margin-md space-y-6">
      {/* Page Title & Stage 01 Triage Input Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary block mb-1">
            01 · PROTECTION RELAY TRIAGE &amp; THRESHOLD INPUTS
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">
            Alerts &amp; Events Triage Workspace
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Filter protection relay advisories, calibrate automated peak trigger thresholds, and commit triage decisions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-DEFAULT border border-outline-variant/25">
            <label htmlFor="relay-trigger-input" className="text-label-sm text-on-surface-variant">
              Relay Peak Trigger (kW):
            </label>
            <input
              id="relay-trigger-input"
              type="number"
              min={120}
              max={210}
              step={5}
              value={peakTriggerKw}
              onChange={(e) => setPeakTriggerKw(Number(e.target.value))}
              className="w-16 bg-surface-container-lowest border border-outline-variant/30 rounded-DEFAULT px-2 py-0.5 font-mono text-xs text-primary font-semibold focus:outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container border border-outline-variant/25 text-on-surface font-body-sm text-body-sm transition-colors cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-base leading-none">download</span>
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setAcknowledgedAll(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-DEFAULT bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-base leading-none text-secondary">
              done_all
            </span>
            <span>{acknowledgedAll ? 'All Acknowledged ✓' : 'Acknowledge All'}</span>
          </button>
        </div>
      </div>

      {/* Explicit 6-Stage AI Workspace & Decision Pipeline */}
      <WorkspacePipelinePanel
        screenId="alerts-and-events"
        workspaceName="Protection Relay & Event Triage"
        primaryActionLabel="Run AI Root-Cause Triage"
        inputSummary={`Severity Filter: ${severityFilter.toUpperCase()} · Relay Trigger: ${peakTriggerKw} kW · Active Events: ${filteredEvents.length}`}
        parameters={{
          severityFilter,
          peakTriggerKw,
          acknowledgedAll,
        }}
        validationIssues={validationIssues}
        onResetInputs={handleResetInputs}
        auditLog={auditLog}
        onRecordDecision={onRecordDecision}
      />

      {/* Unified 4-Column Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-surface-container-low border border-outline-variant/25 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
        <div className="p-5 flex items-baseline justify-between">
          <div>
            <span className="text-label-sm text-on-surface-variant block">
              Critical Active
            </span>
            <span className="font-mono-metric text-3xl text-error font-semibold mt-1 block">
              {acknowledgedAll ? '00' : '01'}
            </span>
          </div>
          <span className="font-mono text-label-sm text-error">Feeder #04</span>
        </div>

        <div className="p-5 flex items-baseline justify-between">
          <div>
            <span className="text-label-sm text-on-surface-variant block">
              Warnings Active
            </span>
            <span className="font-mono-metric text-3xl text-on-surface font-semibold mt-1 block">
              {acknowledgedAll ? '00' : '02'}
            </span>
          </div>
          <span className="font-mono text-label-sm text-tertiary">PV / BESS</span>
        </div>

        <div className="p-5 flex items-baseline justify-between">
          <div>
            <span className="text-label-sm text-on-surface-variant block">
              Operator Decisions Logged
            </span>
            <span className="font-mono-metric text-3xl text-primary font-semibold mt-1 block">
              {String(auditLog.length).padStart(2, '0')}
            </span>
          </div>
          <span className="font-mono text-label-sm text-outline">Audit Trail</span>
        </div>

        <div className="p-5 flex items-baseline justify-between">
          <div>
            <span className="text-label-sm text-on-surface-variant block">
              Mean Response Time
            </span>
            <span className="font-mono-metric text-3xl text-secondary font-semibold mt-1 block">
              1.4s
            </span>
          </div>
          <span className="font-mono text-label-sm text-secondary">Automated</span>
        </div>
      </div>

      {/* Combined Event Feed Container */}
      <div className="rounded-lg bg-surface-container-low border border-outline-variant/25 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div
            className="flex flex-wrap items-center gap-1 bg-surface-container-lowest p-0.5 rounded-DEFAULT border border-outline-variant/20 self-start"
            role="group"
            aria-label="Filter events by severity"
          >
            {(
              [
                { id: 'all', label: 'All (21)' },
                { id: 'critical', label: 'Critical (1)' },
                { id: 'warning', label: 'Warning (2)' },
                { id: 'info', label: 'Info (18)' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setSeverityFilter(f.id)}
                aria-pressed={severityFilter === f.id}
                className={`px-3 py-1 rounded-DEFAULT font-body-sm text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  severityFilter === f.id
                    ? 'bg-surface-container-high text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/25 rounded-DEFAULT px-3 py-1.5 w-full sm:w-72">
            <span className="material-symbols-outlined text-outline text-base mr-2">
              search
            </span>
            <input
              aria-label="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none w-full"
              placeholder="Search events or subsystems..."
              type="text"
            />
          </div>
        </div>

        {/* High-Density Structured Event Feed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 text-label-sm text-outline">
                <th className="py-2.5 px-5 w-28">Severity</th>
                <th className="py-2.5 px-4 w-28">Timestamp</th>
                <th className="py-2.5 px-4">Event Description</th>
                <th className="py-2.5 px-4 w-44">Subsystem</th>
                <th className="py-2.5 px-4">Automated Action</th>
                <th className="py-2.5 px-5 text-right w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 font-body-sm text-body-sm">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-on-surface-variant font-body-md"
                  >
                    <span>No matching events found.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSeverityFilter('all');
                        setSearchQuery('');
                      }}
                      className="ml-3 text-primary hover:underline font-mono text-xs cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.severity === 'critical'
                        ? 'bg-error-container/10 hover:bg-surface-container/70 transition-colors'
                        : 'hover:bg-surface-container/50 transition-colors'
                    }
                  >
                    <td className="py-3 px-5 align-middle font-mono text-label-sm">
                      {row.severity === 'critical' && (
                        <span className="text-error font-semibold">{row.badgeLabel}</span>
                      )}
                      {row.severity === 'warning' && (
                        <span className="text-tertiary font-medium">{row.badgeLabel}</span>
                      )}
                      {row.severity === 'info' && row.badgeLabel === 'Info' && (
                        <span className="text-primary">{row.badgeLabel}</span>
                      )}
                      {row.severity === 'info' && row.badgeLabel === 'Resolved' && (
                        <span className="text-secondary">{row.badgeLabel}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-middle font-mono text-body-sm text-on-surface-variant">
                      {row.time}
                    </td>
                    <td className="py-3 px-4 align-middle font-medium text-on-surface">
                      {row.event}
                    </td>
                    <td className="py-3 px-4 align-middle text-on-surface-variant">
                      {row.subsystem}
                    </td>
                    <td className={`py-3 px-4 align-middle ${row.actionColor}`}>
                      {row.automatedAction}
                    </td>
                    <td className="py-3 px-5 align-middle text-right">
                      {row.controlType === 'simulate' && (
                        <button
                          onClick={() => onNavigate('microgrid-simulator')}
                          className={`px-2.5 py-1 rounded-DEFAULT font-body-sm text-xs transition-colors cursor-pointer whitespace-nowrap ${
                            row.severity === 'critical'
                              ? 'bg-primary text-on-primary font-semibold hover:bg-primary-fixed'
                              : 'bg-surface-container-high hover:bg-surface-bright text-on-surface'
                          }`}
                          type="button"
                        >
                          Simulate
                        </button>
                      )}
                      {row.controlType === 'inspect' && (
                        <button
                          onClick={() => onNavigate('decision-lab')}
                          className="px-2.5 py-1 rounded-DEFAULT bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-xs transition-colors cursor-pointer whitespace-nowrap"
                          type="button"
                        >
                          Inspect
                        </button>
                      )}
                      {row.controlType === 'resolved' && (
                        <span className="font-mono text-label-sm text-secondary">
                          Resolved
                        </span>
                      )}
                      {row.controlType === 'completed' && (
                        <span className="font-mono text-label-sm text-secondary">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: 3-Column Substation Telemetry & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              BESS &amp; Transformer Yard
            </h3>
            <span className="font-mono text-label-sm text-secondary">
              31.4°C · Nominal
            </span>
          </div>
          <div className="relative h-40 w-full rounded-DEFAULT overflow-hidden bg-surface-container-lowest border border-outline-variant/20">
            <img
              alt="Substation Battery Storage Yard"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-85"
              src={CCTV_IMG}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between font-mono text-label-sm text-on-surface">
              <span>Substation Feeder #04</span>
              <span className="text-secondary">Thermal Camera 02</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface pb-3 border-b border-outline-variant/20">
            Automated Protection Rules
          </h3>
          <div className="divide-y divide-outline-variant/15 flex-1 flex flex-col justify-center">
            <div className="py-3 flex items-baseline justify-between">
              <span className="font-body-sm text-body-sm text-on-surface">
                Peak Shaving Trigger (&gt;{peakTriggerKw} kW)
              </span>
              <span className="font-mono text-label-sm text-secondary">
                Enabled
              </span>
            </div>
            <div className="py-3 flex items-baseline justify-between">
              <span className="font-body-sm text-body-sm text-on-surface">
                Cloud Ramp Smoothing (&gt;15%/min)
              </span>
              <span className="font-mono text-label-sm text-secondary">
                Enabled
              </span>
            </div>
            <div className="py-3 flex items-baseline justify-between">
              <span className="font-body-sm text-body-sm text-on-surface">
                Grid Frequency Droop (&lt;59.85 Hz)
              </span>
              <span className="font-mono text-label-sm text-primary">
                Standby
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface pb-3 border-b border-outline-variant/20">
            Inverter Thermal Load
          </h3>
          <div className="space-y-3.5 pt-3">
            <div>
              <div className="flex items-center justify-between font-mono text-label-sm mb-1">
                <span className="text-on-surface-variant">Inverter #01</span>
                <span className="text-secondary">68°C</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-DEFAULT overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between font-mono text-label-sm mb-1">
                <span className="text-on-surface-variant">Inverter #02</span>
                <span className="text-secondary">71°C</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-DEFAULT overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between font-mono text-label-sm mb-1">
                <span className="text-on-surface-variant">Inverter #03</span>
                <span className="text-tertiary">88°C</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-DEFAULT overflow-hidden">
                <div className="bg-tertiary h-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
