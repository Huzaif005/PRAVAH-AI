import React, { useState, useEffect } from 'react';
import {
  ScreenId,
  WorkspaceStage,
  ValidationIssue,
  WorkspaceAnalysisResponse,
  DecisionType,
  DecisionAuditEntry,
} from '../types';
import {
  analyzeWorkspace,
  buildDeterministicAnalysis,
} from '../services/workspaceAnalyzer';

interface WorkspacePipelinePanelProps {
  screenId: ScreenId;
  workspaceName: string;
  primaryActionLabel: string;
  inputSummary: string;
  parameters: Record<string, string | number | boolean>;
  validationIssues: ValidationIssue[];
  onResetInputs?: () => void;
  auditLog: DecisionAuditEntry[];
  onRecordDecision: (entry: DecisionAuditEntry) => void;
}

const EXECUTION_STEPS = [
  'Step 1/3 · Verifying physical feeder, thermal, and BESS SoC constraints...',
  'Step 2/3 · Querying 15-minute SCADA telemetry & TOU tariff multipliers...',
  'Step 3/3 · Running Gemini 3.8 Flash optimization & compiling evidence citations...',
];

const SCHEDULE_WINDOWS = [
  '17:00 – 21:00 Peak Tariff Window',
  '18:30 – 20:30 Critical Feeder Shave',
  '12:00 – 15:30 Solar Surplus Recharge',
  '23:00 – 05:00 Off-Peak Baseload Window',
];

