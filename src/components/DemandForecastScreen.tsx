import React, { useState } from 'react';
import { ValidationIssue, DecisionAuditEntry } from '../types';
import { WorkspacePipelinePanel } from './WorkspacePipelinePanel';

interface DemandForecastScreenProps {
  auditLog: DecisionAuditEntry[];
  onRecordDecision: (entry: DecisionAuditEntry) => void;
}

interface ForecastRow {
  hour: string;
  loadKw: string;
  solarKw: string;
  netDemand: string;
  riskLevel: 'Normal' | 'Moderate' | 'Critical';
  strategy: string;
  variance: string;
  isCriticalRow?: boolean;
}

const FORECAST_ROWS: ForecastRow[] = [
  {
    hour: '00:00',
    loadKw: '64.2',
    solarKw: '0.0',
    netDemand: '64.2 kW',
    riskLevel: 'Normal',
    strategy: 'Night Baseload',
    variance: '±1.1%',
  },
  {
    hour: '04:00',
    loadKw: '58.8',
    solarKw: '0.0',
    netDemand: '58.8 kW',
    riskLevel: 'Normal',
    strategy: 'Night Baseload',
    variance: '±0.9%',
  },
  {
    hour: '08:00',
    loadKw: '112.5',
    solarKw: '+28.4',
    netDemand: '84.1 kW',
    riskLevel: 'Normal',
    strategy: 'Baseload Grid',
    variance: '±1.4%',
  },
  {
    hour: '12:00',
    loadKw: '144.0',
    solarKw: '+88.6',
    netDemand: '55.4 kW',
    riskLevel: 'Normal',
    strategy: 'Solar Charging Battery',
    variance: '±1.2%',
  },
  {
    hour: '16:00',
    loadKw: '158.4',
    solarKw: '+32.0',
    netDemand: '126.4 kW',
    riskLevel: 'Moderate',
    strategy: 'Pre-Cooling Active',
    variance: '±1.6%',
  },
  {
    hour: '18:00',
    loadKw: '174.6',
    solarKw: '+6.2',
    netDemand: '168.4 kW',
    riskLevel: 'Moderate',
    strategy: 'BESS Ramp-Up',
    variance: '±1.3%',
  },
  {
    hour: '19:00',
    loadKw: '186.2',
    solarKw: '0.0',
    netDemand: '186.2 kW',
    riskLevel: 'Critical',
    strategy: 'Peak Shaving / Battery Discharge',
    variance: '±1.2%',
    isCriticalRow: true,
  },
  {
    hour: '20:00',
    loadKw: '169.5',
    solarKw: '0.0',
    netDemand: '169.5 kW',
    riskLevel: 'Moderate',
    strategy: 'Peak Shaving Active',
    variance: '±1.5%',
  },
  {
    hour: '22:00',
    loadKw: '122.0',
    solarKw: '0.0',
    netDemand: '122.0 kW',
    riskLevel: 'Normal',
    strategy: 'Night Baseload',
    variance: '±1.1%',
  },
];

