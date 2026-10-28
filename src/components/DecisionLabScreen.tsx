import React, { useState } from 'react';
import { ScreenId, ValidationIssue, DecisionAuditEntry } from '../types';
import { WorkspacePipelinePanel } from './WorkspacePipelinePanel';

interface DecisionLabScreenProps {
  onNavigate: (screen: ScreenId) => void;
  auditLog: DecisionAuditEntry[];
  onRecordDecision: (entry: DecisionAuditEntry) => void;
}

const BESS_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBbxxSECxFL2jbEeSKhL1q8B12dHMfo0ZKeJT-jHPX2YLlkcxRKB-SQqSfRmkAaJck-kJimxvMYOwAOz3KE2XJc1hsrACR3J7UuxAmys9lIAj8FJ6iaRlld8MAy0O_9fysFNxTM2iygdKT6-6GFoSMVueG4mhjx5L0T1BRcM85pfWc642VV6YOv70rpCgjJagkjgk0lQSa8UOcki9-8Y6plvxo8bvoQKUaiQmsXAhPWdHv-1auxumJU';
const SUBSTATION_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCy_V5tLkjMBznfxG1F_r96jKndscr9VEEzxHoSMZqIEkG1aPto9escyNjOV2-CBCZzRBsJ0vJf8oihCo3ZuwC8BvLoG3OfPMIXdBlyGg__xCYDUbjZ8XLyQimJNlaGY42uSzQVjpQLrpXrdOVdAx3dAiHzJwFT3nCQCN42vEYjcQ8mzxEjV132kFCXIafIFXKaSYIcMUX4W9Nl601MCuZivjIoLB9zgkaa4lA3m8Iqi4zPNQmxkKo3';
const SOLAR_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCVaTSsZCkTtUUaxwk8FAYhKseny_1PSOLbOVQf0nBaX_oKN7Qs8QaZMQK8P6utVObLYNNeePW0fzWyHmyygpPPsx3BJHpu1rrjvIwypV3r5O9II8qoWiOuAEjJwDnObpLrX_-bjkw8LT_U0PYHrsEywbgcuTQ4s8zwZ_PjAr8JWGkoV3U6Ec47vjbAkg-4FeYMG3dfuPqXyxBSGmcftc09Loq875RyW00WXIQ37qKYOPVTHbkoFOgj';

