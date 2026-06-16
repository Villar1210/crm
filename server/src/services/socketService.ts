
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
    .split(',')
    .map(o => o.trim());

class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: ALLOWED_ORIGINS,
                methods: ["GET", "POST"],
                credentials: true,
            }
        });

        this.io.use((socket, next) => {
            const token = socket.handshake.auth?.token || (socket.handshake.headers?.authorization || '').split(' ')[1];
            if (!token) return next(new Error('Autenticacao necessaria'));
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
                (socket as any).user = decoded;
                next();
            } catch {
                next(new Error('Token invalido'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            const user = (socket as any).user;
            console.log('Client connected:', socket.id, 'user:', user?.userId);

            if (user?.userId) socket.join(`user_${user.userId}`);
            if (user?.role) socket.join(`role_${user.role}`);

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    public getIO(): Server {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }

}

export const socketService = SocketService.getInstance();
