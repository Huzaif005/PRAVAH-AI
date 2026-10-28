import {
  WorkspaceAnalysisRequest,
  WorkspaceAnalysisResponse,
} from '../types';

export function buildDeterministicAnalysis(
  req: WorkspaceAnalysisRequest,
  engineSource: 'gemini-3.8-flash' | 'deterministic-solver' = 'deterministic-solver'
): WorkspaceAnalysisResponse {
  const now = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const params = req.parameters || {};

  switch (req.screenId) {
    case 'overview': {
      const horizon = String(params.timeHorizon || '24H');
      const targetCap = Number(params.feederCapKw || 160);
      const reserveFloor = Number(params.reserveFloorPct || 20);
      const shaveKw = Math.max(18, Math.min(52, 184.2 - targetCap + (30 - reserveFloor) * 0.4)).toFixed(1);
      const projectedPeak = (184.2 - Number(shaveKw)).toFixed(1);
      const dailySavings = (Number(shaveKw) * 11.4).toFixed(2);

      return {
        summary: `Dispatching BESS Rack #02 at ${shaveKw} kW during 18:30–21:00 holds Feeder #04 peak demand at ${projectedPeak} kW (within the ${targetCap} kW target ceiling) across the ${horizon} horizon.`,
        recommendedAction: `Arm ${shaveKw} kW BESS Peak-Shaving & HVAC Pre-Cooling (${horizon})`,
        recommendedWindow: '18:30 – 21:00 Peak Tariff Window',
        metrics: [
          {
            label: 'Predicted Feeder Peak',
            baseline: '184.2 kW',
            projected: `${projectedPeak} kW`,
            delta: `-${shaveKw} kW`,
            status: Number(projectedPeak) <= targetCap ? 'optimal' : 'warning',
          },
          {
            label: 'Net Tariff Savings',
            baseline: '$0.00 / day',
            projected: `+$${dailySavings} / day`,
            delta: '+18.4% vs base',
            status: 'optimal',
          },
          {
            label: 'BESS Post-Window SoC',
            baseline: '74.0% SoC',
            projected: `${Math.max(reserveFloor, 38).toFixed(1)}% SoC`,
            delta: `Floor ${reserveFloor}% respected`,
            status: 'optimal',
          },
          {
            label: 'Self-Consumption Ratio',
            baseline: '63.0%',
            projected: '88.4%',
            delta: '+25.4% solar utilization',
            status: 'optimal',
          },
        ],
        evidence: [
          {
            source: 'Substation Feeder #04 Telemetry',
            parameter: `Target Cap: ${targetCap} kW`,
            observation: `Unmitigated evening ramp reaches 184.2 kW at 19:15 due to simultaneous HVAC and EV fleet load.`,
            confidence: '98.6%',
          },
          {
            source: 'LFP Storage Bank Rack #02',
            parameter: `SoC Floor: ${reserveFloor}%`,
            observation: `185 kWh available stored energy supports ${shaveKw} kW continuous discharge for 2.5 hours without breaching reserve floor.`,
            confidence: '99.1%',
          },
          {
            source: 'Utility TOU Tariff Schedule',
            parameter: 'Peak Multiplier 2.4x ($0.42/kWh)',
            observation: `Avoiding demand ratchet above ${targetCap} kW prevents monthly capacity surcharge and saves $${dailySavings}.`,
            confidence: '97.8%',
          },
        ],
        engineSource,
        timestamp: now,
      };
    }

    case 'demand-forecast': {
      const horizon = String(params.horizon || '24h');
      const confidence = String(params.confidence || '95');
      const evLoadIncluded = Boolean(params.showEV);
      const tempOffset = Number(params.tempAdjustmentC || 0);
      const basePeak = 186.2 + (evLoadIncluded ? 14.5 : 0) + tempOffset * 3.1;
      const mitigatedPeak = (basePeak - 34.0).toFixed(1);

      return {
        summary: `${horizon.toUpperCase()} load forecast (${confidence}% confidence band) projects an unmitigated peak of ${basePeak.toFixed(1)} kW at 19:00. Pre-scheduled 34.0 kW BESS discharge reduces net feeder peak to ${mitigatedPeak} kW.`,
        recommendedAction: `Lock ${horizon.toUpperCase()} Forecast Curve & Arm 19:00 BESS Shave`,
        recommendedWindow: '19:00 – 20:30 Critical Peak Interval',
        metrics: [
          {
            label: '19:00 Unmitigated Peak',
            baseline: '186.2 kW',
            projected: `${basePeak.toFixed(1)} kW`,
            delta: `${evLoadIncluded ? '+14.5 kW EV' : 'Baseline EV'}`,
            status: basePeak > 195 ? 'critical' : 'warning',
          },
          {
            label: 'Mitigated Net Demand',
            baseline: `${basePeak.toFixed(1)} kW`,
            projected: `${mitigatedPeak} kW`,
            delta: '-34.0 kW BESS shave',
            status: Number(mitigatedPeak) <= 165 ? 'optimal' : 'warning',
          },
          {
            label: 'Midday Solar PV Capture',
            baseline: '88.6 kW (12:00)',
            projected: '112.0 kW (13:00)',
            delta: '+26.4% recharge flux',
            status: 'optimal',
          },
          {
            label: 'Forecast MAPE Accuracy',
            baseline: '1.8% Error',
            projected: '1.2% Error',
            delta: `${confidence}% Conf. Band`,
            status: 'optimal',
          },
        ],
        evidence: [
          {
            source: 'Meteorological Pyranometer Array',
            parameter: `Ambient Δ: ${tempOffset >= 0 ? '+' : ''}${tempOffset}°C`,
            observation: `Clear Sky Index 0.89 with 845 W/m² irradiance supports full BESS recharge between 11:30 and 15:00.`,
            confidence: `${confidence}.4%`,
          },
          {
            source: 'Feeder Load Regression Model',
            parameter: `EV Fleet Layer: ${evLoadIncluded ? 'Included' : 'Excluded'}`,
            observation: `Chiller compressor staging accounts for 44% of the 17:30–19:30 load inflection.`,
            confidence: '96.9%',
          },
          {
            source: 'IEEE 2030.5 Dispatch Solver',
            parameter: '15-Minute Rolling Horizon',
            observation: `Pre-cooling thermal mass at 16:00 shifts 18.4 kW of HVAC demand out of the 19:00 critical window.`,
            confidence: '98.2%',
          },
        ],
        engineSource,
        timestamp: now,
      };
    }

    case 'microgrid-simulator': {
      const demandVal = Number(params.demandVal ?? 15);
      const solarVal = Number(params.solarVal ?? 65);
      const socVal = Number(params.socVal ?? 82);
      const gridOnline = Boolean(params.gridOnline ?? true);
      const tariffVal = Number(params.tariffVal ?? 1.8);
      const contingency = String(params.contingency || 'ev');

      const rawDemand = 126.6 * (1 + demandVal / 100) + (contingency === 'ev' ? 8 : contingency === 'trip' ? 12 : 0);
      const bessDischarge = Math.min(60, Math.max(12, (socVal / 100) * 48 + (rawDemand - 120) * 0.25));
      const mitigatedPeak = Math.max(105, rawDemand + 24 - bessDischarge * 0.68);
      const savings = (bessDischarge * 4.8 * tariffVal + solarVal * 1.1).toFixed(2);

      return {
        summary: `Digital twin stress test (${gridOnline ? 'Grid-Tied' : 'Islanded Mode'}, contingency: ${contingency.toUpperCase()}) stabilized facility load at ${mitigatedPeak.toFixed(1)} kW with ${bessDischarge.toFixed(1)} kW BESS discharge and -$${savings} daily cost delta.`,
        recommendedAction: `Commit Simulated Dispatch Sequence (${bessDischarge.toFixed(1)} kW BESS / ${gridOnline ? 'Grid-Synced' : 'Islanded'})`,
        recommendedWindow: '17:00 – 21:00 Stress Mitigation Window',
        metrics: [
          {
            label: 'Simulated Peak Load',
            baseline: `${(rawDemand + 24).toFixed(1)} kW`,
            projected: `${mitigatedPeak.toFixed(1)} kW`,
            delta: `-${(bessDischarge * 0.68).toFixed(1)} kW shaved`,
            status: mitigatedPeak <= 165 ? 'optimal' : 'warning',
          },
          {
            label: 'BESS Peak Discharge',
            baseline: '15.0 kW',
            projected: `${bessDischarge.toFixed(1)} kW`,
            delta: `Initial SoC ${socVal}%`,
            status: socVal >= 25 ? 'optimal' : 'warning',
          },
          {
            label: 'Projected Tariff Savings',
            baseline: '$180.00 / day',
            projected: `$${savings} / day`,
            delta: `${tariffVal}x Tariff Tier`,
            status: 'optimal',
          },
          {
            label: 'Bus Voltage Stability',
            baseline: '96.4%',
            projected: gridOnline ? '99.2%' : '97.8%',
            delta: gridOnline ? 'Grid-Tied' : 'Islanded Droop Control',
            status: 'optimal',
          },
        ],
        evidence: [
          {
            source: 'Digital Twin Power Flow Solver',
            parameter: `Demand +${demandVal}% | Solar ${solarVal}%`,
            observation: `Net bus balance converges in 14 iterations with zero under-frequency load shedding required.`,
            confidence: '99.0%',
          },
          {
            source: 'BESS Inverter Rack #01–#02',
            parameter: `Usable Reserve: ${((250 * socVal) / 100).toFixed(1)} kWh`,
            observation: `C-rate remains at 0.42C during peak shave, keeping LFP cell temperature below 32.8°C.`,
            confidence: '98.4%',
          },
          {
            source: 'Contingency Injection Engine',
            parameter: `Event: ${contingency.toUpperCase()}`,
            observation: `Automated throttling of non-essential EV chargers recovers 18.5 kW of feeder thermal headroom within 1.2 seconds.`,
            confidence: '97.5%',
          },
        ],
        engineSource,
        timestamp: now,
      };
    }

    case 'decision-lab': {
      const strategy = String(params.activeStrategy || 'A');
      const horizon = String(params.horizon || '24H');
      const isA = strategy === 'A';

      return {
        summary: `Strategy ${strategy} (${isA ? 'Balanced Dispatch' : 'Max Arbitrage'}) evaluated over ${horizon} reduces peak grid demand from 186.4 kW to ${isA ? '148.2 kW' : '139.0 kW'} while saving ${isA ? '$342.20/day' : '$376.40/day'}.`,
        recommendedAction: `Deploy Strategy ${strategy}: ${isA ? 'Balanced Peak Shaving & Longevity' : 'Maximum TOU Tariff Arbitrage'}`,
        recommendedWindow: '17:00 – 21:00 Daily Dispatch Policy',
        metrics: [
          {
            label: 'Peak Grid Demand',
            baseline: '186.4 kW',
            projected: isA ? '148.2 kW' : '139.0 kW',
            delta: isA ? '-38.2 kW (-20.5%)' : '-47.4 kW (-25.4%)',
            status: 'optimal',
          },
          {
            label: 'Daily Operating Cost',
            baseline: '$1,482.50',
            projected: isA ? '$1,140.30' : '$1,106.10',
            delta: isA ? '-$342.20 / day' : '-$376.40 / day',
            status: 'optimal',
          },
          {
            label: 'BESS Cycle Degradation',
            baseline: '1.45 eq cycles/d',
            projected: isA ? '0.68 eq cycles/d' : '1.18 eq cycles/d',
            delta: isA ? '+4.2 yrs service life' : '+1.8 yrs service life',
            status: isA ? 'optimal' : 'warning',
          },
          {
            label: 'Solar Self-Consumption',
            baseline: '64.0%',
            projected: isA ? '94.8%' : '91.2%',
            delta: isA ? '+30.8% capture' : '+27.2% capture',
            status: 'optimal',
          },
        ],
        evidence: [
          {
            source: 'Multi-Objective Pareto Solver',
            parameter: `Policy: Strategy ${strategy} (${horizon})`,
            observation: isA
              ? 'Limits depth-of-discharge to 20%–88% SoC window, cutting lithium plating stress by 53% vs. unregulated baseline.'
              : 'Deep-cycles BESS down to 15% SoC floor during $0.42/kWh peak tariff to maximize short-term arbitrage yield.',
            confidence: '96.4%',
          },
          {
            source: 'Campus Interconnect #04 Relay',
            parameter: '160 kW Soft Threshold',
            observation: `Both candidate strategies eliminate the 19:00 feeder overload excursion observed under legacy rule-based operation.`,
            confidence: '99.2%',
          },
          {
            source: 'Solar Array Alpha Telemetry',
            parameter: '450 kWp Rooftop PV',
            observation: `Midday curtailment drops to 0.0 kWh by synchronizing BESS absorption with 12:15–14:45 irradiance peak.`,
            confidence: '98.2%',
          },
        ],
        engineSource,
        timestamp: now,
      };
    }

    case 'alerts-and-events': {
      const severityFilter = String(params.severityFilter || 'all');
      const targetThresholdKw = Number(params.peakTriggerKw || 175);

      return {
        summary: `Root-cause triage across active ${severityFilter.toUpperCase()} events confirms Feeder #04 transient (194.8 kW) and PV-02 cloud drop (-38%) are fully mitigated by automated 42 kW BESS discharge.`,
        recommendedAction: `Confirm Automated Protection Response & Lock ${targetThresholdKw} kW Relay Trigger`,
        recommendedWindow: 'Immediate PLC Relay Execution',
        metrics: [
          {
            label: 'Feeder #04 Overload Excursion',
            baseline: '194.8 kW Peak',
            projected: '152.8 kW Mitigated',
            delta: '-42.0 kW BESS response',
            status: 'optimal',
          },
          {
            label: 'Protection Response Latency',
            baseline: '4.8s Manual',
            projected: '1.4s Autonomous',
            delta: '-3.4s faster clears',
            status: 'optimal',
          },
          {
            label: 'Inverter #03 Thermal State',
            baseline: '88.0°C (Warning)',
            projected: '74.5°C (Derated)',
            delta: '-13.5°C reactive trim',
            status: 'optimal',
          },
          {
            label: 'Unacknowledged Criticals',
            baseline: '1 Active',
            projected: '0 Active',
            delta: 'Triaged & Verified',
            status: 'optimal',
          },
        ],
        evidence: [
          {
            source: 'Main Feeder #04 Protection Relay',
            parameter: `Trigger Setpoint: ${targetThresholdKw} kW`,
            observation: `Current transformer sensed 194.8 kW at 14:28:04; BESS-A injected 42 kW within 1,420 ms to prevent breaker trip.`,
            confidence: '99.5%',
          },
          {
            source: 'Rooftop Array PV-02 String Monitor',
            parameter: '-38% Irradiance Transient',
            observation: `Cumulus cloud edge crossed Sector B at 14:15:22; BESS ramp-rate smoothing held ramp below 8%/min.`,
            confidence: '98.7%',
          },
          {
            source: 'Inverter #03 Heatsink RTD Sensor',
            parameter: 'IGBT Junction Temp 88°C',
            observation: `Curtailing reactive power injection by 12 kVAR reduces thermal loading without sacrificing real kW output.`,
            confidence: '97.9%',
          },
        ],
        engineSource,
        timestamp: now,
      };
    }

    case 'reports': {
      const facility = String(params.facility || 'North Campus Microgrid (All Zones)');
      const period = String(params.period || 'Last 30 Days (Oct 1 - Oct 30)');
      const format = String(params.format || 'PDF');

      return {
        summary: `Compiled verified ${format} audit statement for ${facility} (${period}): $18,420 net cost savings, 14.2 Tons Scope 2 CO₂e avoided, and 22.4% peak demand reduction.`,
        recommendedAction: `Certify & Publish ${format} Compliance Audit (${facility})`,
        recommendedWindow: 'Q4 Sustainability & Tariff Filing Window',
        metrics: [
          {
            label: 'Verified Net Cost Savings',
            baseline: '$16,120 Prior Period',
            projected: '$18,420 Current',
            delta: '+14.2% vs baseline',
            status: 'optimal',
          },
          {
            label: 'Scope 2 CO₂e Avoided',
            baseline: '11.8 Tons',
            projected: '14.2 Tons',
            delta: '+2.4 Tons certified',
            status: 'optimal',
          },
          {
            label: 'Peak Demand Reduction',
            baseline: '18.1%',
            projected: '22.4%',
            delta: '1,240 kW shaved',
            status: 'optimal',
          },
          {
            label: 'Solar Self-Consumption',
            baseline: '89.2%',
            projected: '94.8%',
            delta: '0.0 kWh curtailed',
            status: 'optimal',
          },
        ],
        evidence: [
          {
            source: 'Revenue-Grade Utility Meter #M-01',
            parameter: `Period: ${period}`,
            observation: `ANSI C12.20 Class 0.2 meter logs confirm 54,750 kWh total optimized dispatch across peak and shoulder windows.`,
            confidence: '99.9%',
          },
          {
            source: 'EPA eGRID Subregion Carbon Ledger',
            parameter: '0.385 kg CO₂e / kWh Factor',
            observation: `Solar self-consumption and peak gas-peaker displacement yielded 14.2 metric tons of verifiable Scope 2 abatement.`,
            confidence: '99.4%',
          },
          {
            source: 'BESS Warranty Telemetry Archive',
            parameter: 'State-of-Health (SoH) 98.7%',
            observation: `Thermal and C-rate logs confirm zero warranty excursions across all 30 billing days.`,
            confidence: '99.6%',
          },
        ],
        engineSource,
        timestamp: now,
      };
    }

    case 'settings':
    default: {
      const softCap = Number(params.softCap || 4200);
      const criticalCap = Number(params.criticalCap || 4500);
      const bessFloor = Number(params.bessFloor || 15);
      const bessCeiling = Number(params.bessCeiling || 95);
      const aiWeightCost = Number(params.aiWeightCost || 65);

      return {
        summary: `PLC governance policy validated: Soft Cap ${softCap} kW, Critical Ceiling ${criticalCap} kW, BESS operating band ${bessFloor}%–${bessCeiling}% SoC, and ${aiWeightCost}% Cost / ${100 - aiWeightCost}% Carbon solver weighting.`,
        recommendedAction: `Commit Validated Governance Policy to OPC-UA PLC Controller`,
        recommendedWindow: 'Immediate PLC Register Write',
        metrics: [
          {
            label: 'Feeder Protection Margin',
            baseline: '300 kW Buffer',
            projected: `${criticalCap - softCap} kW Buffer`,
            delta: `${softCap} / ${criticalCap} kW`,
            status: criticalCap - softCap >= 200 ? 'optimal' : 'warning',
          },
          {
            label: 'Usable BESS Cycling Band',
            baseline: '75% Window',
            projected: `${bessCeiling - bessFloor}% Window`,
            delta: `${bessFloor}%–${bessCeiling}% SoC`,
            status: 'optimal',
          },
          {
            label: 'Solver Objective Balance',
            baseline: '50% / 50%',
            projected: `${aiWeightCost}% Cost / ${100 - aiWeightCost}% CO₂`,
            delta: 'Pareto Converged',
            status: 'optimal',
          },
          {
            label: 'OPC-UA Relay Handshake',
            baseline: '32 / 32 Online',
            projected: '14 ms Roundtrip',
            delta: 'CRC Verified',
            status: 'optimal',
          },
        ],
        evidence: [
          {
            source: 'OPC-UA PLC Gateway Validator',
            parameter: String(params.plcEndpoint || 'opc.tcp://10.24.4.108:4840/gridmind/plc'),
            observation: `All 32 Modbus/OPC-UA protection registers passed bounds verification with zero address collisions.`,
            confidence: '99.8%',
          },
          {
            source: 'BESS Battery Management System (BMS)',
            parameter: `SoC Window ${bessFloor}%–${bessCeiling}%`,
            observation: `Maintains 15%+ emergency backup reserve while preventing high-voltage cell stress above ${bessCeiling}% SoC.`,
            confidence: '99.3%',
          },
          {
            source: 'Autonomous Dispatch Watchdog',
            parameter: `Min Confidence: ${params.confidenceThreshold || 90}%`,
            observation: `Fallback to deterministic local PLC rules triggers automatically if model confidence drops below ${params.confidenceThreshold || 90}%.`,
            confidence: '99.7%',
          },
        ],
        engineSource,
        timestamp: now,
      };
    }
  }
}

export async function analyzeWorkspace(
  req: WorkspaceAnalysisRequest
): Promise<WorkspaceAnalysisResponse> {
  if (req.simulateFault) {
    await new Promise((r) => setTimeout(r, 650));
    throw new Error(
      'SCADA Telemetry Gateway timeout on OPC-UA Node #04 (HTTP 503). All workspace inputs have been preserved—retry execution or run the deterministic physics solver.'
    );
  }

  try {
    const response = await fetch('/api/workspace/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        errBody.error || `Server analysis returned HTTP ${response.status}`
      );
    }

    const data: WorkspaceAnalysisResponse = await response.json();
    return data;
  } catch (err) {
    // If the user did not request fault simulation and the backend endpoint is unavailable,
    // gracefully return deterministic analysis so standard workflows never break.
    return buildDeterministicAnalysis(req, 'deterministic-solver');
  }
}
