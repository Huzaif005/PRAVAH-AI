import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/api.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT
    ? parseInt(process.env.X_ZOHO_CATALYST_LISTEN_PORT, 10)
    : process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;

  // Middleware for JSON and raw text (CSV ingestion)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.text({ limit: '10mb', type: ['text/csv', 'text/plain'] }));

  // Mount modular backend API
  app.use('/api', apiRouter);

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GridMind AI server listening on http://localhost:${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
    console.log(`QuickML Predict: http://localhost:${PORT}/api/quickml/predict`);
  });
}

startServer();
