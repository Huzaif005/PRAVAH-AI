import React, { useState, useEffect } from 'react';
import { ScreenId, AnalysisRecord, DecisionAuditEntry } from '../types';
import { createAnalysisFromWorkspace } from '../services/editorialAnalysisData';

interface EditorialWorkspaceScreenProps {
  initialRecord?: AnalysisRecord | null;
  onSaveAnalysis: (record: AnalysisRecord) => void;
  onRecordDecision: (entry: DecisionAuditEntry) => void;
  onNavigate: (screen: ScreenId, reportId?: string) => void;
}

type WorkflowPhase = 'input' | 'processing' | 'results' | 'decision_confirmed' | 'error';

export const EditorialWorkspaceScreen: React.FC<EditorialWorkspaceScreenProps> = ({
  initialRecord,
  onSaveAnalysis,
  onRecordDecision,
  onNavigate,
}) => {
  // Stage 1: User Input State (preserved across failures/retries)
  const [title, setTitle] = useState(
    initialRecord?.title || 'North Campus Feeder #04 Evening Peak Study'
  );
  const [substationZone, setSubstationZone] = useState(
    initialRecord?.substationZone || 'North Campus · Interconnect #04'
  );
  const [scenarioNotes, setScenarioNotes] = useState(
    initialRecord?.scenarioNotes ||
      'Evaluate 17:00–21:00 peak TOU tariff window with concurrent HVAC chiller staging and 18 kW EV fleet arrival.'
  );
  const [feederCapKw, setFeederCapKw] = useState<number>(
    initialRecord?.feederCapKw ?? 160
  );
  const [bessReserveFloorPct, setBessReserveFloorPct] = useState<number>(
    initialRecord?.bessReserveFloorPct ?? 20
  );
  const [tariffWindow, setTariffWindow] = useState(
    initialRecord?.tariffWindow || '17:00 – 21:00 Peak TOU ($0.42/kWh)'
  );
  const [ambientTempC, setAmbientTempC] = useState<number>(
    initialRecord?.ambientTempC ?? 33
  );
  const [includeEvFleet, setIncludeEvFleet] = useState<boolean>(
    initialRecord?.includeEvFleet ?? true
  );
  const [modelChoice, setModelChoice] = useState<
    'Gemini 3.8 Flash + Solver' | 'Deterministic Load Solver'
  >(initialRecord?.modelUsed || 'Gemini 3.8 Flash + Solver');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Execution & Fault Simulation State
  const [phase, setPhase] = useState<WorkflowPhase>('input');
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [simulateFault, setSimulateFault] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedRecord, setGeneratedRecord] = useState<AnalysisRecord | null>(null);

  // Decision & Confirmation Modal State
  const [decisionNote, setDecisionNote] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDecisionType, setPendingDecisionType] = useState<
    'Approved for schedule' | 'Flagged for review' | 'Held'
  >('Approved for schedule');

  useEffect(() => {
    if (initialRecord) {
      setTitle(initialRecord.title);
      setSubstationZone(initialRecord.substationZone);
      setScenarioNotes(initialRecord.scenarioNotes);
      setFeederCapKw(initialRecord.feederCapKw);
      setBessReserveFloorPct(initialRecord.bessReserveFloorPct);
      setTariffWindow(initialRecord.tariffWindow);
      setAmbientTempC(initialRecord.ambientTempC);
      setIncludeEvFleet(initialRecord.includeEvFleet);
      setModelChoice(initialRecord.modelUsed);
    }
  }, [initialRecord]);

  // Input Validation Rules
  const validationErrors: { field: string; message: string }[] = [];
  if (!title.trim()) {
    validationErrors.push({
      field: 'Analysis title',
      message: 'Provide a descriptive title for the audit log.',
    });
  }
  if (!scenarioNotes.trim() || scenarioNotes.trim().length < 15) {
    validationErrors.push({
      field: 'Scenario observations',
      message: 'Enter at least 15 characters describing the load or weather conditions to evaluate.',
    });
  }
  if (feederCapKw < 130 || feederCapKw > 220) {
    validationErrors.push({
      field: 'Soft feeder cap (kW)',
      message: `${feederCapKw} kW is outside valid substation operating bounds (130 kW – 220 kW).`,
    });
  }
  if (bessReserveFloorPct < 15 || bessReserveFloorPct > 55) {
    validationErrors.push({
      field: 'BESS reserve floor (%)',
      message: `${bessReserveFloorPct}% violates the mandatory 15%–55% emergency backup reserve envelope.`,
    });
  }
  if (ambientTempC < -10 || ambientTempC > 48) {
    validationErrors.push({
      field: 'Ambient temperature (°C)',
      message: `${ambientTempC}°C is outside calibrated chiller correlation bounds (-10°C to 48°C).`,
    });
  }

  const isInputValid = validationErrors.length === 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setScenarioNotes(
      (prev) =>
        `${prev}\n[Attached interval file: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)]`
    );
  };

  const handleRunAnalysis = async (forceDeterministic = false) => {
    if (!isInputValid) return;

    setErrorMessage(null);
    setPhase('processing');
    setProcessingStep(0);

    const t1 = setTimeout(() => setProcessingStep(1), 220);
    const t2 = setTimeout(() => setProcessingStep(2), 450);

    try {
      const record = await createAnalysisFromWorkspace({
        title,
        substationZone,
        scenarioNotes,
        feederCapKw,
        bessReserveFloorPct,
        tariffWindow,
        ambientTempC,
        includeEvFleet,
        modelChoice: forceDeterministic ? 'Deterministic Load Solver' : modelChoice,
        simulateFault: forceDeterministic ? false : simulateFault,
      });

      setGeneratedRecord(record);
      onSaveAnalysis(record);
      setPhase('results');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Telemetry analysis request failed. All inputs have been preserved.'
      );
      setPhase('error');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  };

  const handleConfirmDecision = () => {
    if (!generatedRecord) return;
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedRecord: AnalysisRecord = {
      ...generatedRecord,
      status:
        pendingDecisionType === 'Approved for schedule'
          ? 'Completed'
          : pendingDecisionType === 'Flagged for review'
          ? 'Review required'
          : 'Draft',
      humanDecision: {
        status: pendingDecisionType,
        reviewer: 'E. Vance, Lead Grid Engineer',
        note:
          decisionNote.trim() ||
          `Confirmed ${pendingDecisionType.toLowerCase()} after inspecting factor attribution and uncertainty band.`,
        decidedAt: `Oct 28, 2026 · ${timestamp}`,
      },
    };

    setGeneratedRecord(updatedRecord);
    onSaveAnalysis(updatedRecord);

    onRecordDecision({
      id: `DEC-${Math.floor(1000 + Math.random() * 9000)}`,
      workspace: 'AI Workspace',
      screenId: 'workspace',
      decision:
        pendingDecisionType === 'Approved for schedule'
          ? 'APPROVED'
          : pendingDecisionType === 'Flagged for review'
          ? 'SCHEDULED'
          : 'REJECTED',
      scheduleWindow: tariffWindow,
      operatorNote: updatedRecord.humanDecision?.note || '',
      inputSnapshot: `${substationZone} · Cap ${feederCapKw} kW · Floor ${bessReserveFloorPct}%`,
      impactSummary: `Peak: ${updatedRecord.unmitigatedPeakKw} → ${updatedRecord.mitigatedPeakKw} kW (${updatedRecord.uncertaintyRangeKw})`,
      recommendedAction: updatedRecord.title,
      engineSource:
        modelChoice === 'Gemini 3.8 Flash + Solver'
          ? 'gemini-3.8-flash'
          : 'deterministic-solver',
      timestamp,
    });

    setShowConfirmModal(false);
    setPhase('decision_confirmed');
  };

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DDD5C9]">
        <div>
          <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536] block mb-1">
            WORKSPACE · CORE ANALYSIS WORKFLOW
          </span>
          <h1 className="font-serif-editorial text-[32px] sm:text-[40px] leading-[1.12] text-[#29251F]">
            Feeder dispatch &amp; peak mitigation workspace
          </h1>
          <p className="text-[15px] text-[#716A61] mt-1 max-w-2xl">
            Configure feeder parameters, validate physical safety bounds, execute structured analysis, and record an auditable engineering decision.
          </p>
        </div>

        {/* Fault-injection test toggle */}
        <label
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-[6px] bg-[#FCFAF6] border border-[#DDD5C9] cursor-pointer select-none self-start md:self-auto"
          title="Simulate a network/SCADA failure to test non-destructive input preservation and retry"
        >
          <input
            type="checkbox"
            checked={simulateFault}
            onChange={(e) => setSimulateFault(e.target.checked)}
            className="accent-[#A43E35] cursor-pointer"
          />
          <span className="font-mono-meta text-[11px] text-[#716A61]">
            Simulate gateway timeout (test error &amp; retry)
          </span>
        </label>
      </div>

      {/* EXPLICIT 4-STAGE WORKFLOW STEPPER: INPUT → PROCESSING → RESULTS → DECISION */}
      <nav
        aria-label="Workspace workflow stages"
        className="grid grid-cols-2 sm:grid-cols-4 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[8px] divide-y sm:divide-y-0 sm:divide-x divide-[#DDD5C9]"
      >
        {[
          {
            step: '01',
            label: 'INPUT',
            sub: isInputValid ? 'Parameters valid' : `${validationErrors.length} issue(s)`,
            active: phase === 'input' || !isInputValid,
          },
          {
            step: '02',
            label: 'PROCESSING',
            sub:
              phase === 'processing'
                ? 'Running solver...'
                : phase === 'error'
                ? 'Failed (inputs kept)'
                : 'Ready',
            active: phase === 'processing' || phase === 'error',
          },
          {
            step: '03',
            label: 'RESULTS',
            sub: generatedRecord ? `${generatedRecord.id} ready` : 'Not yet run',
            active: phase === 'results',
          },
          {
            step: '04',
            label: 'DECISION',
            sub:
              phase === 'decision_confirmed' && generatedRecord?.humanDecision
                ? generatedRecord.humanDecision.status
                : 'Human review required',
            active: phase === 'decision_confirmed',
          },
        ].map((item) => (
          <div
            key={item.step}
            className={`px-4 py-3 flex items-baseline justify-between ${
              item.active ? 'bg-[#FFFFFF]' : ''
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-meta text-xs font-medium text-[#754536]">
                  {item.step}
                </span>
                <span className="font-mono-meta text-xs font-semibold text-[#29251F]">
                  {item.label}
                </span>
              </div>
              <span className="font-mono-meta text-[11px] text-[#716A61] block mt-0.5">
                {item.sub}
              </span>
            </div>
            {item.active && (
              <span className="font-mono-meta text-xs text-[#754536]">●</span>
            )}
          </div>
        ))}
      </nav>

      {/* MAIN WORKSPACE GRID: LEFT INPUT FORM (7 COLS) + RIGHT PROCESSING / RESULTS / DECISION (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* STAGE 01: INPUT & CONFIGURATION FORM */}
        <section
          aria-label="Stage 1 Input Parameters"
          className="lg:col-span-7 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C9]">
            <div>
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] block">
                STAGE 01 · INPUT CONFIGURATION
              </span>
              <h2 className="font-serif-editorial text-[22px] text-[#29251F] mt-0.5">
                Feeder &amp; storage parameters
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setTitle('North Campus Feeder #04 Evening Peak Study');
                setSubstationZone('North Campus · Interconnect #04');
                setScenarioNotes(
                  'Evaluate 17:00–21:00 peak TOU tariff window with concurrent HVAC chiller staging and 18 kW EV fleet arrival.'
                );
                setFeederCapKw(160);
                setBessReserveFloorPct(20);
                setAmbientTempC(33);
                setIncludeEvFleet(true);
              }}
              className="font-mono-meta text-[11px] text-[#716A61] hover:text-[#29251F] underline cursor-pointer"
            >
              Reset to baseline preset
            </button>
          </div>

          {/* Inline Validation Banner */}
          {!isInputValid && (
            <div
              role="alert"
              className="p-4 rounded-[8px] bg-[#FFFFFF] border border-[#A43E35] space-y-1.5"
            >
              <div className="font-mono-meta text-xs font-medium text-[#A43E35] uppercase">
                ✕ Validation required before running analysis
              </div>
              <ul className="list-disc list-inside text-xs text-[#29251F] space-y-1">
                {validationErrors.map((err) => (
                  <li key={err.field}>
                    <span className="font-semibold">{err.field}:</span> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-5">
            {/* Title & Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ws-title"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Analysis title
                </label>
                <input
                  id="ws-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
                />
              </div>

              <div>
                <label
                  htmlFor="ws-zone"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Substation feeder zone
                </label>
                <select
                  id="ws-zone"
                  value={substationZone}
                  onChange={(e) => setSubstationZone(e.target.value)}
                  className="w-full h-11 px-3 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
                >
                  <option>North Campus · Interconnect #04</option>
                  <option>Sector 4 · Manufacturing Bus B</option>
                  <option>Substation Yard · Bus Tie #01</option>
                  <option>Central Utility Plant · Chiller #01–#02</option>
                </select>
              </div>
            </div>

            {/* Scenario Notes & Telemetry File Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="ws-notes"
                  className="text-[13px] font-medium text-[#29251F]"
                >
                  Scenario observations &amp; load assumptions
                </label>
                <label className="font-mono-meta text-[11px] text-[#754536] hover:underline cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  + Attach CSV/JSON interval log
                </label>
              </div>
              <textarea
                id="ws-notes"
                rows={3}
                value={scenarioNotes}
                onChange={(e) => setScenarioNotes(e.target.value)}
                placeholder="Describe feeder load conditions, planned equipment staging, or weather anomalies..."
                className="w-full p-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
              />
              {uploadedFileName && (
                <p className="font-mono-meta text-[11px] text-[#35674A] mt-1">
                  ✓ Attached telemetry file: {uploadedFileName}
                </p>
              )}
            </div>

            {/* Numeric Physical Constraints (3 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label
                  htmlFor="ws-cap"
                  className="block text-[13px] font-medium text-[#29251F] mb-1"
                >
                  Soft feeder cap (kW)
                </label>
                <span className="block font-mono-meta text-[11px] text-[#716A61] mb-1.5">
                  Valid range: 130–220 kW
                </span>
                <input
                  id="ws-cap"
                  type="number"
                  min={100}
                  max={250}
                  step={5}
                  value={feederCapKw}
                  onChange={(e) => setFeederCapKw(Number(e.target.value))}
                  className={`w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border font-mono-meta text-[14px] text-[#29251F] ${
                    feederCapKw < 130 || feederCapKw > 220
                      ? 'border-[#A43E35]'
                      : 'border-[#DDD5C9]'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="ws-floor"
                  className="block text-[13px] font-medium text-[#29251F] mb-1"
                >
                  BESS reserve floor (%)
                </label>
                <span className="block font-mono-meta text-[11px] text-[#716A61] mb-1.5">
                  Safety floor: 15%–55% SoC
                </span>
                <input
                  id="ws-floor"
                  type="number"
                  min={5}
                  max={80}
                  step={5}
                  value={bessReserveFloorPct}
                  onChange={(e) => setBessReserveFloorPct(Number(e.target.value))}
                  className={`w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border font-mono-meta text-[14px] text-[#29251F] ${
                    bessReserveFloorPct < 15 || bessReserveFloorPct > 55
                      ? 'border-[#A43E35]'
                      : 'border-[#DDD5C9]'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="ws-temp"
                  className="block text-[13px] font-medium text-[#29251F] mb-1"
                >
                  Ambient peak temp (°C)
                </label>
                <span className="block font-mono-meta text-[11px] text-[#716A61] mb-1.5">
                  Drives HVAC compressor load
                </span>
                <input
                  id="ws-temp"
                  type="number"
                  min={-15}
                  max={55}
                  step={1}
                  value={ambientTempC}
                  onChange={(e) => setAmbientTempC(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                />
              </div>
            </div>

            {/* Tariff Schedule & Meaningful Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label
                  htmlFor="ws-tariff"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Utility tariff window
                </label>
                <select
                  id="ws-tariff"
                  value={tariffWindow}
                  onChange={(e) => setTariffWindow(e.target.value)}
                  className="w-full h-11 px-3 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                >
                  <option>17:00 – 21:00 Peak TOU ($0.42/kWh)</option>
                  <option>12:00 – 18:00 Shoulder Tier ($0.28/kWh)</option>
                  <option>00:00 – 24:00 Critical Demand Response Event</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="ws-model"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Analysis solver mode
                </label>
                <select
                  id="ws-model"
                  value={modelChoice}
                  onChange={(e) =>
                    setModelChoice(
                      e.target.value as
                        | 'Gemini 3.8 Flash + Solver'
                        | 'Deterministic Load Solver'
                    )
                  }
                  className="w-full h-11 px-3 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                >
                  <option value="Gemini 3.8 Flash + Solver">
                    Gemini 3.8 Flash + Physics Solver (Explainable Narrative)
                  </option>
                  <option value="Deterministic Load Solver">
                    Deterministic Load Solver Only (Zero-LLM Mode)
                  </option>
                </select>
              </div>
            </div>

            {/* EV Fleet Coincidence Toggle */}
            <div className="pt-2 flex items-center justify-between p-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9]">
              <div>
                <span className="text-[14px] font-medium text-[#29251F] block">
                  Include 18:00 EV fleet charger arrival (+14.5 kW)
                </span>
                <span className="text-xs text-[#716A61]">
                  Models unthrottled Level 2 depot charging coincidence during evening ramp
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeEvFleet}
                onChange={(e) => setIncludeEvFleet(e.target.checked)}
                className="w-4 h-4 accent-[#754536] cursor-pointer"
              />
            </div>

            {/* Primary Run Analysis Button */}
            <div className="pt-4 border-t border-[#DDD5C9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="font-mono-meta text-[11px] text-[#716A61]">
                {isInputValid
                  ? '✓ All physical bounds verified for execution'
                  : '✕ Resolve validation errors above to enable execution'}
              </span>

              <button
                type="button"
                disabled={!isInputValid || phase === 'processing'}
                onClick={() => handleRunAnalysis(false)}
                className="h-12 px-7 rounded-[6px] bg-[#754536] hover:bg-[#61372B] disabled:bg-[#DDD5C9] disabled:text-[#716A61] text-[#FFFFFF] text-[15px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {phase === 'processing' ? 'Running analysis...' : 'Run analysis'}
              </button>
            </div>
          </div>
        </section>

        {/* STAGES 02, 03 & 04: PROCESSING, RESULTS PREVIEW & HUMAN DECISION */}
        <section
          aria-label="Analysis Output and Decision Panel"
          className="lg:col-span-5 space-y-6"
        >
          {/* INITIAL UNRUN STATE: NEVER IMPLY AN ANALYSIS HAS RUN WHEN IT HAS NOT */}
          {phase === 'input' && !generatedRecord && (
            <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-8 space-y-4">
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#716A61] block">
                STAGE 02–04 · AWAITING EXECUTION
              </span>
              <h3 className="font-serif-editorial text-[24px] text-[#29251F]">
                No analysis has been executed for the current draft parameters.
              </h3>
              <p className="text-[14px] text-[#716A61] leading-relaxed">
                Review the feeder cap, battery reserve floor, and tariff window on the left, then click <strong className="text-[#29251F] font-medium">Run analysis</strong> to compute the 24-hour mitigated load envelope and factor attribution.
              </p>
              <div className="pt-3 border-t border-[#DDD5C9] font-mono-meta text-[11px] text-[#716A61]">
                Current draft target: {substationZone} · {feederCapKw} kW cap
              </div>
            </div>
          )}

          {/* STAGE 02: PROCESSING SKELETON & STEP STATE */}
          {phase === 'processing' && (
            <div
              role="status"
              aria-live="polite"
              className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 space-y-6"
            >
              <div>
                <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] block">
                  STAGE 02 · PROCESSING ANALYSIS
                </span>
                <h3 className="font-serif-editorial text-[22px] text-[#29251F] mt-1">
                  Evaluating feeder constraints &amp; storage trajectory...
                </h3>
              </div>

              <div className="space-y-3 text-xs font-mono-meta">
                <div className="flex items-center justify-between py-2 border-b border-[#DDD5C9]">
                  <span className="text-[#29251F]">
                    01. Verifying {feederCapKw} kW cap &amp; {bessReserveFloorPct}% SoC floor
                  </span>
                  <span className="text-[#35674A]">Verified ✓</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#DDD5C9]">
                  <span className={processingStep >= 1 ? 'text-[#29251F]' : 'text-[#716A61]'}>
                    02. Computing 15-minute load &amp; solar PV balance
                  </span>
                  <span className="text-[#754536]">
                    {processingStep >= 1 ? 'Active...' : 'Queued'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className={processingStep >= 2 ? 'text-[#29251F]' : 'text-[#716A61]'}>
                    03. Synthesizing factor explanations &amp; limitations
                  </span>
                  <span className="text-[#716A61]">
                    {processingStep >= 2 ? 'Active...' : 'Queued'}
                  </span>
                </div>
              </div>

              {/* Restrained Loading Skeleton */}
              <div className="space-y-3 pt-2 animate-pulse">
                <div className="h-16 bg-[#DDD5C9]/50 rounded-[6px]" />
                <div className="h-28 bg-[#DDD5C9]/40 rounded-[6px]" />
              </div>
            </div>
          )}

          {/* ERROR & RETRY STATE (PRESERVES 100% OF USER INPUTS) */}
          {phase === 'error' && (
            <div
              role="alert"
              className="bg-[#FFFFFF] border border-[#A43E35] rounded-[10px] p-6 space-y-5"
            >
              <div>
                <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#A43E35] font-medium block">
                  ✕ STAGE 02 EXECUTION FAILED · INPUTS PRESERVED
                </span>
                <h3 className="font-serif-editorial text-[22px] text-[#29251F] mt-1">
                  Telemetry gateway request interrupted
                </h3>
                <p className="text-[14px] text-[#716A61] mt-2 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="p-3.5 rounded-[6px] bg-[#FCFAF6] border border-[#DDD5C9] font-mono-meta text-[11px] text-[#29251F]">
                Preserved input state: {title} · {feederCapKw} kW cap · {bessReserveFloorPct}% SoC floor
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSimulateFault(false);
                    setTimeout(() => handleRunAnalysis(false), 40);
                  }}
                  className="h-11 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-xs font-medium cursor-pointer"
                >
                  Clear fault &amp; retry analysis
                </button>
                <button
                  type="button"
                  onClick={() => handleRunAnalysis(true)}
                  className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#F3EEE5] text-[#29251F] text-xs font-medium cursor-pointer"
                >
                  Run deterministic solver fallback
                </button>
              </div>
            </div>
          )}

          {/* STAGE 03 & 04: RESULTS PREVIEW & HUMAN DECISION */}
          {(phase === 'results' || phase === 'decision_confirmed') && generatedRecord && (
            <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#DDD5C9]">
                <div>
                  <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#35674A] font-medium block">
                    STAGE 03 · ANALYSIS COMPLETE ({generatedRecord.id})
                  </span>
                  <h3 className="font-serif-editorial text-[22px] text-[#29251F] mt-0.5">
                    {generatedRecord.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('results', generatedRecord.id)}
                  className="font-mono-meta text-xs text-[#754536] hover:underline shrink-0 cursor-pointer"
                >
                  Open full report →
                </button>
              </div>

              {/* Key Output Metrics */}
              <div className="grid grid-cols-3 bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] divide-x divide-[#DDD5C9]">
                <div className="p-3.5">
                  <span className="font-mono-meta text-[10px] uppercase text-[#716A61] block">
                    Unmitigated
                  </span>
                  <span className="font-serif-editorial text-xl text-[#A43E35] tabular-nums mt-0.5 block">
                    {generatedRecord.unmitigatedPeakKw.toFixed(1)} kW
                  </span>
                </div>
                <div className="p-3.5">
                  <span className="font-mono-meta text-[10px] uppercase text-[#716A61] block">
                    Mitigated peak
                  </span>
                  <span className="font-serif-editorial text-xl text-[#35674A] tabular-nums mt-0.5 block">
                    {generatedRecord.mitigatedPeakKw.toFixed(1)} kW
                  </span>
                </div>
                <div className="p-3.5">
                  <span className="font-mono-meta text-[10px] uppercase text-[#716A61] block">
                    BESS Shave
                  </span>
                  <span className="font-serif-editorial text-xl text-[#29251F] tabular-nums mt-0.5 block">
                    -{generatedRecord.bessDischargeKw.toFixed(1)} kW
                  </span>
                </div>
              </div>

              {/* Summary Narrative */}
              <p className="text-[14px] text-[#29251F] leading-relaxed">
                {generatedRecord.executiveSummary}
              </p>

              <div className="p-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[11px] text-[#716A61]">
                Uncertainty range: <span className="text-[#29251F]">{generatedRecord.uncertaintyRangeKw}</span>
              </div>

              {/* STAGE 04: EXPLICIT HUMAN DECISION BAR */}
              <div className="pt-4 border-t border-[#DDD5C9] space-y-4">
                <div>
                  <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] font-medium block">
                    STAGE 04 · HUMAN DECISION &amp; GOVERNANCE
                  </span>
                  <p className="text-xs text-[#716A61] mt-0.5">
                    Consequential feeder schedules require explicit engineering sign-off before PLC commitment.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="ws-decision-note"
                    className="block text-xs font-medium text-[#29251F] mb-1"
                  >
                    Engineering review note
                  </label>
                  <input
                    id="ws-decision-note"
                    type="text"
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="Optional rationale or relay coordination note..."
                    className="w-full h-10 px-3 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-xs text-[#29251F]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDecisionType('Approved for schedule');
                      setShowConfirmModal(true);
                    }}
                    className="h-10 px-4 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-xs font-medium cursor-pointer"
                  >
                    Approve for schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDecisionType('Flagged for review');
                      setShowConfirmModal(true);
                    }}
                    className="h-10 px-3.5 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] hover:bg-[#F3EEE5] text-[#29251F] text-xs font-medium cursor-pointer"
                  >
                    Flag for review
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('results', generatedRecord.id)}
                    className="h-10 px-3.5 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#FFFFFF] text-[#754536] text-xs font-medium cursor-pointer ml-auto"
                  >
                    Full editorial report →
                  </button>
                </div>

                {generatedRecord.humanDecision && (
                  <div
                    role="status"
                    className="p-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#35674A] text-xs space-y-1"
                  >
                    <div className="font-mono-meta text-[11px] text-[#35674A] font-medium">
                      ✓ Decision recorded: {generatedRecord.humanDecision.status}
                    </div>
                    <div className="text-[#29251F]">{generatedRecord.humanDecision.note}</div>
                    <div className="font-mono-meta text-[10px] text-[#716A61]">
                      Signed by {generatedRecord.humanDecision.reviewer} · {generatedRecord.humanDecision.decidedAt}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* CONFIRMATION DIALOG FOR CONSEQUENTIAL DISPATCH DECISIONS */}
      {showConfirmModal && generatedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 bg-[#29251F]/60 flex items-center justify-center p-4"
        >
          <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] max-w-md w-full p-6 space-y-5 shadow-xl">
            <div>
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] block">
                CONFIRM CONSEQUENTIAL DECISION
              </span>
              <h3
                id="confirm-modal-title"
                className="font-serif-editorial text-[24px] text-[#29251F] mt-1"
              >
                {pendingDecisionType}
              </h3>
              <p className="text-sm text-[#716A61] mt-2">
                You are recording an official engineering decision for <strong className="text-[#29251F]">{generatedRecord.id}</strong> ({generatedRecord.substationZone}). This action logs a permanent entry in the operational audit trail.
              </p>
            </div>

            <div className="p-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-xs space-y-1 text-[#29251F]">
              <div>Target peak reduction: -{generatedRecord.bessDischargeKw.toFixed(1)} kW</div>
              <div>Mitigated feeder peak: {generatedRecord.mitigatedPeakKw.toFixed(1)} kW</div>
              <div>Reserve floor: {generatedRecord.bessReserveFloorPct}% SoC</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-10 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] text-xs font-medium text-[#29251F] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className="h-10 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-xs font-medium cursor-pointer"
              >
                Confirm &amp; log decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