export const DecisionLabScreen: React.FC<DecisionLabScreenProps> = ({
  onNavigate,
  auditLog,
  onRecordDecision,
}) => {
  const [horizon, setHorizon] = useState<'24H' | '7D' | '30D'>('24H');
  const [activeStrategy, setActiveStrategy] = useState<'A' | 'B'>('A');
  const [maxDailyCycles, setMaxDailyCycles] = useState<number>(1.0);

  // Stage 02 Validation Checks
  const validationIssues: ValidationIssue[] = [];
  const selectedCycleStress = activeStrategy === 'A' ? 0.68 : 1.18;

  if (maxDailyCycles < 0.4) {
    validationIssues.push({
      field: 'Max Daily BESS Cycles',
      message: `${maxDailyCycles.toFixed(2)} eq cycles/day is too restrictive to execute peak demand shaving.`,
      remediation: 'Set Max Daily BESS Cycles to at least 0.50 eq cycles/day.',
      severity: 'error',
    });
  } else if (selectedCycleStress > maxDailyCycles) {
    validationIssues.push({
      field: `Strategy ${activeStrategy} Cycle Limit`,
      message: `Strategy ${activeStrategy} requires ${selectedCycleStress} eq cycles/day, exceeding your ${maxDailyCycles.toFixed(2)} eq cycles/day warranty ceiling.`,
      remediation: 'Switch to Strategy A (0.68 eq cycles/day) or raise Max Daily BESS Cycles to 1.20.',
      severity: 'error',
    });
  }

  const handleResetInputs = () => {
    setHorizon('24H');
    setActiveStrategy('A');
    setMaxDailyCycles(1.0);
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin sm:p-margin-md space-y-6">
      {/* Page Header & Stage 01 Policy Selection Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary block mb-1">
            01 · CANDIDATE POLICY SELECTION &amp; CYCLE CONSTRAINTS
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">
            Decision Lab Workspace
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Compare candidate dispatch policies against rule-based operation, validate battery warranty limits, and commit a decision
          </p>
        </div>

        {/* Simulation Filter & Horizon Selector */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-DEFAULT border border-outline-variant/25">
            <label htmlFor="cycle-limit-input" className="text-label-sm text-on-surface-variant">
              Max BESS Cycles/Day:
            </label>
            <input
              id="cycle-limit-input"
              type="number"
              min={0.2}
              max={2.0}
              step={0.1}
              value={maxDailyCycles}
              onChange={(e) => setMaxDailyCycles(Number(e.target.value))}
              className="w-16 bg-surface-container-lowest border border-outline-variant/30 rounded-DEFAULT px-2 py-0.5 font-mono text-xs text-primary font-semibold focus:outline-none focus:border-primary"
            />
          </div>

          <div
            className="bg-surface-container-low p-0.5 rounded-DEFAULT border border-outline-variant/25 flex items-center"
            role="group"
            aria-label="Policy Evaluation Horizon"
          >
            {(['24H', '7D', '30D'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                aria-pressed={horizon === h}
                className={`px-3 py-1 rounded-DEFAULT font-mono text-label-sm transition-colors cursor-pointer whitespace-nowrap ${
                  horizon === h
                    ? 'bg-surface-container-high text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                {h}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container border border-outline-variant/25 text-on-surface transition-colors cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-base leading-none text-primary">
              description
            </span>
            <span className="font-body-sm text-body-sm font-medium">View Audit Report</span>
          </button>
        </div>
      </div>

      {/* Unified 3-Column Strategy Comparison Matrix */}
      <div className="bg-surface-container-low border border-outline-variant/25 rounded-lg grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/20">
        {/* Column 1: Baseline */}
        <div className="p-6 flex flex-col justify-between">
          <div>
            <div className="font-mono text-label-sm text-outline mb-1">
              01 · Reference Baseline
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
              Rule-Based Operation
            </h2>

            <div className="divide-y divide-outline-variant/15">
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Peak Grid Demand
                </span>
                <span className="font-mono text-body-md text-error font-semibold">
                  186.4 kW
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Grid Dependency
                </span>
                <span className="font-mono text-body-md text-on-surface">68.5%</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Solar Self-Consumption
                </span>
                <span className="font-mono text-body-md text-on-surface-variant">
                  64.0%
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  BESS Cycle Stress
                </span>
                <span className="font-mono text-body-md text-on-surface-variant">
                  1.45 eq cycles/day
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Daily Operating Cost
                </span>
                <span className="font-mono text-body-md text-on-surface">$1,482.50</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/15 flex items-center justify-between text-label-sm text-outline">
            <span>Legacy PLC Schedule</span>
            <span className="font-mono">+$342.20/day vs optimal</span>
          </div>
        </div>

        {/* Column 2: Strategy A (Recommended) */}
        <div
          className={`p-6 flex flex-col justify-between transition-colors ${
            activeStrategy === 'A' ? 'bg-surface-container/60' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-mono text-label-sm mb-1">
              <span className="text-primary">02 · Recommended Candidate</span>
              <span className="text-secondary">Balanced</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
              Strategy A: Balanced Dispatch
            </h2>

            <div className="divide-y divide-outline-variant/15">
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Peak Grid Demand
                </span>
                <span className="font-mono text-body-md text-secondary font-semibold">
                  148.2 kW
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Grid Dependency
                </span>
                <span className="font-mono text-body-md text-on-surface font-semibold">
                  49.2%
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Solar Self-Consumption
                </span>
                <span className="font-mono text-body-md text-secondary font-semibold">
                  94.8%
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  BESS Cycle Stress
                </span>
                <span className="font-mono text-body-md text-primary">
                  0.68 eq cycles/day
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Daily Operating Cost
                </span>
                <span className="font-mono text-body-md text-secondary font-semibold">
                  $1,140.30
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
            <span className="font-mono text-label-sm text-secondary">-$342.20/day</span>
            <button
              onClick={() => setActiveStrategy('A')}
              aria-pressed={activeStrategy === 'A'}
              className={`px-3.5 py-1.5 rounded-DEFAULT font-body-sm text-body-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeStrategy === 'A'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
              }`}
              type="button"
            >
              {activeStrategy === 'A' ? 'Selected for Evaluation ✓' : 'Select Strategy A'}
            </button>
          </div>
        </div>

        {/* Column 3: Strategy B */}
        <div
          className={`p-6 flex flex-col justify-between transition-colors ${
            activeStrategy === 'B' ? 'bg-surface-container/60' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-mono text-label-sm mb-1">
              <span className="text-tertiary">03 · Alternative Candidate</span>
              <span className="text-outline">Aggressive</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-5">
              Strategy B: Max Arbitrage
            </h2>

            <div className="divide-y divide-outline-variant/15">
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Peak Grid Demand
                </span>
                <span className="font-mono text-body-md text-on-surface font-semibold">
                  139.0 kW
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Grid Dependency
                </span>
                <span className="font-mono text-body-md text-on-surface">46.8%</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Solar Self-Consumption
                </span>
                <span className="font-mono text-body-md text-on-surface">91.2%</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  BESS Cycle Stress
                </span>
                <span className="font-mono text-body-md text-tertiary">
                  1.18 eq cycles/day
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Daily Operating Cost
                </span>
                <span className="font-mono text-body-md text-on-surface">
                  $1,106.10
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/15 flex items-center justify-between">
            <span className="font-mono text-label-sm text-tertiary">-$376.40/day</span>
            <button
              onClick={() => setActiveStrategy('B')}
              aria-pressed={activeStrategy === 'B'}
              className={`px-3.5 py-1.5 rounded-DEFAULT font-body-sm text-body-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeStrategy === 'B'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
              }`}
              type="button"
            >
              {activeStrategy === 'B' ? 'Selected for Evaluation ✓' : 'Select Strategy B'}
            </button>
          </div>
        </div>
      </div>

      {/* Explicit 6-Stage AI Workspace & Decision Pipeline */}
      <WorkspacePipelinePanel
        screenId="decision-lab"
        workspaceName="Decision Lab Policy Matrix"
        primaryActionLabel={`Evaluate Strategy ${activeStrategy} with AI`}
        inputSummary={`Candidate: Strategy ${activeStrategy} · Horizon: ${horizon} · Max Cycles/Day: ${maxDailyCycles.toFixed(2)}`}
        parameters={{
          activeStrategy,
          horizon,
          maxDailyCycles,
        }}
        validationIssues={validationIssues}
        onResetInputs={handleResetInputs}
        auditLog={auditLog}
        onRecordDecision={onRecordDecision}
      />

      {/* Middle Analytical Row: 24-Hr Comparative Load Trajectory + Multi-Axis Trade-Off Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <div className="xl:col-span-8 rounded-lg bg-surface-container-low border border-outline-variant/25 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              24-Hour Dispatch Comparison (kW)
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-outline"></span>
                <span className="text-on-surface-variant">Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-primary"></span>
                <span className="text-primary">Strategy A</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-tertiary"></span>
                <span className="text-tertiary">Strategy B</span>
              </div>
            </div>
          </div>

          <div className="relative w-full h-64 pt-2">
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 800 220"
            >
              <defs>
                <linearGradient id="strategyAGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="peakZoneGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffb4ab" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffb4ab" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              <line stroke="#262a35" strokeWidth="1" x1="0" x2="800" y1="30" y2="30" />
              <line stroke="#262a35" strokeWidth="1" x1="0" x2="800" y1="80" y2="80" />
              <line stroke="#262a35" strokeWidth="1" x1="0" x2="800" y1="130" y2="130" />
              <line stroke="#262a35" strokeWidth="1" x1="0" x2="800" y1="180" y2="180" />

              <line
                stroke="#ffb4ab"
                strokeDasharray="6 4"
                strokeOpacity="0.55"
                strokeWidth="1.2"
                x1="0"
                x2="800"
                y1="62"
                y2="62"
              />
              <text
                className="font-mono text-[10px]"
                fill="#ffb4ab"
                x="12"
                y="55"
              >
                160 kW Threshold
              </text>

              <rect fill="url(#peakZoneGrad)" height="200" rx="2" width="160" x="540" y="10" />
              <text
                className="font-mono text-[10px]"
                fill="#ffb4ab"
                x="552"
                y="26"
              >
                -38.2 kW Shaved
              </text>

              <path
                d="M 0 155 Q 80 165, 160 150 T 320 110 T 460 125 Q 540 110, 610 24 Q 670 28, 720 115 T 800 145"
                fill="none"
                stroke="#869397"
                strokeOpacity="0.7"
                strokeWidth="1.5"
              />

              <path
                d="M 0 160 Q 80 170, 160 145 T 320 135 T 460 155 Q 540 130, 610 88 Q 670 92, 730 58 T 800 130"
                fill="none"
                stroke="#d0bcff"
                strokeDasharray="5 4"
                strokeWidth="1.75"
              />

              <path
                d="M 0 155 Q 80 162, 160 148 T 320 128 T 460 142 Q 540 115, 610 74 Q 670 76, 720 108 T 800 140 L 800 220 L 0 220 Z"
                fill="url(#strategyAGrad)"
              />
              <path
                d="M 0 155 Q 80 162, 160 148 T 320 128 T 460 142 Q 540 115, 610 74 Q 670 76, 720 108 T 800 140"
                fill="none"
                stroke="#4cd7f6"
                strokeWidth="2.5"
              />

              <circle cx="610" cy="24" fill="#ffb4ab" r="4" />
              <circle
                cx="610"
                cy="74"
                fill="#4cd7f6"
                r="4.5"
                stroke="#0a0e18"
                strokeWidth="1.5"
              />
              <line
                stroke="#4edea3"
                strokeDasharray="2 2"
                strokeWidth="1.2"
                x1="610"
                x2="610"
                y1="29"
                y2="68"
              />
            </svg>

            <div className="flex justify-between items-center text-outline font-mono text-[11px] mt-2 pt-2 border-t border-outline-variant/20">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span className="text-primary font-semibold">19:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Objective Trade-off Matrix */}
        <div className="xl:col-span-4 rounded-lg bg-surface-container-low border border-outline-variant/25 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-5">
              Policy Objective Weights (Strategy {activeStrategy})
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between font-mono text-label-sm mb-1.5">
                  <span className="text-on-surface">Tariff Savings</span>
                  <span className="text-secondary">
                    {activeStrategy === 'A' ? '92%' : '96%'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-DEFAULT bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: activeStrategy === 'A' ? '92%' : '96%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-label-sm mb-1.5">
                  <span className="text-on-surface">Peak Feeder Protection</span>
                  <span className="text-primary">
                    {activeStrategy === 'A' ? '98%' : '94%'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-DEFAULT bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: activeStrategy === 'A' ? '98%' : '94%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-label-sm mb-1.5">
                  <span className="text-on-surface">BESS Cycle Longevity</span>
                  <span className="text-primary">
                    {activeStrategy === 'A' ? '94%' : '78%'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-DEFAULT bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: activeStrategy === 'A' ? '94%' : '78%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-label-sm mb-1.5">
                  <span className="text-on-surface">Carbon Abatement</span>
                  <span className="text-secondary">
                    {activeStrategy === 'A' ? '89%' : '86%'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-DEFAULT bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-secondary"
                    style={{ width: activeStrategy === 'A' ? '89%' : '86%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-outline-variant/20 text-label-sm text-on-surface-variant">
            Evaluated across {horizon} rolling weather &amp; tariff scenarios
          </div>
        </div>
      </div>

      {/* Unified Hardware Asset Strip */}
      <div className="rounded-lg bg-surface-container-low border border-outline-variant/25 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/20">
          <div className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-DEFAULT bg-surface-container-lowest shrink-0 overflow-hidden border border-outline-variant/20">
              <img
                alt="BESS Unit"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                src={BESS_IMG}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                BESS Unit #02 (1.2 MWh)
              </span>
              <span className="font-mono text-label-sm text-secondary">
                LFP Rack · Optimal Thermal State
              </span>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-DEFAULT bg-surface-container-lowest shrink-0 overflow-hidden border border-outline-variant/20">
              <img
                alt="Substation Feeder"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                src={SUBSTATION_IMG}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                Campus Interconnect #04
              </span>
              <span className="font-mono text-label-sm text-primary">
                160 kW Soft Cap · 200 kW Max
              </span>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-DEFAULT bg-surface-container-lowest shrink-0 overflow-hidden border border-outline-variant/20">
              <img
                alt="Solar Array"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                src={SOLAR_IMG}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                Solar Array Alpha (450 kWp)
              </span>
              <span className="font-mono text-label-sm text-on-surface-variant">
                98.2% Forecast Correlation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
