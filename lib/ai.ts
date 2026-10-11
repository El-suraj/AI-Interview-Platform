import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type { ZodType } from "zod";

import { feedbackSchema, questionSchema } from "@/constants";

const feedbackResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    totalScore: {
      type: Type.NUMBER,
      description: "The candidate's overall score from 0 to 100.",
      minimum: 0,
      maximum: 100,
    },
    categoryScores: {
      type: Type.ARRAY,
      description: "Detailed scores for the required interview categories.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          score: { type: Type.NUMBER, minimum: 0, maximum: 100 },
          comment: { type: Type.STRING },
        },
        required: ["name", "score", "comment"],
      },
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    areasForImprovement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    finalAssessment: { type: Type.STRING },
  },
  required: [
    "totalScore",
    "categoryScores",
    "strengths",
    "areasForImprovement",
    "finalAssessment",
  ],
};

const questionResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: "A list of interview questions.",
      items: { type: Type.STRING },
    },
  },
  required: ["questions"],
};

export async function generateFeedback(prompt: string) {
  return generateStructuredOutput(prompt, feedbackResponseSchema, feedbackSchema);
}

export async function generateQuestions(prompt: string) {
  return generateStructuredOutput(prompt, questionResponseSchema, questionSchema);
}

async function generateStructuredOutput<T>(
  prompt: string,
  responseSchema: Schema,
  validator: ZodType<T>
): Promise<T> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: responseSchema,
    },
  });

  if (!interaction.output_text) {
    throw new Error("Gemini returned no structured output.");
  }

  const output: unknown = JSON.parse(interaction.output_text);
  return validator.parse(output);
}
