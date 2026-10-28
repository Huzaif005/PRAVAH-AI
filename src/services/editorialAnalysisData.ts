import { AnalysisRecord } from '../types';
import { analyzeWorkspace } from './workspaceAnalyzer';

export const INITIAL_ANALYSES: AnalysisRecord[] = [
  {
    id: 'ANL-2026-104',
    title: 'North Campus Feeder #04 Evening Peak Mitigation',
    substationZone: 'North Campus · Interconnect #04',
    createdAt: 'Oct 28, 2026 · 14:20',
    status: 'Completed',
    modelUsed: 'Gemini 3.8 Flash + Solver',
    isIllustrativeDemo: true,
    scenarioNotes:
      'Evaluate 17:00–21:00 time-of-use peak tariff window with concurrent HVAC chiller staging and 18 kW EV fleet arrival.',
    feederCapKw: 160,
    bessReserveFloorPct: 20,
    tariffWindow: '17:00 – 21:00 Peak TOU ($0.42/kWh)',
    ambientTempC: 33,
    includeEvFleet: true,
    executiveSummary:
      'Unmitigated feeder demand is projected to reach 186.2 kW at 19:00, exceeding the 160.0 kW soft transformer rating by 26.2 kW. Scheduling a 38.2 kW LFP battery discharge from 18:15 to 20:45 combined with pre-cooling Zone 2 chillers at 15:30 holds net feeder import to 148.0 kW while maintaining a 24% battery state-of-charge floor.',
    unmitigatedPeakKw: 186.2,
    mitigatedPeakKw: 148.0,
    bessDischargeKw: 38.2,
    estimatedDailyDeltaUsd: 342.2,
    uncertaintyRangeKw: '±6.4 kW (15-min rolling thermal & irradiance band)',
    hourlySeries: [
      { hour: '00:00', baselineKw: 68, mitigatedKw: 68, solarKw: 0, socPct: 62 },
      { hour: '04:00', baselineKw: 62, mitigatedKw: 62, solarKw: 0, socPct: 60 },
      { hour: '08:00', baselineKw: 114, mitigatedKw: 102, solarKw: 32, socPct: 68 },
      { hour: '12:00', baselineKw: 148, mitigatedKw: 94, solarKw: 96, socPct: 86 },
      { hour: '15:00', baselineKw: 156, mitigatedKw: 138, solarKw: 68, socPct: 92 },
      { hour: '17:00', baselineKw: 168, mitigatedKw: 144, solarKw: 18, socPct: 84 },
      { hour: '19:00', baselineKw: 186.2, mitigatedKw: 148.0, solarKw: 0, socPct: 48 },
      { hour: '21:00', baselineKw: 154, mitigatedKw: 139, solarKw: 0, socPct: 26 },
      { hour: '23:00', baselineKw: 98, mitigatedKw: 108, solarKw: 0, socPct: 38 },
    ],
    factors: [
      {
        name: '19:00 HVAC & EV Coincidence',
        direction: 'Increases risk',
        contribution: '+28.4 kW at 19:00',
        explanation:
          'Ambient temperature of 33°C sustains chiller compressor load into early evening while fleet chargers initiate at 18:15.',
      },
      {
        name: 'BESS Rack #02 Peak Shaving',
        direction: 'Reduces peak',
        contribution: '-38.2 kW (18:15–20:45)',
        explanation:
          'Discharging 95.5 kWh across the 2.5-hour window trims net utility import below the 160 kW soft ceiling.',
      },
      {
        name: 'Midday Solar PV Recharge',
        direction: 'Stabilizes reserve',
        contribution: '+96.0 kW peak PV at 12:30',
        explanation:
          'Surplus rooftop generation charges storage from 60% to 92% SoC prior to the evening tariff window.',
      },
      {
        name: 'Peak Demand Ratchet Avoidance',
        direction: 'Tariff exposure',
        contribution: '-$342.20 / day illustrative delta',
        explanation:
          'Preventing a 15-minute interval excursion above 160 kW avoids the monthly utility capacity ratchet charge.',
      },
    ],
    limitations: [
      'Telemetry series reflects illustrative 15-minute SCADA intervals and does not account for sub-second harmonic transients.',
      'Solar recharge projection assumes clear-sky pyranometer conditions; rapid cumulus cloud transients can reduce midday SoC accumulation by 12–18%.',
      'Battery cycle degradation estimates assume LFP cell temperatures remain between 22°C and 32°C.',
    ],
    humanDecision: {
      status: 'Approved for schedule',
      reviewer: 'E. Vance, Lead Grid Engineer',
      note: 'Verified against Feeder #04 thermal relay limits. Scheduled for 18:15 execution.',
      decidedAt: 'Oct 28, 2026 · 14:26',
    },
  },
  {
    id: 'ANL-2026-103',
    title: 'Sector 4 Cloud Transient & Storage Reserve Stress Test',
    substationZone: 'Sector 4 · Manufacturing Bus B',
    createdAt: 'Oct 27, 2026 · 16:45',
    status: 'Review required',
    modelUsed: 'Gemini 3.8 Flash + Solver',
    isIllustrativeDemo: true,
    scenarioNotes:
      'Assess sudden 40% midday solar irradiance drop during high-load induction furnace batch cycle.',
    feederCapKw: 175,
    bessReserveFloorPct: 25,
    tariffWindow: '12:00 – 18:00 Shoulder Tier ($0.28/kWh)',
    ambientTempC: 29,
    includeEvFleet: false,
    executiveSummary:
      'A 40% solar curtailment between 13:00 and 14:30 reduces midday BESS charging, leaving storage at 68% SoC entering the evening ramp. To preserve the 25% reserve floor, evening discharge must be capped at 29.0 kW, resulting in a 168.5 kW feeder peak.',
    unmitigatedPeakKw: 197.5,
    mitigatedPeakKw: 168.5,
    bessDischargeKw: 29.0,
    estimatedDailyDeltaUsd: 248.0,
    uncertaintyRangeKw: '±9.1 kW (high irradiance volatility)',
    hourlySeries: [
      { hour: '00:00', baselineKw: 72, mitigatedKw: 72, solarKw: 0, socPct: 55 },
      { hour: '04:00', baselineKw: 69, mitigatedKw: 69, solarKw: 0, socPct: 54 },
      { hour: '08:00', baselineKw: 128, mitigatedKw: 120, solarKw: 22, socPct: 58 },
      { hour: '12:00', baselineKw: 164, mitigatedKw: 142, solarKw: 54, socPct: 68 },
      { hour: '15:00', baselineKw: 170, mitigatedKw: 158, solarKw: 38, socPct: 66 },
      { hour: '17:00', baselineKw: 181, mitigatedKw: 162, solarKw: 12, socPct: 58 },
      { hour: '19:00', baselineKw: 197.5, mitigatedKw: 168.5, solarKw: 0, socPct: 34 },
      { hour: '21:00', baselineKw: 160, mitigatedKw: 151, solarKw: 0, socPct: 26 },
      { hour: '23:00', baselineKw: 104, mitigatedKw: 112, solarKw: 0, socPct: 35 },
    ],
    factors: [
      {
        name: 'Midday Cloud Ramp (-40% PV)',
        direction: 'Increases risk',
        contribution: '-42.0 kW solar deficit',
        explanation:
          'Limits midday storage recharge to 68% SoC prior to evening peak.',
      },
      {
        name: '25% Reserve Floor Constraint',
        direction: 'Stabilizes reserve',
        contribution: 'Caps discharge at 29.0 kW',
        explanation:
          'Prevents deep-discharge below emergency backup threshold.',
      },
    ],
    limitations: [
      'Illustrative stress scenario; actual furnace power factor corrections require local capacitor bank telemetry.',
      'Cloud transient modeled as a uniform step change across PV strings 01–03.',
    ],
  },
  {
    id: 'ANL-2026-102',
    title: 'Weekend Baseload & Transformer Maintenance Islanding Check',
    substationZone: 'Substation Yard · Bus Tie #01',
    createdAt: 'Oct 25, 2026 · 11:10',
    status: 'Completed',
    modelUsed: 'Deterministic Load Solver',
    isIllustrativeDemo: true,
    scenarioNotes:
      'Verify 4-hour planned utility disconnect window on Sunday 10:00–14:00 using solar PV and BESS droop control.',
    feederCapKw: 140,
    bessReserveFloorPct: 30,
    tariffWindow: '00:00 – 24:00 Off-Peak Weekend ($0.16/kWh)',
    ambientTempC: 24,
    includeEvFleet: false,
    executiveSummary:
      'Planned 4-hour islanded maintenance window between 10:00 and 14:00 is feasible with a 30% minimum SoC margin. Weekend facility baseload averages 88.4 kW and is 82% covered by midday rooftop solar.',
    unmitigatedPeakKw: 118.0,
    mitigatedPeakKw: 84.5,
    bessDischargeKw: 22.0,
    estimatedDailyDeltaUsd: 164.5,
    uncertaintyRangeKw: '±4.2 kW (low weekend occupancy variance)',
    hourlySeries: [
      { hour: '00:00', baselineKw: 58, mitigatedKw: 58, solarKw: 0, socPct: 78 },
      { hour: '04:00', baselineKw: 54, mitigatedKw: 54, solarKw: 0, socPct: 76 },
      { hour: '08:00', baselineKw: 82, mitigatedKw: 74, solarKw: 29, socPct: 82 },
      { hour: '12:00', baselineKw: 96, mitigatedKw: 42, solarKw: 88, socPct: 91 },
      { hour: '15:00', baselineKw: 102, mitigatedKw: 78, solarKw: 64, socPct: 88 },
      { hour: '17:00', baselineKw: 112, mitigatedKw: 84.5, solarKw: 20, socPct: 74 },
      { hour: '19:00', baselineKw: 118.0, mitigatedKw: 84.5, solarKw: 0, socPct: 52 },
      { hour: '21:00', baselineKw: 92, mitigatedKw: 82, solarKw: 0, socPct: 44 },
      { hour: '23:00', baselineKw: 68, mitigatedKw: 68, solarKw: 0, socPct: 48 },
    ],
    factors: [
      {
        name: 'Midday Islanded Solar Coverage',
        direction: 'Reduces peak',
        contribution: '82% load coverage',
        explanation:
          'Rooftop PV supplies 88 kW against 96 kW campus baseload during 10:00–14:00 disconnect.',
      },
      {
        name: 'Grid-Forming Inverter Droop Reserve',
        direction: 'Stabilizes reserve',
        contribution: '52% minimum SoC',
        explanation:
          'BESS maintains 22% headroom above the 30% critical islanding floor.',
      },
    ],
    limitations: [
      'Requires cold-load pickup relay coordination prior to utility re-closure at 14:00.',
    ],
    humanDecision: {
      status: 'Approved for schedule',
      reviewer: 'M. Lindqvist, Operations Director',
      note: 'Approved for Sunday maintenance window.',
      decidedAt: 'Oct 25, 2026 · 15:05',
    },
  },
  {
    id: 'ANL-2026-101',
    title: 'Chilled Water Loop Thermal Storage Pre-Cooling Study',
    substationZone: 'Central Utility Plant · Chiller #01–#02',
    createdAt: 'Oct 22, 2026 · 09:30',
    status: 'Draft',
    modelUsed: 'Deterministic Load Solver',
    isIllustrativeDemo: true,
    scenarioNotes:
      'Shift 22 kW of afternoon HVAC compressor demand into the 12:30–15:00 solar surplus window by lowering chilled water setpoint by 1.8°C.',
    feederCapKw: 165,
    bessReserveFloorPct: 20,
    tariffWindow: '17:00 – 21:00 Peak TOU ($0.42/kWh)',
    ambientTempC: 31,
    includeEvFleet: true,
    executiveSummary:
      'Pre-cooling the campus chilled water loop between 12:30 and 15:00 absorbs 55 kWh of midday solar PV that would otherwise be exported at low feed-in rates, reducing 18:00–20:00 HVAC electrical draw by 18.4 kW.',
    unmitigatedPeakKw: 181.0,
    mitigatedPeakKw: 149.6,
    bessDischargeKw: 31.4,
    estimatedDailyDeltaUsd: 289.4,
    uncertaintyRangeKw: '±5.8 kW (building occupancy thermal lag)',
    hourlySeries: [
      { hour: '00:00', baselineKw: 65, mitigatedKw: 65, solarKw: 0, socPct: 60 },
      { hour: '04:00', baselineKw: 60, mitigatedKw: 60, solarKw: 0, socPct: 58 },
      { hour: '08:00', baselineKw: 110, mitigatedKw: 105, solarKw: 30, socPct: 65 },
      { hour: '12:00', baselineKw: 140, mitigatedKw: 158, solarKw: 94, socPct: 82 },
      { hour: '15:00', baselineKw: 152, mitigatedKw: 146, solarKw: 70, socPct: 89 },
      { hour: '17:00', baselineKw: 166, mitigatedKw: 142, solarKw: 16, socPct: 80 },
      { hour: '19:00', baselineKw: 181.0, mitigatedKw: 149.6, solarKw: 0, socPct: 49 },
      { hour: '21:00', baselineKw: 148, mitigatedKw: 136, solarKw: 0, socPct: 31 },
      { hour: '23:00', baselineKw: 92, mitigatedKw: 98, solarKw: 0, socPct: 40 },
    ],
    factors: [
      {
        name: 'Thermal Mass Pre-Cooling Shift',
        direction: 'Reduces peak',
        contribution: '-18.4 kW evening HVAC load',
        explanation:
          'Reduces compressor duty cycle during peak TOU hours without exceeding occupant comfort bounds.',
      },
    ],
    limitations: [
      'Draft study awaiting zone humidity sensor calibration in Building C.',
    ],
  },
];

