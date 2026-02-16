import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, GeneratedOverlay } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFrame = async (base64Image: string): Promise<AIAnalysisResult> => {
  const client = getClient();
  
  // Using flash-latest for fast multimodal inference
  const modelId = "gemini-2.0-flash-exp"; 

  const prompt = `Analyze this webcam frame for a live stream setup. 
  Provide brief, professional feedback on:
  1. Lighting quality (is it too dark, washed out, uneven?)
  2. Composition (headroom, centering, background clutter)
  3. Actionable advice to improve the shot.
  
  Return raw JSON only.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      lighting: { type: Type.STRING },
      composition: { type: Type.STRING },
      advice: { type: Type.STRING },
    },
    required: ["lighting", "composition", "advice"],
  };

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateOverlay = async (userPrompt: string): Promise<GeneratedOverlay> => {
  const client = getClient();
  
  // Using pro for better code/SVG generation
  const modelId = "gemini-3-flash-preview"; 

  const systemPrompt = `You are a professional broadcast graphics designer. 
  Generate a transparent SVG overlay based on the user's request. 
  The SVG should be modern, clean, and suitable for a live stream (OBS/vMix).
  
  Return JSON containing the SVG string and the best position for it.
  The SVG must have width="100%" and height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet".
  Ensure text is legible. Use gradients or semi-transparent backgrounds where appropriate.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      svgContent: { type: Type.STRING, description: "The full <svg>...</svg> string" },
      position: { type: Type.STRING, enum: ['bottom-left', 'bottom-right', 'top-right', 'top-left', 'center', 'full'] }
    },
    required: ["id", "svgContent", "position"]
  };

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GeneratedOverlay;
  } catch (error) {
    console.error("Gemini Overlay Gen Error:", error);
    throw error;
  }
};