import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController.ts';
import { GovernanceController } from '../controllers/governanceController.ts';
import { TelemetryController } from '../controllers/telemetryController.ts';
import { ForecastController } from '../controllers/forecastController.ts';
import { SimulatorController } from '../controllers/simulatorController.ts';
import { AlertsController } from '../controllers/alertsController.ts';
import { ReportsController } from '../controllers/reportsController.ts';
import { SettingsController } from '../controllers/settingsController.ts';
import { AuthController } from '../controllers/authController.ts';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'PRAVAAH Smart Microgrid Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    model: 'Gemini 3.8 Flash + Deterministic Load Solver',
  });
});

// 1. Analyses & Workspace
apiRouter.get('/analyses', AnalysisController.getAnalyses);
apiRouter.get('/analyses/:id', AnalysisController.getAnalysisById);
apiRouter.post('/analyses', AnalysisController.createAnalysis);
apiRouter.put('/analyses/:id', AnalysisController.updateAnalysis);
apiRouter.delete('/analyses/:id', AnalysisController.deleteAnalysis);
apiRouter.post('/analyses/evaluate', AnalysisController.analyzeWorkspace);
apiRouter.post('/workspace/analyze', AnalysisController.analyzeWorkspace);

// 2. Governance & Decision Audit Log
apiRouter.get('/governance/decisions', GovernanceController.getAuditLog);
apiRouter.post('/governance/decisions', GovernanceController.recordDecision);

// 3. Telemetry Stream & History
apiRouter.get('/telemetry/live', TelemetryController.getLiveTelemetry);
apiRouter.get('/telemetry/history', TelemetryController.getTelemetryHistory);

// 4. Forecasts & QuickML Engine
apiRouter.get('/forecasts', ForecastController.getForecasts);
apiRouter.post('/forecasts/predict', ForecastController.predictQuickML);
apiRouter.post('/quickml/predict', ForecastController.predictQuickML);
apiRouter.post('/telemetry/upload-csv', ForecastController.ingestAndPredictCsv);

// 5. Simulator
apiRouter.post('/simulator/stress-test', SimulatorController.runStressTest);

// 6. Alerts & SCADA Events
apiRouter.get('/alerts', AlertsController.getAlerts);
apiRouter.post('/alerts/:id/ack', AlertsController.acknowledgeAlert);
apiRouter.post('/alerts/:id/trigger', AlertsController.triggerAlertAction);

// 7. Compliance & Executive Reports
apiRouter.get('/reports', ReportsController.getReports);
apiRouter.post('/reports/generate', ReportsController.generateReport);

// 8. Settings & Configurations
apiRouter.get('/settings', SettingsController.getSettings);
apiRouter.put('/settings', SettingsController.updateSettings);

// 9. Auth & Operator Profiles
apiRouter.post('/auth/login', AuthController.login);
apiRouter.post('/auth/signup', AuthController.signup);
apiRouter.get('/auth/me', AuthController.getProfile);
