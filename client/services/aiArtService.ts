import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// --- Konfigurace pro Google Gemini ---
const geminiApiKey = process.env.GEMINI_API_KEY;
let geminiAI: GoogleGenAI | null = null;
if (geminiApiKey) {
    geminiAI = new GoogleGenAI({ apiKey: geminiApiKey });
} else {
    console.warn("GEMINI_API_KEY environment variable not set. Google Gemini features will be disabled.");
}

// --- Konfigurace pro OpenAI ---
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
    // Důležité: 'dangerouslyAllowBrowser' je nutné pro volání z klienta.
    // V produkční aplikaci by se volání mělo dít přes bezpečný backend.
    openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });
} else {
    console.warn("OPENAI_API_KEY environment variable not set. OpenAI features will be disabled.");
}


export type ApiProvider = 'gemini' | 'openai';

/**
 * Generuje obrázek pomocí vybrané AI služby.
 * @param prompt Textový popis obrázku.
 * @param provider Kterou službu použít ('gemini' nebo 'openai').
 * @returns Base64 Data URL vygenerovaného obrázku.
 */
export const generateArt = async (prompt: string, provider: ApiProvider): Promise<string> => {
    
    if (provider === 'gemini') {
        if (!geminiAI) {
            throw new Error("API klíč pro Google Gemini není nakonfigurován.");
        }
        try {
            const response = await geminiAI.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: `fantasy art, digital painting, intricate, elegant, highly detailed, concept art, smooth, sharp focus, illustration, in the style of mtg, ${prompt}`,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '4:3',
                },
            });
            
            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            } else {
                throw new Error("API od Gemini nevrátilo žádný obrázek.");
            }

        } catch (error) {
            console.error("Chyba při generování obrázku s Gemini API:", error);
            throw new Error("Nepodařilo se vygenerovat obrázek. Zkontrolujte konzoli pro detaily.");
        }
    } 
    
    else if (provider === 'openai') {
        if (!openai) {
            throw new Error("API klíč pro OpenAI není nakonfigurován.");
        }
        try {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: `A detailed, high-quality digital painting in the style of a Magic: The Gathering card art. Subject: ${prompt}. No text, no borders.`,
                n: 1,
                size: "1024x1024", // DALL-E 3 podporuje 1024x1024, 1792x1024, or 1024x1792
                response_format: 'b64_json', // Důležité pro získání base64
            });

            const b64_json = response.data[0]?.b64_json;
            if (b64_json) {
                return `data:image/jpeg;base64,${b64_json}`;
            } else {
                throw new Error("API od OpenAI nevrátilo žádný obrázek.");
            }
        } catch (error: any) {
            console.error("Chyba při generování obrázku s OpenAI API:", error);
            const errorMessage = error.response?.data?.error?.message || "Nepodařilo se vygenerovat obrázek. Zkontrolujte konzoli pro detaily.";
            throw new Error(errorMessage);
        }
    }

    throw new Error("Neznámý poskytovatel AI.");
};