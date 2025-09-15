import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GeneratedCode {
  files: Record<string, string>;
  framework: string;
  description: string;
}

export async function generateCodeFromPrompt(prompt: string): Promise<GeneratedCode> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert full-stack developer. Generate complete, production-ready code based on user requirements. 
          
          Respond with JSON in this exact format:
          {
            "files": {
              "src/App.tsx": "// React component code here",
              "src/components/Component.tsx": "// Component code here",
              "package.json": "// Package.json content"
            },
            "framework": "react|vue|angular|node|next",
            "description": "Brief description of the generated application"
          }
          
          - Include all necessary files for a working application
          - Use modern best practices and TypeScript when applicable
          - Include proper imports and exports
          - Make the code production-ready with error handling
          - Include package.json with all required dependencies`
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      files: result.files || {},
      framework: result.framework || "react",
      description: result.description || "Generated application"
    };
  } catch (error) {
    console.error("Code generation failed:", error);
    throw new Error("Failed to generate code: " + (error as Error).message);
  }
}

export async function improveCode(existingCode: string, improvement: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert developer. Improve the given code based on the user's request. Return only the improved code."
        },
        {
          role: "user",
          content: `Existing code:\n${existingCode}\n\nImprovement request: ${improvement}`
        }
      ],
      max_tokens: 2000,
    });

    return response.choices[0].message.content || existingCode;
  } catch (error) {
    console.error("Code improvement failed:", error);
    throw new Error("Failed to improve code: " + (error as Error).message);
  }
}
