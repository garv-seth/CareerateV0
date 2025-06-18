import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import session from 'express-session';
import passport from './auth/passport';
import { CollaborationServer } from './collaboration';
import { app as agentWorkflow } from './orchestrator/workflow';
import { db } from './lib/db';
import authRouter from './router/auth';
import userRouter from './router/user';
import { protect, AuthenticatedRequest } from './auth/middleware';
import { User } from '@prisma/client';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Setup logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({ format: winston.format.simple() }),
    ],
});

// Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000"
}));
app.use(express.json());

// Session middleware required for Passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routers
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

// API endpoint to run the agent workflow
app.get('/api/v1/orchestrate', protect, async (req: AuthenticatedRequest, res: Response) => {
    // The new workflow expects the entire message history
    const { messages } = req.query; 

    if (!messages || typeof messages !== 'string') {
        return res.status(400).json({ error: '`messages` query parameter (a JSON stringified array) is required' });
    }

    try {
        const parsedMessages = JSON.parse(messages);

        const stream = await agentWorkflow.stream({
            messages: parsedMessages,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        let lastEvent: any = null;
        for await (const event of stream) {
            // The new stream format directly gives us the messages
            if (event.messages) {
                res.write(`data: ${JSON.stringify(event.messages)}\n\n`);
                lastEvent = event;
            }
        }

        // After the stream is finished, save the conversation from the last event
        if (lastEvent && lastEvent.messages) {
            const user = req.user as User;
            if (!user) {
                logger.error("Error: User not found on authenticated request.");
                return res.end();
            }
            const conversation = await db.conversation.create({
                data: {
                    userId: user.id,
                    messages: {
                        create: lastEvent.messages.map((msg: any) => ({
                            content: msg.content.toString(),
                            role: msg._getType(),
                        }))
                    }
                }
            });
            logger.info(`Saved conversation with ID: ${conversation.id}`);
        }

        res.end();

    } catch (error) {
        logger.error('Error in orchestration workflow:', error);
        // Ensure we don't try to write to a closed stream
        if (!res.writableEnded) {
            res.status(500).json({ error: 'An error occurred during orchestration.' });
        }
    }
});

// Initialize WebSocket collaboration server
const collaborationServer = new CollaborationServer(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
    });
}); 