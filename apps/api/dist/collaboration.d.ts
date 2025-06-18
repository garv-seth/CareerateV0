import { Server } from 'socket.io';
export declare class CollaborationServer {
    private io;
    private activeTeams;
    private activeCollaborations;
    private agentStates;
    constructor(io: Server);
    private getTeamId;
    private handleAgentAction;
    private handleUserMessage;
    private broadcastTeamUpdate;
}
//# sourceMappingURL=collaboration.d.ts.map