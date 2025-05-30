# Careerate AI Career Acceleration Platform - Architecture Documentation

## Executive Summary

Careerate is an AI-powered career acceleration platform that learns from users' work patterns via a Chrome extension to provide personalized AI tool recommendations and workflow optimizations. The platform uses cutting-edge AI agents, multi-modal learning, and privacy-first data collection to enhance professional productivity.

## System Overview

### Core Vision
- **Problem**: Professionals struggle to find the right AI tools for their specific workflow and context
- **Solution**: Intelligent Chrome extension + web platform that learns work patterns and recommends optimal AI tools
- **Outcome**: 30-50% productivity improvement through personalized AI tool recommendations

### Key Features
1. **Intelligent Workflow Tracking**: Privacy-first Chrome extension monitors work patterns
2. **AI-Powered Recommendations**: Multi-agent system suggests optimal AI tools based on context
3. **Personalized Learning Paths**: Adaptive curriculum for AI tool mastery
4. **Implementation Guidance**: Step-by-step guides for tool integration
5. **Progress Analytics**: Data-driven insights on productivity improvements

## Technical Architecture

### Technology Stack

#### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with HMR
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query (TanStack Query)
- **Routing**: React Router v6
- **Authentication**: Azure MSAL (Microsoft Authentication Library)
- **Charts/Analytics**: Recharts
- **Animations**: Framer Motion

#### Backend Services

##### Node.js API (Primary Backend)
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Azure AD B2C integration
- **Session Management**: Express Session with Redis
- **Rate Limiting**: Express Rate Limit
- **Validation**: Zod schemas

##### Python AI Service (FastAPI)
- **Framework**: FastAPI with Uvicorn
- **AI/ML Libraries**: 
  - Google Gemini 2.5 Flash (via Vertex AI SDK)
  - OpenAI GPT-4o mini (as potential fallback/alternative)
  - Anthropic Claude 3 Opus/Sonnet/Haiku (as potential fallback/alternative)
  - Azure OpenAI Service (if used)
  - Hugging Face Transformers
  - scikit-learn for pattern analysis
  - pandas/numpy for data processing
- **Vector Database**: Azure Cognitive Search
- **Model Management**: Azure Machine Learning
- **Async Processing**: Celery with Redis

##### Chrome Extension
- **Manifest**: V3 (latest standard)
- **Content Scripts**: JavaScript ES6+
- **Background Service**: Service Worker
- **Communication**: Message passing + Chrome Storage API
- **Privacy**: Zero PII collection, local data processing

#### Infrastructure (Azure Cloud)

##### Core Services
- **Hosting**: Azure App Service (Linux containers)
- **Database**: Azure Database for PostgreSQL (Flexible Server)
- **Cache**: Azure Cache for Redis (Premium tier)
- **Storage**: Azure Blob Storage (hot/cool tiers)
- **Search**: Azure Cognitive Search
- **AI**: Azure OpenAI Service + Azure Machine Learning

##### Security & Identity
- **Authentication**: Azure AD B2C
- **Secrets**: Azure Key Vault
- **SSL/TLS**: Azure Application Gateway
- **DDoS Protection**: Azure DDoS Protection Standard
- **Monitoring**: Azure Monitor + Application Insights

##### DevOps & CI/CD
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Container Registry**: Azure Container Registry
- **Monitoring**: Azure Monitor + Datadog
- **Logging**: Azure Log Analytics

## AI Agent Architecture

### MVP Focus: DevOps/SRE Engineers
The Minimum Viable Product (MVP) will specifically target **DevOps Engineers and Site Reliability Engineers (SREs)**. This focus allows for a lean yet impactful initial offering, leveraging the rich tool ecosystem and automation-centric workflows of these professionals. Learnings from this MVP will inform expansion to other tech roles.

### LangGraph Agent for DevOps/SRE Assistance

The core of the AI system will be a **LangGraph-powered agent** built with the Vertex AI SDK, utilizing a **Gemini model** (e.g., `gemini-1.5-pro` or `gemini-1.5-flash`). This agent will be designed to understand the context of DevOps/SRE workflows and provide actionable recommendations.