export const DemandForecastScreen: React.FC<DemandForecastScreenProps> = ({
  auditLog,
  onRecordDecision,
}) => {
  const [horizon, setHorizon] = useState<'24h' | '7d' | '30d'>('24h');
  const [confidence, setConfidence] = useState<'95' | '90'>('95');
  const [tempAdjustmentC, setTempAdjustmentC] = useState<number>(0);

  const [showBaseline, setShowBaseline] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showEV, setShowEV] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'moderate' | 'normal'>('all');

  const envMetrics = {
    '24h': { temp: '34.2°C', tempSub: '+4.1°C Peak', hum: '62%', irr: '845 W/m²', acc: '98.8%' },
    '7d': { temp: '31.8°C', tempSub: '+2.6°C Avg', hum: '58%', irr: '790 W/m²', acc: '97.9%' },
    '30d': { temp: '29.4°C', tempSub: 'Seasonal Norm', hum: '54%', irr: '760 W/m²', acc: '96.8%' },
  }[horizon];

  const validationIssues: ValidationIssue[] = [];
  if (tempAdjustmentC < -10 || tempAdjustmentC > 10) {
    validationIssues.push({
      field: 'Ambient Temp Δ (°C)',
      message: `${tempAdjustmentC}°C exceeds meteorological calibration envelope (-10°C to +10°C).`,
      remediation: 'Set Ambient Temp Δ between -10°C and +10°C.',
      severity: 'error',
    });
  } else if (tempAdjustmentC >= 5 && showEV) {
    validationIssues.push({
      field: 'Combined Heatwave + EV Surge',
      message: `+${tempAdjustmentC}°C ambient offset combined with EV Fleet Load pushes 19:00 demand above 200 kW critical ceiling.`,
      remediation: 'Pre-schedule 42 kW BESS peak shaving or defer EV fleet charging past 21:00.',
      severity: 'warning',
    });
  }

  const handleResetInputs = () => {
    setHorizon('24h');
    setConfidence('95');
    setTempAdjustmentC(0);
    setShowEV(false);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Hour,PredictedLoad_kW,SolarGen_kW,NetDemand_kW,RiskLevel,Strategy,Variance\n' +
      '00:00,64.2,0.0,64.2,Normal,Night Baseload,1.1%\n' +
      '04:00,58.8,0.0,58.8,Normal,Night Baseload,0.9%\n' +
      '08:00,112.5,28.4,84.1,Normal,Baseload Grid,1.4%\n' +
      '12:00,144.0,88.6,55.4,Normal,Solar Charging Battery,1.2%\n' +
      '16:00,158.4,32.0,126.4,Moderate,Pre-Cooling Active,1.6%\n' +
      '18:00,174.6,6.2,168.4,Moderate,BESS Ramp-Up,1.3%\n' +
      '19:00,186.2,0.0,186.2,Critical,Peak Shaving / Battery Discharge,1.2%\n' +
      '20:00,169.5,0.0,169.5,Moderate,Peak Shaving Active,1.5%\n' +
      '22:00,122.0,0.0,122.0,Normal,Night Baseload,1.1%';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PRAVAAH_${horizon}_Demand_Forecast.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows = FORECAST_ROWS.filter((row) => {
    const matchesSearch =
      row.hour.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.riskLevel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk =
      riskFilter === 'all' || row.riskLevel.toLowerCase() === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="flex-1 overflow-y-auto p-margin sm:p-margin-md space-y-6">
      {/* 1. PAGE HEADER & STAGE 01 INPUT TOOLBAR */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary block mb-1">
            01 · FORECAST MODEL INPUTS &amp; HORIZON PARAMETERS
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">
            Demand Forecast Workspace
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Calibrate horizon, confidence interval, and weather delta to generate hourly BESS dispatch schedules
          </p>
        </div>

        {/* Stage 01 Explicit Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-surface-container-low px-2.5 py-1.5 rounded-DEFAULT border border-outline-variant/25">
            <label htmlFor="horizon-select" className="text-label-sm text-outline mr-2">
              Forecast Horizon:
            </label>
            <select
              id="horizon-select"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value as '24h' | '7d' | '30d')}
              className="bg-transparent font-body-sm text-body-sm text-on-surface font-medium focus:outline-none cursor-pointer"
            >
              <option className="bg-surface-container" value="24h">
                Next 24 Hours
              </option>
              <option className="bg-surface-container" value="7d">
                Next 7 Days
              </option>
              <option className="bg-surface-container" value="30d">
                30-Day Outlook
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1.5 rounded-DEFAULT border border-outline-variant/25">
            <label htmlFor="forecast-temp-delta" className="text-label-sm text-on-surface-variant">
              Ambient Temp Δ (°C):
            </label>
            <input
              id="forecast-temp-delta"
              type="number"
              min={-15}
              max={15}
              step={1}
              value={tempAdjustmentC}
              onChange={(e) => setTempAdjustmentC(Number(e.target.value))}
              className="w-14 bg-surface-container-lowest border border-outline-variant/30 rounded-DEFAULT px-2 py-0.5 font-mono text-xs text-primary font-semibold focus:outline-none focus:border-primary"
            />
          </div>

          <div
            className="flex items-center bg-surface-container-low p-0.5 rounded-DEFAULT border border-outline-variant/25"
            role="group"
            aria-label="Prediction Confidence Band"
          >
            <button
              onClick={() => setConfidence('95')}
              aria-pressed={confidence === '95'}
              className={`px-2.5 py-1 rounded-DEFAULT font-mono text-label-sm transition-colors cursor-pointer whitespace-nowrap ${
                confidence === '95'
                  ? 'font-semibold bg-surface-container-high text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              95% Conf.
            </button>
            <button
              onClick={() => setConfidence('90')}
              aria-pressed={confidence === '90'}
              className={`px-2.5 py-1 rounded-DEFAULT font-mono text-label-sm transition-colors cursor-pointer whitespace-nowrap ${
                confidence === '90'
                  ? 'font-semibold bg-surface-container-high text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              90% Conf.
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container border border-outline-variant/25 text-on-surface font-body-sm text-body-sm transition-colors cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Secure Telemetry & Operational Engine Status */}
      <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[8px] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-[#29251F] uppercase tracking-wider">
              Microgrid Demand Forecasting Engine
            </span>
            <span className="text-[#DDD5C9]">·</span>
            <span className="font-mono text-[11px] text-[#716A61]">
              24-Hour Horizon · Dynamic BESS Dispatch · High-Confidence Inference
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-semibold">
            ● Model Online
          </span>
        </div>
      </div>

      {/* Explicit 6-Stage AI Workspace & Decision Pipeline */}
      <WorkspacePipelinePanel
        screenId="demand-forecast"
        workspaceName="Demand Forecast Solver"
        primaryActionLabel="Execute Forecast Solver"
        inputSummary={`Horizon: ${horizon.toUpperCase()} · Conf: ${confidence}% · Temp Δ: ${tempAdjustmentC >= 0 ? '+' : ''}${tempAdjustmentC}°C · EV Layer: ${showEV ? 'On' : 'Off'}`}
        parameters={{
          horizon,
          confidence,
          tempAdjustmentC,
          showEV,
        }}
        validationIssues={validationIssues}
        onResetInputs={handleResetInputs}
        auditLog={auditLog}
        onRecordDecision={onRecordDecision}
      />

      {/* 2. UNIFIED 4-COLUMN ENVIRONMENTAL CORRELATION STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-surface-container-low border border-outline-variant/25 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
        <div className="p-4 flex items-baseline justify-between">
          <div>
            <div className="text-label-sm text-on-surface-variant">Ambient Temperature</div>
            <div className="font-mono-metric text-2xl text-on-surface font-semibold mt-1">
              {envMetrics.temp}
            </div>
          </div>
          <span className="font-mono text-label-sm text-error">{envMetrics.tempSub}</span>
        </div>

        <div className="p-4 flex items-baseline justify-between">
          <div>
            <div className="text-label-sm text-on-surface-variant">Relative Humidity</div>
            <div className="font-mono-metric text-2xl text-on-surface font-semibold mt-1">
              {envMetrics.hum}
            </div>
          </div>
          <span className="font-mono text-label-sm text-primary">Dew Pt 24°C</span>
        </div>

        <div className="p-4 flex items-baseline justify-between">
          <div>
            <div className="text-label-sm text-on-surface-variant">Solar Irradiance</div>
            <div className="font-mono-metric text-2xl text-secondary font-semibold mt-1">
              {envMetrics.irr}
            </div>
          </div>
          <span className="font-mono text-label-sm text-secondary">Clear Sky Index 0.89</span>
        </div>

        <div className="p-4 flex items-baseline justify-between">
          <div>
            <div className="text-label-sm text-on-surface-variant">Model Accuracy</div>
            <div className="font-mono-metric text-2xl text-on-surface font-semibold mt-1">
              {envMetrics.acc}
            </div>
          </div>
          <span className="font-mono text-label-sm text-tertiary">MAPE 1.2%</span>
        </div>
      </div>

      {/* 3. MAIN MULTI-LINE FORECAST VISUALIZATION */}
      <div className="bg-surface-container-low border border-outline-variant/25 rounded-lg p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              24-Hour Load Horizon &amp; Layer Overlays
            </h2>
            <p className="font-mono text-label-sm text-error mt-0.5">
              Projected Peak: {(186.2 + (showEV ? 14.5 : 0) + tempAdjustmentC * 3.1).toFixed(1)} kW at 19:00 · BESS 34.0 kW Shave Armed
            </p>
          </div>

          {/* Interactive Layer Toggles with clear purpose */}
          <div className="flex flex-wrap items-center gap-4 text-label-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                checked={showBaseline}
                onChange={(e) => setShowBaseline(e.target.checked)}
                className="accent-primary rounded-xs cursor-pointer"
                type="checkbox"
              />
              <span className="w-3 h-0.5 bg-outline inline-block"></span>
              <span className="text-on-surface-variant">Historical Baseline</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                checked={showWeather}
                onChange={(e) => setShowWeather(e.target.checked)}
                className="accent-secondary rounded-xs cursor-pointer"
                type="checkbox"
              />
              <span className="w-3 h-0.5 bg-secondary inline-block"></span>
              <span className="text-secondary">Solar PV Curve</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="accent-tertiary rounded-xs cursor-pointer"
                type="checkbox"
              />
              <span className="w-3 h-2 bg-tertiary/30 border border-tertiary inline-block"></span>
              <span className="text-tertiary">Confidence Band</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                checked={showEV}
                onChange={(e) => setShowEV(e.target.checked)}
                className="accent-primary rounded-xs cursor-pointer"
                type="checkbox"
              />
              <span className="w-3 h-0.5 border-b border-dotted border-primary inline-block"></span>
              <span className="text-on-surface-variant">Include EV Fleet (+14.5 kW)</span>
            </label>
          </div>
        </div>

        {/* High-Precision SVG Chart Canvas */}
        <div className="relative w-full h-76 pt-2">
          <svg
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 900 280"
          >
            <defs>
              <linearGradient id="aiForecastFill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="solarGenFill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#4edea3" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="peakDangerBand" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#93000a" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#93000a" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <g className="text-[10px] fill-outline font-mono">
              <line stroke="#3d494c" strokeOpacity="0.2" x1="45" x2="875" y1="20" y2="20" />
              <text textAnchor="end" x="38" y="24">220kW</text>
              <line stroke="#3d494c" strokeOpacity="0.2" x1="45" x2="875" y1="55" y2="55" />
              <text textAnchor="end" x="38" y="59">200kW</text>
              <line stroke="#3d494c" strokeOpacity="0.2" x1="45" x2="875" y1="100" y2="100" />
              <text textAnchor="end" x="38" y="104">160kW</text>
              <line stroke="#3d494c" strokeOpacity="0.2" x1="45" x2="875" y1="145" y2="145" />
              <text textAnchor="end" x="38" y="149">120kW</text>
              <line stroke="#3d494c" strokeOpacity="0.2" x1="45" x2="875" y1="190" y2="190" />
              <text textAnchor="end" x="38" y="194">80kW</text>
              <line stroke="#3d494c" strokeOpacity="0.2" x1="45" x2="875" y1="235" y2="235" />
              <text textAnchor="end" x="38" y="239">40kW</text>
            </g>

            <line
              stroke="#ffb4ab"
              strokeDasharray="6,4"
              strokeOpacity="0.7"
              strokeWidth="1.2"
              x1="45"
              x2="875"
              y1="55"
              y2="55"
            />
            <text className="font-mono" fill="#ffb4ab" fontSize="9" x="52" y="48">
              200 kW Critical Limit
            </text>

            <line
              stroke="#d0bcff"
              strokeDasharray="4,4"
              strokeOpacity="0.55"
              strokeWidth="1"
              x1="45"
              x2="875"
              y1="100"
              y2="100"
            />
            <text className="font-mono" fill="#d0bcff" fontSize="9" x="52" y="93">
              160 kW Soft Warning
            </text>

            <rect fill="url(#peakDangerBand)" height="225" rx="2" width="120" x="645" y="15" />
            <text
              className="font-mono"
              fill="#ffb4ab"
              fontSize="9"
              textAnchor="middle"
              x="705"
              y="28"
            >
              Peak Tariff Zone
            </text>

            {showWeather && (
              <g>
                <path
                  d="M240,235 Q340,220 400,145 Q455,95 510,140 Q580,205 660,235 L660,240 L240,240 Z"
                  fill="url(#solarGenFill)"
                />
                <path
                  d="M240,235 Q340,220 400,145 Q455,95 510,140 Q580,205 660,235"
                  fill="none"
                  stroke="#4edea3"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </g>
            )}

            {showBaseline && (
              <path
                d="M45,205 C115,212 185,195 255,155 C325,120 395,115 465,128 C535,135 605,110 685,78 C735,72 795,125 875,180"
                fill="none"
                stroke="#869397"
                strokeDasharray="4,4"
                strokeOpacity="0.65"
                strokeWidth="1.5"
              />
            )}

            {showEV && (
              <path
                d="M45,220 Q200,225 350,195 T685,165 T875,210"
                fill="none"
                stroke="#4cd7f6"
                strokeDasharray="2,3"
                strokeWidth="1.8"
              />
            )}

            {showConfidence && (
              <path
                d="M45,195 C115,202 185,180 255,140 C325,105 395,98 465,112 C535,120 615,85 685,56 C735,52 795,108 875,165 L875,185 C795,128 735,76 685,82 C615,108 535,140 465,132 C395,118 325,125 255,158 C185,196 115,216 45,210 Z"
                fill="#d0bcff"
                fillOpacity={confidence === '95' ? 0.14 : 0.08}
              />
            )}

            <path
              d="M45,202 C115,209 185,188 255,149 C325,115 395,108 465,122 C535,130 615,96 685,68 C735,64 795,118 875,175 L875,240 L45,240 Z"
              fill="url(#aiForecastFill)"
            />
            <path
              d="M45,202 C115,209 185,188 255,149 C325,115 395,108 465,122 C535,130 615,96 685,68 C735,64 795,118 875,175"
              fill="none"
              stroke="#4cd7f6"
              strokeLinecap="round"
              strokeWidth="2.5"
            />

            <line
              stroke="#ffb4ab"
              strokeDasharray="2,2"
              strokeWidth="1"
              x1="685"
              x2="685"
              y1="68"
              y2="240"
            />
            <circle
              cx="685"
              cy="68"
              fill="#ffb4ab"
              r="4"
              stroke="#0f131d"
              strokeWidth="1.5"
            />
            <text
              className="font-mono"
              fill="#ffb4ab"
              fontSize="10"
              textAnchor="end"
              x="675"
              y="64"
            >
              19:00 Peak {(186.2 + (showEV ? 14.5 : 0) + tempAdjustmentC * 3.1).toFixed(1)} kW
            </text>

            <circle
              cx="455"
              cy="118"
              fill="#4edea3"
              r="4"
              stroke="#0f131d"
              strokeWidth="1.5"
            />
            <text
              className="font-mono"
              fill="#4edea3"
              fontSize="9"
              textAnchor="middle"
              x="455"
              y="108"
            >
              13:00 PV Peak 112 kW
            </text>

            <g className="text-[10px] fill-on-surface-variant font-mono" textAnchor="middle">
              <text x="45" y="262">00:00</text>
              <text x="115" y="262">02:00</text>
              <text x="185" y="262">04:00</text>
              <text x="255" y="262">06:00</text>
              <text x="325" y="262">08:00</text>
              <text x="395" y="262">10:00</text>
              <text x="465" y="262">12:00</text>
              <text x="535" y="262">14:00</text>
              <text x="605" y="262">16:00</text>
              <text className="fill-error font-semibold" x="685" y="262">19:00</text>
              <text x="775" y="262">21:00</text>
              <text x="865" y="262">23:00</text>
            </g>
          </svg>
        </div>
      </div>

      {/* 4. HIGH-DENSITY HOURLY DISPATCH SCHEDULE TABLE */}
      <div className="bg-surface-container-low border border-outline-variant/25 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Hourly Dispatch Schedule
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/25 px-3 py-1.5 rounded-DEFAULT">
              <span className="material-symbols-outlined text-outline text-base mr-1.5">
                search
              </span>
              <input
                aria-label="Filter hourly schedule"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent font-body-sm text-body-sm text-on-surface placeholder-outline focus:outline-none w-44"
                placeholder="Filter schedule..."
                type="text"
              />
            </div>
            <select
              aria-label="Filter by risk level"
              value={riskFilter}
              onChange={(e) =>
                setRiskFilter(e.target.value as 'all' | 'critical' | 'moderate' | 'normal')
              }
              className="bg-surface-container-lowest border border-outline-variant/25 px-3 py-1.5 rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 text-label-sm text-outline">
                <th className="py-2.5 px-5">Hour</th>
                <th className="py-2.5 px-4 text-right">Predicted Load (kW)</th>
                <th className="py-2.5 px-4 text-right">Solar PV (kW)</th>
                <th className="py-2.5 px-4 text-right">Net Demand</th>
                <th className="py-2.5 px-4">Risk State</th>
                <th className="py-2.5 px-4">Control Strategy</th>
                <th className="py-2.5 px-5 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 font-body-sm text-body-sm">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    <span>No schedule intervals match the selected filter.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setRiskFilter('all');
                      }}
                      className="ml-3 text-primary hover:underline font-mono text-xs cursor-pointer"
                    >
                      Reset Table Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.hour}
                    className={
                      row.isCriticalRow
                        ? 'bg-error-container/15 hover:bg-error-container/25 transition-colors'
                        : 'hover:bg-surface-container/60 transition-colors'
                    }
                  >
                    <td
                      className={`py-2.5 px-5 font-mono ${
                        row.isCriticalRow
                          ? 'text-error font-semibold'
                          : 'text-on-surface font-medium'
                      }`}
                    >
                      {row.hour}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono ${
                        row.isCriticalRow
                          ? 'font-semibold text-error'
                          : 'text-on-surface'
                      }`}
                    >
                      {row.loadKw}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono ${
                        row.solarKw.startsWith('+')
                          ? 'text-secondary font-medium'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {row.solarKw}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono ${
                        row.isCriticalRow
                          ? 'text-error font-semibold'
                          : 'text-on-surface'
                      }`}
                    >
                      {row.netDemand}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-label-sm">
                      {row.riskLevel === 'Normal' && (
                        <span className="text-secondary">Normal</span>
                      )}
                      {row.riskLevel === 'Moderate' && (
                        <span className="text-tertiary">Moderate</span>
                      )}
                      {row.riskLevel === 'Critical' && (
                        <span className="text-error font-semibold">Critical</span>
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-4 ${
                        row.isCriticalRow
                          ? 'text-on-surface font-medium'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {row.strategy}
                    </td>
                    <td
                      className={`py-2.5 px-5 text-right font-mono ${
                        row.isCriticalRow
                          ? 'text-error font-semibold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {row.variance}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
