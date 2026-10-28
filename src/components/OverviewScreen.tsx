import React, { useState } from 'react';
import { ScreenId, AnalysisRecord, DecisionAuditEntry } from '../types';

interface OverviewScreenProps {
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  analyses: AnalysisRecord[];
  auditLog: DecisionAuditEntry[];
  onRecordDecision?: (entry: DecisionAuditEntry) => void;
  onSelectAnalysisForEdit?: (analysis: AnalysisRecord) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  onNavigate,
  analyses,
  auditLog,
  onSelectAnalysisForEdit,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<'both' | 'mitigated' | 'solar'>('both');

  const latestAnalysis = analyses[0];

  return (
    <div className="space-y-10">
      {/* 1. CONTEXTUAL WELCOME & PAGE TITLE + PRIMARY ACTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DDD5C9]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
              01 / APPLICATION OVERVIEW
            </span>
            <span className="text-[#DDD5C9]">·</span>
            <span className="font-mono-meta text-[11px] text-[#716A61]">
              ILLUSTRATIVE DEMO ENVIRONMENT
            </span>
          </div>
          <h1 className="font-serif-editorial text-[32px] sm:text-[40px] leading-[1.12] text-[#29251F]">
            Operational intelligence overview
          </h1>
          <p className="text-[15px] text-[#716A61] mt-1.5 max-w-2xl">
            Monitor feeder peak exposure, inspect explainable battery dispatch studies, and manage human sign-off across North Campus microgrid zones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#FFFFFF] text-[14px] font-medium text-[#29251F] transition-colors cursor-pointer"
          >
            Browse history ({analyses.length})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('workspace')}
            className="h-11 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
          >
            + New dispatch analysis
          </button>
        </div>
      </div>

      {/* Physical Microgrid Asset Telemetry Strip */}
      <div className="bg-energy-ambient-card border border-[#DDD5C9] rounded-[10px] p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-emerald-300">
              PHYSICAL DIGITAL TWIN SYNCHRONIZED
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-editorial font-medium text-white">
            North Campus Renewable Energy Microgrid
          </h2>
          <p className="text-xs sm:text-sm text-stone-200/90 mt-1">
            Real-time telemetry active across 110 kW PV Array, 160 kWh BESS Bank, and Feeder Transformer #04 with automated peak-shaving dispatch.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs font-mono-meta bg-black/45 backdrop-blur-sm px-4 py-3 rounded-[6px] border border-white/10 shrink-0">
          <div>
            <span className="text-stone-300 block text-[10px] uppercase">Grid Mode</span>
            <span className="text-emerald-300 font-semibold text-sm">Renewable Storage</span>
          </div>
          <div className="w-[1px] h-6 bg-white/15" />
          <div>
            <span className="text-stone-300 block text-[10px] uppercase">Solar Infeed</span>
            <span className="text-white font-semibold text-sm">88.6 kW</span>
          </div>
          <div className="w-[1px] h-6 bg-white/15" />
          <div>
            <span className="text-stone-300 block text-[10px] uppercase">BESS Reserve</span>
            <span className="text-white font-semibold text-sm">82% SoC</span>
          </div>
        </div>
      </div>

      {/* 2. TYPOGRAPHY-LED METRICS STRIP (4 MEANINGFUL METRICS, NO IDENTICAL CARD BLOAT) */}
      <section aria-label="Key Microgrid Metrics">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#716A61]">
            02 / ILLUSTRATIVE FEEDER TELEMETRY BENCHMARKS (NORTH CAMPUS #04)
          </span>
          <span className="font-mono-meta text-[11px] text-[#716A61]">
            Reference study: {latestAnalysis?.id || 'ANL-2026-104'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] divide-y sm:divide-y-0 sm:divide-x divide-[#DDD5C9]">
          <div className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[13px] text-[#716A61] block">
                Projected evening peak (unmitigated)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif-editorial text-[34px] leading-none text-[#A43E35] tabular-nums">
                  {latestAnalysis ? latestAnalysis.unmitigatedPeakKw.toFixed(1) : '186.2'}
                </span>
                <span className="font-mono-meta text-xs text-[#716A61]">kW</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#DDD5C9] flex items-center justify-between font-mono-meta text-[11px]">
              <span className="text-[#A43E35]">Exceeds 160 kW cap</span>
              <span className="text-[#716A61]">19:00 interval</span>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[13px] text-[#716A61] block">
                Mitigated feeder peak (scheduled)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif-editorial text-[34px] leading-none text-[#35674A] tabular-nums">
                  {latestAnalysis ? latestAnalysis.mitigatedPeakKw.toFixed(1) : '148.0'}
                </span>
                <span className="font-mono-meta text-xs text-[#716A61]">kW</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#DDD5C9] flex items-center justify-between font-mono-meta text-[11px]">
              <span className="text-[#35674A]">
                -{latestAnalysis ? latestAnalysis.bessDischargeKw.toFixed(1) : '38.2'} kW BESS shave
              </span>
              <span className="text-[#716A61]">Within rating</span>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[13px] text-[#716A61] block">
                Forecast uncertainty band
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif-editorial text-[34px] leading-none text-[#29251F] tabular-nums">
                  ±6.4
                </span>
                <span className="font-mono-meta text-xs text-[#716A61]">kW</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#DDD5C9] flex items-center justify-between font-mono-meta text-[11px]">
              <span className="text-[#315B85]">15-min rolling horizon</span>
              <span className="text-[#716A61]">Weather-adjusted</span>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[13px] text-[#716A61] block">
                Post-window storage reserve
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif-editorial text-[34px] leading-none text-[#29251F] tabular-nums">
                  26.0%
                </span>
                <span className="font-mono-meta text-xs text-[#716A61]">SoC</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#DDD5C9] flex items-center justify-between font-mono-meta text-[11px]">
              <span className="text-[#35674A]">Floor 20.0% respected</span>
              <span className="text-[#716A61]">Rack #02 LFP</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TREND CHART + RECENT ACTIVITY & SHORTCUTS (ASYMMETRIC 8 / 4 GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Relevant 24-Hour Load & Solar Trend Chart */}
        <div className="lg:col-span-8 bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#DDD5C9]">
            <div>
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] block">
                03 / 24-HOUR FEEDER TRAJECTORY (ILLUSTRATIVE TELEMETRY)
              </span>
              <h2 className="font-serif-editorial text-[22px] text-[#29251F] mt-0.5">
                Unmitigated demand vs. scheduled BESS peak shaving
              </h2>
            </div>

            {/* Series Filter Controls */}
            <div className="flex items-center gap-1 bg-[#F3EEE5] p-1 rounded-[6px] border border-[#DDD5C9] self-start">
              {(
                [
                  { id: 'both', label: 'All series' },
                  { id: 'mitigated', label: 'Load only' },
                  { id: 'solar', label: 'Solar PV' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSeries(tab.id)}
                  className={`px-2.5 py-1 rounded-[4px] font-mono-meta text-[11px] transition-colors cursor-pointer ${
                    selectedSeries === tab.id
                      ? 'bg-[#FFFFFF] text-[#29251F] font-medium'
                      : 'text-[#716A61] hover:text-[#29251F]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 mb-4 font-mono-meta text-[11px] text-[#716A61]">
            <span className="flex items-center gap-2 text-[#29251F]">
              <span className="w-3.5 h-0.5 bg-[#754536] inline-block" />
              Mitigated feeder load (Oxide)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-0.5 border-b border-dashed border-[#716A61] inline-block" />
              Unmitigated baseline
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-2.5 bg-[#B6BFA6]/60 border border-[#B6BFA6] inline-block" />
              Midday solar PV recharge (Soft sage)
            </span>
          </div>

          {/* Precise SVG Visualization */}
          <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] p-4">
            <svg viewBox="0 0 720 230" className="w-full h-60 overflow-visible">
              <g className="fill-[#716A61] text-[10px] font-mono-meta">
                <line x1="42" y1="25" x2="695" y2="25" stroke="#DDD5C9" strokeDasharray="3 3" />
                <text x="34" y="29" textAnchor="end">200 kW</text>

                <line x1="42" y1="68" x2="695" y2="68" stroke="#A43E35" strokeDasharray="5 3" strokeOpacity="0.65" />
                <text x="34" y="72" textAnchor="end" className="fill-[#A43E35]">160 kW</text>

                <line x1="42" y1="115" x2="695" y2="115" stroke="#DDD5C9" strokeDasharray="3 3" />
                <text x="34" y="119" textAnchor="end">120 kW</text>

                <line x1="42" y1="162" x2="695" y2="162" stroke="#DDD5C9" strokeDasharray="3 3" />
                <text x="34" y="166" textAnchor="end">80 kW</text>

                <line x1="42" y1="195" x2="695" y2="195" stroke="#DDD5C9" />
                <text x="34" y="199" textAnchor="end">50 kW</text>
              </g>

              <text x="50" y="61" className="fill-[#A43E35] text-[10px] font-mono-meta">
                160.0 kW Soft Transformer Ceiling
              </text>

              {/* Soft Sage Solar PV Series */}
              {(selectedSeries === 'both' || selectedSeries === 'solar') && (
                <g>
                  <path
                    d="M 180,195 Q 260,180 340,96 Q 400,78 465,148 L 520,195 Z"
                    fill="#B6BFA6"
                    fillOpacity="0.35"
                  />
                  <path
                    d="M 180,195 Q 260,180 340,96 Q 400,78 465,148 L 520,195"
                    fill="none"
                    stroke="#8A9677"
                    strokeWidth="1.75"
                  />
                </g>
              )}

              {/* Unmitigated & Mitigated Load Curves */}
              {(selectedSeries === 'both' || selectedSeries === 'mitigated') && (
                <g>
                  <path
                    d="M 42,174 C 120,178 195,142 280,118 C 365,98 460,82 545,42 C 600,48 645,122 695,158"
                    fill="none"
                    stroke="#716A61"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  <path
                    d="M 42,174 C 120,178 195,148 280,128 C 365,112 460,96 545,84 C 600,88 645,126 695,154"
                    fill="none"
                    stroke="#754536"
                    strokeWidth="2.5"
                  />

                  <circle cx="545" cy="42" r="4" fill="#A43E35" />
                  <circle cx="545" cy="84" r="4.5" fill="#754536" />
                  <line
                    x1="545"
                    y1="47"
                    x2="545"
                    y2="79"
                    stroke="#35674A"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <text
                    x="536"
                    y="35"
                    textAnchor="end"
                    className="fill-[#A43E35] text-[10px] font-mono-meta font-medium"
                  >
                    19:00 Unmitigated (186.2 kW)
                  </text>
                  <text
                    x="556"
                    y="88"
                    className="fill-[#35674A] text-[10px] font-mono-meta font-medium"
                  >
                    Mitigated 148.0 kW (-38.2 kW)
                  </text>
                </g>
              )}

              <g className="fill-[#716A61] text-[10px] font-mono-meta" textAnchor="middle">
                <text x="48" y="216">00:00</text>
                <text x="160" y="216">04:00</text>
                <text x="275" y="216">08:00</text>
                <text x="390" y="216">12:00</text>
                <text x="475" y="216">16:00</text>
                <text x="545" y="216" className="fill-[#29251F] font-semibold">19:00</text>
                <text x="685" y="216">23:00</text>
              </g>
            </svg>
          </div>

          <div className="mt-4 pt-4 border-t border-[#DDD5C9] flex flex-wrap items-center justify-between gap-4 text-xs text-[#716A61]">
            <span>
              Illustrative 15-minute interval model for North Campus Feeder #04.
            </span>
            <button
              type="button"
              onClick={() =>
                onNavigate('results', latestAnalysis ? latestAnalysis.id : 'ANL-2026-104')
              }
              className="font-medium text-[#754536] hover:underline cursor-pointer"
            >
              Open full editorial report ({latestAnalysis ? latestAnalysis.id : 'ANL-2026-104'}) →
            </button>
          </div>
        </div>

        {/* Right 4 Columns: Useful Workflow Shortcuts & Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shortcuts Panel */}
          <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6">
            <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] block">
              04 / WORKFLOW SHORTCUTS
            </span>
            <h2 className="font-serif-editorial text-[20px] text-[#29251F] mt-1 mb-4">
              Direct actions
            </h2>

            <div className="divide-y divide-[#DDD5C9] border-t border-[#DDD5C9]">
              <button
                type="button"
                onClick={() => onNavigate('workspace')}
                className="w-full py-3.5 text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-[14px] font-medium text-[#29251F] group-hover:text-[#754536] transition-colors">
                    Configure new dispatch analysis
                  </div>
                  <div className="text-xs text-[#716A61]">
                    Input → Processing → Results → Decision
                  </div>
                </div>
                <span className="font-mono-meta text-xs text-[#754536]">→</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('results', 'ANL-2026-104')}
                className="w-full py-3.5 text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-[14px] font-medium text-[#29251F] group-hover:text-[#754536] transition-colors">
                    Review latest editorial report
                  </div>
                  <div className="text-xs text-[#716A61]">
                    Inspect factors, uncertainty &amp; limitations
                  </div>
                </div>
                <span className="font-mono-meta text-xs text-[#754536]">→</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('microgrid-simulator')}
                className="w-full py-3.5 text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-[14px] font-medium text-[#29251F] group-hover:text-[#754536] transition-colors">
                    Open digital twin stress simulator
                  </div>
                  <div className="text-xs text-[#716A61]">
                    Test islanding &amp; cloud drop contingencies
                  </div>
                </div>
                <span className="font-mono-meta text-xs text-[#754536]">→</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('onboarding')}
                className="w-full pt-3.5 text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-[14px] font-medium text-[#29251F] group-hover:text-[#754536] transition-colors">
                    Calibrate facility onboarding profile
                  </div>
                  <div className="text-xs text-[#716A61]">
                    Update transformer ratings &amp; tariff tiers
                  </div>
                </div>
                <span className="font-mono-meta text-xs text-[#754536]">→</span>
              </button>
            </div>
          </div>

          {/* Recent Decision Activity Ledger */}
          <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#716A61]">
                RECENT AUDIT ACTIVITY
              </span>
              <button
                type="button"
                onClick={() => onNavigate('history')}
                className="font-mono-meta text-[11px] text-[#754536] hover:underline cursor-pointer"
              >
                Full log →
              </button>
            </div>

            <div className="divide-y divide-[#DDD5C9] border-t border-[#DDD5C9] text-xs">
              {auditLog.slice(0, 3).map((item) => (
                <div key={item.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between font-mono-meta text-[11px]">
                    <span
                      className={
                        item.decision === 'APPROVED'
                          ? 'text-[#35674A] font-medium'
                          : item.decision === 'SCHEDULED'
                          ? 'text-[#315B85] font-medium'
                          : 'text-[#A43E35] font-medium'
                      }
                    >
                      ● {item.decision}
                    </span>
                    <span className="text-[#716A61]">{item.timestamp}</span>
                  </div>
                  <div className="font-medium text-[#29251F]">{item.recommendedAction}</div>
                  <div className="text-[#716A61] truncate">{item.operatorNote}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT RESULTS & ANALYSES TABLE */}
      <section className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] overflow-hidden">
        <div className="p-6 border-b border-[#DDD5C9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] block">
              05 / RECENT ANALYSES &amp; REPORTS
            </span>
            <h2 className="font-serif-editorial text-[22px] text-[#29251F] mt-0.5">
              Recent feeder studies
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs font-medium text-[#754536] hover:underline cursor-pointer self-start sm:self-auto"
          >
            View all in History →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DDD5C9] bg-[#FFFFFF] font-mono-meta text-[11px] text-[#716A61] uppercase">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-4">Analysis title &amp; zone</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Mitigated peak</th>
                <th className="py-3.5 px-4 text-right">Uncertainty</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD5C9] text-[14px]">
              {analyses.slice(0, 4).map((rec) => (
                <tr key={rec.id} className="hover:bg-[#FFFFFF] transition-colors">
                  <td className="py-4 px-6 font-mono-meta text-xs text-[#754536] font-medium">
                    {rec.id}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-[#29251F]">{rec.title}</div>
                    <div className="font-mono-meta text-[11px] text-[#716A61] mt-0.5">
                      {rec.substationZone} · {rec.createdAt}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono-meta text-xs">
                    {rec.status === 'Completed' && (
                      <span className="text-[#35674A] font-medium">● Completed</span>
                    )}
                    {rec.status === 'Review required' && (
                      <span className="text-[#A43E35] font-medium">▲ Review required</span>
                    )}
                    {rec.status === 'Draft' && (
                      <span className="text-[#716A61]">○ Draft</span>
                    )}
                    {rec.status === 'Failed' && (
                      <span className="text-[#A43E35]">✕ Failed</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-mono-meta tabular-nums text-[#29251F] font-medium">
                    {rec.mitigatedPeakKw.toFixed(1)} kW
                  </td>
                  <td className="py-4 px-4 text-right font-mono-meta tabular-nums text-xs text-[#716A61]">
                    {rec.uncertaintyRangeKw.split(' ')[0]}
                  </td>
                  <td className="py-4 px-6 text-right space-x-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onNavigate('results', rec.id)}
                      className="text-xs font-medium text-[#754536] hover:underline cursor-pointer"
                    >
                      View report
                    </button>
                    {onSelectAnalysisForEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAnalysisForEdit(rec);
                          onNavigate('workspace');
                        }}
                        className="text-xs text-[#716A61] hover:text-[#29251F] cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
