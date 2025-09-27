import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

// A2A Protocol JSON-RPC 2.0 Schema
const A2AMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any(),
  id: z.string()
});

const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['orchestrator', 'specialist']),
  type: z.enum(['cara', 'codesmith', 'architect', 'guardian', 'deployer']),
  status: z.enum(['idle', 'thinking', 'working', 'completed', 'error']),
  capabilities: z.array(z.string())
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Agent System Configuration
const AGENT_PERSONALITIES = {
  cara: {
    name: 'Cara',
    role: 'AI Orchestrator',
    personality: 'You are Cara, the lead AI orchestrator who coordinates a team of specialist agents. You are intelligent, strategic, and focused on breaking down complex tasks into manageable pieces for your team. You speak confidently and provide clear direction.',
    model: 'gpt-4'
  },
  codesmith: {
    name: 'CodeSmith',
    role: 'Expert Developer',
    personality: 'You are CodeSmith, a master developer who writes clean, efficient, and maintainable code. You focus on best practices, performance, and code quality. You are methodical and detail-oriented.',
    model: 'gpt-4'
  },
  architect: {
    name: 'Architect',
    role: 'System Architect',
    personality: 'You are Architect, a system design expert who creates scalable and robust architectures. You think holistically about system design, considering performance, scalability, and maintainability.',
    model: 'gpt-4'
  },
  guardian: {
    name: 'Guardian',
    role: 'Security & Quality Specialist',
    personality: 'You are Guardian, a security and quality expert who ensures code is secure, tested, and follows best practices. You are thorough and vigilant about potential issues.',
    model: 'gpt-4'
  },
  deployer: {
    name: 'Deployer',
    role: 'DevOps Specialist',
    personality: 'You are Deployer, a DevOps expert who handles infrastructure, CI/CD, and deployments. You focus on automation, reliability, and scalability of systems.',
    model: 'gpt-4'
  }
};

// A2A Protocol Message Router
router.post('/message', isAuthenticated, async (req, res) => {
  try {
    const message = A2AMessageSchema.parse(req.body);
    const { method, params, id } = message;

    console.log(`A2A Message: ${method} -> ${params.targetAgent}`);

    // Route to appropriate handler
    let response;
    switch (method) {
      case 'task.analyze':
        response = await handleTaskAnalysis(params);
        break;
      case 'code.generate':
        response = await handleCodeGeneration(params);
        break;
      case 'system.design':
        response = await handleSystemDesign(params);
        break;
      case 'security.audit':
        response = await handleSecurityAudit(params);
        break;
      case 'deploy.setup':
        response = await handleDeploySetup(params);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }

    res.json({
      jsonrpc: '2.0',
      result: response,
      id
    });
  } catch (error) {
    console.error('A2A Protocol Error:', error);
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: 'Invalid params',
        data: error.message
      },
      id: req.body.id
    });
  }
});

// Cara's Task Analysis (Orchestrator)
async function handleTaskAnalysis(params: any) {
  const { prompt } = params;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: AGENT_PERSONALITIES.cara.personality + `

        Analyze the following task and determine:
        1. What type of task this is (code, architecture, security, deployment, or multi-agent)
        2. Which specialist agents should handle it
        3. Break it down into specific subtasks
        4. Provide a clear execution plan

        Respond in JSON format with:
        {
          "taskType": "code|architecture|security|deployment|multi",
          "assignedAgents": ["agent1", "agent2"],
          "subtasks": [{"agent": "agentId", "task": "description"}],
          "executionPlan": "overall plan description",
          "estimatedTime": "time estimate"
        }
        `
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7
  });

  const analysis = JSON.parse(response.choices[0].message.content || '{}');

  return {
    agent: 'cara',
    analysis,
    message: `I've analyzed your request. This appears to be a ${analysis.taskType} task. I'll coordinate ${analysis.assignedAgents.join(' and ')} to handle this efficiently.`
  };
}

// CodeSmith - Code Generation
async function handleCodeGeneration(params: any) {
  const { prompt, context } = params;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: AGENT_PERSONALITIES.codesmith.personality + `

        Generate high-quality, production-ready code based on the request. Include:
        - Clean, well-structured code
        - Proper TypeScript types
        - Error handling
        - Comments where necessary
        - Following best practices

        Respond with:
        {
          "code": "generated code",
          "language": "typescript|javascript|python|etc",
          "filename": "suggested filename",
          "dependencies": ["list of dependencies"],
          "explanation": "brief explanation of the code"
        }
        `
      },
      {
        role: 'user',
        content: `Generate code for: ${prompt}. Context: ${context || 'No additional context'}`
      }
    ],
    temperature: 0.3
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  return {
    agent: 'codesmith',
    result,
    message: `I've generated the code for your request. The code follows best practices and includes proper error handling.`
  };
}

