import { GoogleGenAI, Type } from "@google/genai";
import { VerificationResult } from "../types";

// Initialize Gemini Client
const createClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing in process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Verifies if the two provided base64 images represent the same person.
 */
export const verifyIdentity = async (
  referenceImageBase64: string,
  currentImageBase64: string
): Promise<VerificationResult> => {
  const client = createClient();
  
  // Clean base64 strings if they contain data URI prefixes
  const cleanRef = referenceImageBase64.replace(/^data:image\/\w+;base64,/, "");
  const cleanCurr = currentImageBase64.replace(/^data:image\/\w+;base64,/, "");

  if (!client) {
    throw new Error("API Key not found. Please set process.env.API_KEY.");
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanRef
            }
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanCurr
            }
          },
          {
            text: `Perform a strict 1:1 face verification between Image 1 (Reference) and Image 2 (Live Capture).

            Guidelines:
            1. Analyze facial landmarks (eye distance, nose shape, jawline, mouth structure) precisely.
            2. Ignore differences in lighting, background, or minor expression changes.
            3. IGNORE clothing or accessories (glasses, hats) unless they obscure key features.
            4. If the faces are clearly different people, return match: false.
            5. If unsure or image quality is too low to be certain, return match: false.
            
            Return JSON:
            - match: boolean (true ONLY if very high probability of being the same person)
            - confidence: number (0.0 to 1.0)
            - reason: string (concise technical reason, e.g., "Mismatched jawline" or "Strong feature correlation")`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["match", "confidence", "reason"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini");

    const result = JSON.parse(resultText) as VerificationResult;
    return result;

  } catch (error) {
    console.error("Gemini Verification Failed:", error);
    throw error;
  }
};