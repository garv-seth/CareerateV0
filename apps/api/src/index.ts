import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import { CollaborationServer } from './collaboration';
import { app as agentWorkflow } from './orchestrator/workflow';

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


// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

// API endpoint to run the agent workflow
app.get('/api/v1/orchestrate', async (req: Request, res: Response) => {
    const { user_query, context } = req.query;

    if (!user_query || typeof user_query !== 'string') {
        return res.status(400).json({ error: 'user_query string parameter is required' });
    }

    const parsedContext = typeof context === 'string' ? JSON.parse(context) : {};

    try {
        const stream = await agentWorkflow.stream({
            user_query: user_query,
            context: parsedContext,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        for await (const event of stream) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
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