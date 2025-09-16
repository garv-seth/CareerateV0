import OpenAI from "openai";
import { PassThrough } from "stream";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GeneratedCode {
  files: Record<string, string>;
  framework: string;
  description: string;
  architecture?: string;
  dependencies?: Record<string, string>;
  databaseSchema?: any;
  apiEndpoints?: any[];
  testFiles?: Record<string, string>;
  deploymentConfig?: any;
  metadata?: any;
}

export interface GenerationContext {
  type: 'full-app' | 'component' | 'api' | 'database' | 'test';
  framework?: string;
  existingCode?: Record<string, string>;
  existingSchema?: any;
  userPreferences?: any;
  projectContext?: any;
}

export interface StreamingUpdate {
  type: 'progress' | 'file' | 'complete' | 'error';
  data: any;
  progress?: number;
}

export async function generateCodeFromPrompt(
  prompt: string, 
  context: GenerationContext = { type: 'full-app' }
): Promise<GeneratedCode> {
  try {
    const systemPrompt = buildAdvancedSystemPrompt(context);
    const enhancedPrompt = enhanceUserPrompt(prompt, context);

    // Try GPT-5 first, fallback to GPT-4 if not available
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enhancedPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8000,
        temperature: 0.7,
      });
    } catch (gpt5Error) {
      console.log('GPT-5 failed, falling back to GPT-4:', gpt5Error.message);
      response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enhancedPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8000,
        temperature: 0.7,
      });
    }

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      files: result.files || {},
      framework: result.framework || detectFramework(prompt, context),
      description: result.description || "Generated application",
      architecture: result.architecture || "monolith",
      dependencies: result.dependencies || {},
      databaseSchema: result.databaseSchema || null,
      apiEndpoints: result.apiEndpoints || [],
      testFiles: result.testFiles || {},
      deploymentConfig: result.deploymentConfig || null,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: prompt,
        context: context,
        model: "gpt-5",
        tokensUsed: response.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    console.error("Code generation failed:", error);
    throw new Error("Failed to generate code: " + (error as Error).message);
  }
}

export async function* generateCodeStreamFromPrompt(
  prompt: string,
  context: GenerationContext = { type: 'full-app' },
  onProgress?: (update: StreamingUpdate) => void
): AsyncGenerator<StreamingUpdate> {
  try {
    const systemPrompt = buildAdvancedSystemPrompt(context, true);
    const enhancedPrompt = enhanceUserPrompt(prompt, context);

    yield { type: 'progress', data: 'Initializing generation...', progress: 5 };
    onProgress?.({ type: 'progress', data: 'Initializing generation...', progress: 5 });

    // Try GPT-5 first, fallback to GPT-4 if streaming not available
    let stream;
    try {
      stream = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enhancedPrompt },
        ],
        stream: true,
        max_completion_tokens: 8000,
      });
    } catch (streamError) {
      console.log('GPT-5 streaming failed, falling back to GPT-4 streaming:', streamError.message);
      stream = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enhancedPrompt },
        ],
        stream: true,
        max_completion_tokens: 8000,
      });
    }

    let content = "";
    let progress = 10;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      content += delta;
      progress = Math.min(90, progress + 2);
      
      const update: StreamingUpdate = {
        type: 'progress',
        data: `Generating code... ${delta.slice(-20)}`,
        progress
      };
      
      yield update;
      onProgress?.(update);
    }

    yield { type: 'progress', data: 'Processing generated code...', progress: 95 };
    onProgress?.({ type: 'progress', data: 'Processing generated code...', progress: 95 });

    const result = JSON.parse(content || "{}");
    const generatedCode: GeneratedCode = {
      files: result.files || {},
      framework: result.framework || detectFramework(prompt, context),
      description: result.description || "Generated application",
      architecture: result.architecture || "monolith",
      dependencies: result.dependencies || {},
      databaseSchema: result.databaseSchema || null,
      apiEndpoints: result.apiEndpoints || [],
      testFiles: result.testFiles || {},
      deploymentConfig: result.deploymentConfig || null,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: prompt,
        context: context,
        model: "gpt-5"
      }
    };

    const completeUpdate: StreamingUpdate = {
      type: 'complete',
      data: generatedCode,
      progress: 100
    };
    
    yield completeUpdate;
    onProgress?.(completeUpdate);

  } catch (error) {
    console.error("Streaming code generation failed:", error);
    const errorUpdate: StreamingUpdate = {
      type: 'error',
      data: "Failed to generate code: " + (error as Error).message
    };
    yield errorUpdate;
    onProgress?.(errorUpdate);
  }
}