```python
# Conceptual structure of the DevOps LangGraph Agent
from vertexai import agent_engines
from langchain_google_vertexai import HarmBlockThreshold, HarmCategory
from vertexai.preview.generative_models import ToolConfig

# 1. Define and configure a model
MODEL_NAME = "gemini-2.5-flash-preview-05-20" # Or gemini-1.5-pro

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_UNSPECIFIED: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    # ... other safety settings
}

MODEL_KWARGS = {
    "temperature": 0.3,
    "max_output_tokens": 2048,
    "top_p": 0.95,
    "safety_settings": SAFETY_SETTINGS,
}

# 2. Define DevOps-specific tools (Python functions)
# Example tools (to be implemented in fastapi_service/core/devops_langgraph_tools.py)
def search_devops_ai_tools(
    query: str,
    category: Optional[str] = None, # e.g., "iac", "ci_cd", "monitoring"
    tags: Optional[List[str]] = None # e.g., ["terraform", "kubernetes"]
) -> List[Dict[str, Any]]:
    """Searches the AIToolsRepository for DevOps/SRE specific AI tools."""
    # ... implementation using AIToolsRepository ...
    pass

def suggest_iac_optimization(
    iac_tool: str, # "terraform", "ansible", "pulumi"
    code_snippet: Optional[str] = None,
    task_description: Optional[str] = None
) -> Dict[str, str]:
    """Suggests optimizations or AI tools for IaC tasks."""
    # ... implementation using Gemini for analysis ...
    pass

def analyze_cli_usage_patterns(
    cli_history: List[str], # e.g., ["kubectl get pods", "docker build ."]
    target_tool: Optional[str] = None # e.g., "kubectl", "docker", "terraform"
) -> Dict[str, Any]:
    """Analyzes CLI command history for common patterns and suggests AI tools or aliases."""
    # ... implementation ...
    pass

# 3. (Optional) Store checkpoints (using PostgreSQL)
# CHECKPOINTER_KWARGS will be configured via `fastapi_service/core/config.py`
# from database_config import CHECKPOINTER_KWARGS, checkpointer_builder

# 4. (Optional) Customize the prompt template
# A system prompt will be defined to guide the agent for DevOps/SRE tasks.
DEVOPS_SYSTEM_INSTRUCTION = (
    "You are a specialized AI assistant for DevOps and SRE professionals. "
    "Your goal is to help them optimize workflows, discover relevant AI tools, "
    "troubleshoot issues, and automate tasks related to Infrastructure as Code (IaC), "
    "CI/CD, containerization (Docker, Kubernetes), monitoring, and cloud platforms. "
    "Analyze provided context (e.g., CLI usage, code snippets, task descriptions) "
    "and offer actionable, specific, and concise recommendations. "
    "Prioritize tools and techniques that enhance automation and reliability."
)

# 5. Create the LangGraph agent
# This will be done in `fastapi_service/core/devops_langgraph_agent.py`
# devops_agent = agent_engines.LanggraphAgent(
#     model=MODEL_NAME,
#     model_kwargs=MODEL_KWARGS,
#     tools=[
#         search_devops_ai_tools,
#         suggest_iac_optimization,
#         analyze_cli_usage_patterns,
#         # Potentially a GoogleSearchRetrieval tool for broader context
#     ],
#     system_instruction=DEVOPS_SYSTEM_INSTRUCTION,
#     # checkpointer_kwargs=CHECKPOINTER_KWARGS,
#     # checkpointer_builder=checkpointer_builder, # To be defined
#     model_tool_kwargs={ # Example tool configuration
#         "tool_config": {
#             "function_calling_config": {
#                 "mode": ToolConfig.FunctionCallingConfig.Mode.ANY,
#                 # "allowed_function_names": ["search_devops_ai_tools", ...],
#             },
#         },
#     }
# )

```

The previous multi-agent system (Orchestrator, Pattern Analysis, Tool Discovery, etc.) will be deprecated in favor of this more focused and integrated LangGraph agent for the MVP.

### MCP (Model Context Protocol) Integration

MCP integration will be simplified for the MVP. The `ToolDiscoveryAgent`'s previous role of interacting with MCP servers will be absorbed into the `search_devops_ai_tools` function or similar tools within the LangGraph agent, which will query our internal `ai_tools` database. This database will be curated with DevOps/SRE relevant AI tools.

#### Supported AI Tool Categories (MVP Focus: DevOps/SRE)
1.  **Infrastructure as Code (IaC)**
    *   AI for Terraform (e.g., modules, HCL generation, policy checking)
    *   AI for Ansible/Pulumi/CloudFormation
    *   Configuration management AI tools

