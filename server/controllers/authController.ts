import { Request, Response } from 'express';
import { store } from '../data/store.ts';

export class AuthController {
  static login(req: Request, res: Response): void {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const settings = store.getSettings();
    res.json({
      token: 'jwt_mock_token_gridmind_2026',
      user: {
        id: 'usr-elena-vance-01',
        email: email || settings.operatorEmail,
        fullName: settings.operatorName,
        role: settings.operatorTitle,
        organization: 'North Campus Energy District',
      },
    });
  }

  static signup(req: Request, res: Response): void {
    const { fullName, email, organization } = req.body;
    if (!email || !fullName) {
      res.status(400).json({ error: 'Full name and email are required.' });
      return;
    }

    store.updateSettings({
      operatorName: fullName,
      operatorEmail: email,
    });

    res.status(201).json({
      token: 'jwt_mock_token_gridmind_2026',
      user: {
        id: `usr-${Date.now()}`,
        email,
        fullName,
        role: 'Facility Engineer',
        organization: organization || 'North Campus Energy District',
      },
    });
  }

  static getProfile(_req: Request, res: Response): void {
    const settings = store.getSettings();
    res.json({
      id: 'usr-elena-vance-01',
      email: settings.operatorEmail,
      fullName: settings.operatorName,
      role: settings.operatorTitle,
      organization: 'North Campus Energy District',
      substationCallsign: settings.substationCallsign,
    });
  }
}
