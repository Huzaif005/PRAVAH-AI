import { Request, Response } from 'express';
import { store } from '../data/store.ts';
import { GeminiService } from '../services/geminiService.ts';
import type { WorkspaceAnalysisRequest } from '../types/backendTypes.ts';

export class AnalysisController {
  static getAnalyses(_req: Request, res: Response): void {
    const list = store.getAnalyses();
    res.json(list);
  }

  static getAnalysisById(req: Request, res: Response): void {
    const { id } = req.params;
    const analysis = store.getAnalysisById(id);
    if (!analysis) {
      res.status(404).json({ error: `Analysis record ${id} not found.` });
      return;
    }
    res.json(analysis);
  }

  static createAnalysis(req: Request, res: Response): void {
    const record = req.body;
    if (!record || !record.id || !record.title) {
      res.status(400).json({ error: 'Missing required analysis fields (id, title).' });
      return;
    }
    const created = store.createAnalysis(record);
    res.status(201).json(created);
  }

  static updateAnalysis(req: Request, res: Response): void {
    const { id } = req.params;
    const updates = req.body;
    const updated = store.updateAnalysis(id, updates);
    if (!updated) {
      res.status(404).json({ error: `Analysis record ${id} not found.` });
      return;
    }
    res.json(updated);
  }

  static deleteAnalysis(req: Request, res: Response): void {
    const { id } = req.params;
    const ok = store.deleteAnalysis(id);
    if (!ok) {
      res.status(404).json({ error: `Analysis record ${id} not found.` });
      return;
    }
    res.json({ success: true, deletedId: id });
  }

  static async analyzeWorkspace(req: Request, res: Response): Promise<void> {
    const body = req.body as WorkspaceAnalysisRequest;
    try {
      const result = await GeminiService.analyzeWorkspace(body);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown optimization error';
      if (message.includes('HTTP 503') || message.includes('timeout')) {
        res.status(503).json({ error: message });
      } else {
        res.status(500).json({ error: message });
      }
    }
  }
}