2.  **CI/CD & Automation**
    *   AI for pipeline optimization (e.g., GitHub Actions, Jenkins, GitLab CI)
    *   AI-assisted script generation (Bash, Python, Groovy)
    *   Automated testing and quality gates with AI

3.  **Containers & Orchestration**
    *   AI for Dockerfile optimization
    *   AI for Kubernetes (e.g., manifest generation, `kubectl` assistance, cost optimization)
    *   Service mesh AI tools

4.  **Monitoring & Observability**
    *   AI for log analysis and anomaly detection (e.g., for Prometheus, Grafana, ELK, Datadog, Dynatrace)
    *   AI-powered incident response and root cause analysis
    *   Predictive monitoring tools

5.  **Cloud Platform AI Tools**
    *   Azure AI tools for DevOps (e.g., Azure DevOps AI features)
    *   AWS/GCP specific AI tools for cloud management and optimization
    *   AI for cost management in cloud environments

6.  **Security (DevSecOps)**
    *   AI for vulnerability scanning in IaC and container images
    *   AI-assisted policy enforcement
    *   Security automation tools

7.  **General Developer Productivity AI (relevant to DevOps)**
    *   Advanced code assistants (beyond basic completion)
    *   Documentation generation/summarization AI
    *   AI for API testing and interaction

## Data Architecture

### Database Schema (PostgreSQL)

