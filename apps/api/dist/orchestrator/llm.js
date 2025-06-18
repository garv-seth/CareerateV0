"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = void 0;
const openai_1 = require("@langchain/openai");
// This assumes OPENAI_API_KEY is set in the environment
exports.model = new openai_1.ChatOpenAI({
    temperature: 0.2,
    modelName: "gpt-4-turbo",
});
//# sourceMappingURL=llm.js.map