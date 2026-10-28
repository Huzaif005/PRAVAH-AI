import type {
  WorkspaceAnalysisRequest,
  WorkspaceAnalysisResponse,
  SimulationRequest,
  SimulationResponse,
} from '../types/backendTypes.ts';
import { buildDeterministicAnalysis } from '../../src/services/workspaceAnalyzer.ts';

export class PhysicsSolver {
  /**
   * Deterministic solver for workspace analysis (rule-based engineering dispatch).
   */
  static solveWorkspaceAnalysis(req: WorkspaceAnalysisRequest): WorkspaceAnalysisResponse {
    return buildDeterministicAnalysis(req, 'deterministic-solver');
  }

  /**
   * Deterministic digital twin microgrid stress simulation solver.
   */
  static runSimulation(req: SimulationRequest): SimulationResponse {
    const {
      demandVal,
      solarVal,
      tempVal,
      socVal,
      gridOnline,
      tariffVal,
      contingency,
    } = req;

    // Contingency and temperature impact multipliers
    const tempFactor = 1 + (tempVal - 85) * 0.004;
    const contingencyBoost =
      contingency === 'ev'
        ? 18.5
        : contingency === 'cloud'
        ? 12.0
        : contingency === 'trip'
        ? 24.0
        : 0;

    const baseUnmitigated = (145 + demandVal * 0.85) * tempFactor + contingencyBoost;
    const solarGenKw = (solarVal / 100) * 110;

    // BESS dispatch calculation: shave peaks exceeding soft feeder rating of 160 kW
    const targetFeederCap = 160;
    const peakDelta = Math.max(0, baseUnmitigated - targetFeederCap);
    
    // Battery discharge constrained by SOC (cannot discharge below 15% reserve floor)
    const availableCapacityRatio = Math.max(0, (socVal - 15) / 85);
    const maxBessRate = 45.0; // kW max inverter rating
    const bessDischargeKw = Math.min(peakDelta, maxBessRate * availableCapacityRatio);

    const mitigatedPeak = +(baseUnmitigated - bessDischargeKw).toFixed(1);
    const unmitigatedPeak = +(baseUnmitigated).toFixed(1);

    // End-of-window battery State of Charge
    const energyDischargedKwh = bessDischargeKw * 3.5; // ~3.5h peak window
    const batteryCapacityKwh = 160; // 160 kWh BESS
    const effectiveSoC = Math.max(
      15,
      +(socVal - (energyDischargedKwh / batteryCapacityKwh) * 100).toFixed(1)
    );

    // Transformer thermal loading percentage relative to 160 kW continuous rating
    const thermalLoadPct = +((mitigatedPeak / targetFeederCap) * 100).toFixed(1);

    // Cost metrics
    const peakCostPerKwh = 0.28 * tariffVal;
    const baselineDailyCost = +((baseUnmitigated * 4 * peakCostPerKwh) + 220).toFixed(2);
    const mitigatedDailyCost = +((mitigatedPeak * 4 * peakCostPerKwh) + 220).toFixed(2);
    const dailySavings = +(baselineDailyCost - mitigatedDailyCost).toFixed(2);

    const warnings: string[] = [];
    if (!gridOnline) {
      warnings.push('Microgrid operates in islanded mode: synchronous inverter grid-forming control active.');
    }
    if (effectiveSoC <= 20) {
      warnings.push(`Projected BESS reserve (${effectiveSoC}%) nears the 15% emergency reserve floor.`);
    }
    if (mitigatedPeak > targetFeederCap) {
      warnings.push(`Feeder demand (${mitigatedPeak} kW) exceeds 160 kW transformer rating by +${+(mitigatedPeak - targetFeederCap).toFixed(1)} kW.`);
    }
    if (contingency === 'trip') {
      warnings.push('Feeder Trip active: non-critical campus chiller loads shed by automatic PLC interlock.');
    }

    // Hourly series simulation
    const hours = ['00:00', '04:00', '08:00', '12:00', '15:00', '17:00', '19:00', '21:00', '23:00'];
    const hourlySeries = hours.map((h, idx) => {
      let bKw = 60 + idx * 12;
      if (h === '19:00') bKw = unmitigatedPeak;
      else if (h === '17:00') bKw = unmitigatedPeak * 0.9;
      else if (h === '12:00') bKw = 148;

      let mKw = bKw;
      if (h === '19:00') mKw = mitigatedPeak;
      else if (h === '17:00') mKw = Math.min(bKw, 144);

      let sKw = 0;
      if (h === '08:00') sKw = 28;
      else if (h === '12:00') sKw = +(solarGenKw).toFixed(1);
      else if (h === '15:00') sKw = +(solarGenKw * 0.7).toFixed(1);
      else if (h === '17:00') sKw = +(solarGenKw * 0.2).toFixed(1);

      let sPct = socVal;
      if (h === '12:00') sPct = Math.min(95, socVal + 15);
      else if (h === '19:00') sPct = effectiveSoC;
      else if (h === '21:00') sPct = Math.max(15, effectiveSoC - 5);

      return {
        hour: h,
        baselineKw: +bKw.toFixed(1),
        mitigatedKw: +mKw.toFixed(1),
        solarKw: sKw,
        socPct: +sPct.toFixed(1),
      };
    });

    return {
      unmitigatedPeakKw: unmitigatedPeak,
      mitigatedPeakKw: mitigatedPeak,
      bessDischargeKw: +bessDischargeKw.toFixed(1),
      effectiveSoCPct: effectiveSoC,
      transformerThermalLoadPct: thermalLoadPct,
      estimatedCostPerDayUsd: mitigatedDailyCost,
      costSavingsPerDayUsd: dailySavings,
      warningAlerts: warnings,
      hourlySeries,
    };
  }
}
