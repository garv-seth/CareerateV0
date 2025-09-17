# Careerate - AI-Powered Development Platform

## Overview

Careerate is a full-stack web application that combines AI-powered code generation with intelligent hosting and project management. The platform allows users to describe applications in natural language, generates complete code using AI, and provides comprehensive project management capabilities.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui components based on Radix UI
- **Styling**: Tailwind CSS with dark/light mode support
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Azure B2C
- **Session Management**: PostgreSQL session store
- **AI Integration**: OpenAI API for code generation

### Infrastructure
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Azure B2C tenant
- **Storage**: Azure Blob Storage
- **Hosting**: Azure Container Apps
- **CI/CD**: GitHub Actions with Azure Container Registry

## Environment Variables

The application uses Azure Key Vault for secret management. Key environment variables include:

- `DATABASE_URL`: Neon PostgreSQL connection string
- `AZURE_CLIENT_ID`: Azure B2C client ID
- `AZURE_CLIENT_SECRET`: Azure B2C client secret
- `AZURE_TENANT_ID`: Azure tenant ID
- `B2C_TENANT_NAME`: Azure B2C tenant name
- `B2C_SIGNUP_SIGNIN_POLICY_NAME`: B2C policy name
- `SESSION_SECRET`: Session encryption secret
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`: Stripe payment processing
- `SENDGRID_API_KEY`: Email service
- `TWILIO_ACCOUNT_SID`: SMS service

## Database Schema

### Core Tables
- **users**: User account information
- **projects**: User projects and metadata
- **code_generations**: AI-generated code history
- **integrations**: Third-party service connections
- **integration_secrets**: Encrypted integration credentials

### Advanced Features
- **ai_agents**: Autonomous AI agents
- **deployments**: Deployment tracking
- **performance_metrics**: Application performance data
- **security_scans**: Security analysis results
- **collaboration**: Team collaboration features

## Development

### Setup
```bash
npm install
npm run dev
```

### Database Operations
```bash
npm run db:push  # Push schema changes
```

### Type Checking
```bash
npm run check
```

### Build
```bash
npm run build
npm start
```

## Deployment

The application deploys to Azure Container Apps using GitHub Actions:

1. **Build**: GitHub Actions builds the Docker image
2. **Registry**: Pushes to Azure Container Registry (careerateacr)
3. **Deploy**: Deploys to Azure Container Apps environment

### Azure Resources
- **Resource Group**: Careerate
- **Container Registry**: careerateacr
- **Container Apps Environment**: careerate-agents-env
- **Key Vault**: CareeerateSecretsVault
- **Storage Account**: careeratestorage

## AI Services

### Code Generation
- **Provider**: OpenAI GPT models
- **Capabilities**: Full-stack application generation
- **Output**: Structured code with file organization
- **Features**: Code improvement, testing, optimization

### Integration Framework
- **Repository Connections**: GitHub, GitLab integration
- **API Connectors**: RESTful API management
- **Cloud Providers**: AWS, Azure, GCP integration
- **Communication**: Slack, email, SMS notifications

## Security

- **Authentication**: Azure B2C with OAuth2 flow
- **Session Management**: Secure PostgreSQL-backed sessions
- **Secret Management**: Azure Key Vault integration
- **Encryption**: Master key for sensitive data
- **HTTPS**: Enforced in production

## Monitoring & Analytics

- **Application Insights**: Performance and error tracking
- **Usage Analytics**: User behavior tracking
- **Health Checks**: Service availability monitoring
- **Rate Limiting**: API usage controls

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Component-based architecture
- Separation of concerns

### Database
- Use Drizzle ORM for all database operations
- Implement proper migrations
- Follow foreign key relationships
- Use transactions for complex operations

### API Design
- RESTful endpoints
- Consistent error handling
- Proper HTTP status codes
- Request/response validation with Zod

### Authentication
- All API routes require authentication
- Use `isAuthenticated` middleware
- Proper session management
- Secure logout flow

## Claude Code Integration

This project is optimized for development with Claude Code:

- **Context Files**: This claude.md file provides project context
- **Type Safety**: Full TypeScript implementation
- **Clear Architecture**: Modular design with clear separation
- **Documentation**: Comprehensive inline documentation
- **Error Handling**: Consistent error patterns

### Working with Claude Code
- Use this file for understanding project structure
- Refer to schema.ts for database operations
- Check routes.ts for API endpoints
- Review component structure in client/src

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify DATABASE_URL in Azure Key Vault
2. **Authentication**: Check Azure B2C configuration
3. **Build Errors**: Run `npm run check` for type issues
4. **Environment Variables**: Ensure all secrets are in Key Vault

### Debugging
- Check application logs in Azure Container Apps
- Use browser dev tools for frontend issues
- Monitor API responses for backend problems
- Verify database connections with proper error logging