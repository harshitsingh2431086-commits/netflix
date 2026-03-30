import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

// Lazy initialization to prevent crashes if key is missing during module load
let ai: GoogleGenAI | null = null;

const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const getAIRecommendations = async (userQuery: string, contextMovies: string[]): Promise<string> => {
  const client = getAIClient();
  
  if (!client) {
    return "AI service is not configured (Missing API Key).";
  }

  try {
    const model = 'gemini-2.5-flash-latest';
    const prompt = `
      You are a movie recommendation assistant for a streaming service called Netflux.
      The user is asking: "${userQuery}".
      
      Here is a list of popular movies currently available: ${contextMovies.slice(0, 10).join(', ')}.
      
      Suggest 3 movies from the list or generic popular real-world movies that fit the mood. 
      Keep the tone friendly, concise, and exciting. 
      Format the response as a short paragraph.
    `;

    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I couldn't generate a recommendation right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the AI brain right now.";
  }
};