import { Request, Response } from 'express';
import { store } from '../data/store.ts';
import { DemandPredictor, TelemetryRow } from '../services/demandPredictor.ts';

export class ForecastController {
  static getForecasts(_req: Request, res: Response): void {
    const list = store.getForecasts();
    res.json({
      feederId: 'NC-FEEDER-04',
      horizon: '24H',
      generatedAt: 'Today · 14:00 UTC',
      confidence: '98.8%',
      criticalPeakHour: '19:00',
      rows: list,
    });
  }

  /**
   * Endpoint adhering to HackSphere 3.0 QuickML inference contract.
   * Accepts { data: [ { timestamp, ambient_temp_c, humidity_pct, solar_irradiance_wm2 } ] }
   * Returns { predictions: [...], signals: [...] }
   */
  static async predictQuickML(req: Request, res: Response): Promise<void> {
    try {
      const data: TelemetryRow[] = req.body?.data || req.body?.rows || [];
      if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ error: 'Expected non-empty array in "data" property.' });
        return;
      }

      const result = await DemandPredictor.predict(data);
      res.json({
        predictions: result.predictions,
        signals: result.signals,
        count: result.predictions.length,
        status: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Prediction error';
      res.status(500).json({ error: msg });
    }
  }

  /**
   * Endpoint to parse CSV text upload (e.g. sample_test_input.csv) and run demand predictions + transition signals.
   */
  static async ingestAndPredictCsv(req: Request, res: Response): Promise<void> {
    try {
      const csvText = typeof req.body === 'string' ? req.body : req.body?.csv;
      if (!csvText || typeof csvText !== 'string') {
        res.status(400).json({ error: 'Expected raw CSV string in body or "csv" property.' });
        return;
      }

      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        res.status(400).json({ error: 'CSV must contain a header and at least 1 data row.' });
        return;
      }

      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const tsIdx = header.indexOf('timestamp');
      const tempIdx = header.indexOf('ambient_temp_c');
      const humIdx = header.indexOf('humidity_pct');
      const solIdx = header.indexOf('solar_irradiance_wm2');

      if (tsIdx === -1 || tempIdx === -1) {
        res.status(400).json({
          error: 'CSV missing required headers: timestamp, ambient_temp_c, humidity_pct, solar_irradiance_wm2',
        });
        return;
      }

      const rows: TelemetryRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 2 && parts[tsIdx]) {
          rows.push({
            timestamp: parts[tsIdx].trim(),
            ambient_temp_c: parseFloat(parts[tempIdx]) || 20.0,
            humidity_pct: humIdx !== -1 ? parseFloat(parts[humIdx]) || 60.0 : 60.0,
            solar_irradiance_wm2: solIdx !== -1 ? parseFloat(parts[solIdx]) || 0.0 : 0.0,
          });
        }
      }

      const result = await DemandPredictor.predict(rows);
      res.json({
        totalRows: rows.length,
        predictions: result.predictions,
        signals: result.signals,
        sampleOutput: result.signals.slice(0, 5),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV parsing error';
      res.status(500).json({ error: msg });
    }
  }
}
