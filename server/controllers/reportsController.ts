import { Request, Response } from 'express';
import { store } from '../data/store.ts';
import type { ReportArchiveItem } from '../types/backendTypes.ts';

export class ReportsController {
  static getReports(_req: Request, res: Response): void {
    const list = store.getReports();
    res.json(list);
  }

  static generateReport(req: Request, res: Response): void {
    const { name, format, facility, period } = req.body;
    const newReport: ReportArchiveItem = {
      id: `rep-${Date.now()}`,
      name: name || `Executive_Dispatch_Audit_${new Date().toISOString().slice(0, 10)}.${format === 'CSV' ? 'csv' : 'pdf'}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      size: format === 'CSV' ? '410 KB' : '2.1 MB',
      format: format === 'CSV' ? 'CSV' : 'PDF',
      period: period || 'Current Billing Cycle',
      facility: facility || 'North Campus Microgrid (All Zones)',
      savings: '$14,850',
      co2: '12.4 Tons',
      peakReduction: '21.8%',
      selfConsumption: '95.2%',
    };

    const saved = store.createReport(newReport);
    res.status(201).json(saved);
  }
}