// Architect - System Design
async function handleSystemDesign(params: any) {
  const { prompt, requirements } = params;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: AGENT_PERSONALITIES.architect.personality + `

        Design a system architecture based on the requirements. Consider:
        - Scalability and performance
        - Data flow and architecture patterns
        - Technology stack recommendations
        - Infrastructure requirements
        - Integration points

        Respond with:
        {
          "architecture": "system architecture description",
          "components": [{"name": "component", "description": "desc", "technology": "tech"}],
          "dataFlow": "data flow description",
          "techStack": ["technology1", "technology2"],
          "infrastructure": "infrastructure recommendations",
          "considerations": ["consideration1", "consideration2"]
        }
        `
      },
      {
        role: 'user',
        content: `Design system for: ${prompt}. Requirements: ${requirements || 'Standard web application'}`
      }
    ],
    temperature: 0.4
  });

  const design = JSON.parse(response.choices[0].message.content || '{}');

  return {
    agent: 'architect',
    design,
    message: `I've designed a scalable architecture for your system. The design considers performance, maintainability, and future growth.`
  };
}

// Guardian - Security Audit
async function handleSecurityAudit(params: any) {
  const { code, prompt } = params;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: AGENT_PERSONALITIES.guardian.personality + `

        Perform a security audit and quality review. Check for:
        - Security vulnerabilities
        - Input validation
        - Authentication/authorization issues
        - Code quality and best practices
        - Performance considerations

        Respond with:
        {
          "securityIssues": [{"severity": "high|medium|low", "issue": "description", "fix": "how to fix"}],
          "qualityIssues": [{"type": "performance|maintainability|readability", "issue": "description", "suggestion": "improvement"}],
          "overallScore": "score out of 10",
          "recommendations": ["recommendation1", "recommendation2"]
        }
        `
      },
      {
        role: 'user',
        content: `Review this for security and quality: ${code || prompt}`
      }
    ],
    temperature: 0.2
  });

  const audit = JSON.parse(response.choices[0].message.content || '{}');

  return {
    agent: 'guardian',
    audit,
    message: `Security audit complete. I've identified ${audit.securityIssues?.length || 0} security issues and ${audit.qualityIssues?.length || 0} quality improvements.`
  };
}

// Deployer - Deployment Setup
async function handleDeploySetup(params: any) {
  const { project, requirements } = params;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: AGENT_PERSONALITIES.deployer.personality + `

        Create a deployment strategy and setup. Include:
        - CI/CD pipeline configuration
        - Infrastructure requirements
        - Environment setup
        - Monitoring and logging
        - Scaling strategy

        Respond with:
        {
          "deploymentStrategy": "strategy description",
          "pipeline": [{"step": "step name", "description": "what it does", "tools": ["tool1"]}],
          "infrastructure": {"provider": "aws|azure|gcp", "services": ["service1"]},
          "monitoring": "monitoring setup",
          "scaling": "scaling strategy",
          "environmentVars": ["VAR1", "VAR2"]
        }
        `
      },
      {
        role: 'user',
        content: `Setup deployment for: ${project}. Requirements: ${requirements || 'Standard web application deployment'}`
      }
    ],
    temperature: 0.3
  });

  const deployment = JSON.parse(response.choices[0].message.content || '{}');

  return {
    agent: 'deployer',
    deployment,
    message: `Deployment strategy ready! I've configured a robust CI/CD pipeline with ${deployment.infrastructure?.provider || 'cloud'} infrastructure.`
  };
}

// Get Agent Status
router.get('/status', isAuthenticated, async (req, res) => {
  const agents = [
    {
      id: 'cara',
      name: 'Cara',
      role: 'orchestrator',
      type: 'cara',
      status: 'idle',
      capabilities: ['Task Planning', 'Agent Coordination', 'Project Management', 'Resource Allocation']
    },
    {
      id: 'codesmith',
      name: 'CodeSmith',
      role: 'specialist',
      type: 'codesmith',
      status: 'idle',
      capabilities: ['Code Generation', 'Refactoring', 'Performance Optimization', 'Best Practices']
    },
    {
      id: 'architect',
      name: 'Architect',
      role: 'specialist',
      type: 'architect',
      status: 'idle',
      capabilities: ['System Design', 'Architecture Planning', 'Scalability', 'Integration']
    },
    {
      id: 'guardian',
      name: 'Guardian',
      role: 'specialist',
      type: 'guardian',
      status: 'idle',
      capabilities: ['Security Audit', 'Code Review', 'Testing', 'Quality Assurance']
    },
    {
      id: 'deployer',
      name: 'Deployer',
      role: 'specialist',
      type: 'deployer',
      status: 'idle',
      capabilities: ['CI/CD', 'Cloud Deployment', 'Infrastructure', 'Monitoring']
    }
  ];

  res.json({ agents });
});

// Agent Discovery (A2A Protocol)
router.get('/.well-known/agent.json', (req, res) => {
  res.json({
    name: 'Careerate Agent Swarm',
    version: '1.0.0',
    protocol: 'A2A/1.0',
    description: 'AI agent swarm for software development with Cara as orchestrator',
    capabilities: [
      'task.analyze',
      'code.generate',
      'system.design',
      'security.audit',
      'deploy.setup'
    ],
    agents: Object.keys(AGENT_PERSONALITIES).map(id => ({
      id,
      name: AGENT_PERSONALITIES[id].name,
      role: AGENT_PERSONALITIES[id].role,
      capabilities: ['analyze', 'execute', 'collaborate']
    })),
    endpoints: {
      message: '/api/agents/message',
      status: '/api/agents/status'
    }
  });
});

export default router;