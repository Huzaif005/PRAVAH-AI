import { Request, Response } from 'express';
import { store } from '../data/store.ts';

export class TelemetryController {
  static getLiveTelemetry(_req: Request, res: Response): void {
    const live = store.getLiveTelemetry();
    res.json(live);
  }

  static getTelemetryHistory(req: Request, res: Response): void {
    const range = (req.query.range as string) || '24h';
    // Provide 24h historical telemetry points
    const now = new Date();
    const history = [];
    const points = range === '7d' ? 28 : 24;

    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const hourNum = d.getHours();

      // Peak between 17:00 and 21:00
      let baseLoad = 75 + Math.sin((hourNum / 24) * Math.PI * 2 - Math.PI / 2) * 45;
      if (hourNum >= 17 && hourNum <= 20) {
        baseLoad += 55;
      }
      const solar = hourNum >= 7 && hourNum <= 17 ? Math.max(0, Math.sin(((hourNum - 7) / 10) * Math.PI) * 98) : 0;
      const net = Math.max(0, baseLoad - solar * 0.4);

      history.push({
        timestamp: hourStr,
        loadKw: +baseLoad.toFixed(1),
        solarKw: +solar.toFixed(1),
        netDemandKw: +net.toFixed(1),
        bessSocPct: +(60 + Math.sin(hourNum / 3) * 25).toFixed(1),
        ambientTempC: +(26 + Math.sin((hourNum - 6) / 12 * Math.PI) * 7).toFixed(1),
      });
    }

    res.json({
      feederId: 'NC-FEEDER-04',
      range,
      interval: '1h',
      data: history,
    });
  }
}
