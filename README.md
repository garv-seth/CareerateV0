# Careerate - AI-Powered Development Platform

Careerate is a comprehensive AI-powered development platform that handles everything from code generation to deployment and maintenance. Built with modern DevSecOps practices and enterprise-grade security.

## 🚀 Features

### Vibe Coding
- **Natural Language to Code**: Describe your app and AI generates production-ready code
- **Real-time Collaboration**: Live cursors, presence, and collaborative editing
- **AI Agents**: Specialized agents for code generation, debugging, optimization, testing, and review
- **Intelligent File Management**: In-memory project files with auto-save and version control

### Vibe Hosting
- **Multi-Cloud Deployment**: Deploy to AWS, Azure, GCP with natural language commands
- **Intelligent Infrastructure**: AI manages scaling, load balancing, and optimization
- **Zero-Downtime Deployments**: Blue-green, rolling, and canary deployment strategies
- **Real-time Monitoring**: Live metrics, health checks, and automated rollback

### Enterprise Migration
- **Legacy Assessment**: AI-powered analysis of existing systems
- **Migration Planning**: Automated timeline and resource allocation
- **Code Modernization**: Framework upgrades and architectural improvements
- **AI Recommendations**: One-click fixes and optimizations

### Integrations Hub
- **100+ Services**: GitHub, AWS, Stripe, Datadog, Snowflake, and more
- **Plug-and-Play Setup**: KeyVault-secured credential management
- **Health Monitoring**: Real-time integration status and alerts
- **OAuth & API Key Support**: Multiple authentication methods

### Security & Compliance
- **Azure KeyVault Integration**: Enterprise-grade secret management
- **SOC 2 Type II Compliance**: Industry-standard security practices
- **Role-Based Access Control**: Fine-grained permissions and audit logs
- **Encrypted Storage**: AES-256 encryption for all sensitive data

## 🎨 Modern UI Design

Careerate features a distinctive dark theme with purple-pink gradients, inspired by modern development platforms:
- **Agent-Centric Dashboard**: Main interface focuses on AI agent interaction
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Consistent Design System**: Unified components and styling
- **Responsive Layout**: Optimized for desktop and mobile

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Wouter** for routing
- **TanStack Query** for state management
- **Monaco Editor** for code editing
- **WebSocket** for real-time features

### Backend
- **Node.js** with Express
- **TypeScript** throughout
- **PostgreSQL** with Drizzle ORM
- **Azure AD** for authentication
- **WebSocket** for collaboration
- **OpenAI GPT-5** for AI features

### Infrastructure
- **Azure Container Apps** for hosting
- **Azure KeyVault** for secrets
- **PostgreSQL** (Neon) for database
- **Docker** for containerization
- **GitHub Actions** for CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Azure account with KeyVault
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/careerate.git
   cd careerate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   ```

4. **Set up Azure KeyVault secrets**
   ```bash
   # Use provided script
   ./scripts/setup-keyvault-secrets.sh
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 Usage Examples

### Create a Project with AI
```typescript
// Natural language prompt
"Build me a Netflix clone with user authentication, video streaming, and recommendations"

// AI generates:
// - React frontend with authentication
// - Node.js backend with video APIs
// - Database schema for users and content
// - Deployment configuration
// - Test suites
```

### Deploy with Natural Language
```typescript
// Hosting prompt
"Deploy to Azure with auto-scaling in West US 2 using blue-green strategy"

// AI handles:
// - Provider selection and configuration
// - Infrastructure provisioning
// - Application deployment
// - Health checks and monitoring
// - Rollback planning
```

### Connect Integrations
```typescript
// Add secrets to KeyVault
az keyvault secret set --vault-name careeeratesecretsvault --name "GITHUB-CLIENT-ID" --value "your-client-id"

// Integration automatically connects and provides:
// - Repository access
// - Webhook configuration
// - Health monitoring
// - Usage analytics
```

## 🔧 Configuration

### Required Environment Variables
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_CLIENT_ID` - Azure application client ID
- `AZURE_CLIENT_SECRET` - Azure application secret
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key

### Optional Integrations
- `OPENAI_API_KEY` - For AI features
- `GITHUB_CLIENT_ID/SECRET` - For GitHub integration
- `STRIPE_SECRET_KEY` - For payment processing
- `SENDGRID_API_KEY` - For email notifications

## 🏗 Architecture

### Core Services
- **AI Service**: Code generation, analysis, and optimization
- **Deployment Manager**: Multi-cloud deployment orchestration
- **Collaboration Server**: Real-time WebSocket communication
- **Integration Service**: Third-party service connections
- **Subscription Service**: Usage tracking and billing

### Database Schema
- **Users & Projects**: Core entity management
- **Integrations**: Service connections and secrets
- **Subscriptions**: Billing and usage tracking
- **Collaboration**: Real-time session management
- **AI Agents**: Autonomous task management

## 🔒 Security

### Data Protection
- All secrets encrypted with Azure KeyVault
- AES-256 encryption for sensitive data
- SOC 2 Type II compliance standards
- Regular security audits and monitoring

### Access Control
- Azure AD integration
- Role-based permissions
- Session management
- API rate limiting

## 📈 Monitoring

### Health Checks
- Application health endpoints
- Integration status monitoring
- Database connectivity checks
- Real-time alerting

### Analytics
- Usage tracking and reporting
- Performance metrics
- Error monitoring
- Business intelligence

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.careerate.com](https://docs.careerate.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/careerate/issues)
- **Email**: support@careerate.com

---

Built with ❤️ by the Careerate team
