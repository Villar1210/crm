import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import './worker'; // Start Worker
import { whatsappService } from './services/whatsappService';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ promise, reason }, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
    logger.error(error, 'Uncaught Exception');
});


import { socketService } from './services/socketService';

const app = express();
const server = http.createServer(app);

// Initialize Socket Service
socketService.init(server);
const io = socketService.getIO();

whatsappService.init(io);


const BASE_PORT = Number(process.env.PORT) || 3001;
const MAX_PORT_ATTEMPTS = Number(process.env.PORT_RETRY_ATTEMPTS) || 5;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Requests sem origin (curl, server-to-server, mobile) sao sempre permitidos
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

// Helmet substitui os headers manuais de seguranca
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "https://graph.facebook.com", "https://api.linkedin.com", "wss:"],
            frameAncestors: ["'self'", "https://web.whatsapp.com"],
        },
    },
}));

// Rate limiting global (complementa o especifico de auth)
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes. Tente novamente em breve.' },
    skip: (req) => req.path === '/api/health',
});
app.use('/api/', globalLimiter);

import authRoutes from './routes/authRoutes';
import leadRoutes from './routes/leadRoutes';
import propertyRoutes from './routes/propertyRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import emailRoutes from './routes/emailRoutes';
import socialRoutes from './routes/socialRoutes';
import leadRouletteRoutes from './routes/leadRouletteRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import pipelineRoutes from './routes/pipelineRoutes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/lead-roulette', leadRouletteRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/pipelines', pipelineRoutes);


import pdfRoutes from './routes/pdfRoutes';
app.use('/api/pdf', pdfRoutes);
import realEstateRoutes from './routes/realEstateRoutes';
app.use('/api/real-estate', realEstateRoutes);
import systemRoutes from './routes/systemRoutes';
app.use('/api/system', systemRoutes);
import taskRoutes from './routes/taskRoutes';
app.use('/api/tasks', taskRoutes);
import campaignRoutes from './routes/campaignRoutes';
app.use('/api/campaigns', campaignRoutes);
import settingsRoutes from './routes/settingsRoutes';
app.use('/api/settings', settingsRoutes);
import userRoutes from './routes/userRoutes';
app.use('/api/users', userRoutes);
import saasRoutes from './routes/saasRoutes';
app.use('/api/saas', saasRoutes);
import securityRoutes from './routes/securityRoutes';
app.use('/api/security', securityRoutes);

// Health Check
app.get('/api/health', async (_req, res) => {
    const checks: Record<string, any> = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
    };

    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = 'ok';
    } catch {
        checks.database = 'error';
        checks.status = 'degraded';
    }

    checks.whatsapp = whatsappService.getStatus?.() ?? 'unknown';

    const httpStatus = checks.status === 'ok' ? 200 : 503;
    res.status(httpStatus).json(checks);
});


// Serve static files (Frontend)
const buildPath = path.join(__dirname, '../../dist');
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(buildPath));

app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

let currentPort = BASE_PORT;
let attemptsLeft = MAX_PORT_ATTEMPTS;

const startServer = () => {
    server.listen(currentPort);
    server.on('listening', () => {
        console.log(`[Server] Running on port ${currentPort}`);
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
            console.warn(`[Server] Port ${currentPort} in use, trying ${currentPort + 1}...`);
            currentPort++;
            attemptsLeft--;
            server.close();
            startServer();
        } else {
            console.error('[Server] Failed to start:', err);
            process.exit(1);
        }
    });
};

startServer();
