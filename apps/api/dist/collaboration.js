"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationServer = void 0;
const workflow_1 = require("./orchestrator/workflow");
class CollaborationServer {
    constructor(io) {
        this.activeTeams = new Map();
        this.activeCollaborations = new Map();
        this.agentStates = new Map();
        this.io = io;
        this.io.on('connection', (socket) => {
            socket.on('join-team', (teamId) => {
                socket.join(teamId);
                this.broadcastTeamUpdate(teamId);
            });
            socket.on('agent-action', (data) => {
                this.handleAgentAction(socket, data);
            });
            socket.on('user-message', (data) => {
                this.handleUserMessage(socket, data);
            });
        });
    }
    getTeamId(socket) {
        // A simple way to associate a socket with a team.
        // In a real app, this would be more robust, probably based on authentication.
        const rooms = Array.from(socket.rooms);
        const room = rooms.find(r => r !== socket.id);
        return room || 'default';
    }
    handleAgentAction(socket, action) {
        const teamId = this.getTeamId(socket);
        // Broadcast agent activity to team members
        socket.to(teamId).emit('agent-activity', {
            agentId: action.agentId,
            action: action.type,
            details: action.payload,
            timestamp: Date.now()
        });
        // This is a placeholder for updating agent status
        // this.updateAgentStatus(teamId, action.agentId, action.type);
    }
    handleUserMessage(socket, message) {
        const teamId = this.getTeamId(socket);
        console.log(`Received message from user ${message.userId} in team ${teamId}: ${message.content}`);
        // Trigger the LangGraph orchestration
        workflow_1.app.invoke({
            user_query: message.content,
            context: { teamId, userId: message.userId }
        }).then((result) => {
            console.log("Workflow finished:", result);
            const finalMessage = {
                id: Date.now().toString(),
                sender: 'system', // Or a master agent
                content: result.final_solution,
            };
            this.io.to(teamId).emit('agent-message', finalMessage);
        });
    }
    broadcastTeamUpdate(teamId) {
        const team = this.activeTeams.get(teamId);
        if (team) {
            this.io.to(teamId).emit('team-update', {
                agents: team.agents,
                activeCollaborations: team.activeCollaborations
            });
        }
    }
}
exports.CollaborationServer = CollaborationServer;
//# sourceMappingURL=collaboration.js.map