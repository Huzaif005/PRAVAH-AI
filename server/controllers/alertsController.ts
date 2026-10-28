import { Request, Response } from 'express';
import { store } from '../data/store.ts';

export class AlertsController {
  static getAlerts(_req: Request, res: Response): void {
    const list = store.getAlerts();
    res.json(list);
  }

  static acknowledgeAlert(req: Request, res: Response): void {
    const { id } = req.params;
    const updated = store.acknowledgeAlert(id);
    if (!updated) {
      res.status(404).json({ error: `Alert ${id} not found.` });
      return;
    }
    res.json(updated);
  }

  static triggerAlertAction(req: Request, res: Response): void {
    const { id } = req.params;
    const result = store.triggerAlertAction(id);
    if (!result) {
      res.status(404).json({ error: `Alert ${id} not found.` });
      return;
    }
    res.json(result);
  }
}