export const WorkspacePipelinePanel: React.FC<WorkspacePipelinePanelProps> = ({
  screenId,
  workspaceName,
  primaryActionLabel,
  inputSummary,
  parameters,
  validationIssues,
  onResetInputs,
  auditLog,
  onRecordDecision,
}) => {
  const [stage, setStage] = useState<WorkspaceStage>('results');
  const [simulateFault, setSimulateFault] = useState<boolean>(false);
  const [execStepIndex, setExecStepIndex] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WorkspaceAnalysisResponse>(() =>
    buildDeterministicAnalysis(
      {
        screenId,
        workspaceName,
        inputSummary,
        parameters,
      },
      'deterministic-solver'
    )
  );

  const [selectedWindow, setSelectedWindow] = useState<string>(SCHEDULE_WINDOWS[0]);
  const [operatorNote, setOperatorNote] = useState<string>('');
  const [lastDecision, setLastDecision] = useState<DecisionAuditEntry | null>(null);

  const blockingErrors = validationIssues.filter((v) => v.severity === 'error');
  const warnings = validationIssues.filter((v) => v.severity === 'warning');
  const hasBlockingErrors = blockingErrors.length > 0;

  // Keep baseline deterministic preview updated when inputs change while in results/input stage
  useEffect(() => {
    if (stage === 'results' && analysis.engineSource === 'deterministic-solver') {
      setAnalysis(
        buildDeterministicAnalysis(
          {
            screenId,
            workspaceName,
            inputSummary,
            parameters,
          },
          'deterministic-solver'
        )
      );
    }
  }, [inputSummary, screenId, workspaceName]);

  const runExecution = async (forceDeterministic = false) => {
    if (hasBlockingErrors) {
      setStage('validating');
      return;
    }

    setErrorMessage(null);
    setStage('executing');
    setExecStepIndex(0);
    setElapsedMs(120);

    const stepTimer1 = setTimeout(() => setExecStepIndex(1), 240);
    const stepTimer2 = setTimeout(() => setExecStepIndex(2), 480);
    const msInterval = setInterval(() => {
      setElapsedMs((prev) => prev + 95);
    }, 95);

    try {
      if (forceDeterministic) {
        await new Promise((r) => setTimeout(r, 420));
        const fallbackResult = buildDeterministicAnalysis(
          {
            screenId,
            workspaceName,
            inputSummary,
            parameters,
            simulateFault: false,
          },
          'deterministic-solver'
        );
        setAnalysis(fallbackResult);
        setSelectedWindow(fallbackResult.recommendedWindow || SCHEDULE_WINDOWS[0]);
        setStage('results');
      } else {
        const result = await analyzeWorkspace({
          screenId,
          workspaceName,
          inputSummary,
          parameters,
          simulateFault,
        });
        setAnalysis(result);
        setSelectedWindow(result.recommendedWindow || SCHEDULE_WINDOWS[0]);
        setStage('results');
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Execution interrupted. All operator inputs remain intact.';
      setErrorMessage(msg);
      setStage('error');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearInterval(msInterval);
    }
  };

  const handleDecision = (decision: DecisionType) => {
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const entry: DecisionAuditEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      workspace: workspaceName,
      screenId,
      decision,
      scheduleWindow:
        decision === 'SCHEDULED'
          ? selectedWindow
          : decision === 'APPROVED'
          ? 'Immediate PLC Dispatch'
          : 'Held / Rejected',
      operatorNote:
        operatorNote.trim() ||
        (decision === 'APPROVED'
          ? 'Verified against telemetry evidence and approved for execution.'
          : decision === 'SCHEDULED'
          ? `Queued for ${selectedWindow}.`
          : 'Recommendation held pending manual feeder inspection.'),
      inputSnapshot: inputSummary,
      impactSummary: analysis.metrics
        .slice(0, 2)
        .map((m) => `${m.label}: ${m.projected} (${m.delta})`)
        .join(' · '),
      recommendedAction: analysis.recommendedAction,
      engineSource: analysis.engineSource,
      timestamp: now,
    };

    setLastDecision(entry);
    onRecordDecision(entry);
    setOperatorNote('');
    setStage('decided');
  };

  const activeStageNumber =
    hasBlockingErrors || stage === 'validating'
      ? 2
      : stage === 'empty'
      ? 1
      : stage === 'executing' || stage === 'error'
      ? 3
      : stage === 'results'
      ? 4
      : stage === 'decided'
      ? 6
      : 1;

  const stagesList = [
    { num: 1, code: '01', label: 'Input', sub: 'Parameters' },
    {
      num: 2,
      code: '02',
      label: 'Validation',
      sub: hasBlockingErrors
        ? `${blockingErrors.length} Error(s)`
        : warnings.length > 0
        ? `${warnings.length} Advisory`
        : 'Bounds Verified',
    },
    {
      num: 3,
      code: '03',
      label: 'Execution',
      sub:
        stage === 'executing'
          ? 'Running...'
          : stage === 'error'
          ? 'Fault / Retry'
          : 'Solver Ready',
    },
    { num: 4, code: '04', label: 'Results', sub: 'KPI Deltas' },
    { num: 5, code: '05', label: 'Evidence', sub: 'Citations' },
    {
      num: 6,
      code: '06',
      label: 'Decision',
      sub: stage === 'decided' && lastDecision ? lastDecision.decision : 'Awaiting Action',
    },
  ];

  return (
    <section
      aria-label={`${workspaceName} 6-Stage Operational Workflow`}
      className="bg-surface-container-low border border-outline-variant/25 rounded-lg overflow-hidden"
    >
      {/* TOP BAR: EXPLICIT 6-STAGE PIPELINE HEADER & PRIMARY EXECUTION CONTROLS */}
      <div className="p-4 sm:p-5 border-b border-outline-variant/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-container-lowest/60">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">
              AI WORKSPACE &amp; DECISION ENGINE
            </span>
            <span className="text-outline-variant">·</span>
            <span className="font-mono text-[11px] text-on-surface-variant">
              Engine: {analysis.engineSource === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash + Physics Solver' : 'Deterministic Physics Solver'}
            </span>
          </div>
          <p className="font-mono text-xs text-on-surface mt-1">
            Active Input Snapshot: <span className="text-primary">{inputSummary}</span>
          </p>
        </div>

        {/* Execution Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => runExecution(false)}
            disabled={stage === 'executing' || hasBlockingErrors}
            className={`px-4 py-1.5 rounded-DEFAULT font-body-sm text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              hasBlockingErrors
                ? 'bg-surface-container-highest text-outline cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary-fixed cursor-pointer'
            }`}
          >
            <span
              className={`material-symbols-outlined text-sm leading-none ${
                stage === 'executing' ? 'animate-spin' : ''
              }`}
            >
              {stage === 'executing' ? 'sync' : 'bolt'}
            </span>
            <span>
              {stage === 'executing' ? 'Executing Solver...' : primaryActionLabel}
            </span>
          </button>
        </div>
      </div>

      {/* 6-STAGE PROGRESS STEPPER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-outline-variant/20 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/15 bg-surface-container-lowest/30">
        {stagesList.map((s) => {
          const isCurrent = activeStageNumber === s.num || (stage === 'results' && s.num === 5);
          const isCompleted = activeStageNumber > s.num;
          const isErrorStage =
            (s.num === 2 && hasBlockingErrors) || (s.num === 3 && stage === 'error');

          return (
            <div
              key={s.code}
              className={`px-3.5 py-2.5 flex items-baseline justify-between transition-colors ${
                isErrorStage
                  ? 'bg-error-container/15'
                  : isCurrent
                  ? 'bg-primary/10'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isErrorStage
                        ? 'text-error'
                        : isCurrent
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-secondary'
                        : 'text-outline'
                    }`}
                  >
                    {s.code}
                  </span>
                  <span className="font-headline-sm text-xs font-semibold text-on-surface">
                    {s.label}
                  </span>
                </div>
                <span
                  className={`font-mono text-[10px] block mt-0.5 ${
                    isErrorStage
                      ? 'text-error font-semibold'
                      : isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-secondary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {s.sub}
                </span>
              </div>
              <span className="font-mono text-[10px] text-outline">
                {isErrorStage ? '!' : isCompleted ? '✓' : isCurrent ? '●' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* STAGE 02: VALIDATION ISSUES BANNER (IF ANY ERRORS OR WARNINGS) */}
      {validationIssues.length > 0 && (
        <div
          role="alert"
          className={`p-4 border-b border-outline-variant/20 ${
            hasBlockingErrors ? 'bg-error-container/15' : 'bg-tertiary/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span
              className={`font-mono text-xs font-bold uppercase tracking-wider ${
                hasBlockingErrors ? 'text-error' : 'text-tertiary'
              }`}
            >
              {hasBlockingErrors
                ? `Stage 02 Validation Halted · ${blockingErrors.length} Physical Constraint Violation(s)`
                : `Stage 02 Validation Advisory · ${warnings.length} Operational Warning(s)`}
            </span>
            {onResetInputs && (
              <button
                type="button"
                onClick={onResetInputs}
                className="font-mono text-xs text-primary hover:underline cursor-pointer self-start sm:self-auto"
              >
                Restore Valid Baseline Parameters →
              </button>
            )}
          </div>
          <div className="divide-y divide-outline-variant/15">
            {validationIssues.map((issue, idx) => (
              <div
                key={`${issue.field}-${idx}`}
                className="py-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs"
              >
                <div>
                  <span
                    className={`font-mono font-semibold mr-2 ${
                      issue.severity === 'error' ? 'text-error' : 'text-tertiary'
                    }`}
                  >
                    [{issue.field}]
                  </span>
                  <span className="text-on-surface font-medium">{issue.message}</span>
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  Fix: {issue.remediation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 03: REALISTIC LOADING STATE */}
      {stage === 'executing' && (
        <div
          role="status"
          aria-live="polite"
          className="p-6 sm:p-8 flex flex-col items-start justify-between gap-4"
        >
          <div className="w-full flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
              STAGE 03 · EXECUTING AI &amp; PHYSICS SOLVER
            </span>
            <span className="font-mono text-xs tabular-nums text-on-surface-variant">
              Elapsed: {elapsedMs} ms
            </span>
          </div>

          <div className="w-full bg-surface-container-highest h-1.5 rounded-DEFAULT overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-200"
              style={{ width: `${((execStepIndex + 1) / EXECUTION_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="space-y-1.5 w-full">
            {EXECUTION_STEPS.map((stepText, idx) => (
              <div
                key={stepText}
                className={`font-mono text-xs flex items-center justify-between ${
                  idx === execStepIndex
                    ? 'text-on-surface font-semibold'
                    : idx < execStepIndex
                    ? 'text-secondary'
                    : 'text-outline'
                }`}
              >
                <span>{stepText}</span>
                <span>{idx < execStepIndex ? 'DONE' : idx === execStepIndex ? 'ACTIVE' : 'PENDING'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 03: ERROR & NON-DESTRUCTIVE RETRY STATE */}
      {stage === 'error' && (
        <div
          role="alert"
          className="p-6 bg-error-container/10 border-b border-outline-variant/20 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-error block">
                STAGE 03 EXECUTION FAULT · USER INPUTS PRESERVED
              </span>
              <p className="text-sm text-on-surface font-medium mt-1">
                {errorMessage}
              </p>
            </div>
            <span className="font-mono text-xs text-secondary shrink-0">
              Input State: 100% Intact
            </span>
          </div>

          <div className="p-3 rounded-DEFAULT bg-surface-container-lowest border border-outline-variant/20 font-mono text-xs text-on-surface-variant">
            Preserved Snapshot: <span className="text-on-surface">{inputSummary}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSimulateFault(false);
                setTimeout(() => runExecution(false), 50);
              }}
              className="px-4 py-2 rounded-DEFAULT bg-primary text-on-primary hover:bg-primary-fixed font-body-sm text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Fault &amp; Retry Execution
            </button>
            <button
              type="button"
              onClick={() => runExecution(true)}
              className="px-4 py-2 rounded-DEFAULT bg-surface-container-high hover:bg-surface-bright border border-outline-variant/30 text-on-surface font-body-sm text-xs font-semibold transition-colors cursor-pointer"
            >
              Run Deterministic Physics Fallback
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {stage === 'empty' && (
        <div className="p-8 text-center space-y-3">
          <div className="font-mono text-xs uppercase tracking-widest text-outline">
            WORKSPACE RESULTS CLEARED · STAGE 01 INPUT READY
          </div>
          <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
            Configure your target parameters above and run the solver to generate quantified KPI deltas, physical telemetry evidence, and dispatch recommendations.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => runExecution(false)}
              className="px-4 py-2 rounded-DEFAULT bg-primary text-on-primary hover:bg-primary-fixed font-body-sm text-xs font-bold transition-colors cursor-pointer"
            >
              {primaryActionLabel}
            </button>
            {onResetInputs && (
              <button
                type="button"
                onClick={() => {
                  onResetInputs();
                  runExecution(true);
                }}
                className="px-4 py-2 rounded-DEFAULT bg-surface-container hover:bg-surface-container-high border border-outline-variant/25 font-body-sm text-xs text-on-surface transition-colors cursor-pointer"
              >
                Restore Baseline Preset
              </button>
            )}
          </div>
        </div>
      )}

      {/* STAGES 04, 05 & 06: RESULTS, EVIDENCE & USER DECISION */}
      {(stage === 'results' || stage === 'decided' || stage === 'validating') && (
        <div className="divide-y divide-outline-variant/20">
          {/* STAGE 04: QUANTIFIED RESULTS */}
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold">
                  04 · QUANTIFIED RESULTS SUMMARY
                </span>
                <p className="text-sm text-on-surface font-medium mt-1">
                  {analysis.summary}
                </p>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-outline shrink-0">
                Computed {analysis.timestamp}
              </span>
            </div>

            {/* 4-Column Metric Delta Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border border-outline-variant/20 rounded-DEFAULT divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20 bg-surface-container-lowest/40">
              {analysis.metrics.map((m) => (
                <div key={m.label} className="p-3.5 flex flex-col justify-between">
                  <span className="text-label-sm text-on-surface-variant">{m.label}</span>
                  <div className="mt-1.5 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold tabular-nums text-on-surface">
                      {m.projected}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        m.status === 'critical'
                          ? 'text-error'
                          : m.status === 'warning'
                          ? 'text-tertiary'
                          : 'text-secondary'
                      }`}
                    >
                      {m.delta}
                    </span>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-outline-variant/15 flex items-center justify-between font-mono text-[11px] text-outline">
                    <span>Baseline</span>
                    <span className="tabular-nums">{m.baseline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STAGE 05: VERIFIABLE TELEMETRY & TARIFF EVIDENCE */}
          <div className="p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-secondary font-semibold">
                05 · TELEMETRY &amp; TARIFF EVIDENCE LEDGER
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                {analysis.evidence.length} Verifiable Citations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-[11px] font-mono text-outline uppercase">
                    <th className="py-2 pr-4 w-56">Telemetry / Meter Source</th>
                    <th className="py-2 px-4 w-52">Evaluated Parameter</th>
                    <th className="py-2 px-4">Physical &amp; Tariff Evidence</th>
                    <th className="py-2 pl-4 text-right w-28">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-xs">
                  {analysis.evidence.map((ev, i) => (
                    <tr key={`${ev.source}-${i}`}>
                      <td className="py-2.5 pr-4 font-medium text-on-surface align-top">
                        {ev.source}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-primary align-top">
                        {ev.parameter}
                      </td>
                      <td className="py-2.5 px-4 text-on-surface-variant align-top">
                        {ev.observation}
                      </td>
                      <td className="py-2.5 pl-4 text-right font-mono tabular-nums text-secondary font-semibold align-top">
                        {ev.confidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* STAGE 06: OPERATOR DECISION & AUDIT LOG COMMITMENT */}
          <div className="p-5 bg-surface-container-lowest/70 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold block">
                  06 · OPERATOR DECISION &amp; DISPATCH GOVERNANCE
                </span>
                <div className="text-sm font-semibold text-on-surface mt-0.5">
                  Recommended Action: <span className="text-secondary">{analysis.recommendedAction}</span>
                </div>
              </div>

              {/* Decision Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Target dispatch schedule window"
                  value={selectedWindow}
                  onChange={(e) => setSelectedWindow(e.target.value)}
                  className="bg-surface-container border border-outline-variant/25 rounded-DEFAULT px-2.5 py-1.5 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  {SCHEDULE_WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  aria-label="Operator decision note"
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  placeholder="Optional operator rationale..."
                  className="bg-surface-container border border-outline-variant/25 rounded-DEFAULT px-3 py-1.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary w-52"
                />

                <button
                  type="button"
                  disabled={hasBlockingErrors}
                  onClick={() => handleDecision('APPROVED')}
                  className="px-3.5 py-1.5 rounded-DEFAULT bg-secondary text-on-secondary hover:opacity-90 font-body-sm text-xs font-bold transition-opacity cursor-pointer disabled:opacity-40"
                >
                  Approve &amp; Dispatch
                </button>
                <button
                  type="button"
                  disabled={hasBlockingErrors}
                  onClick={() => handleDecision('SCHEDULED')}
                  className="px-3.5 py-1.5 rounded-DEFAULT bg-primary text-on-primary hover:bg-primary-fixed font-body-sm text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Schedule Window
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('REJECTED')}
                  className="px-3 py-1.5 rounded-DEFAULT bg-surface-container-high hover:bg-surface-bright border border-outline-variant/30 text-error font-body-sm text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>

            {/* Confirmation Banner when a decision has been committed */}
            {lastDecision && (
              <div
                role="status"
                aria-live="polite"
                className="p-3.5 rounded-DEFAULT bg-surface-container border border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="text-xs">
                  <span className="font-mono font-bold text-primary mr-2">
                    [{lastDecision.id}]
                  </span>
                  <span
                    className={`font-mono font-bold mr-2 ${
                      lastDecision.decision === 'APPROVED'
                        ? 'text-secondary'
                        : lastDecision.decision === 'SCHEDULED'
                        ? 'text-primary'
                        : 'text-error'
                    }`}
                  >
                    {lastDecision.decision}
                  </span>
                  <span className="text-on-surface font-medium">
                    {lastDecision.recommendedAction}
                  </span>
                  <span className="text-on-surface-variant ml-2">
                    ({lastDecision.scheduleWindow}) — {lastDecision.operatorNote}
                  </span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-outline shrink-0">
                  Logged {lastDecision.timestamp}
                </span>
              </div>
            )}

            {/* Shared Cross-Workspace Decision Audit Ledger (Most Recent 3 Entries) */}
            {auditLog.length > 0 && (
              <div className="pt-2 border-t border-outline-variant/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
                    RECENT OPERATOR DECISION AUDIT LOG ({auditLog.length} TOTAL)
                  </span>
                </div>
                <div className="divide-y divide-outline-variant/10 text-xs">
                  {auditLog.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      className="py-1.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1"
                    >
                      <div className="truncate">
                        <span className="font-mono text-[11px] text-outline mr-2">
                          {entry.timestamp}
                        </span>
                        <span
                          className={`font-mono text-[11px] font-bold mr-2 ${
                            entry.decision === 'APPROVED'
                              ? 'text-secondary'
                              : entry.decision === 'SCHEDULED'
                              ? 'text-primary'
                              : 'text-error'
                          }`}
                        >
                          {entry.decision}
                        </span>
                        <span className="font-medium text-on-surface mr-2">
                          [{entry.workspace}]
                        </span>
                        <span className="text-on-surface-variant">
                          {entry.recommendedAction} — {entry.impactSummary}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-outline shrink-0">
                        {entry.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
