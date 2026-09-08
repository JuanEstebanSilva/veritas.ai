import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import authRoutes from './routes/authRoutes';
import analysisRoutes from './routes/analysisRoutes';
import writingRoutes from './routes/writingRoutes';
import userRoutes from './routes/userRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Configuración de CORS
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  })
);

// El webhook de Stripe requiere raw buffer, por lo que lo registramos antes o con verify
app.use(
  express.json({
    limit: '15mb',
    verify: (req: any, _res, buf) => {
      if (req.originalUrl && req.originalUrl.includes('/webhook')) {
        req.rawBody = buf;
      }
    },
  })
);

app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    platform: 'Veritas AI',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Manejo de rutas 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Recurso API no encontrado.',
  });
});

// Manejador global de errores
app.use(errorHandler);

export default app;
