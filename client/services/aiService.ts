import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { CardData } from "../types"; // Importujeme CardData pro kontext

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
// Návratový typ se vrací do původní jednoduché podoby
export interface CardTextResult {
    rulesText: string;
    flavorText: string;
}

export const generateCardText = async (
    provider: ApiProvider,
    cardContext: CardData,
    powerLevel: 'slabá' | 'normální' | 'silná' | 'broken',
    theme: string
): Promise<CardTextResult> => {
    
    const powerLevelInstruction = {
        'slabá': "Design the card to be simple and weak, suitable for a common rarity in a draft set. Focus on flavor. A planeswalker should have simple, low-impact abilities.",
        'normální': "Design the card to be balanced and interesting for standard play, like a good uncommon or playable rare. A planeswalker should have 3 distinct abilities of increasing cost.",
        'silná': "Design the card to be powerful and impactful, suitable for competitive decks at a rare or mythic rare level. A planeswalker should have powerful, synergistic abilities, including a strong ultimate.",
        'broken': "Design the card to be intentionally overpowered and game-defining, something that would likely be banned. Push the limits of its mana cost. A planeswalker's abilities should generate immense value immediately."
    }[powerLevel];

    let typeSpecificContext = '';
    let typeSpecificInstructions = '';
    
    if (cardContext.cardType === 'Creature') {
        typeSpecificContext = `- Power/Toughness: ${cardContext.power}/${cardContext.toughness}`;
        typeSpecificInstructions = "The rules text should define abilities appropriate for a creature.";
    } else if (cardContext.cardType === 'Planeswalker') {
        const loyalty = cardContext.customFields?.loyalty;
        typeSpecificContext = loyalty ? `- Current Loyalty Value (for reference): ${loyalty}` : '';
        
        // --- ZMĚNA ZDE: Nová instrukce pro přidání komentáře ---
        typeSpecificInstructions = `
            The rules text MUST define a set of loyalty abilities for the planeswalker.
            - Follow the format: "[+N]: Effect.", "[-N]: Effect.", "[_N]: Effect.".
            - After all abilities, on a new line, add a suggestion for the starting loyalty in the format: "(Suggested starting loyalty: N)".
            - The costs of the abilities should make sense for the suggested starting loyalty and the overall power level.
        `;
    } else {
        typeSpecificInstructions = "The rules text should describe the effect of this spell or permanent.";
    }

    // Příklad v JSONu už nepotřebuje startingLoyalty
    const jsonStructureExample = `
        {
          "rulesText": "Your generated rules text here. Use \\n for line breaks.",
          "flavorText": "Your generated flavor text here."
        }
    `;

    const prompt = `
        You are an expert Magic: The Gathering card designer.
        Your task is to generate the rules text and flavor text for a custom card.
        
        Current card details for context:
        - Name: ${cardContext.name || "(Unnamed)"}
        - Mana Cost: ${cardContext.manaCost || "(No cost)"}
        - Type: ${cardContext.cardType} ${cardContext.subtype ? ` — ${cardContext.subtype}` : ''}
        ${typeSpecificContext}

        User's Request:
        - Card Concept/Theme: "${theme}"
        - Desired Power Level: ${powerLevelInstruction}

        Design Instructions:
        1.  Create rules text that fits all the provided context.
        2.  ${typeSpecificInstructions}
        3.  Create a short, evocative flavor text.
        4.  The rules text must use standard MTG templating (e.g., {T}, {W}, {2}).
        5.  You MUST respond ONLY with a single, valid JSON object without any other text.
        
        The JSON object must have this exact structure:
        ${jsonStructureExample}
    `;

    try {
        let aiResponse: string | undefined | null = null;
        
        if (provider === 'gemini') {
            if (!geminiAI) throw new Error("API klíč pro Google Gemini není nakonfigurován.");
            const model = (geminiAI as any).getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(prompt);
            aiResponse = result.response.text();

        } else if (provider === 'openai') {
            if (!openai) throw new Error("API klíč pro OpenAI není nakonfigurován.");
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });
            aiResponse = completion.choices[0].message.content;
        }

        if (!aiResponse) {
            throw new Error("AI nevrátila žádnou odpověď.");
        }

        const jsonString = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonString) as CardTextResult;

        if (!parsed.rulesText || typeof parsed.flavorText === 'undefined') {
            throw new Error("AI odpověď nemá správnou JSON strukturu.");
        }
        
        return parsed;

    } catch (error) {
        console.error(`Chyba při generování textu s ${provider}:`, error);
        throw new Error(`Nepodařilo se vygenerovat text. Zkontrolujte API klíče a konzoli.`);
    }
};