#### Core Tables
```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azure_ad_id VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  profile JSONB,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Tools Registry
CREATE TABLE ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  description TEXT,
  capabilities JSONB,
  pricing_model VARCHAR,
  api_endpoints JSONB,
  performance_metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Activity Patterns (from Chrome Extension)
CREATE TABLE user_activity_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR NOT NULL,
  patterns JSONB,
  time_spent INTEGER,
  productivity_score FLOAT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Tool Recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tool_id UUID REFERENCES ai_tools(id),
  context JSONB,
  relevance_score FLOAT,
  confidence FLOAT,
  reasoning TEXT,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learning Paths
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  tools UUID[] REFERENCES ai_tools(id),
  steps JSONB,
  progress JSONB,
  estimated_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Progress Tracking
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tool_id UUID REFERENCES ai_tools(id),
  learning_path_id UUID REFERENCES learning_paths(id),
  completion_percentage FLOAT,
  skill_level VARCHAR,
  last_activity TIMESTAMP,
  metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Vector Database (Azure Cognitive Search)
- **Tool Embeddings**: Semantic representations of AI tools
- **User Pattern Embeddings**: Vectorized user behavior patterns
- **Similarity Search**: Real-time recommendation matching
- **Semantic Queries**: Natural language tool discovery

### Privacy-First Data Collection

#### Chrome Extension Data Collection (MVP: DevOps Focus)
The Chrome extension will be adapted to capture data points highly relevant to DevOps/SRE workflows, while maintaining strict privacy.
```javascript
// Non-sensitive data only, focused on DevOps activities
const activityData = {
  timestamp: Date.now(),
  domain: getDomainCategory(url), // e.g., "iac", "ci_cd", "monitoring", "cloud_platform"
  activityType: detectDevOpsActivityType(tab, pageContent), // e.g., "editing_terraform", "running_kubectl", "viewing_dashboard", "writing_script"
  duration: getTimeSpent(),
  toolsUsed: getDetectedDevOpsTools(tab, pageContent), // e.g., ["terraform_cli", "docker_cli", "aws_console", "github_actions_ui", "prometheus_ui"]
  cliCommands: getSanitizedCliCommands(pageContent), // Sanitized common CLI commands (kubectl, docker, terraform, ansible, git)
  configFileType: detectConfigFileType(pageContent, url), // e.g., "yaml", "hcl", "dockerfile", "json", "python_script", "bash_script"
  cloudProviderContext: detectCloudProvider(domain, pageContent), // e.g., "aws", "azure", "gcp"
  // NO personal content, URLs beyond domain, or identifiable information
};
```

## Security Architecture

### Zero-Trust Security Model

#### Authentication & Authorization
- **Multi-Factor Authentication**: Azure AD B2C with MFA
- **OAuth 2.0 + OpenID Connect**: Industry standard protocols
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Granular permissions

#### Data Protection
- **Encryption at Rest**: AES-256 encryption for all stored data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Key Management**: Azure Key Vault with HSM backing
- **Data Classification**: Automatic data sensitivity classification

#### API Security
- **Rate Limiting**: Adaptive rate limiting per user/endpoint
- **Input Validation**: Comprehensive validation with Zod schemas
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **CORS Configuration**: Strict cross-origin policies

#### Chrome Extension Security
- **Content Security Policy (CSP)**: Strict CSP headers
- **Secure Messaging**: Encrypted message passing
- **Minimal Permissions**: Principle of least privilege
- **Regular Security Audits**: Automated vulnerability scanning

## Scalability & Performance

### Horizontal Scaling Strategy

#### Microservices Architecture
1. **User Service**: Authentication and profile management
2. **Activity Service**: Chrome extension data processing
3. **Recommendation Service**: AI-powered tool recommendations
4. **Learning Service**: Curriculum and progress management
5. **Analytics Service**: User insights and reporting

#### Auto-Scaling Configuration
```yaml
# Azure Container Instances scaling
minReplicas: 2
maxReplicas: 100
targetCPUUtilizationPercentage: 70
scaleUpPeriodSeconds: 30
scaleDownPeriodSeconds: 300
```

#### Caching Strategy
- **Redis Cluster**: Distributed caching for session data
- **CDN**: Azure CDN for static assets
- **Application-Level**: Intelligent caching for API responses
- **Database**: PostgreSQL connection pooling and read replicas

#### Performance Monitoring
- **Real-time Metrics**: Azure Application Insights
- **Custom Dashboards**: Grafana with Prometheus
- **Alerting**: PagerDuty integration for critical issues
- **Performance Testing**: Automated load testing with k6

## AI Model Management

### Model Lifecycle Management

#### Model Training Pipeline
1. **Data Preparation**: Automated feature engineering
2. **Training**: Azure Machine Learning with GPU clusters
3. **Validation**: Cross-validation and A/B testing
4. **Deployment**: Blue-green deployments
5. **Monitoring**: Model drift detection and retraining

#### Model Versioning
- **MLflow**: Experiment tracking and model registry
- **Git-based**: Version control for model code
- **Automated Rollbacks**: Quick rollback for underperforming models

#### Responsible AI
- **Bias Detection**: Automated bias testing in recommendations
- **Explainability**: LIME/SHAP for model interpretability
- **Fairness Metrics**: Continuous monitoring for algorithmic fairness
- **Human Oversight**: Human-in-the-loop for critical decisions

## Chrome Extension Architecture

### Extension Components

#### Manifest V3 Configuration
```json
{
  "manifest_version": 3,
  "name": "Careerate AI DevOps Productivity Tracker",
  "version": "1.0.0",
  "description": "Analyzes DevOps workflows to recommend AI tools and optimizations.",
  "permissions": [
    "storage", 
    "alarms", 
    "activeTab", 
    "scripting", 
    "notifications"
  ],
  "host_permissions": ["*://*/*"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content-script.js"],
    "run_at": "document_idle",
    "all_frames": false
  }],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "options_page": "options.html",
  "web_accessible_resources": [
    {
      "resources": ["icons/*.png"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

#### Background Service Worker (DevOps Focus)
```javascript
// background.js
// ... (imports and existing class structure) ...

// Ensure placeholder or actual icon files (icon16.png, icon48.png, icon128.png)
// exist in the chrome_extension/icons/ directory.

class AdvancedActivityTracker {
  // ... (constructor, existing methods) ...

  detectActivityType(tab, pageContentDetails) { // Updated to accept pageContentDetails
    const url = tab.url.toLowerCase();
    const title = tab.title.toLowerCase();
    const domain = this.getDomain(tab.url);

    // DevOps specific activity detection
    if (pageContentDetails?.isEditingYAML || pageContentDetails?.isEditingHCL || pageContentDetails?.isEditingDockerfile) {
        if (url.includes("github") || url.includes("gitlab")) return "editing_iac_vcs";
        return "editing_config_file";
    }
    if (pageContentDetails?.isViewingTerminal && pageContentDetails.detectedCliTools?.length > 0) {
        return `running_${pageContentDetails.detectedCliTools[0]}`; // e.g., running_kubectl
    }
    if (domain.includes("jenkins") || domain.includes("gitlab") || (domain.includes("github") && url.includes("/actions"))) {
        return "managing_ci_cd";
    }
    if (domain.includes("grafana") || domain.includes("prometheus") || domain.includes("datadoghq") || domain.includes("newrelic")) {
        return "viewing_monitoring_dashboard";
    }
    if (domain.includes("aws.amazon.com") || domain.includes("portal.azure.com") || domain.includes("console.cloud.google.com")) {
        return `managing_cloud_${this.detectCloudProvider(domain, {})}`;
    }
     if (pageContentDetails?.isEditingPython || pageContentDetails?.isEditingShell) {
        return "writing_script";
    }
    // Fallback to general patterns
    for (const [activityType, pattern] of Object.entries(ACTIVITY_PATTERNS)) {
      if (pattern.domains.some(d => domain.includes(d))) return activityType;
      if (pattern.keywords.some(k => url.includes(k) || title.includes(k))) return activityType;
    }
    return 'browsing_devops_general';
  }

  detectAITools(tab, pageContentDetails) { // Updated
    const url = tab.url.toLowerCase();
    const domain = this.getDomain(tab.url);
    const detectedTools = [];

    // General AI Tools
    for (const [toolName, patterns] of Object.entries(AI_TOOLS_PATTERNS.general)) { // Assuming AI_TOOLS_PATTERNS is structured
      if (patterns.some(p => url.includes(p) || domain.includes(p))) detectedTools.push(toolName);
    }
    // DevOps Specific AI Tools (from page content or known domains)
    if (pageContentDetails?.detectedDevOpsAITools?.length > 0) {
        detectedTools.push(...pageContentDetails.detectedDevOpsAITools);
    }
    // Add more specific DevOps AI tool detection if necessary, e.g. based on known API calls or UI elements
    
    return [...new Set(detectedTools)]; // Unique tools
  }

  async getPageContext(tab) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: false }, // Target only top frame
        func: this.extractPageContext // This function runs in the page's context
      });
      return this.privacyFilter.sanitizeContext(result?.result || {});
    } catch (error) {
      if (CONFIG.DEBUG) console.warn('Could not extract page context for tab:', tab.id, tab.url, error.message);
      return {};
    }
  }

  extractPageContext() {
    // This function runs in the page context
    const getSanitizedCli = (text) => {
        if (!text) return [];
        const commonCommands = ["kubectl", "docker", "terraform", "ansible", "git", "aws", "az", "gcloud", "helm", "skaffold"];
        const lines = text.split('\n');
        const commands = [];
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("$ ") || trimmedLine.startsWith("# ")) { // Common prompt indicators
                const commandPart = trimmedLine.substring(2);
                const firstWord = commandPart.split(" ")[0];
                if (commonCommands.includes(firstWord)) {
                    // Sanitize: keep command and first few args, redact sensitive parts
                    const parts = commandPart.split(" ").slice(0, 4);
                    if (parts.length > 1 && parts.includes("--token")) parts.splice(parts.indexOf("--token"), 2); // Example redaction
                    commands.push(parts.join(" "));
                    if (commands.length >= 5) break; // Limit collected commands
                }
            }
        }
        return commands;
    };
    
    const detectTerminals = () => document.querySelectorAll('textarea[class*="terminal"], div[class*="terminal"], pre[class*="terminal"], .xterm-screen').length > 0;
    const getTerminalContent = () => {
        const termElement = document.querySelector('.xterm-screen textarea, textarea[class*="terminal"]'); // Prioritize accessible ones
        return termElement ? (termElement as HTMLTextAreaElement).value : document.body.innerText; // Fallback
    };

    const terminalContent = detectTerminals() ? getTerminalContent() : "";
    const bodyText = document.body.innerText || "";

    const context = {
      isEditingYAML: !!document.querySelector('pre code.language-yaml, pre code.language-yml, textarea[data-mode="yaml"]'),
      isEditingHCL: !!document.querySelector('pre code.language-hcl, pre code.language-terraform, textarea[data-mode="hcl"]'),
      isEditingDockerfile: /dockerfile/i.test(document.title) || !!document.querySelector('pre code.language-dockerfile, textarea[data-mode="dockerfile"]'),
      isEditingPython: !!document.querySelector('pre code.language-python, textarea[data-mode="python"]'),
      isEditingShell: !!document.querySelector('pre code.language-shell, pre code.language-bash, textarea[data-mode="shell"]'),
      isViewingTerminal: detectTerminals(),
      detectedCliTools: [...new Set(getSanitizedCli(terminalContent).map(cmd => cmd.split(" ")[0]))], // e.g. ["kubectl", "docker"]
      sanitizedCliCommands: getSanitizedCli(terminalContent).slice(0,5), // Top 5 sanitized commands
      configFileType: null, // To be refined based on content/URL
      cloudProviderContext: null, // To be detected based on domain/content
      pageKeywords: (bodyText.match(/\b(terraform|ansible|kubernetes|docker|aws|azure|gcp|ci\/cd|jenkins|gitlab|prometheus|grafana)\b/gi) || []).slice(0,10),
      detectedDevOpsAITools: [], // Placeholder for more specific AI tool detection in content
      // Add more DevOps specific context points
    };

    // Refine configFileType
    if (context.isEditingYAML) context.configFileType = 'yaml';
    else if (context.isEditingHCL) context.configFileType = 'hcl';
    else if (context.isEditingDockerfile) context.configFileType = 'dockerfile';
    else if (context.isEditingPython) context.configFileType = 'python_script';
    else if (context.isEditingShell) context.configFileType = 'bash_script';

    // Detect cloud provider from domain
    const hostname = window.location.hostname;
    if (hostname.includes("aws.amazon.com")) context.cloudProviderContext = "aws";
    else if (hostname.includes("portal.azure.com") || hostname.includes("dev.azure.com")) context.cloudProviderContext = "azure";
    else if (hostname.includes("console.cloud.google.com")) context.cloudProviderContext = "gcp";

    return context;
  }

  // ... (rest of the BackgroundService/AdvancedActivityTracker class)
}

// Update AI_TOOLS_PATTERNS to be more structured for DevOps
const AI_TOOLS_PATTERNS = {
    general: { // Existing general tools
        'gpt': ['openai.com', 'chat.openai.com', 'chatgpt'],
        'claude': ['anthropic.com', 'claude.ai'],
        // ... other general tools
    },
    devops: { // DevOps specific AI tools (can be expanded)
        'github-copilot-enterprise': ['copilot.github.com/enterprise'], // Example
        'datadog-ai': ['app.datadoghq.com/ai'], // Example
        'aws-codewhisperer': ['aws.amazon.com/codewhisperer'],
        'azure-devops-ai': ['dev.azure.com'], // If specific AI features are on subpaths
    }
};

// Update ACTIVITY_PATTERNS for DevOps
const ACTIVITY_PATTERNS = {
  editing_config_file: { keywords: ['yaml', 'hcl', 'json', 'dockerfile', 'conf', 'ini'], domains: [], indicators: ['editor', 'textarea', 'code', 'pre'] },
  running_cli: { keywords: ['terminal', 'console', 'command line'], domains: [], indicators: ['terminal', 'xterm'] },
  managing_ci_cd: { keywords: ['pipeline', 'deploy', 'build', 'release'], domains: ['jenkins', 'gitlab.com', 'github.com/actions', 'circleci.com', 'travis-ci.com', 'dev.azure.com'], indicators: ['pipeline', 'build-status'] },
  viewing_monitoring_dashboard: { keywords: ['dashboard', 'metrics', 'logs', 'alerts', 'tracing'], domains: ['grafana.com', 'prometheus.io', 'datadoghq.com', 'newrelic.com', 'splunk.com'], indicators: ['chart', 'graph', 'dashboard'] },
  managing_cloud_aws: { keywords: ['aws', 'ec2', 's3', 'lambda', 'rds'], domains: ['aws.amazon.com', 'console.aws.amazon.com'], indicators: ['aws-console'] },
  managing_cloud_azure: { keywords: ['azure', 'vm', 'blob', 'functions'], domains: ['portal.azure.com', 'dev.azure.com'], indicators: ['azure-portal'] },
  managing_cloud_gcp: { keywords: ['gcp', 'compute engine', 'cloud storage', 'cloud functions'], domains: ['console.cloud.google.com'], indicators: ['gcp-console'] },
  writing_script_python: { keywords: ['.py', 'python'], domains: [], indicators: ['python', 'script'] },
  writing_script_shell: { keywords: ['.sh', 'bash', 'shell'], domains: [], indicators: ['bash', 'shell', 'script'] },
  editing_iac_vcs: { keywords: ['terraform', 'ansible', 'pulumi', 'cloudformation', '.tf', '.yaml'], domains: ['github.com', 'gitlab.com', 'bitbucket.org'], indicators: ['diff', 'commit', 'pull request'] },
  browsing_devops_general: { keywords: ['devops', 'sre', 'kubernetes', 'docker'], domains: ['stackoverflow.com', 'reddit.com/r/devops'], indicators: [] },
  // ... (other general patterns like 'research', 'communication' can remain but might be less frequent for core DevOps tasks)
};

```

#### Content Script
```javascript
class ContentScript {
  constructor() {
    this.activityDetector = new ActivityDetector();
    this.toolDetector = new ToolDetector();
  }
  
  detectActivity() {
    const activity = {
      type: this.activityDetector.getCurrentActivity(),
      tools: this.toolDetector.getDetectedTools(),
      duration: this.activityDetector.getSessionDuration()
    };
    
    chrome.runtime.sendMessage({action: 'trackActivity', data: activity});
  }
}
```

#### Privacy-First Data Collection
- **No PII Collection**: No personal information collected
- **Local Processing**: All sensitive processing done locally
- **Opt-in Analytics**: User consent for all data collection
- **Data Transparency**: Clear explanation of data usage

## Integration Architecture

### Third-Party Integrations

#### AI Service Providers
```typescript
interface AIProvider {
  name: string;
  apiEndpoint: string;
  authentication: AuthMethod;
  models: string[];
  rateLimits: RateLimit;
  capabilities: Capability[];
}

const providers: AIProvider[] = [
  {
    name: "Google Vertex AI",
    apiEndpoint: "https://us-central1-aiplatform.googleapis.com", // Example endpoint
    authentication: "service-account-gcp",
    models: ["gemini-2.5-flash-preview-05-20", "gemini-1.5-pro"],
    capabilities: ["text-generation", "chat", "embeddings", "function-calling", "multimodal"]
  },
  {
    name: "OpenAI",
    apiEndpoint: "https://api.openai.com/v1",
    authentication: "api-key",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    capabilities: ["text-generation", "chat", "embeddings", "function-calling", "multimodal"]
  },
  {
    name: "Anthropic",
    apiEndpoint: "https://api.anthropic.com",
    authentication: "api-key", 
    models: ["claude-3-opus", "claude-3-sonnet"],
    capabilities: ["text-generation", "analysis", "reasoning"]
  }
];
```

#### Tool Discovery APIs
- **Product Hunt API**: Latest AI tool launches
- **GitHub API**: Trending AI repositories
- **Crunchbase API**: Funding and company data
- **Custom Scrapers**: Specialized AI tool directories

#### Analytics & Monitoring
- **Azure Application Insights**: Application performance monitoring
- **Datadog**: Infrastructure and custom metrics
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: User behavior analytics (privacy-compliant)

## Development Workflow

### Development Environment

#### Local Development Setup
```bash
# Prerequisites
node --version # v18+
python --version # 3.11+
docker --version # 20+
terraform --version # 1.5+

# Setup
git clone https://github.com/your-org/careerate-v0
cd careerate-v0

# Install dependencies
npm install
cd fastapi_service && pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env with local development values

# Start development servers
npm run dev # Frontend + Node.js API
python fastapi_service/main.py # Python AI service
```

#### Testing Strategy
- **Unit Tests**: Jest (Frontend), pytest (Backend)
- **Integration Tests**: Cypress (E2E), Supertest (API)
- **AI Model Tests**: Custom testing framework for ML models
- **Performance Tests**: k6 for load testing
- **Security Tests**: OWASP ZAP for security scanning

#### Code Quality
- **Linting**: ESLint, Prettier, Black (Python)
- **Type Checking**: TypeScript strict mode, mypy (Python)
- **Code Review**: GitHub Pull Request reviews
- **Automated Checks**: Pre-commit hooks with husky

### Deployment Pipeline

#### CI/CD Workflow (GitHub Actions)
```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm test
          python -m pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'careerate-prod'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

#### Infrastructure as Code (Terraform)
```hcl
# Azure Resource Group
resource "azurerm_resource_group" "careerate" {
  name     = "careerate-rg"
  location = "East US"
}

# Azure App Service Plan
resource "azurerm_service_plan" "careerate" {
  name                = "careerate-plan"
  resource_group_name = azurerm_resource_group.careerate.name
  location           = azurerm_resource_group.careerate.location
  os_type            = "Linux"
  sku_name           = "P1v3"
}

# Azure Database for PostgreSQL
resource "azurerm_postgresql_flexible_server" "careerate" {
  name                   = "careerate-db"
  resource_group_name    = azurerm_resource_group.careerate.name
  location              = azurerm_resource_group.careerate.location
  version               = "14"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  storage_mb            = 32768
  sku_name              = "GP_Standard_D2s_v3"
}
```

## Monitoring & Observability

### Application Monitoring

#### Metrics Collection
- **Business Metrics**: User engagement, recommendation accuracy, tool adoption
- **Technical Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, network, storage
- **AI Model Metrics**: Prediction accuracy, model drift, training metrics

#### Alerting Strategy
```yaml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    severity: "critical"
    notification: ["pagerduty", "slack"]
  
  - name: "Model Accuracy Degradation"
    condition: "recommendation_accuracy < 80%"
    severity: "warning"
    notification: ["slack", "email"]
  
  - name: "Database Connection Issues"
    condition: "db_connection_errors > 10"
    severity: "critical"
    notification: ["pagerduty"]
```

#### Logging Strategy
- **Structured Logging**: JSON format with consistent schema
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Correlation IDs**: Track requests across services
- **Sensitive Data**: Automatic PII redaction

## Business Intelligence & Analytics

### User Analytics

#### Key Performance Indicators (KPIs)
1. **User Engagement**
   - Daily/Monthly Active Users
   - Session duration and frequency
   - Feature adoption rates

2. **Recommendation Quality**
   - Recommendation click-through rate
   - Tool adoption rate post-recommendation
   - User satisfaction scores

3. **Learning Effectiveness**
   - Learning path completion rates
   - Skill improvement metrics
   - Time to proficiency

4. **Business Metrics**
   - User retention rates
   - Conversion funnel metrics
   - Revenue per user (if applicable)

#### Analytics Dashboard
```typescript
interface AnalyticsDashboard {
  userMetrics: {
    activeUsers: number;
    newUsers: number;
    retentionRate: number;
  };
  
  recommendationMetrics: {
    accuracy: number;
    clickThroughRate: number;
    adoptionRate: number;
  };
  
  learningMetrics: {
    completionRate: number;
    averageTimeToComplete: number;
    skillImprovement: number;
  };
}
```

## Compliance & Legal

### Data Privacy Compliance

#### GDPR Compliance
- **Right to Access**: User data export functionality
- **Right to Rectification**: User profile editing
- **Right to Erasure**: Account deletion with data purging
- **Data Portability**: Standard format data export
- **Consent Management**: Granular consent controls

#### CCPA Compliance
- **Transparency**: Clear privacy policy and data usage
- **Consumer Rights**: Data access, deletion, and opt-out
- **Non-Discrimination**: No penalty for privacy choices

#### SOC 2 Type II
- **Security**: Comprehensive security controls
- **Availability**: High availability architecture
- **Processing Integrity**: Data accuracy and completeness
- **Confidentiality**: Proper data classification and access controls

## Future Roadmap

### Phase 1: MVP (Months 1-3)
- [x] Basic Chrome extension with activity tracking
- [x] Simple recommendation engine
- [x] User authentication and profiles
- [ ] Basic learning paths
- [ ] MVP web dashboard

### Phase 2: Enhanced AI (Months 4-6)
- [ ] Advanced recommendation algorithms
- [ ] Multi-agent system implementation
- [ ] Real-time tool discovery
- [ ] Personalized learning paths
- [ ] Implementation guides

### Phase 3: Advanced Features (Months 7-12)
- [ ] Team collaboration features
- [ ] Enterprise integrations
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] API marketplace for third-party tools

### Phase 4: Scale & Enterprise (Year 2)
- [ ] Multi-tenant architecture
- [ ] Advanced security features
- [ ] Custom AI model training
- [ ] White-label solutions
- [ ] Global expansion

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled, comprehensive type coverage
- **Python**: Type hints, docstrings, PEP 8 compliance
- **Testing**: Minimum 80% code coverage
- **Documentation**: Comprehensive API documentation with OpenAPI

### Security Guidelines
- **Input Validation**: All inputs validated and sanitized
- **Authentication**: Multi-factor authentication required
- **Authorization**: Principle of least privilege
- **Data Handling**: Encrypt sensitive data, minimize data collection

### Performance Guidelines
- **Response Times**: < 200ms for API endpoints
- **Page Load**: < 2 seconds for web pages
- **Scalability**: Design for 10x current load
- **Efficiency**: Optimize database queries and AI model inference

This architecture document serves as the single source of truth for the Careerate AI Career Acceleration Platform. All development teams and AI agents should refer to this document for implementation guidance and architectural decisions. 