import React, { useState } from 'react';
import { ScreenId, ValidationIssue, DecisionAuditEntry } from '../types';
import { WorkspacePipelinePanel } from './WorkspacePipelinePanel';

interface SimulatorScreenProps {
  onNavigate: (screen: ScreenId) => void;
  auditLog: DecisionAuditEntry[];
  onRecordDecision: (entry: DecisionAuditEntry) => void;
}

const PRESETS = [
  'Normal Operations',
  'Evening Peak',
  'Low Solar Availability',
  'Sudden Demand Spike',
  'Limited Battery',
  'Grid Disruption',
] as const;

export const SimulatorScreen: React.FC<SimulatorScreenProps> = ({
  auditLog,
  onRecordDecision,
}) => {
  const [activePreset, setActivePreset] = useState<string>('Normal Operations');
  const [demandVal, setDemandVal] = useState<number>(15);
  const [solarVal, setSolarVal] = useState<number>(65);
  const [tempVal, setTempVal] = useState<number>(92);
  const [socVal, setSocVal] = useState<number>(82);
  const [gridOnline, setGridOnline] = useState<boolean>(true);
  const [tariffVal, setTariffVal] = useState<number>(1.8);
  const [contingency, setContingency] = useState<'none' | 'ev' | 'cloud' | 'trip'>('ev');

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    if (preset.includes('Evening Peak')) {
      setDemandVal(45);
      setSolarVal(15);
      setGridOnline(true);
    } else if (preset.includes('Low Solar')) {
      setSolarVal(18);
      setDemandVal(20);
      setGridOnline(true);
    } else if (preset.includes('Sudden Demand Spike')) {
      setDemandVal(65);
      setContingency('ev');
      setGridOnline(true);
    } else if (preset.includes('Grid Disruption')) {
      setGridOnline(false);
    } else if (preset.includes('Limited Battery')) {
      setSocVal(25);
      setGridOnline(true);
    } else {
      setDemandVal(15);
      setSolarVal(65);
      setSocVal(82);
      setGridOnline(true);
    }
  };

  const handleReset = () => {
    setActivePreset('Normal Operations');
    setDemandVal(15);
    setSolarVal(65);
    setTempVal(92);
    setSocVal(82);
    setGridOnline(true);
    setTariffVal(1.8);
    setContingency('ev');
  };

  // Stage 02 Real-time Physical Validation
  const validationIssues: ValidationIssue[] = [];
  if (!gridOnline && solarVal < 25 && socVal < 35) {
    validationIssues.push({
      field: 'Islanded Power Deficit',
      message: `Grid is Islanded while Solar (${solarVal}%) and BESS SoC (${socVal}%) are insufficient to sustain critical campus load.`,
      remediation: 'Reconnect Utility Grid, raise BESS Initial SoC above 35%, or increase Solar Irradiance.',
      severity: 'error',
    });
  }
  if (socVal < 15) {
    validationIssues.push({
      field: 'BESS Initial SoC',
      message: `Initial SoC (${socVal}%) is below the 15% emergency protection floor.`,
      remediation: 'Increase BESS Initial SoC to at least 15%.',
      severity: 'error',
    });
  }
  if (demandVal >= 60 && contingency === 'trip') {
    validationIssues.push({
      field: 'Feeder Trip + High Demand',
      message: `+${demandVal}% demand surge during Feeder Trip requires emergency non-critical load shedding.`,
      remediation: 'Reduce Demand Multiplier below +60% or switch Contingency from Feeder Trip.',
      severity: 'warning',
    });
  }

  const tempFactor = 1 + (tempVal - 85) * 0.004;
  const contingencyBoost =
    contingency === 'ev' ? 18.5 : contingency === 'cloud' ? 12.0 : contingency === 'trip' ? 24.0 : 0;
  const rawDemandNum = 126.6 * (1 + demandVal / 100) * tempFactor + contingencyBoost * 0.3;
  const demandKw = rawDemandNum.toFixed(1);
  const solarNum = (150 * (contingency === 'cloud' ? solarVal * 0.55 : solarVal)) / 100;
  const solarKw = solarNum.toFixed(1);
  const usableReserve = ((250 * socVal) / 100).toFixed(1);
  const tariffCost = (0.24 * tariffVal).toFixed(2);

  const bessDischargeNum = Math.min(
    60,
    Math.max(12, (socVal / 100) * 48 + (rawDemandNum - 120) * 0.25)
  );
  const bessDischargeKw = bessDischargeNum.toFixed(1);
  const gridImportNum = gridOnline
    ? Math.max(0, rawDemandNum - solarNum * 0.65 - bessDischargeNum)
    : 0;
  const gridImportKw = gridImportNum.toFixed(1);

  const totalSupply = Math.max(1, solarNum * 0.65 + bessDischargeNum + gridImportNum);
  const solarMixPct = Math.round(((solarNum * 0.65) / totalSupply) * 100);
  const bessMixPct = Math.round((bessDischargeNum / totalSupply) * 100);
  const gridMixPct = Math.max(0, 100 - solarMixPct - bessMixPct);

  const simulatedPeakKw = Math.max(
    110,
    rawDemandNum + 26.4 - bessDischargeNum * 0.65
  ).toFixed(1);
  const peakReductionKw = (bessDischargeNum * 0.7).toFixed(1);
  const gridImport24h = Math.round(gridImportNum * 24 + 480).toLocaleString();
  const renewableSharePct = Math.min(
    98,
    Math.max(15, solarMixPct + bessMixPct * 0.5)
  ).toFixed(1);
  const projectedSavings = (bessDischargeNum * 4.8 * tariffVal + solarNum * 1.4).toFixed(2);
  const co2Saved = Math.round(solarNum * 4.2 + bessDischargeNum * 2.1);

  return (
    <div className="flex-1 overflow-y-auto p-margin sm:p-margin-md space-y-6">
      {/* TOP BAR: SIMULATION HEADER & SCENARIO PRESETS */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary block mb-1">
            01 · DIGITAL TWIN SCENARIO &amp; STRESS PARAMETERS
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">
            Microgrid Simulator Workspace
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Select a stress preset or tune physical parameters below, validate bus constraints, and execute the solver
          </p>
        </div>

        {/* Scenario Segmented Bar & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center bg-surface-container-low p-0.5 rounded-DEFAULT border border-outline-variant/25 overflow-x-auto max-w-full"
            role="group"
            aria-label="Simulation Scenario Presets"
          >
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  aria-pressed={isActive}
                  className={`px-2.5 py-1 rounded-DEFAULT font-body-sm text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  {preset}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container border border-outline-variant/25 text-on-surface transition-colors font-body-sm text-body-sm font-medium cursor-pointer whitespace-nowrap"
            type="button"
            title="Restore all simulator sliders to Normal Operations baseline"
          >
            Reset Inputs
          </button>
        </div>
      </div>

      {/* MAIN 3-COLUMN WORKSPACE GRID (STAGE 01 INPUTS & TELEMETRY CANVAS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
        {/* LEFT PANEL: INTERACTIVE PARAMETER CONTROLS */}
        <div className="xl:col-span-3 bg-surface-container-low border border-outline-variant/25 rounded-lg p-5 divide-y divide-outline-variant/15">
          <div className="pb-3 flex items-baseline justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              01 · Input Parameters
            </h2>
            <span className="font-mono text-label-sm text-outline">15-Min Step</span>
          </div>

          {/* Control 1: Demand Level Multiplier */}
          <div className="py-3.5 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label
                htmlFor="sim-demand"
                className="font-body-sm text-body-sm text-on-surface font-medium"
              >
                Demand Multiplier
              </label>
              <span className="font-mono text-body-sm text-primary">
                {demandVal >= 0 ? `+${demandVal}` : demandVal}%
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Scales campus facility load relative to 126.6 kW baseline
            </p>
            <input
              id="sim-demand"
              aria-label="Demand Level Multiplier"
              className="w-full cursor-pointer"
              max={80}
              min={-30}
              type="range"
              value={demandVal}
              onChange={(e) => setDemandVal(parseInt(e.target.value, 10))}
            />
          </div>

          {/* Control 2: Solar Availability */}
          <div className="py-3.5 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label
                htmlFor="sim-solar"
                className="font-body-sm text-body-sm text-on-surface font-medium"
              >
                Solar Irradiance
              </label>
              <span className="font-mono text-body-sm text-secondary">
                {solarVal}%
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Controls PV-01..03 array generation capacity (max 150 kWp)
            </p>
            <input
              id="sim-solar"
              aria-label="Solar Irradiance Percentage"
              className="w-full cursor-pointer"
              max={100}
              min={0}
              type="range"
              value={solarVal}
              onChange={(e) => setSolarVal(parseInt(e.target.value, 10))}
            />
          </div>

          {/* Control 3: Weather / HVAC Load Stress */}
          <div className="py-3.5 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label
                htmlFor="sim-temp"
                className="font-body-sm text-body-sm text-on-surface font-medium"
              >
                Ambient Temperature
              </label>
              <span className="font-mono text-body-sm text-tertiary">
                {tempVal}°F
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Modulates HVAC chiller staging thermal demand
            </p>
            <input
              id="sim-temp"
              aria-label="Ambient Temperature Fahrenheit"
              className="w-full cursor-pointer"
              max={112}
              min={65}
              type="range"
              value={tempVal}
              onChange={(e) => setTempVal(parseInt(e.target.value, 10))}
            />
          </div>

          {/* Control 4: Initial Battery Reserve */}
          <div className="py-3.5 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label
                htmlFor="sim-soc"
                className="font-body-sm text-body-sm text-on-surface font-medium"
              >
                BESS Initial SoC
              </label>
              <span className="font-mono text-body-sm text-on-surface">
                {socVal}% ({usableReserve} kWh)
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Available LFP energy before peak window (min 15% safety floor)
            </p>
            <input
              id="sim-soc"
              aria-label="BESS Initial State of Charge"
              className="w-full cursor-pointer"
              max={100}
              min={10}
              type="range"
              value={socVal}
              onChange={(e) => setSocVal(parseInt(e.target.value, 10))}
            />
          </div>

          {/* Control 5: Grid Tariff & Outage State */}
          <div className="py-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-body-sm text-body-sm text-on-surface font-medium block">
                  Utility Grid Connection
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Toggle islanded microgrid operation
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={gridOnline}
                onClick={() => setGridOnline(!gridOnline)}
                className="font-mono text-label-sm cursor-pointer px-2.5 py-1 rounded-DEFAULT border border-outline-variant/30 bg-surface-container"
              >
                <span className={gridOnline ? 'text-secondary' : 'text-error'}>
                  {gridOnline ? 'Online' : 'Islanded'}
                </span>
              </button>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label htmlFor="sim-tariff" className="text-label-sm text-on-surface-variant">
                  TOU Tariff Multiplier
                </label>
                <span className="font-mono text-label-sm text-primary">
                  ${tariffCost}/kWh ({tariffVal}x)
                </span>
              </div>
              <input
                id="sim-tariff"
                aria-label="Tariff Tier Multiplier"
                className="w-full cursor-pointer"
                max={3.5}
                min={1.0}
                step={0.2}
                type="range"
                value={tariffVal}
                onChange={(e) => setTariffVal(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Control 6: Contingency Injection */}
          <div className="pt-3.5 space-y-2">
            <span className="text-label-sm text-on-surface-variant block">
              Contingency Event Injection
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'none', label: 'None' },
                  { id: 'ev', label: 'EV Surge' },
                  { id: 'cloud', label: 'Cloud Drop' },
                  { id: 'trip', label: 'Feeder Trip' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setContingency(item.id)}
                  aria-pressed={contingency === item.id}
                  className={`px-2.5 py-1.5 rounded-DEFAULT font-body-sm text-xs text-left transition-colors cursor-pointer ${
                    contingency === item.id
                      ? 'bg-surface-container-high text-primary font-semibold border border-primary/40'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-transparent'
                  }`}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: DIGITAL TWIN TELEMETRY & COMPARATIVE ENVELOPE */}
        <div className="xl:col-span-6 flex flex-col gap-gutter">
          {/* TOP CENTER: CLEAN 4-NODE DIGITAL TWIN BALANCE */}
          <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/25 space-y-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Digital Twin Node Balance
              </h2>
              <span className="font-mono text-label-sm text-secondary">
                98.6% Bus Efficiency
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-outline-variant/20 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
              <div className="py-3 sm:px-3 first:pl-0">
                <span className="text-label-sm text-on-surface-variant block">
                  Solar PV
                </span>
                <span className="font-mono text-lg font-semibold text-secondary mt-0.5 block">
                  {solarKw} kWp
                </span>
              </div>

              <div className="py-3 sm:px-3">
                <span className="text-label-sm text-on-surface-variant block">
                  Grid Import
                </span>
                <span className="font-mono text-lg font-semibold text-on-surface mt-0.5 block">
                  {gridImportKw} kW
                </span>
              </div>

              <div className="py-3 sm:px-3">
                <span className="text-label-sm text-on-surface-variant block">
                  BESS Discharge
                </span>
                <span className="font-mono text-lg font-semibold text-tertiary mt-0.5 block">
                  {bessDischargeKw} kW
                </span>
              </div>

              <div className="py-3 sm:px-3 last:pr-0">
                <span className="text-label-sm text-on-surface-variant block">
                  Facility Load
                </span>
                <span className="font-mono text-lg font-semibold text-primary mt-0.5 block">
                  {demandKw} kW
                </span>
              </div>
            </div>

            {/* Energy Source Proportion Bar */}
            <div className="space-y-2">
              <div className="flex flex-wrap justify-between items-center gap-2 font-mono text-label-sm">
                <span className="text-on-surface-variant">Dispatch Mix</span>
                <div className="flex items-center gap-4">
                  <span className="text-secondary">{solarMixPct}% Solar</span>
                  <span className="text-tertiary">{bessMixPct}% Battery</span>
                  <span className="text-primary">{gridMixPct}% Grid</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-DEFAULT bg-surface-container-highest overflow-hidden flex">
                <div className="h-full bg-secondary" style={{ width: `${solarMixPct}%` }}></div>
                <div className="h-full bg-tertiary" style={{ width: `${bessMixPct}%` }}></div>
                <div className="h-full bg-primary" style={{ width: `${gridMixPct}%` }}></div>
              </div>
            </div>
          </div>

          {/* BOTTOM CENTER: BASELINE VS. SCENARIO FORECAST VISUAL CHART */}
          <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/25 flex flex-col flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                24-Hour Comparative Demand Envelope
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-label-sm">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-3 h-0.5 bg-outline"></span>
                  <span>Baseline</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary font-medium">
                  <span className="w-3 h-0.5 bg-primary"></span>
                  <span>Simulated Scenario</span>
                </div>
                <div className="flex items-center gap-1.5 text-secondary">
                  <span className="w-3 h-0.5 bg-secondary"></span>
                  <span>PV Profile</span>
                </div>
              </div>
            </div>

            <div className="relative w-full h-72 flex flex-col justify-between pt-2">
              <svg
                className="w-full h-full relative z-10"
                preserveAspectRatio="none"
                viewBox="0 0 600 220"
              >
                <defs>
                  <linearGradient id="solarGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4edea3" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="30" x2="600" y2="30" stroke="#262a35" strokeDasharray="3 3" />
                <line x1="0" y1="85" x2="600" y2="85" stroke="#262a35" strokeDasharray="3 3" />
                <line x1="0" y1="145" x2="600" y2="145" stroke="#262a35" strokeDasharray="3 3" />
                <line x1="0" y1="205" x2="600" y2="205" stroke="#262a35" />

                <path
                  d="M 0,205 Q 150,205 200,155 T 300,50 T 400,155 Q 450,205 600,205 Z"
                  fill="url(#solarGradient)"
                />
                <path
                  d="M 0,205 Q 150,205 200,155 T 300,50 T 400,155 Q 450,205 600,205"
                  fill="none"
                  stroke="#4edea3"
                  strokeLinecap="round"
                  strokeWidth="1.75"
                />
                <path
                  d="M 0,160 C 80,165 140,150 200,140 C 260,130 320,135 380,120 C 440,105 480,45 520,70 C 560,95 580,140 600,155"
                  fill="none"
                  stroke="#869397"
                  strokeDasharray="4,4"
                  strokeWidth="1.5"
                />
                <path
                  d="M 0,150 C 80,155 140,135 200,125 C 260,115 320,118 380,105 C 440,85 470,68 490,92 C 510,95 540,120 600,145"
                  fill="none"
                  stroke="#4cd7f6"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <circle
                  cx="470"
                  cy="80"
                  fill="#4cd7f6"
                  r="4"
                  stroke="#0f131d"
                  strokeWidth="1.5"
                />
                <text
                  x="470"
                  y="68"
                  textAnchor="middle"
                  fill="#4cd7f6"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  19:30 Mitigated (-{peakReductionKw} kW)
                </text>
              </svg>

              <div className="flex justify-between pt-2 font-mono text-label-sm text-on-surface-variant border-t border-outline-variant/20">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span className="text-primary font-semibold">19:30</span>
                <span>21:00</span>
                <span>23:59</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: UNIFIED IMPACT LEDGER & DISPATCH SEQUENCE */}
        <div className="xl:col-span-3 flex flex-col gap-gutter">
          {/* Unified Impact Ledger */}
          <div className="bg-surface-container-low border border-outline-variant/25 rounded-lg p-5 divide-y divide-outline-variant/15">
            <div className="pb-3">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Real-Time Physics Preview
              </h2>
            </div>

            <div className="py-3.5 flex items-baseline justify-between">
              <div>
                <div className="text-label-sm text-on-surface-variant">Simulated Peak</div>
                <div className="font-mono-metric text-2xl text-on-surface font-semibold mt-0.5">
                  {simulatedPeakKw} kW
                </div>
              </div>
              <span className="font-mono text-label-sm text-secondary">
                -{peakReductionKw} kW
              </span>
            </div>

            <div className="py-3.5 flex items-baseline justify-between">
              <div>
                <div className="text-label-sm text-on-surface-variant">24h Grid Import</div>
                <div className="font-mono-metric text-2xl text-on-surface font-semibold mt-0.5">
                  {gridImport24h} kWh
                </div>
              </div>
              <span className="font-mono text-label-sm text-outline">Feeder #04</span>
            </div>

            <div className="py-3.5 flex items-baseline justify-between">
              <div>
                <div className="text-label-sm text-on-surface-variant">Renewable Share</div>
                <div className="font-mono-metric text-2xl text-secondary font-semibold mt-0.5">
                  {renewableSharePct}%
                </div>
              </div>
              <span className="font-mono text-label-sm text-secondary">PV + BESS</span>
            </div>

            <div className="pt-3.5 flex items-baseline justify-between">
              <div>
                <div className="text-label-sm text-on-surface-variant">Projected Savings</div>
                <div className="font-mono-metric text-2xl text-secondary font-semibold mt-0.5">
                  -${projectedSavings}
                </div>
              </div>
              <span className="font-mono text-label-sm text-tertiary">
                {co2Saved} kg CO₂e
              </span>
            </div>
          </div>

          {/* Dispatch Sequence */}
          <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/25 space-y-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Candidate Dispatch Sequence
            </h3>
            <div className="divide-y divide-outline-variant/15 text-body-sm text-on-surface-variant">
              <div className="py-2.5 flex items-baseline gap-2.5">
                <span className="font-mono text-label-sm text-primary">01.</span>
                <span className="text-on-surface">Throttle non-essential EV fleet chargers</span>
              </div>
              <div className="py-2.5 flex items-baseline gap-2.5">
                <span className="font-mono text-label-sm text-primary">02.</span>
                <span className="text-on-surface">
                  Discharge BESS at {bessDischargeKw} kW during peak window
                </span>
              </div>
              <div className="py-2.5 flex items-baseline gap-2.5">
                <span className="font-mono text-label-sm text-primary">03.</span>
                <span className="text-on-surface">Engage HVAC chilled-water pre-cooling</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit 6-Stage AI Workspace & Decision Pipeline */}
      <WorkspacePipelinePanel
        screenId="microgrid-simulator"
        workspaceName="Microgrid Stress Simulator"
        primaryActionLabel="Run Stress Simulation & AI Analysis"
        inputSummary={`Preset: ${activePreset} · Demand: ${demandVal >= 0 ? `+${demandVal}` : demandVal}% · Solar: ${solarVal}% · SoC: ${socVal}% · Grid: ${gridOnline ? 'Online' : 'Islanded'} · Contingency: ${contingency.toUpperCase()}`}
        parameters={{
          activePreset,
          demandVal,
          solarVal,
          tempVal,
          socVal,
          gridOnline,
          tariffVal,
          contingency,
        }}
        validationIssues={validationIssues}
        onResetInputs={handleReset}
        auditLog={auditLog}
        onRecordDecision={onRecordDecision}
      />
    </div>
  );
};
