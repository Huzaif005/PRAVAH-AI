import { Request, Response } from 'express';
import { PhysicsSolver } from '../services/physicsSolver.ts';
import type { SimulationRequest } from '../types/backendTypes.ts';

export class SimulatorController {
  static runStressTest(req: Request, res: Response): void {
    const body = req.body as SimulationRequest;
    if (!body || typeof body.demandVal !== 'number') {
      res.status(400).json({ error: 'Invalid simulation parameters.' });
      return;
    }

    const result = PhysicsSolver.runSimulation(body);
    res.json(result);
  }
}
