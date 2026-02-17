
import { GoogleGenAI, Type } from "@google/genai";
import { AIExplanationResult } from '../types';

const SYSTEM_INSTRUCTION = `You are a world-class senior Data Science mentor. 
Your goal is to explain cells from a Jupyter Notebook to a student.
You will receive either code cells or markdown cells.

For CODE cells: Instead of just describing what the code does line-by-line, provide deep pedagogical insight about the logic, libraries used, and how it fits into the data science workflow.

For MARKDOWN cells: Explain the significance of the documentation, what concepts it introduces, how it frames the analysis, and why good documentation matters in data science projects.

Structure your response in JSON with these fields:
1. "why": Explain the fundamental purpose of this cell in the context of a data science project.
2. "analogy": Provide a creative real-world analogy to help the student visualize the concept.
3. "pitfalls": A list of common mistakes or misconceptions beginners might have related to this cell's content.

Keep your tone encouraging, professional, and insightful.`;

const explanationSchema = {
  type: Type.OBJECT,
  properties: {
    why: {
      type: Type.STRING,
      description: "Fundamental reasoning behind this code.",
    },
    analogy: {
      type: Type.STRING,
      description: "Real-world analogy for the concept.",
    },
    pitfalls: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Common beginner mistakes.",
    },
  },
  required: ["why", "analogy", "pitfalls"],
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const explainCell = async (
  content: string,
  cellType: 'code' | 'markdown' | 'raw',
  context?: string,
  maxRetries: number = 2
): Promise<AIExplanationResult> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY. Set it in your .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const cellLabel = cellType === 'code' ? 'Code' : cellType === 'markdown' ? 'Markdown' : 'Raw';
  const prompt = `
    Context of the project: ${context || "General Data Science"}
    Cell type: ${cellLabel}
    Cell content:
    \`\`\`${cellType === 'code' ? 'python' : 'markdown'}
    ${content}
    \`\`\`
  `;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await delay(1000 * Math.pow(2, attempt - 1));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: explanationSchema,
        },
      });

      const parsed = JSON.parse(response.text || "{}") as AIExplanationResult;
      if (!parsed.why || !parsed.analogy) {
        throw new Error('Incomplete response from Gemini API');
      }
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(`Gemini API attempt ${attempt + 1} failed:`, error);
    }
  }

  console.error("Gemini API Error after retries:", lastError);
  throw lastError;
};
