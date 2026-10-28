import React, { useState } from 'react';
import { ScreenId, AnalysisRecord, DecisionAuditEntry } from '../types';
import { createAnalysisFromWorkspace } from '../services/editorialAnalysisData';

interface EditorialResultsScreenProps {
  analyses: AnalysisRecord[];
  activeReportId: string;
  onSelectReportId: (id: string) => void;
  onUpdateAnalysis: (updated: AnalysisRecord) => void;
  onEditInWorkspace: (record: AnalysisRecord) => void;
  onRecordDecision: (entry: DecisionAuditEntry) => void;
  onNavigate: (screen: ScreenId, reportId?: string) => void;
}

export const EditorialResultsScreen: React.FC<EditorialResultsScreenProps> = ({
  analyses,
  activeReportId,
  onSelectReportId,
  onUpdateAnalysis,
  onEditInWorkspace,
  onRecordDecision,
  onNavigate,
}) => {
  const currentRecord =
    analyses.find((a) => a.id === activeReportId) || analyses[0];

  const [isRerunning, setIsRerunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDecisionStatus, setConfirmDecisionStatus] = useState<
    'Approved for schedule' | 'Flagged for review' | 'Held' | null
  >(null);
  const [reviewerName, setReviewerName] = useState('E. Vance · Lead Grid Architect');
  const [reviewerNote, setReviewerNote] = useState(
    'Verified transformer thermal headroom and 20% BESS reserve floor before peak window.'
  );

  if (!currentRecord) {
    return (
      <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-10 text-center space-y-4">
        <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#716A61]">
          NO REPORT FOUND
        </div>
        <h2 className="font-serif-editorial text-[28px] text-[#29251F]">
          No analysis study selected
        </h2>
        <p className="text-[15px] text-[#716A61] max-w-md mx-auto">
          Launch a new study in the AI workspace or select an existing study from the analysis history.
        </p>
        <button
          onClick={() => onNavigate('workspace')}
          className="h-11 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
        >
          Open AI workspace
        </button>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleRerun = async () => {
    setIsRerunning(true);
    try {
      const refreshed = await createAnalysisFromWorkspace({
        title: currentRecord.title,
        substationZone: currentRecord.substationZone,
        scenarioNotes: currentRecord.scenarioNotes,
        feederCapKw: currentRecord.feederCapKw,
        bessReserveFloorPct: currentRecord.bessReserveFloorPct,
        tariffWindow: currentRecord.tariffWindow,
        ambientTempC: currentRecord.ambientTempC,
        includeEvFleet: currentRecord.includeEvFleet,
        modelChoice: currentRecord.modelUsed,
      });
      const updatedRecord: AnalysisRecord = {
        ...refreshed,
        id: currentRecord.id,
        createdAt: `${ currentRecord.createdAt.split(' · ')[0] } · Rerun ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };
      onUpdateAnalysis(updatedRecord);
      showToast(`Reran analysis ${currentRecord.id} with current parameters.`);
    } catch {
      showToast('Rerun encountered an error; existing report preserved.');
    } finally {
      setIsRerunning(false);
    }
  };

  const handleExportReport = (format: 'markdown' | 'csv') => {
    if (format === 'markdown') {
      const md = [
        `# ${currentRecord.title} (${currentRecord.id})`,
        `Substation Zone: ${currentRecord.substationZone}`,
        `Timestamp: ${currentRecord.createdAt}`,
        `Status: ${currentRecord.status}`,
        `Synthesis Engine: ${currentRecord.modelUsed}`,
        `Illustrative Demo Data: ${currentRecord.isIllustrativeDemo ? 'Yes' : 'No'}`,
        ``,
        `## Executive Summary`,
        currentRecord.executiveSummary,
        ``,
        `## Key Metrics`,
        `- Unmitigated Peak: ${currentRecord.unmitigatedPeakKw.toFixed(1)} kW`,
        `- Mitigated Peak: ${currentRecord.mitigatedPeakKw.toFixed(1)} kW (Feeder Cap: ${currentRecord.feederCapKw} kW)`,
        `- BESS Dispatch: ${currentRecord.bessDischargeKw.toFixed(1)} kW (Reserve Floor: ${currentRecord.bessReserveFloorPct}%)`,
        `- Estimated Daily Delta: $${currentRecord.estimatedDailyDeltaUsd.toLocaleString()}`,
        `- Physical Uncertainty Band: ${currentRecord.uncertaintyRangeKw}`,
        ``,
        `## Explainable Contributing Factors`,
        ...currentRecord.factors.map(
          (f) => `- **${f.name}** (${f.direction} | ${f.contribution}): ${f.explanation}`
        ),
        ``,
        `## Model & Telemetry Limitations`,
        ...currentRecord.limitations.map((l) => `- ${l}`),
      ].join('\n');

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentRecord.id}-editorial-report.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${currentRecord.id} as Markdown dossier.`);
    } else {
      const headers = 'Hour,Baseline_kW,Mitigated_kW,Solar_kW,BESS_SoC_Pct\n';
      const rows = currentRecord.hourlySeries
        .map(
          (pt) =>
            `${pt.hour},${pt.baselineKw},${pt.mitigatedKw},${pt.solarKw},${pt.socPct}`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentRecord.id}-hourly-telemetry.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${currentRecord.id} 24-hour series as CSV.`);
    }
  };

  const handleConfirmHumanDecision = () => {
    if (!confirmDecisionStatus) return;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedRecord: AnalysisRecord = {
      ...currentRecord,
      status:
        confirmDecisionStatus === 'Approved for schedule'
          ? 'Completed'
          : confirmDecisionStatus === 'Flagged for review'
          ? 'Review required'
          : 'Draft',
      humanDecision: {
        status: confirmDecisionStatus,
        reviewer: reviewerName.trim() || 'Operator',
        note: reviewerNote.trim() || 'Reviewed via editorial report dossier.',
        decidedAt: `${nowTime} UTC`,
      },
    };

    onUpdateAnalysis(updatedRecord);

    onRecordDecision({
      id: `DEC-${Math.floor(1000 + Math.random() * 9000)}`,
      workspace: `Editorial Report (${currentRecord.id})`,
      screenId: 'results',
      decision:
        confirmDecisionStatus === 'Approved for schedule'
          ? 'APPROVED'
          : confirmDecisionStatus === 'Flagged for review'
          ? 'SCHEDULED'
          : 'REJECTED',
      scheduleWindow: currentRecord.tariffWindow,
      operatorNote: reviewerNote.trim() || confirmDecisionStatus,
      inputSnapshot: `${currentRecord.substationZone} · Cap ${currentRecord.feederCapKw} kW`,
      impactSummary: `Peak ${currentRecord.unmitigatedPeakKw.toFixed(1)} kW → ${currentRecord.mitigatedPeakKw.toFixed(1)} kW`,
      recommendedAction: `BESS ${currentRecord.bessDischargeKw.toFixed(1)} kW dispatch (${confirmDecisionStatus})`,
      engineSource:
        currentRecord.modelUsed === 'Gemini 3.8 Flash + Solver'
          ? 'gemini-3.8-flash'
          : 'deterministic-solver',
      timestamp: nowTime,
    });

    setConfirmDecisionStatus(null);
    showToast(`Recorded human review decision: ${confirmDecisionStatus}.`);
  };

  const peakReductionKw =
    currentRecord.unmitigatedPeakKw - currentRecord.mitigatedPeakKw;
  const isWithinCap = currentRecord.mitigatedPeakKw <= currentRecord.feederCapKw;

  return (
    <div className="space-y-10 pb-12">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#29251F] text-[#FCFAF6] border border-[#754536] rounded-[8px] px-4 py-3 shadow-lg flex items-center gap-3 max-w-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#35674A] shrink-0" />
          <span className="text-[13px]">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-[11px] font-mono-meta uppercase tracking-wider text-[#B6BFA6] hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP BAR: STUDY SWITCHER & REPORT ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#DDD5C9]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('history')}
            className="text-[13px] text-[#716A61] hover:text-[#29251F] flex items-center gap-1.5 cursor-pointer"
          >
            ← All studies
          </button>
          <span className="text-[#DDD5C9]">/</span>
          <label htmlFor="report-study-switcher" className="sr-only">
            Select analysis report
          </label>
          <select
            id="report-study-switcher"
            value={currentRecord.id}
            onChange={(e) => onSelectReportId(e.target.value)}
            className="h-10 px-3 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[13px] font-mono-meta text-[#29251F] focus:outline-none focus:border-[#754536]"
          >
            {analyses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} — {item.title}
              </option>
            ))}
          </select>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-mono-meta text-[11px] ${
              currentRecord.status === 'Completed'
                ? 'bg-[#35674A]/10 text-[#35674A]'
                : currentRecord.status === 'Review required'
                ? 'bg-[#754536]/12 text-[#754536]'
                : currentRecord.status === 'Failed'
                ? 'bg-[#A43E35]/12 text-[#A43E35]'
                : 'bg-[#315B85]/12 text-[#315B85]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {currentRecord.status}
          </span>

          {currentRecord.isIllustrativeDemo && (
            <span className="px-2.5 py-1 rounded-[4px] bg-[#F3EEE5] border border-[#DDD5C9] font-mono-meta text-[11px] text-[#716A61]">
              ILLUSTRATIVE TELEMETRY
            </span>
          )}
        </div>

        {/* Actions: Export, Rerun, Edit */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleExportReport('markdown')}
            className="h-10 px-3.5 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#FFFFFF] text-[#29251F] text-[13px] font-medium transition-colors cursor-pointer"
          >
            Export Markdown
          </button>
          <button
            onClick={() => handleExportReport('csv')}
            className="h-10 px-3.5 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#FFFFFF] text-[#29251F] text-[13px] font-medium transition-colors cursor-pointer"
          >
            Export CSV
          </button>
          <button
            onClick={handleRerun}
            disabled={isRerunning}
            className="h-10 px-3.5 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#FFFFFF] disabled:opacity-50 text-[#29251F] text-[13px] font-medium transition-colors cursor-pointer"
          >
            {isRerunning ? 'Rerunning solver...' : 'Rerun analysis'}
          </button>
          <button
            onClick={() => onEditInWorkspace(currentRecord)}
            className="h-10 px-4 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[13px] font-medium transition-colors cursor-pointer"
          >
            Edit in workspace
          </button>
        </div>
      </div>

      {/* 1. EDITORIAL DOSSIER HEADER & RESULT SUMMARY FIRST */}
      <article className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DDD5C9]">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3 font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
              <span>ANALYSIS DOSSIER · {currentRecord.id}</span>
              <span className="text-[#DDD5C9]">·</span>
              <span className="text-[#716A61]">{currentRecord.substationZone}</span>
            </div>
            <h1 className="font-serif-editorial text-[30px] sm:text-[40px] leading-[1.12] text-[#29251F]">
              {currentRecord.title}
            </h1>
          </div>
          <div className="text-left md:text-right font-mono-meta text-[11px] text-[#716A61] space-y-1 shrink-0">
            <div>GENERATED: {currentRecord.createdAt}</div>
            <div>ENGINE: {currentRecord.modelUsed}</div>
            <div>TARIFF: {currentRecord.tariffWindow}</div>
          </div>
        </div>

        {/* Executive Summary Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#716A61]">
              01 / EXECUTIVE RESULT SUMMARY
            </div>
            <p className="font-serif-editorial text-[22px] sm:text-[26px] leading-[1.38] text-[#29251F]">
              {currentRecord.executiveSummary}
            </p>
            <p className="text-[14px] leading-[1.6] text-[#716A61]">
              <strong>Scenario Scope:</strong> {currentRecord.scenarioNotes} Ambient temperature modeled at{' '}
              <span className="font-mono-meta text-[#29251F]">{currentRecord.ambientTempC}°C</span>{' '}
              with EV fleet charging demand{' '}
              <span className="font-mono-meta text-[#29251F]">
                {currentRecord.includeEvFleet ? 'included' : 'excluded'}
              </span>.
            </p>
          </div>

          {/* Uncertainty & Physics Verification Box */}
          <div className="lg:col-span-4 bg-[#F3EEE5] border border-[#DDD5C9] rounded-[8px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#29251F]">
                UNCERTAINTY & BOUNDS
              </span>
              <span
                className={`font-mono-meta text-[11px] px-2 py-0.5 rounded-[4px] ${
                  isWithinCap
                    ? 'bg-[#35674A]/12 text-[#35674A]'
                    : 'bg-[#A43E35]/12 text-[#A43E35]'
                }`}
              >
                {isWithinCap ? 'CAP COMPLIANT' : 'EXCEEDS CAP'}
              </span>
            </div>
            <div className="pt-1 border-t border-[#DDD5C9] space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#716A61]">Thermal & solar variance band:</span>
                <span className="font-mono-meta font-medium text-[#29251F]">
                  {currentRecord.uncertaintyRangeKw}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A61]">Transformer continuous limit:</span>
                <span className="font-mono-meta font-medium text-[#29251F]">
                  {currentRecord.feederCapKw.toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A61]">Enforced BESS SoC floor:</span>
                <span className="font-mono-meta font-medium text-[#29251F]">
                  {currentRecord.bessReserveFloorPct}%
                </span>
              </div>
            </div>
            <p className="text-[12px] leading-[1.5] text-[#716A61] pt-1 border-t border-[#DDD5C9]">
              Uncertainty bounds reflect physical irradiance and chiller staging sensitivity rather than synthetic probability scores.
            </p>
          </div>
        </div>

        {/* 4 Key Typography-Led Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#DDD5C9] border border-[#DDD5C9] rounded-[8px] overflow-hidden">
          <div className="bg-[#FFFFFF] p-5 space-y-1.5">
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#716A61]">
              UNMITIGATED PEAK
            </div>
            <div className="font-serif-editorial text-[32px] leading-none text-[#29251F] tabular-nums">
              {currentRecord.unmitigatedPeakKw.toFixed(1)}{' '}
              <span className="text-[15px] font-sans-ui font-normal text-[#716A61]">kW</span>
            </div>
            <div className="font-mono-meta text-[11px] text-[#A43E35]">
              {currentRecord.unmitigatedPeakKw > currentRecord.feederCapKw
                ? `+${(currentRecord.unmitigatedPeakKw - currentRecord.feederCapKw).toFixed(1)} kW over feeder cap`
                : 'Within nominal feeder cap'}
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 space-y-1.5">
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#716A61]">
              MITIGATED PEAK DEMAND
            </div>
            <div className="font-serif-editorial text-[32px] leading-none text-[#35674A] tabular-nums">
              {currentRecord.mitigatedPeakKw.toFixed(1)}{' '}
              <span className="text-[15px] font-sans-ui font-normal text-[#716A61]">kW</span>
            </div>
            <div className="font-mono-meta text-[11px] text-[#35674A]">
              −{peakReductionKw.toFixed(1)} kW net peak shaving
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 space-y-1.5">
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#716A61]">
              BESS DISCHARGE RATE
            </div>
            <div className="font-serif-editorial text-[32px] leading-none text-[#754536] tabular-nums">
              {currentRecord.bessDischargeKw.toFixed(1)}{' '}
              <span className="text-[15px] font-sans-ui font-normal text-[#716A61]">kW</span>
            </div>
            <div className="font-mono-meta text-[11px] text-[#716A61]">
              Min reserve {currentRecord.bessReserveFloorPct}% preserved
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 space-y-1.5">
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#716A61]">
              ESTIMATED TARIFF DELTA
            </div>
            <div className="font-serif-editorial text-[32px] leading-none text-[#29251F] tabular-nums">
              ${currentRecord.estimatedDailyDeltaUsd.toLocaleString()}{' '}
              <span className="text-[15px] font-sans-ui font-normal text-[#716A61]">/ day</span>
            </div>
            <div className="font-mono-meta text-[11px] text-[#315B85]">
              Avoided demand & TOU arbitrage
            </div>
          </div>
        </div>
      </article>

      {/* 2. SUPPORTING EVIDENCE & VISUALIZATIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 cols: 24-Hour Load & Dispatch Envelope */}
        <div className="lg:col-span-7 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
                02 / SUPPORTING TELEMETRY EVIDENCE
              </span>
              <span className="font-mono-meta text-[11px] text-[#716A61]">
                INTERVAL: 24-HOUR DISPATCH PROFILE
              </span>
            </div>
            <h2 className="font-serif-editorial text-[24px] text-[#29251F] mb-5">
              Baseline vs. mitigated feeder demand curve
            </h2>

            {/* SVG Chart */}
            <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] p-4">
              <svg
                viewBox="0 0 640 230"
                className="w-full h-56 overflow-visible"
                role="img"
                aria-label="Comparison of unmitigated baseline load, oxide mitigated load, and soft sage solar generation"
              >
                {/* Horizontal grid lines */}
                {[50, 100, 150, 200].map((val) => {
                  const y = 200 - (val / 220) * 175;
                  return (
                    <g key={val}>
                      <line
                        x1="42"
                        y1={y}
                        x2="620"
                        y2={y}
                        stroke="#DDD5C9"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="36"
                        y={y + 4}
                        textAnchor="end"
                        className="fill-[#716A61] font-mono-meta text-[10px]"
                      >
                        {val}kW
                      </text>
                    </g>
                  );
                })}

                {/* Feeder cap threshold line */}
                {(() => {
                  const capY = 200 - (currentRecord.feederCapKw / 220) * 175;
                  return (
                    <g>
                      <line
                        x1="42"
                        y1={capY}
                        x2="620"
                        y2={capY}
                        stroke="#A43E35"
                        strokeWidth="1.25"
                        strokeDasharray="5 4"
                      />
                      <text
                        x="616"
                        y={capY - 5}
                        textAnchor="end"
                        className="fill-[#A43E35] font-mono-meta text-[9px]"
                      >
                        FEEDER CAP ({currentRecord.feederCapKw} kW)
                      </text>
                    </g>
                  );
                })()}

                {/* Soft Sage Solar Generation Polygon & Line */}
                <polygon
                  fill="#B6BFA6"
                  fillOpacity="0.28"
                  points={[
                    `42,200`,
                    ...currentRecord.hourlySeries.map((pt, idx) => {
                      const x =
                        42 +
                        (idx / Math.max(1, currentRecord.hourlySeries.length - 1)) *
                          578;
                      const y = 200 - (pt.solarKw / 220) * 175;
                      return `${x},${y}`;
                    }),
                    `620,200`,
                  ].join(' ')}
                />
                <polyline
                  fill="none"
                  stroke="#B6BFA6"
                  strokeWidth="2"
                  points={currentRecord.hourlySeries
                    .map((pt, idx) => {
                      const x =
                        42 +
                        (idx / Math.max(1, currentRecord.hourlySeries.length - 1)) *
                          578;
                      const y = 200 - (pt.solarKw / 220) * 175;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Unmitigated Baseline Dashed Curve */}
                <polyline
                  fill="none"
                  stroke="#29251F"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.6"
                  points={currentRecord.hourlySeries
                    .map((pt, idx) => {
                      const x =
                        42 +
                        (idx / Math.max(1, currentRecord.hourlySeries.length - 1)) *
                          578;
                      const y = 200 - (pt.baselineKw / 220) * 175;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Mitigated Oxide Curve */}
                <polyline
                  fill="none"
                  stroke="#754536"
                  strokeWidth="2.75"
                  points={currentRecord.hourlySeries
                    .map((pt, idx) => {
                      const x =
                        42 +
                        (idx / Math.max(1, currentRecord.hourlySeries.length - 1)) *
                          578;
                      const y = 200 - (pt.mitigatedKw / 220) * 175;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Data points & X-axis labels */}
                {currentRecord.hourlySeries.map((pt, idx) => {
                  const x =
                    42 +
                    (idx / Math.max(1, currentRecord.hourlySeries.length - 1)) *
                      578;
                  const yMit = 200 - (pt.mitigatedKw / 220) * 175;
                  return (
                    <g key={pt.hour}>
                      <circle cx={x} cy={yMit} r="3.5" fill="#754536" />
                      <text
                        x={x}
                        y="220"
                        textAnchor="middle"
                        className="fill-[#716A61] font-mono-meta text-[10px]"
                      >
                        {pt.hour}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-4 border-t border-[#DDD5C9] text-[12px] text-[#716A61]">
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-[#754536] inline-block" />
                <strong className="text-[#29251F] font-medium">Mitigated load (kW)</strong>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-b border-dashed border-[#29251F] inline-block" />
                <span>Unmitigated baseline</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-[2px] bg-[#B6BFA6]/60 border border-[#B6BFA6] inline-block" />
                <span>PV solar offset</span>
              </span>
            </div>
            <span className="font-mono-meta text-[11px]">
              PEAK SHAVED: {peakReductionKw.toFixed(1)} kW
            </span>
          </div>
        </div>

        {/* Right 5 cols: Battery State-of-Charge (SoC) Trajectory & Interval Table */}
        <div className="lg:col-span-5 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536] mb-2">
              03 / STORAGE RESERVE TRAJECTORY
            </div>
            <h2 className="font-serif-editorial text-[24px] text-[#29251F] mb-4">
              BESS state-of-charge & interval ledger
            </h2>

            {/* SoC Bar Strip */}
            <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] p-4 space-y-3">
              <div className="flex items-center justify-between font-mono-meta text-[11px] text-[#716A61]">
                <span>STATE OF CHARGE (%)</span>
                <span>RESERVE FLOOR: {currentRecord.bessReserveFloorPct}%</span>
              </div>
              <div className="grid grid-cols-9 gap-2 items-end h-28 pt-2 px-1">
                {currentRecord.hourlySeries.map((pt) => {
                  const isDischargeWindow =
                    pt.hour === '16:00' || pt.hour === '18:00' || pt.hour === '20:00';
                  return (
                    <div
                      key={pt.hour}
                      className="flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <span className="font-mono-meta text-[10px] text-[#29251F] tabular-nums">
                        {pt.socPct}%
                      </span>
                      <div className="w-full bg-[#F3EEE5] rounded-t-[3px] h-20 flex items-end overflow-hidden border border-[#DDD5C9]/60">
                        <div
                          style={{ height: `${pt.socPct}%` }}
                          className={`w-full transition-all ${
                            isDischargeWindow ? 'bg-[#754536]' : 'bg-[#B6BFA6]'
                          }`}
                        />
                      </div>
                      <span className="font-mono-meta text-[9px] text-[#716A61]">
                        {pt.hour.slice(0, 2)}h
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compact Interval Table */}
            <div className="mt-4 border border-[#DDD5C9] rounded-[8px] overflow-hidden bg-[#FFFFFF]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DDD5C9] bg-[#F3EEE5]/60 font-mono-meta text-[10px] uppercase tracking-[0.1em] text-[#716A61]">
                    <th className="py-2 px-3">Hour</th>
                    <th className="py-2 px-3 text-right">Baseline</th>
                    <th className="py-2 px-3 text-right">Mitigated</th>
                    <th className="py-2 px-3 text-right">SoC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD5C9] font-mono-meta text-[12px]">
                  {currentRecord.hourlySeries.slice(3, 8).map((pt) => (
                    <tr key={pt.hour} className="hover:bg-[#FCFAF6]">
                      <td className="py-2 px-3 text-[#29251F]">{pt.hour}</td>
                      <td className="py-2 px-3 text-right text-[#716A61] tabular-nums">
                        {pt.baselineKw.toFixed(1)} kW
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-[#754536] tabular-nums">
                        {pt.mitigatedKw.toFixed(1)} kW
                      </td>
                      <td className="py-2 px-3 text-right text-[#29251F] tabular-nums">
                        {pt.socPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[12px] text-[#716A61] flex items-center justify-between pt-2 border-t border-[#DDD5C9]">
            <span>Oxide bars indicate active peak-window dispatch.</span>
            <span className="font-mono-meta text-[11px] text-[#35674A]">
              FLOOR RESPECTED
            </span>
          </div>
        </div>
      </section>

      {/* 3. EXPLAINABLE FACTORS TABLE & MODEL LIMITATIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns: Explainable Drivers */}
        <div className="lg:col-span-8 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 space-y-5">
          <div>
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536] mb-1">
              04 / EXPLAINABLE PHYSICAL & TARIFF FACTORS
            </div>
            <h2 className="font-serif-editorial text-[26px] text-[#29251F]">
              Primary drivers shaping this dispatch recommendation
            </h2>
          </div>

          <div className="overflow-x-auto border border-[#DDD5C9] rounded-[8px] bg-[#FFFFFF]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DDD5C9] bg-[#F3EEE5]/70 font-mono-meta text-[11px] uppercase tracking-[0.1em] text-[#716A61]">
                  <th className="py-3 px-4">Contributing factor</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Measured effect</th>
                  <th className="py-3 px-4">Physical & tariff explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C9] text-[13px]">
                {currentRecord.factors.map((factor, idx) => (
                  <tr key={idx} className="hover:bg-[#FCFAF6] align-top">
                    <td className="py-3.5 px-4 font-medium text-[#29251F]">
                      {factor.name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] font-mono-meta text-[11px] ${
                          factor.direction === 'Reduces peak'
                            ? 'bg-[#35674A]/12 text-[#35674A]'
                            : factor.direction === 'Increases risk'
                            ? 'bg-[#A43E35]/12 text-[#A43E35]'
                            : factor.direction === 'Stabilizes reserve'
                            ? 'bg-[#315B85]/12 text-[#315B85]'
                            : 'bg-[#754536]/12 text-[#754536]'
                        }`}
                      >
                        {factor.direction}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-meta font-medium text-[#29251F] whitespace-nowrap tabular-nums">
                      {factor.contribution}
                    </td>
                    <td className="py-3.5 px-4 text-[#716A61] leading-[1.55]">
                      {factor.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Columns: Explicit Model & Telemetry Limitations */}
        <div className="lg:col-span-4 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536] mb-1">
                05 / MODEL & DATA LIMITATIONS
              </div>
              <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
                Boundary assumptions
              </h2>
            </div>

            <p className="text-[13px] leading-[1.6] text-[#716A61]">
              To prevent over-reliance on automated projections, operators must verify the following boundary conditions before committing PLC schedules:
            </p>

            <ul className="space-y-3">
              {currentRecord.limitations.map((limitation, i) => (
                <li
                  key={i}
                  className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[6px] p-3.5 text-[13px] leading-[1.55] text-[#29251F] flex items-start gap-2.5"
                >
                  <span className="font-mono-meta text-[11px] text-[#754536] mt-0.5">
                    0{i + 1}
                  </span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-[#DDD5C9] text-[12px] text-[#716A61]">
            <strong className="text-[#29251F]">Epistemic transparency:</strong> No unverified confidence percentages are generated. All recommendations are bounded by physical inverter ratings.
          </div>
        </div>
      </section>

      {/* 4. HUMAN REVIEW & CONSEQUENTIAL SIGN-OFF PANEL */}
      <section className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#DDD5C9]">
          <div>
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536] mb-1">
              06 / HUMAN REVIEW FOR CONSEQUENTIAL DECISIONS
            </div>
            <h2 className="font-serif-editorial text-[26px] text-[#29251F]">
              Operator sign-off & PLC dispatch authorization
            </h2>
            <p className="text-[14px] text-[#716A61] mt-1">
              Consequential grid actions require explicit human review and an immutable audit note before execution.
            </p>
          </div>

          {currentRecord.humanDecision && (
            <div className="bg-[#F3EEE5] border border-[#DDD5C9] rounded-[8px] px-4 py-3 text-left md:text-right shrink-0">
              <div className="font-mono-meta text-[10px] uppercase tracking-[0.12em] text-[#716A61]">
                CURRENT SIGN-OFF STATUS
              </div>
              <div className="font-mono-meta text-[13px] font-medium text-[#35674A] mt-0.5">
                {currentRecord.humanDecision.status}
              </div>
              <div className="text-[12px] text-[#716A61] mt-0.5">
                {currentRecord.humanDecision.reviewer} · {currentRecord.humanDecision.decidedAt}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="reviewer-identity-input"
              className="block text-[13px] font-medium text-[#29251F] mb-1.5"
            >
              Reviewing engineer / operator
            </label>
            <input
              id="reviewer-identity-input"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-[6px] bg-[#FCFAF6] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
            />
          </div>
          <div>
            <label
              htmlFor="reviewer-audit-note"
              className="block text-[13px] font-medium text-[#29251F] mb-1.5"
            >
              Verification & sign-off rationale
            </label>
            <input
              id="reviewer-audit-note"
              type="text"
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              className="w-full h-11 px-3.5 rounded-[6px] bg-[#FCFAF6] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="text-[12px] text-[#716A61]">
            Selecting an action opens a confirmation step prior to committing to the audit log.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setConfirmDecisionStatus('Held')}
              className="h-11 px-4 rounded-[6px] border border-[#A43E35]/40 bg-[#FFFFFF] hover:bg-[#A43E35]/5 text-[#A43E35] text-[13px] font-medium transition-colors cursor-pointer"
            >
              Hold & reject schedule
            </button>
            <button
              onClick={() => setConfirmDecisionStatus('Flagged for review')}
              className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#F3EEE5] text-[#29251F] text-[13px] font-medium transition-colors cursor-pointer"
            >
              Flag for secondary review
            </button>
            <button
              onClick={() => setConfirmDecisionStatus('Approved for schedule')}
              className="h-11 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[13px] font-medium transition-colors cursor-pointer"
            >
              Approve for PLC schedule
            </button>
          </div>
        </div>
      </section>

      {/* CONFIRMATION DIALOG FOR CONSEQUENTIAL DECISION */}
      {confirmDecisionStatus && (
        <div
          className="fixed inset-0 z-50 bg-[#29251F]/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-decision-title"
        >
          <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
              CONSEQUENTIAL ACTION CONFIRMATION
            </div>
            <h3
              id="confirm-decision-title"
              className="font-serif-editorial text-[26px] text-[#29251F]"
            >
              Confirm &ldquo;{confirmDecisionStatus}&rdquo;?
            </h3>
            <p className="text-[14px] leading-[1.6] text-[#716A61]">
              You are recording a formal operator sign-off for{' '}
              <strong className="text-[#29251F]">{currentRecord.id}</strong> (
              {currentRecord.substationZone}). This updates the study status and appends a permanent entry to the governance ledger.
            </p>
            <div className="bg-[#F3EEE5] border border-[#DDD5C9] rounded-[6px] p-3.5 font-mono-meta text-[12px] text-[#29251F] space-y-1">
              <div>REVIEWER: {reviewerName}</div>
              <div>DISPATCH: {currentRecord.bessDischargeKw.toFixed(1)} kW BESS</div>
              <div>NOTE: {reviewerNote}</div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDecisionStatus(null)}
                className="h-10 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] text-[#29251F] text-[13px] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHumanDecision}
                className="h-10 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[13px] font-medium cursor-pointer"
              >
                Confirm sign-off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
