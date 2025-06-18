"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const winston_1 = __importDefault(require("winston"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("./auth/passport"));
const collaboration_1 = require("./collaboration");
const workflow_1 = require("./orchestrator/workflow");
const db_1 = require("./lib/db");
const auth_1 = __importDefault(require("./router/auth"));
const user_1 = __importDefault(require("./router/user"));
const middleware_1 = require("./auth/middleware");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
// Setup logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.Console({ format: winston_1.default.format.simple() }),
    ],
});
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000"
}));
app.use(express_1.default.json());
// Session middleware required for Passport
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
}));
// Passport middleware
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Routers
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// API endpoint to run the agent workflow
app.get('/api/v1/orchestrate', middleware_1.protect, async (req, res) => {
    var _a, e_1, _b, _c;
    // The new workflow expects the entire message history
    const { messages } = req.query;
    if (!messages || typeof messages !== 'string') {
        return res.status(400).json({ error: '`messages` query parameter (a JSON stringified array) is required' });
    }
    try {
        const parsedMessages = JSON.parse(messages);
        const stream = await workflow_1.app.stream({
            messages: parsedMessages,
        });
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        let lastEvent = null;
        try {
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const event = _c;
                // The new stream format directly gives us the messages
                if (event.messages) {
                    res.write(`data: ${JSON.stringify(event.messages)}\n\n`);
                    lastEvent = event;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // After the stream is finished, save the conversation from the last event
        if (lastEvent && lastEvent.messages) {
            const user = req.user;
            if (!user || !user.id) {
                logger.error("Error: User not found on authenticated request.");
                return res.end();
            }
            const conversation = await db_1.db.conversation.create({
                data: {
                    userId: user.id,
                    messages: {
                        create: lastEvent.messages.map((msg) => ({
                            content: msg.content.toString(),
                            role: msg._getType(),
                        }))
                    }
                }
            });
            logger.info(`Saved conversation with ID: ${conversation.id}`);
        }
        res.end();
    }
    catch (error) {
        logger.error('Error in orchestration workflow:', error);
        // Ensure we don't try to write to a closed stream
        if (!res.writableEnded) {
            res.status(500).json({ error: 'An error occurred during orchestration.' });
        }
    }
});
// Initialize WebSocket collaboration server
const collaborationServer = new collaboration_1.CollaborationServer(io);
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
//# sourceMappingURL=index.js.map