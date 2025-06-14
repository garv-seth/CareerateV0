# Careerate - AI DevOps Platform

## Overview

Careerate is a comprehensive AI-powered DevOps platform that provides specialized AI assistance across multiple interfaces. It consists of a full-stack web application, Chrome extension, VSCode extension, and various integrations to help DevOps teams streamline their workflows.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for client state, TanStack Query for server state
- **Routing**: React Router v6
- **Authentication**: Azure B2C integration (MSAL)
- **Components**: Comprehensive shadcn/ui component library
- **Animations**: Framer Motion for UI interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM (graceful fallback if unavailable)
- **Real-time**: Socket.IO for WebSocket connections
- **Authentication**: JWT middleware with Azure B2C integration
- **API Design**: RESTful endpoints with structured routing

### Multi-Platform Extensions
- **Chrome Extension**: Manifest v3 with privacy-first design
- **VSCode Extension**: Full TypeScript implementation with webview panels
- **Integration Ready**: Slack and Teams webhook support

## Key Components

### Core AI Services
- **Agent Orchestrator**: Manages specialized AI agents (Terraform, Kubernetes, AWS, etc.)
- **Streaming Chat**: Real-time AI conversations with context awareness
- **MCP (Model Context Protocol)**: Framework for AI model integration
- **Privacy Manager**: Client-side data classification and consent management

### API Endpoints
```
/api/auth/*          - Authentication and user management
/api/agents/*        - AI agent management and selection
/api/chat/*          - Streaming chat with AI agents
/api/mcp/*           - Model Context Protocol endpoints
/api/workspace/*     - Team collaboration features
/api/analytics/*     - Usage analytics and insights
```

### Frontend Pages
- **Landing Page**: Marketing site with interactive animations
- **Dashboard**: Main application interface with AI chat
- **Settings**: User preferences and configuration
- **Authentication**: Azure B2C login/logout flow

### Extension Architecture
- **Chrome Extension**: Context detection, privacy controls, and AI assistance
- **VSCode Extension**: Code analysis, error detection, and AI-powered suggestions
- **Content Scripts**: Page analysis and context extraction

## Data Flow

### Authentication Flow
1. User accesses application
2. Azure B2C handles authentication (with graceful fallback)
3. JWT tokens managed for API access
4. User session persisted across platforms

### AI Interaction Flow
1. User selects AI agent or uses auto-detection
2. Context gathered from current workspace/page
3. Privacy manager classifies and filters sensitive data
4. Request sent to appropriate AI agent via MCP
5. Streaming response delivered via WebSocket
6. Results displayed with syntax highlighting and actions

### Extension Integration
1. Chrome extension detects page context
2. Privacy manager evaluates data sensitivity
3. User consent requested for sensitive operations
4. Context sent to backend API
5. AI responses delivered back to extension

## External Dependencies

### Core Infrastructure
- **Node.js**: Runtime environment (18+)
- **MongoDB**: Database (optional, graceful fallback implemented)
- **Azure B2C**: Authentication provider (optional, graceful fallback)

### AI Services
- **OpenAI API**: Primary AI provider
- **Anthropic API**: Alternative AI provider
- **LangChain**: AI orchestration framework
- **LangGraph**: Workflow management

### Development Tools
- **Vite**: Frontend build tool
- **TypeScript**: Type safety across all components
- **TanStack Query**: Server state management
- **Socket.IO**: Real-time communication

### Azure Services
- **Azure Key Vault**: Secrets management
- **Azure App Service**: Hosting platform
- **Azure B2C**: Identity management

## Deployment Strategy

### Production Deployment
- **Platform**: Azure App Service
- **Build Process**: Automated frontend build with asset copying
- **Environment**: Production-ready TypeScript compilation
- **Startup**: Robust shell script with error handling
- **Monitoring**: Health check endpoints and logging

### Development Environment
- **Frontend**: Vite dev server on port 3000
- **Backend**: TypeScript execution on port 8081
- **Hot Reload**: Full development experience
- **API Proxy**: Vite proxies API requests to backend

### Build Process
```bash
# Frontend build
cd frontend && npx vite build

# Backend build  
cd backend && npm run build

# Asset integration
cp -r frontend/dist/* backend/public/
```

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 14, 2025. Initial setup