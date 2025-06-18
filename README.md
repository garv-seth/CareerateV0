# Careerate AIntern Suite

Welcome to the Careerate AIntern Suite, a comprehensive AI agent platform for DevOps/SRE professionals. This project features specialized AI agents that collaborate like a real engineering team, a web application with a futuristic "Liquid Glass" aesthetic, a Chrome extension for context gathering, and a multi-agent orchestration system.

## Project Structure

This project is a monorepo managed with npm workspaces.

-   `apps/web`: The Next.js frontend application.
-   `apps/api`: The Express.js backend API and WebSocket server.
-   `apps/extension`: The Chrome Extension for context gathering.
-   `packages/ui`: Shared React components for the Liquid Glass design system.
-   `packages/types`: Shared TypeScript definitions for the entire application.
-   `packages/agents`: Definitions and logic for the specialized AI agents.
-   `packages/utils`: Shared utility functions.

## Technology Stack

### Frontend (Next.js 14 + TypeScript)

-   **UI:** React, Tailwind CSS, Framer Motion
-   **3D/Graphics:** Three.js, @react-three/fiber, @react-three/drei
-   **State Management:** Zustand
-   **Forms:** React Hook Form, Zod
-   **Other:** Lucide Icons, Recharts, Socket.IO Client, Monaco Editor

### Backend (Node.js + Express + TypeScript)

-   **Server:** Express, Socket.IO
-   **Database:** Prisma
-   **AI:** OpenAI, Anthropic, LangChain, LangGraph
-   **Infrastructure:** Redis, JWT, Bcrypt, Helmet, CORS, Winston

### Chrome Extension (Manifest V3)

-   Standard Web APIs for context menus, storage, and tab management.

## Getting Started

**Prerequisites:**

-   Node.js (v18 or later)
-   npm (v8 or later)

**1. Clone and Setup**

```bash
git clone https://github.com/careerate/aintern-suite.git
cd aintern-suite
```

**2. Install Dependencies**

> **Note:** The automatic installation of dependencies has been problematic in the development environment. If the command below does not work, you may need to navigate to each workspace (`apps/*` and `packages/*`) and run `npm install` manually.

```bash
npm install
```

**3. Setup Environment**

The backend API and other services will require environment variables. Create a `.env` file in the `apps/api` directory by copying the example:

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in the required environment variables, such as database connection strings, AI model API keys, and JWT secrets.

**4. Setup Database**

The project uses Prisma as an ORM. To initialize the database and generate the Prisma client:

```bash
npx prisma generate
npx prisma db push
```

**5. Start Development Servers**

You can run the frontend and backend servers concurrently.

```bash
# In one terminal, start the Frontend (localhost:3000)
npm run dev --workspace=web

# In another terminal, start the Backend API (localhost:3001)
npm run dev --workspace=api
```

**6. Build for Production**

```bash
# Build the web application
npm run build --workspace=web

# Build the API
npm run build --workspace=api
```

## Next Steps & Future Implementation

This repository contains the foundational scaffolding for the AIntern Suite. The next phases of development would involve:

1.  **AI Integration:** Replace the mock agent handlers in `apps/api/src/orchestrator/agents.ts` with actual calls to LLM providers (OpenAI, Anthropic) using LangChain.
2.  **Database Implementation:** Define data models in `packages/database/schema.prisma` and implement the database logic for persisting users, teams, conversations, etc.
3.  **Authentication:** Implement the `AuthService` on the backend and integrate login/signup flows on the frontend.
4.  **MCP (Mission-Critical Component) Integration:** Build out the `MCPManager` to connect to real services like AWS, GitHub, and Kubernetes for true automation.
5.  **UI Polish:** Complete the placeholder UI components, such as the tabbed views in the `ActivityViewer`, and add more "Liquid Glass" effects and animations.
6.  **Chrome Extension Enhancement:** Implement a UI for the extension's popup and establish a more robust communication channel between the content script and the web application.
7.  **Azure Deployment:** Create CI/CD pipelines (e.g., GitHub Actions) to build Docker containers and deploy the applications to the specified Azure resources (App Service, Cosmos DB, etc.).

This project is a bold vision for the future of DevOps, and this initial build provides a strong and scalable foundation to make it a reality. 