import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        }
    });

    // Verify JWT token during socket connection to secure WebSockets
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user?.userId || socket.user?.id;
        console.log('A user connected:', socket.id, 'UserId:', userId);
        
        // Automatically join the authenticated user to their personal room
        if (userId) {
            socket.join(`user_${userId}`);
        }
        
        // Allow users to join specific group rooms for targeted updates
        socket.on('join_group', (groupId) => {
            socket.join(`group_${groupId}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};