export async function createAnalysisFromWorkspace(params: {
  title: string;
  substationZone: string;
  scenarioNotes: string;
  feederCapKw: number;
  bessReserveFloorPct: number;
  tariffWindow: string;
  ambientTempC: number;
  includeEvFleet: boolean;
  modelChoice: 'Gemini 3.8 Flash + Solver' | 'Deterministic Load Solver';
  simulateFault?: boolean;
}): Promise<AnalysisRecord> {
  const response = await analyzeWorkspace({
    screenId: 'overview',
    workspaceName: params.title,
    inputSummary: `Zone: ${params.substationZone} · Cap: ${params.feederCapKw} kW · Reserve Floor: ${params.bessReserveFloorPct}% · Temp: ${params.ambientTempC}°C`,
    parameters: {
      feederCapKw: params.feederCapKw,
      reserveFloorPct: params.bessReserveFloorPct,
      ambientTempC: params.ambientTempC,
      includeEvFleet: params.includeEvFleet,
      tariffWindow: params.tariffWindow,
      scenarioNotes: params.scenarioNotes,
    },
    simulateFault: params.simulateFault,
  });

  const basePeak =
    176 +
    (params.ambientTempC - 28) * 2.4 +
    (params.includeEvFleet ? 14.5 : 0);
  const unmitigatedPeakKw = Number(basePeak.toFixed(1));
  const maxBessShave = Math.min(
    48,
    Math.max(16, (100 - params.bessReserveFloorPct) * 0.52)
  );
  const neededShave = Math.max(18, unmitigatedPeakKw - params.feederCapKw + 6);
  const bessDischargeKw = Number(Math.min(maxBessShave, neededShave).toFixed(1));
  const mitigatedPeakKw = Number((unmitigatedPeakKw - bessDischargeKw).toFixed(1));
  const estimatedDailyDeltaUsd = Number((bessDischargeKw * 8.95).toFixed(2));

  const nowStr = 'Oct 28, 2026 · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: `ANL-2026-${Math.floor(105 + Math.random() * 890)}`,
    title: params.title.trim() || 'Custom Feeder Dispatch Evaluation',
    substationZone: params.substationZone,
    createdAt: nowStr,
    status: mitigatedPeakKw > params.feederCapKw ? 'Review required' : 'Completed',
    modelUsed: params.modelChoice,
    isIllustrativeDemo: true,
    scenarioNotes: params.scenarioNotes,
    feederCapKw: params.feederCapKw,
    bessReserveFloorPct: params.bessReserveFloorPct,
    tariffWindow: params.tariffWindow,
    ambientTempC: params.ambientTempC,
    includeEvFleet: params.includeEvFleet,
    executiveSummary: response.summary,
    unmitigatedPeakKw,
    mitigatedPeakKw,
    bessDischargeKw,
    estimatedDailyDeltaUsd,
    uncertaintyRangeKw: `±${(4.8 + Math.abs(params.ambientTempC - 25) * 0.25).toFixed(1)} kW (15-min rolling forecast interval)`,
    hourlySeries: [
      { hour: '00:00', baselineKw: 66, mitigatedKw: 66, solarKw: 0, socPct: 60 },
      { hour: '04:00', baselineKw: 61, mitigatedKw: 61, solarKw: 0, socPct: 58 },
      { hour: '08:00', baselineKw: 115, mitigatedKw: 104, solarKw: 31, socPct: 67 },
      { hour: '12:00', baselineKw: 146, mitigatedKw: 96, solarKw: 92, socPct: 85 },
      { hour: '15:00', baselineKw: 158, mitigatedKw: 139, solarKw: 66, socPct: 91 },
      { hour: '17:00', baselineKw: 169, mitigatedKw: 145, solarKw: 16, socPct: 82 },
      {
        hour: '19:00',
        baselineKw: unmitigatedPeakKw,
        mitigatedKw: mitigatedPeakKw,
        solarKw: 0,
        socPct: Math.max(params.bessReserveFloorPct + 8, 44),
      },
      {
        hour: '21:00',
        baselineKw: 152,
        mitigatedKw: 138,
        solarKw: 0,
        socPct: params.bessReserveFloorPct + 3,
      },
      { hour: '23:00', baselineKw: 96, mitigatedKw: 105, solarKw: 0, socPct: 36 },
    ],
    factors: response.evidence.map((ev, index) => ({
      name: ev.source,
      direction:
        index === 0
          ? 'Increases risk'
          : index === 1
          ? 'Reduces peak'
          : 'Tariff exposure',
      contribution: ev.parameter,
      explanation: ev.observation,
    })),
    limitations: [
      'Analysis uses illustrative feeder impedance and tariff parameters configured in the workspace.',
      'Actual PLC dispatch requires local protection relay handshake verification prior to breaker execution.',
      'Uncertainty range reflects historical weather-load variance and does not guarantee future utility tariff rates.',
    ],
  };
}
