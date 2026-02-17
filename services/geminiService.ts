import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, GeneratedOverlay } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFrame = async (base64Image: string): Promise<AIAnalysisResult> => {
  const client = getClient();
  
  // Using gemini-3-flash-preview for reliable multimodal inference
  const modelId = "gemini-3-flash-preview"; 

  const prompt = `Act as a professional broadcast video engineer. Analyze this webcam frame for a high-quality live stream.
  
  Provide a strict technical evaluation in JSON format:
  
  1. **Lighting**: Analyze dynamic range, exposure levels (clipped highlights/crushed shadows), and color temperature.
  2. **Composition**: Evaluate framing (Rule of Thirds), headroom, look room, and background aesthetics.
  3. **Video Quality**: specifically analyze image noise (grain), focus sharpness, motion blur, and compression artifacts.
  4. **Advice (Solutions)**: Provide a bulleted list of SPECIFIC, ACTIONABLE adjustments. 
     - Suggest changing specific settings: "Lower ISO to reduce grain", "Increase Exposure Compensation", "Lock White Balance to a cooler temperature".
     - Suggest physical changes: "Move key light closer", "Clean the lens", "Move camera to eye-level".
     - Do NOT use generic phrases like "improve lighting". Be technical.

  Return raw JSON only.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      lighting: { type: Type.STRING, description: "Technical assessment of lighting (e.g. 'Underexposed, mixed color temps')" },
      composition: { type: Type.STRING, description: "Framing assessment (e.g. 'Too much headroom, centered')" },
      quality: { type: Type.STRING, description: "Analysis of noise, focus, and clarity." },
      advice: { type: Type.STRING, description: "Specific technical solutions and adjustments." },
    },
    required: ["lighting", "composition", "quality", "advice"],
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
    console.error("Video Doctor Analysis Error:", error);
    throw error;
  }
};

export const generateOverlay = async (userPrompt: string): Promise<GeneratedOverlay> => {
  const client = getClient();
  
  // Using gemini-3-flash-preview for svg generation
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