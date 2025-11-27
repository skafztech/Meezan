
import { GoogleGenAI, Type } from "@google/genai";
import { Surah, Ayah, Hadith } from '../types';
import { getHijriDateParts } from './hijriService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

export const getSurahContent = async (surah: Surah, translationStyle: string = "Saheeh International"): Promise<Ayah[]> => {
  const prompt = `
    Provide the full Arabic text and English translation for Surah ${surah.englishName} (${surah.name}).
    
    IMPORTANT: Provide the English translation specifically from the "${translationStyle}" edition/style.
    
    Return ONLY a JSON array where each object represents an Ayah with the following structure:
    {
      "number": <Ayah Number in Surah>,
      "text": "<Arabic Text>",
      "translation": "<English Translation>"
    }
    Ensure the Arabic text includes Tashkeel (diacritics).
    Do not include the Basmalah as verse 1 unless it is Al-Fatiha.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              number: { type: Type.INTEGER },
              text: { type: Type.STRING },
              translation: { type: Type.STRING }
            },
            required: ["number", "text", "translation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    return data.map((item: any) => ({
      ...item,
      numberInSurah: item.number
    }));

  } catch (error) {
    console.error("Error fetching Surah content:", error);
    return [];
  }
};

export const getIslamicAdvice = async (userMessage: string): Promise<{ text: string, sources?: { title: string, uri: string }[] }> => {
  const today = new Date();
  const hijri = getHijriDateParts(today);
  const dateContext = `Today's Gregorian date is ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. The estimated Hijri date is ${hijri.day} ${hijri.monthName} ${hijri.year} AH.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userMessage,
      config: {
        systemInstruction: `You are a knowledgeable, gentle, and respectful Islamic scholar assistant named Meezan. Answer questions based on the Quran and Sunnah. Provide references where possible. Keep answers concise but spiritual. If you do not know, say 'Allah knows best'.
        
        CONTEXT:
        ${dateContext}
        Use the Google Search tool to verify current dates, events, prayer times, or specific factual queries to ensure accuracy.`,
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "I apologize, I could not generate a response.";
    
    // Extract grounding sources if available
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Web Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };

  } catch (error) {
    console.error("Chat error:", error);
    return { text: "I am currently unable to connect to the knowledge base. Please check your internet connection and try again." };
  }
};

export const getDailyInspiration = async (): Promise<{ arabic: string, translation: string, reference: string }> => {
   const prompt = "Generate a random inspiring verse from the Quran or a Sahih Hadith. Return JSON with 'arabic', 'translation', and 'reference'.";
   try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                arabic: { type: Type.STRING },
                translation: { type: Type.STRING },
                reference: { type: Type.STRING }
            }
        }
      }
    });
    const text = response.text;
    if(!text) throw new Error("No text");
    return JSON.parse(text);
   } catch (e) {
       return {
           arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
           translation: "For indeed, with hardship [will be] ease.",
           reference: "Surah Ash-Sharh 94:5"
       };
   }
};

export const getCoordinatesForLocation = async (locationName: string): Promise<{ latitude: number, longitude: number, name: string } | null> => {
  const prompt = `Identify the latitude and longitude for the city/location: "${locationName}". Return JSON.`;
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
            name: { type: Type.STRING, description: "The formatted name of the city, Country" }
          },
          required: ["latitude", "longitude", "name"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export const getLocationName = async (lat: number, lng: number): Promise<string | null> => {
  const prompt = `Identify the city and country for latitude ${lat} and longitude ${lng}. Return JSON: { "location": "City, Country" }.`;
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text);
    return data.location;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export const searchHadiths = async (query: string): Promise<Hadith[]> => {
  const prompt = `
    Search for 3-5 authentic Hadiths (Sahih Bukhari, Sahih Muslim, etc.) related to the topic: "${query}".
    If the query is empty or 'random', provide random authentic Hadiths.
    Return a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              arabic: { type: Type.STRING, description: "The Arabic text of the Hadith with Tashkeel" },
              translation: { type: Type.STRING, description: "English translation" },
              narrator: { type: Type.STRING, description: "Name of the narrator (e.g. Abu Huraira)" },
              source: { type: Type.STRING, description: "Book reference (e.g. Sahih Al-Bukhari 502)" }
            },
            required: ["arabic", "translation", "narrator", "source"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Hadith search error:", error);
    return [];
  }
};
