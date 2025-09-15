# Overview

This is a full-stack web application called "Careerate" that combines AI-powered code generation with intelligent hosting. It allows users to describe applications in natural language, generates complete code using OpenAI's API, and provides a project management dashboard. The platform is built as a modern web application with React frontend, Express backend, and PostgreSQL database.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using **React 18** with **TypeScript** and uses a modern component-based architecture:

- **Routing**: Uses `wouter` for lightweight client-side routing
- **State Management**: Employs TanStack Query (React Query) for server state management and API caching
- **UI Framework**: Built with shadcn/ui components based on Radix UI primitives and styled with Tailwind CSS
- **Styling**: Uses Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
The backend follows a **RESTful API** design using **Express.js**:

- **Framework**: Express.js with TypeScript for type safety
- **API Structure**: RESTful endpoints for user management, project CRUD operations, and AI code generation
- **Middleware**: Custom logging middleware for API request monitoring
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Uses `tsx` for TypeScript execution in development

## Database Architecture
Uses **PostgreSQL** as the primary database with **Drizzle ORM**:

- **Schema**: Defines three main entities - users, projects, and code generations
- **Relationships**: Proper foreign key relationships with cascade deletions
- **Migrations**: Uses Drizzle Kit for schema management and migrations
- **Validation**: Zod schemas for runtime type validation and API request validation

## Storage Layer
Implements a **storage abstraction pattern**:

- **Interface**: `IStorage` interface defines all database operations
- **Implementation**: `MemStorage` class provides in-memory storage for development/demo
- **Pattern**: Repository pattern separating business logic from data access
- **Demo Data**: Pre-populated with demo user and sample projects

## Code Generation System
AI-powered code generation using **OpenAI GPT-5**:

- **Prompt Engineering**: Structured system prompts for generating production-ready code
- **Output Format**: JSON response with file structure, framework info, and descriptions
- **Integration**: Seamless integration with project management system
- **Error Handling**: Robust error handling for AI API failures

## UI Component System
Comprehensive design system using **shadcn/ui**:

- **Base**: Built on Radix UI primitives for accessibility
- **Styling**: Consistent styling with Tailwind CSS and CSS variables
- **Components**: Full set of reusable components (buttons, forms, dialogs, etc.)
- **Theming**: Dark/light mode support with CSS custom properties

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service (configured via `@neondatabase/serverless`)
- **Connection**: Uses connection pooling and serverless architecture

## AI Services
- **OpenAI API**: GPT-5 model for code generation
- **Configuration**: Expects `OPENAI_API_KEY` environment variable
- **Fallback**: Graceful handling when API key is not provided

## UI Libraries
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type system for both frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds

## Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Configuration**: Integrated with database for persistent sessions

## Form Handling
- **React Hook Form**: Form state management and validation
- **Hookform Resolvers**: Integration with Zod for schema validation

## Development Environment
- **Replit Integration**: Special plugins and configuration for Replit development environment
- **Hot Module Replacement**: Fast development feedback with Vite HMR