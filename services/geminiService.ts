
import { GoogleGenAI } from "@google/genai";
import { NewsItem, Source, Sentiment } from "../types";

export const fetchNewsUpdate = async (
  topic: string, 
  location?: { lat: number; lng: number } | null
): Promise<NewsItem> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let locationContext = "";
  if (location) {
    locationContext = `Prioritize news happening near coordinates ${location.lat}, ${location.lng} if relevant, otherwise stick to major global news.`;
  }

  const prompt = `Find the most significant news headline in the ${topic} category from the last 60 minutes.
  ${locationContext}
  
  Return the result in this format:
  TITLE: [Headline]
  SENTIMENT: [bullish, bearish, or neutral]
  LOCATION: [Detected city/country or 'Global']
  SUMMARY: [2-3 sentence engaging journalistic summary]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // Parse the custom format
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const sentimentMatch = text.match(/SENTIMENT:\s*(bullish|bearish|neutral)/i);
    const locationMatch = text.match(/LOCATION:\s*(.*)/i);
    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*)/i);

    const title = titleMatch?.[1]?.trim() || "Breaking Update";
    const sentiment = (sentimentMatch?.[1]?.toLowerCase() || "neutral") as Sentiment;
    const detectedLocation = locationMatch?.[1]?.trim() || "Global";
    const summary = summaryMatch?.[1]?.trim() || text;

    // Extract sources from grounding
    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            url: chunk.web.uri
          });
        }
      });
    }

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

    return {
      id: Math.random().toString(36).substr(2, 9),
      title: title.length > 100 ? title.substring(0, 97) + '...' : title,
      summary: summary,
      timestamp: new Date(),
      sources: uniqueSources.slice(0, 4),
      topic: topic,
      imageUrl: `https://images.unsplash.com/photo-1585829365234-78d9b8184481?auto=format&fit=crop&q=80&w=800&h=400&sig=${Math.random()}`,
      isPostedToX: false,
      sentiment: sentiment,
      location: detectedLocation
    };
  } catch (error) {
    console.error("Gemini News Fetch Error:", error);
    throw error;
  }
};

export const simulatePostToX = async (news: NewsItem): Promise<boolean> => {
  console.log(`[X-AUTH] Posting update: ${news.title} (${news.sentiment})`);
  await new Promise(resolve => setTimeout(resolve, 1200));
  return true;
};
