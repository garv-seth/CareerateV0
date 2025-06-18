# Careerate AIntern Suite 🚀

Welcome to the Careerate AIntern Suite, a comprehensive AI agent platform for DevOps/SRE professionals. This platform features specialized AI agents that perform actual automation tasks - not just chatbots, but AI agents that actively work on your behalf. Built with Apple's Liquid Glass design language, the platform includes:

- **🤖 Specialized AI Agents**: Terra (Terraform), Kube (Kubernetes), Cloud (AWS), and Rapid (Incident Management)
- **🎨 Liquid Glass UI**: Beautiful, modern interface with glassmorphism and fluid animations
- **🔧 Real Automation**: Agents can generate configs, deploy infrastructure, debug issues, and manage incidents
- **🌐 Chrome Extension**: Intelligent context collection from DevOps tools
- **☁️ Azure Integration**: Fully deployable on Azure with managed services

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

## 🚀 Getting Started

**Prerequisites:**

-   Node.js (v18 or later)
-   pnpm (v8 or later)
-   Docker (for containerization)
-   Azure CLI (for deployment)

**1. Clone and Setup**

```bash
git clone https://github.com/careerate/aintern-suite.git
cd aintern-suite
```

**2. Install Dependencies**

This monorepo uses pnpm workspaces for better performance and disk space efficiency:

```bash
pnpm install
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

## 🎯 Implementation Status

### ✅ Completed Components:
- **Agent Definitions**: All four specialized agents (Terra, Kube, Cloud, Rapid) with unique personalities
- **LangGraph Orchestration**: Multi-agent workflow with team selection
- **Automation Tools**: Real DevOps tools for Terraform, Kubernetes, AWS, and incident management
- **Chrome Extension**: Context collection with error detection and right-click integration
- **WebSocket Collaboration**: Real-time agent coordination and activity streaming
- **Glass UI Components**: Beautiful glassmorphism design system
- **Azure Deployment**: Scripts and CI/CD pipeline configuration

### 🔧 What's Functional:
1. **Terra Agent** can:
   - Generate Terraform configurations for VPCs, EC2, RDS, S3
   - Validate Terraform syntax
   - Plan deployments

2. **Kube Agent** can:
   - Generate Kubernetes manifests
   - Debug pod issues with recommendations
   - Scale deployments

3. **Cloud Agent** can:
   - Analyze AWS costs with recommendations
   - Create EC2 instances and security groups
   - Generate CloudFormation templates
   - Create S3 buckets with security best practices

4. **Rapid Agent** can:
   - Create incident responses with runbooks
   - Track incident timelines
   - Perform root cause analysis
   - Generate post-mortems
   - Correlate alerts to reduce noise

## 🚀 Quick Start for Developers

1. **Run the platform locally:**
   ```bash
   pnpm setup  # Install deps and generate Prisma client
   pnpm dev    # Start all services
   ```

2. **Access the applications:**
   - Web UI: http://localhost:3000
   - API: http://localhost:3001
   - Install Chrome extension from `apps/extension`

3. **Deploy to Azure:**
   ```bash
   pnpm deploy:azure
   ```

## 🔐 Azure Configuration

The platform is configured to use your Azure resources:
- **App Service**: Careerate-adaa
- **Key Vault**: CareeerateSecretsVault
- **Storage**: careeratestorage
- **Database**: careeratedb (Cosmos DB)
- **AI**: CareerateAIStack (Azure OpenAI)

Configure secrets in Azure Key Vault for production deployment.

## 🛠️ Next Steps

1. **Production Readiness**:
   - Add comprehensive error handling
   - Implement rate limiting
   - Add monitoring with Application Insights
   - Set up automated backups

2. **Enhanced Features**:
   - Add more MCP integrations (Jenkins, Ansible, New Relic)
   - Implement agent memory for learning from past interactions
   - Add voice interface for hands-free operations
   - Create mobile app for on-the-go incident management

3. **Enterprise Features**:
   - RBAC with Azure AD B2C
   - Audit logging for compliance
   - Multi-tenancy support
   - Custom agent training on company-specific runbooks

This platform represents the future of DevOps automation - where AI agents don't just advise, they actively execute tasks on your behalf. Welcome to the era of true AI-powered DevOps! 🚀 