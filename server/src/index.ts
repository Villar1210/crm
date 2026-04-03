import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import http from 'http';
import './worker'; // Start Worker
import { whatsappService } from './services/whatsappService';

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});


import { socketService } from './services/socketService';

const app = express();
const server = http.createServer(app);

// Initialize Socket Service
socketService.init(server);
const io = socketService.getIO();

whatsappService.attachSocketID(io);


// const prisma = new PrismaClient();
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
app.use((_req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://graph.facebook.com https://api.linkedin.com wss:; " +
        "frame-ancestors 'self' https://web.whatsapp.com"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

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

// Health Check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
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
};

server.on('listening', () => {
    console.log(`Server running on http://localhost:${currentPort}`);
    console.log('Socket.IO ready');
});

server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
        console.warn(`Port ${currentPort} already in use. Trying ${currentPort + 1}...`);
        attemptsLeft -= 1;
        currentPort += 1;
        setTimeout(startServer, 250);
        return;
    }

    console.error('Server error:', error);
    process.exit(1);
});

startServer();
