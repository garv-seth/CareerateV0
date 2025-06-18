import { ChatOpenAI } from "@langchain/openai";

// This assumes OPENAI_API_KEY is set in the environment
export const model = new ChatOpenAI({
  temperature: 0.2,
  modelName: "gpt-4-turbo", 
}); 