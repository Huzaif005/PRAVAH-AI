import React, { useState } from 'react';
import { Download, CheckCircle2, FileText } from 'lucide-react';
import { ValidationIssue, DecisionAuditEntry } from '../types';
import { WorkspacePipelinePanel } from './WorkspacePipelinePanel';

interface ReportArchiveItem {
  id: string;
  name: string;
  date: string;
  size: string;
  format: 'PDF' | 'CSV';
  period: string;
  facility: string;
  savings: string;
  co2: string;
  peakReduction: string;
  selfConsumption: string;
}

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

interface ReportsScreenProps {
  searchQuery?: string;
  auditLog: DecisionAuditEntry[];
  onRecordDecision: (entry: DecisionAuditEntry) => void;
}

export function ReportsScreen({
  searchQuery = '',
  auditLog,
  onRecordDecision,
}: ReportsScreenProps) {
  const [period, setPeriod] = useState('Last 30 Days (Oct 1 - Oct 30)');
  const [facility, setFacility] = useState('North Campus Microgrid (All Zones)');
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [sections, setSections] = useState({
    financial: true,
    carbon: true,
    bess: true,
    anomalies: false,
  });
  const [reports, setReports] = useState<ReportArchiveItem[]>(INITIAL_REPORTS);
  const [activeReport, setActiveReport] = useState<ReportArchiveItem>(INITIAL_REPORTS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedSectionCount = Object.values(sections).filter(Boolean).length;

  // Stage 02 Validation: Ensure at least one report module is selected
  const validationIssues: ValidationIssue[] = [];
  if (selectedSectionCount === 0) {
    validationIssues.push({
      field: 'Included Report Sections',
      message: 'Zero audit modules are selected for report compilation.',
      remediation: 'Enable at least one section (Financial, Carbon, BESS, or Anomalies).',
      severity: 'error',
    });
  }

  const handleResetInputs = () => {
    setPeriod('Last 30 Days (Oct 1 - Oct 30)');
    setFacility('North Campus Microgrid (All Zones)');
    setFormat('PDF');
    setSections({
      financial: true,
      carbon: true,
      bess: true,
      anomalies: false,
    });
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadFile = (report: ReportArchiveItem, exportFormat?: 'PDF' | 'CSV') => {
    const targetFormat = exportFormat || report.format;
    const content = [
      `PRAVAAH AI - EXECUTIVE ENERGY & SUSTAINABILITY REPORT`,
      `Report Name: ${report.name}`,
      `Facility: ${report.facility}`,
      `Reporting Period: ${report.period}`,
      `Generated Date: ${report.date}`,
      `----------------------------------------`,
      `Net Cost Savings: ${report.savings}`,
      `CO2 Emissions Avoided: ${report.co2}`,
      `Peak Demand Reduction: ${report.peakReduction}`,
      `Solar Self-Consumption: ${report.selfConsumption}`,
      `----------------------------------------`,
      `Included Modules: ${Object.entries(sections)
        .filter(([, v]) => v)
        .map(([k]) => k.toUpperCase())
        .join(', ')}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = report.name.replace(/\.(pdf|csv)$/i, '');
    link.setAttribute('download', `${baseName}.${targetFormat.toLowerCase()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded ${baseName}.${targetFormat.toLowerCase()}`);
  };

  const handleGenerateReport = () => {
    if (selectedSectionCount === 0) return;
    const newReport: ReportArchiveItem = {
      id: `rep-${Date.now()}`,
      name: `Custom_${facility.split(' ')[0]}_Report.${format.toLowerCase()}`,
      date: 'Oct 28, 2026',
      size: format === 'PDF' ? '2.1 MB' : '620 KB',
      format,
      period,
      facility,
      savings: facility.includes('Sector 4') ? '$14,980' : facility.includes('BESS') ? '$9,420' : '$18,420',
      co2: facility.includes('Sector 4') ? '11.6 Tons' : facility.includes('BESS') ? '8.4 Tons' : '14.2 Tons',
      peakReduction: facility.includes('Sector 4') ? '21.0%' : '22.4%',
      selfConsumption: '94.8%',
    };
    setReports((prev) => [newReport, ...prev]);
    setActiveReport(newReport);
    triggerToast(`Generated new ${format} report for ${facility}`);
  };

  const filteredReports = reports.filter(
    (r) =>
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facility.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-primary/40 text-on-surface px-4 py-3 rounded-DEFAULT shadow-xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary mb-1">
            01 · COMPLIANCE &amp; AUDIT REPORT GENERATOR
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-on-surface">
            Executive Energy &amp; Sustainability Reports
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Configure facility scope and compliance sections, verify revenue-grade meter evidence, and certify audit statements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleDownloadFile(activeReport, 'CSV')}
            className="px-4 py-2 rounded-DEFAULT bg-surface-container border border-outline-variant/25 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-on-surface-variant" />
            Export Raw CSV
          </button>
          <button
            type="button"
            onClick={() => handleDownloadFile(activeReport, 'PDF')}
            className="px-4 py-2 rounded-DEFAULT bg-primary text-on-primary text-xs font-bold hover:bg-primary-fixed transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Explicit 6-Stage AI Workspace & Decision Pipeline */}
      <WorkspacePipelinePanel
        screenId="reports"
        workspaceName="Compliance & Sustainability Audit Generator"
        primaryActionLabel="Synthesize & Verify Audit Statement"
        inputSummary={`Facility: ${facility} · Period: ${period} · Format: ${format} · Modules: ${selectedSectionCount}/4`}
        parameters={{
          facility,
          period,
          format,
          selectedSectionCount,
        }}
        validationIssues={validationIssues}
        onResetInputs={handleResetInputs}
        auditLog={auditLog}
        onRecordDecision={onRecordDecision}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Report Configuration & Archive Ledger */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container border border-outline-variant/15 rounded-lg p-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.12em] text-on-surface mb-5 pb-3 border-b border-outline-variant/15">
              01 · Report Scope &amp; Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="report-period" className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Reporting Period
                </label>
                <select
                  id="report-period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/25 rounded-DEFAULT px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option>Last 30 Days (Oct 1 - Oct 30)</option>
                  <option>Last Quarter (Q3)</option>
                  <option>Year to Date (YTD)</option>
                  <option>Last 7 Days (Oct 18 - Oct 24)</option>
                </select>
              </div>

              <div>
                <label htmlFor="report-facility" className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Facility / Microgrid Zone
                </label>
                <select
                  id="report-facility"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/25 rounded-DEFAULT px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option>North Campus Microgrid (All Zones)</option>
                  <option>Sector 4 Manufacturing Plant</option>
                  <option>BESS Storage Array A &amp; B</option>
                </select>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider block mb-2">
                  Included Audit Sections (Min 1 Required)
                </span>
                <div className="divide-y divide-outline-variant/15 border-y border-outline-variant/15">
                  <label className="flex items-center justify-between py-2.5 cursor-pointer">
                    <span className="text-xs text-on-surface">Financial &amp; Peak Shaving Savings</span>
                    <input
                      type="checkbox"
                      checked={sections.financial}
                      onChange={() => handleToggleSection('financial')}
                      className="rounded-sm text-primary focus:ring-0 bg-surface-container-lowest border-outline-variant/40"
                    />
                  </label>
                  <label className="flex items-center justify-between py-2.5 cursor-pointer">
                    <span className="text-xs text-on-surface">Scope 2 Carbon Emissions Offset</span>
                    <input
                      type="checkbox"
                      checked={sections.carbon}
                      onChange={() => handleToggleSection('carbon')}
                      className="rounded-sm text-primary focus:ring-0 bg-surface-container-lowest border-outline-variant/40"
                    />
                  </label>
                  <label className="flex items-center justify-between py-2.5 cursor-pointer">
                    <span className="text-xs text-on-surface">BESS Degradation &amp; Cycle Health</span>
                    <input
                      type="checkbox"
                      checked={sections.bess}
                      onChange={() => handleToggleSection('bess')}
                      className="rounded-sm text-primary focus:ring-0 bg-surface-container-lowest border-outline-variant/40"
                    />
                  </label>
                  <label className="flex items-center justify-between py-2.5 cursor-pointer">
                    <span className="text-xs text-on-surface">Grid Anomaly &amp; Dispatch Logs</span>
                    <input
                      type="checkbox"
                      checked={sections.anomalies}
                      onChange={() => handleToggleSection('anomalies')}
                      className="rounded-sm text-primary focus:ring-0 bg-surface-container-lowest border-outline-variant/40"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Target Export Format
                </span>
                <div className="grid grid-cols-2 border border-outline-variant/25 rounded-DEFAULT overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFormat('PDF')}
                    className={`py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      format === 'PDF'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    PDF Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('CSV')}
                    className={`py-2 text-xs font-semibold border-l border-outline-variant/25 transition-colors cursor-pointer ${
                      format === 'CSV'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    CSV Data
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={selectedSectionCount === 0}
                onClick={handleGenerateReport}
                className="w-full py-2.5 mt-2 bg-primary text-on-primary rounded-DEFAULT text-xs font-bold hover:bg-primary-fixed transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Compile &amp; Append to Archive
              </button>
            </div>
          </div>

          {/* Recent Generated Reports Ledger */}
          <div className="bg-surface-container border border-outline-variant/15 rounded-lg p-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.12em] text-on-surface mb-3">
              Generated Archive ({filteredReports.length})
            </h3>
            <div className="divide-y divide-outline-variant/15 border-t border-outline-variant/15">
              {filteredReports.map((rep) => {
                const isSelected = activeReport.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setActiveReport(rep)}
                    className={`py-3 flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? 'text-primary' : 'text-on-surface hover:text-primary'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold truncate">{rep.name}</p>
                      <p className="text-[11px] font-mono tabular-nums text-on-surface-variant mt-0.5">
                        {rep.date} · {rep.size} · {rep.format}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(rep);
                      }}
                      aria-label={`Download ${rep.name}`}
                      className="p-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Executive Report Sheet Preview */}
        <div className="lg:col-span-8 bg-on-surface text-inverse-on-surface rounded-lg p-6 sm:p-10 border border-outline-variant/20">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-inverse-on-surface/15 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-inverse-on-surface/60">
                  PRAVAAH AI · OFFICIAL AUDIT DOCUMENT
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-inverse-on-surface">
                Monthly Performance &amp; Carbon Offset Statement
              </h1>
              <p className="text-xs text-inverse-on-surface/70 mt-1">
                Facility: {activeReport.facility} · Period: {activeReport.period}
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-700">
                VERIFIED AUDIT
              </span>
              <p className="text-[11px] font-mono tabular-nums text-inverse-on-surface/60 mt-1">
                Date: {activeReport.date}
              </p>
            </div>
          </div>

          {/* 4-Column Unified KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-inverse-on-surface/15 divide-y sm:divide-y-0 sm:divide-x divide-inverse-on-surface/15 mb-8">
            <div className="py-4 sm:pr-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-inverse-on-surface/60 block">
                Net Cost Savings
              </span>
              <div className="text-2xl font-extrabold font-headline tabular-nums text-inverse-on-surface mt-1">
                {activeReport.savings}
              </div>
              <span className="text-[11px] font-mono tabular-nums text-emerald-700 font-semibold mt-0.5 block">
                +14.2% vs Baseline
              </span>
            </div>
            <div className="py-4 sm:px-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-inverse-on-surface/60 block">
                CO2 Avoided
              </span>
              <div className="text-2xl font-extrabold font-headline tabular-nums text-inverse-on-surface mt-1">
                {activeReport.co2}
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5 block">
                Scope 2 Certified
              </span>
            </div>
            <div className="py-4 sm:px-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-inverse-on-surface/60 block">
                Peak Reduction
              </span>
              <div className="text-2xl font-extrabold font-headline tabular-nums text-inverse-on-surface mt-1">
                {activeReport.peakReduction}
              </div>
              <span className="text-[11px] font-mono tabular-nums text-inverse-on-surface/60 mt-0.5 block">
                1,240 kW Shaved
              </span>
            </div>
            <div className="py-4 sm:pl-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-inverse-on-surface/60 block">
                Self-Consumption
              </span>
              <div className="text-2xl font-extrabold font-headline tabular-nums text-inverse-on-surface mt-1">
                {activeReport.selfConsumption}
              </div>
              <span className="text-[11px] font-mono text-inverse-on-surface/60 mt-0.5 block">
                Zero Curtailment
              </span>
            </div>
          </div>

          {/* Chart Section */}
          {sections.financial && (
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface/80">
                  Weekly Cost Comparison: Unoptimized Baseline vs. PRAVAAH AI
                </h4>
                <div className="flex items-center gap-4 text-[11px] font-mono text-inverse-on-surface/70">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-inverse-on-surface/30 inline-block"></span> Baseline Tariff
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-sky-600 inline-block"></span> AI Optimized
                  </span>
                </div>
              </div>
              <div className="h-44 border-b border-inverse-on-surface/15 pt-4 pb-3 flex items-end justify-around gap-4">
                {[
                  { label: 'Week 1', base: '85%', opt: '62%' },
                  { label: 'Week 2', base: '92%', opt: '65%' },
                  { label: 'Week 3', base: '78%', opt: '55%' },
                  { label: 'Week 4', base: '95%', opt: '68%' },
                ].map((wk) => (
                  <div key={wk.label} className="flex flex-col items-center gap-2 flex-1 max-w-[96px] h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-2 h-full">
                      <div className="w-5 bg-inverse-on-surface/25 rounded-t-sm" style={{ height: wk.base }}></div>
                      <div className="w-5 bg-sky-600 rounded-t-sm" style={{ height: wk.opt }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-inverse-on-surface/70">{wk.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface/80 mb-3">
              Optimization Ledger by Value Stream
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-inverse-on-surface/20 text-[10px] font-mono text-inverse-on-surface/60 uppercase">
                    <th className="py-2.5">Optimization Category</th>
                    <th className="py-2.5 text-right">Energy Dispatched</th>
                    <th className="py-2.5 text-right">Financial Impact</th>
                    <th className="py-2.5 text-right">Carbon Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inverse-on-surface/10 text-xs font-mono tabular-nums">
                  {sections.financial && (
                    <tr>
                      <td className="py-3 font-sans font-semibold text-inverse-on-surface">
                        Peak Demand Charge Shaving
                      </td>
                      <td className="py-3 text-right text-inverse-on-surface/80">18,400 kWh</td>
                      <td className="py-3 text-right font-bold text-emerald-700">+$11,240.00</td>
                      <td className="py-3 text-right text-inverse-on-surface/80">-4.8 Tons</td>
                    </tr>
                  )}
                  {sections.bess && (
                    <tr>
                      <td className="py-3 font-sans font-semibold text-inverse-on-surface">
                        TOU Tariff Arbitrage (BESS)
                      </td>
                      <td className="py-3 text-right text-inverse-on-surface/80">32,150 kWh</td>
                      <td className="py-3 text-right font-bold text-emerald-700">+$5,180.00</td>
                      <td className="py-3 text-right text-inverse-on-surface/80">-6.1 Tons</td>
                    </tr>
                  )}
                  {sections.carbon && (
                    <tr>
                      <td className="py-3 font-sans font-semibold text-inverse-on-surface">
                        Demand Response Participation
                      </td>
                      <td className="py-3 text-right text-inverse-on-surface/80">4,200 kWh</td>
                      <td className="py-3 text-right font-bold text-emerald-700">+$2,000.00</td>
                      <td className="py-3 text-right text-inverse-on-surface/80">-3.3 Tons</td>
                    </tr>
                  )}
                  {sections.anomalies && (
                    <tr>
                      <td className="py-3 font-sans font-semibold text-inverse-on-surface">
                        Automated Frequency Containment Reserve
                      </td>
                      <td className="py-3 text-right text-inverse-on-surface/80">1,950 kWh</td>
                      <td className="py-3 text-right font-bold text-emerald-700">+$890.00</td>
                      <td className="py-3 text-right text-inverse-on-surface/80">-0.9 Tons</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsScreen;
