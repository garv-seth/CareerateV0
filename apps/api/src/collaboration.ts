import { Server, Socket } from 'socket.io';
import http from 'http';
import { AgentAction, UserMessage } from '@careerate/types';
import { app as agentWorkflow } from './orchestrator/workflow';

interface Team {
    id: string;
    agents: any[]; // Replace with actual Agent type
    activeCollaborations: any[]; // Replace with actual Collaboration type
}

export class CollaborationServer {
    private io: Server;
    private activeTeams: Map<string, Team> = new Map();
  
    constructor(io: Server) {
      this.io = io;
  
      this.io.on('connection', (socket: Socket) => {
        socket.on('join-team', (teamId: string) => {
          socket.join(teamId);
          this.broadcastTeamUpdate(teamId);
        });
  
        socket.on('agent-action', (data: AgentAction) => {
          this.handleAgentAction(socket, data);
        });
  
        socket.on('user-message', (data: UserMessage) => {
          this.handleUserMessage(socket, data);
        });
      });
    }

    private getTeamId(socket: Socket): string {
        // A simple way to associate a socket with a team.
        // In a real app, this would be more robust, probably based on authentication.
        const rooms: string[] = Array.from(socket.rooms) as string[];
        const room = rooms.find(r => r !== socket.id);
        return room || 'default';
    }
  
    private handleAgentAction(socket: Socket, action: AgentAction) {
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

    private handleUserMessage(socket: Socket, message: UserMessage) {
        const teamId = this.getTeamId(socket);
        console.log(`Received message from user ${message.userId} in team ${teamId}: ${message.content}`);
        
        // Trigger the LangGraph orchestration
        agentWorkflow.invoke({
            user_query: message.content,
            context: { teamId, userId: message.userId }
        }).then((result: any) => {
            console.log("Workflow finished:", result);
            const finalMessage = {
                id: Date.now().toString(),
                sender: 'system', // Or a master agent
                content: result.final_solution,
            };
            this.io.to(teamId).emit('agent-message', finalMessage);
        });
    }
  
    private broadcastTeamUpdate(teamId: string) {
      const team = this.activeTeams.get(teamId);
      if (team) {
        this.io.to(teamId).emit('team-update', {
          agents: team.agents,
          activeCollaborations: team.activeCollaborations
        });
      }
    }
  } 