export async function improveCode(
  existingCode: Record<string, string>, 
  improvement: string, 
  context?: GenerationContext
): Promise<GeneratedCode> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert developer. Improve the given codebase based on the user's request. 
          
          Return a JSON object with the improved code structure:
          {
            "files": { "filename": "content" },
            "framework": "detected framework",
            "description": "what was improved",
            "changes": ["list of changes made"],
            "dependencies": { "new dependencies if any" }
          }
          
          - Maintain existing code structure and conventions
          - Only modify what's necessary for the improvement
          - Add proper error handling and TypeScript types
          - Include comments explaining complex changes`
        },
        {
          role: "user",
          content: `Existing codebase:\n${JSON.stringify(existingCode, null, 2)}\n\nImprovement request: ${improvement}`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 6000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      files: result.files || existingCode,
      framework: result.framework || "unknown",
      description: result.description || "Code improved",
      dependencies: result.dependencies || {},
      metadata: {
        changes: result.changes || [],
        improvedAt: new Date().toISOString(),
        improvementRequest: improvement
      }
    };
  } catch (error) {
    console.error("Code improvement failed:", error);
    throw new Error("Failed to improve code: " + (error as Error).message);
  }
}

// Helper functions

function buildAdvancedSystemPrompt(context: GenerationContext, streaming = false): string {
  const basePrompt = `You are an expert full-stack developer and software architect. You create production-ready, scalable applications with modern best practices.`;
  
  const contextPrompts = {
    'full-app': `Generate a complete full-stack application with:
    - Modern frontend (React, Vue, or Svelte with TypeScript)
    - Backend API (Node.js/Express, Python/FastAPI, or similar)
    - Database schema and models
    - Authentication and authorization
    - Comprehensive testing suite
    - Docker configuration
    - CI/CD pipeline setup
    - Security best practices
    - Performance optimizations
    - Accessibility compliance (WCAG 2.1)
    - SEO optimization`,
    
    'component': `Generate reusable, well-tested UI components with:
    - TypeScript interfaces and props
    - Accessibility features
    - Responsive design
    - Storybook stories
    - Unit tests
    - Documentation`,
    
    'api': `Generate a robust API with:
    - RESTful endpoints with proper HTTP methods
    - Input validation and error handling
    - Authentication middleware
    - Rate limiting
    - API documentation (OpenAPI/Swagger)
    - Integration tests
    - Database integration`,
    
    'database': `Generate database schema with:
    - Normalized table structure
    - Proper relationships and constraints
    - Indexes for performance
    - Migration scripts
    - Seed data
    - Backup strategies`,
    
    'test': `Generate comprehensive test suites with:
    - Unit tests with high coverage
    - Integration tests for APIs
    - E2E tests for user flows
    - Performance tests
    - Security tests
    - Test data factories`
  };

  const frameworkGuidelines = context.framework ? getFrameworkSpecificGuidelines(context.framework) : '';
  
  const outputFormat = streaming ? 
    `Respond with a valid JSON object that can be parsed incrementally. Structure your response to allow for streaming updates.` :
    `Respond with a JSON object in this exact format:
    {
      "files": { "filepath": "content" },
      "framework": "primary framework used",
      "description": "clear description of the application",
      "architecture": "monolith|microservices|serverless",
      "dependencies": { "package": "version" },
      "databaseSchema": { "tables": [], "relationships": [] },
      "apiEndpoints": [{ "method": "GET", "path": "/api/users", "description": "" }],
      "testFiles": { "test_filepath": "test_content" },
      "deploymentConfig": { "docker": "", "ci_cd": "" }
    }`;

  return `${basePrompt}\n\n${contextPrompts[context.type]}\n\n${frameworkGuidelines}\n\n${outputFormat}`;
}

function enhanceUserPrompt(prompt: string, context: GenerationContext): string {
  let enhanced = prompt;
  
  // Add context-specific enhancements
  if (context.existingCode) {
    enhanced += `\n\nExisting codebase context:\n${JSON.stringify(context.existingCode, null, 2)}`;
  }
  
  if (context.userPreferences) {
    enhanced += `\n\nUser preferences: ${JSON.stringify(context.userPreferences)}`;
  }
  
  // Add intelligent suggestions based on prompt analysis
  const suggestions = analyzePromptAndSuggest(prompt);
  if (suggestions.length > 0) {
    enhanced += `\n\nSuggested considerations: ${suggestions.join(', ')}`;
  }
  
  return enhanced;
}

function detectFramework(prompt: string, context: GenerationContext): string {
  const frameworks = {
    'react': ['react', 'jsx', 'tsx', 'nextjs', 'next.js'],
    'vue': ['vue', 'vuejs', 'nuxt'],
    'angular': ['angular', 'ng'],
    'svelte': ['svelte', 'sveltekit'],
    'express': ['express', 'node', 'nodejs'],
    'fastapi': ['fastapi', 'python', 'flask'],
    'nextjs': ['next.js', 'nextjs', 'next']
  };
  
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [framework, keywords] of Object.entries(frameworks)) {
    if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
      return framework;
    }
  }
  
  return context.framework || 'react'; // default to react
}

function getFrameworkSpecificGuidelines(framework: string): string {
  const guidelines = {
    'react': `Use React 18+ with functional components, hooks, and TypeScript. Include error boundaries, lazy loading, and React Query for data fetching.`,
    'vue': `Use Vue 3 with Composition API, TypeScript, and Pinia for state management. Include proper component organization.`,
    'nextjs': `Use Next.js 14+ with App Router, TypeScript, Tailwind CSS, and proper SEO optimization.`,
    'express': `Use Express with TypeScript, proper middleware structure, error handling, and security best practices.`,
    'fastapi': `Use FastAPI with Pydantic models, proper async/await, authentication, and API documentation.`
  };
  
  return guidelines[framework] || '';
}

function analyzePromptAndSuggest(prompt: string): string[] {
  const suggestions: string[] = [];
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('user') || lowerPrompt.includes('auth')) {
    suggestions.push('Consider implementing JWT authentication and user roles');
  }
  
  if (lowerPrompt.includes('data') || lowerPrompt.includes('store')) {
    suggestions.push('Design a normalized database schema with proper relationships');
  }
  
  if (lowerPrompt.includes('mobile') || lowerPrompt.includes('responsive')) {
    suggestions.push('Implement responsive design with mobile-first approach');
  }
  
  if (lowerPrompt.includes('real-time') || lowerPrompt.includes('live')) {
    suggestions.push('Consider WebSocket implementation for real-time features');
  }
  
  if (lowerPrompt.includes('payment') || lowerPrompt.includes('ecommerce')) {
    suggestions.push('Integrate secure payment processing and inventory management');
  }
  
  return suggestions;
}

// Analyze code quality, security, and performance
export async function analyzeCode(code: string, language: string = 'typescript'): Promise<any> {
  try {
    const systemPrompt = `You are a senior code reviewer. Analyze the provided ${language} code and return a JSON object with:
    {
      "qualityScore": number (0-100),
      "securityIssues": string[],
      "performanceIssues": string[],
      "accessibilityIssues": string[],
      "suggestions": string[],
      "complexityScore": number,
      "maintainabilityScore": number
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this code:\n\n${code}` },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Code analysis error:", error);
    return { qualityScore: 50, securityIssues: [], performanceIssues: [], suggestions: [] };
  }
}

// Generate comprehensive test suites
export async function generateTests(code: string, framework: string): Promise<any> {
  try {
    const systemPrompt = `Generate comprehensive test suites for the provided code. Return JSON:
    {
      "unitTests": string,
      "integrationTests": string,
      "e2eTests": string,
      "coverage": number,
      "testFramework": string
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate tests for this ${framework} code:\n\n${code}` },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3000,
      temperature: 0.5,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Test generation error:", error);
    return { unitTests: "", integrationTests: "", e2eTests: "" };
  }
}

// Optimize code for performance and security
export async function optimizeCode(code: string, optimizationType: string = 'performance'): Promise<any> {
  try {
    const systemPrompt = `Optimize the provided code for ${optimizationType}. Return JSON:
    {
      "optimizedCode": string,
      "improvements": string[],
      "performanceGains": string,
      "explanation": string
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Optimize this code:\n\n${code}` },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3000,
      temperature: 0.4,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Code optimization error:", error);
    return { optimizedCode: code, improvements: [], explanation: "Optimization failed" };
  }
}
