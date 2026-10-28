import { Request, Response } from 'express';
import { store } from '../data/store.ts';

export class SettingsController {
  static getSettings(_req: Request, res: Response): void {
    const settings = store.getSettings();
    res.json(settings);
  }

  static updateSettings(req: Request, res: Response): void {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: 'Invalid settings body' });
      return;
    }
    const updated = store.updateSettings(updates);
    res.json(updated);
  }
}
