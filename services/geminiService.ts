import { GoogleGenAI } from "@google/genai";

// This function abstracts the Gemini API call.
// It assumes process.env.API_KEY is available in the execution environment.
export async function callGeminiFlashJSON<T,>(payload: any): Promise<T> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Upgraded to Gemini 3 Pro Preview for "Superpowers"
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      ...payload
    });

    const textResponse = response.text.trim();
    
    // Find the start and end of the JSON object to handle responses wrapped in markdown.
    const jsonStartIndex = textResponse.indexOf('{');
    const jsonEndIndex = textResponse.lastIndexOf('}');

    if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
        console.error("LLM response did not contain a valid JSON object. Response text:", textResponse);
        throw new Error("LLM response was not in the expected JSON format.");
    }
    
    const jsonString = textResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    
    try {
        return JSON.parse(jsonString) as T;
    } catch (parseError) {
        console.error("Failed to parse extracted JSON string:", parseError);
        console.error("Extracted JSON string:", jsonString);
        console.error("Original text response from LLM:", textResponse);
        throw new Error("LLM response contained a malformed JSON object.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Forward the specific error message if available, otherwise provide a generic one.
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to get a valid response from the AI sensor: ${message} Please try again.`);
  }
}