import { Request, Response } from 'express';
import { store } from '../data/store.ts';
import type { DecisionAuditEntry } from '../types/backendTypes.ts';

export class GovernanceController {
  static getAuditLog(_req: Request, res: Response): void {
    const list = store.getAuditLog();
    res.json(list);
  }

  static recordDecision(req: Request, res: Response): void {
    const entry = req.body as DecisionAuditEntry;
    if (!entry || !entry.decision || !entry.workspace) {
      res.status(400).json({ error: 'Invalid decision entry payload.' });
      return;
    }

    if (!entry.id) {
      entry.id = `AUD-${Math.floor(8400 + Math.random() * 900)}`;
    }
    if (!entry.timestamp) {
      entry.timestamp = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC`;
    }

    const recorded = store.addAuditEntry(entry);
    res.status(201).json(recorded);
  }
}
