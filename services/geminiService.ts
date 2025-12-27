
import { GoogleGenAI } from "@google/genai";
import { NewsItem, Source, Sentiment } from "../types";

export const fetchNewsUpdate = async (
  topic: string, 
  location?: { lat: number; lng: number } | null
): Promise<NewsItem> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let locationContext = "";
  if (location) {
    locationContext = `Prioritize news happening near coordinates ${location.lat}, ${location.lng} if relevant.`;
  }

  const prompt = `Find the most significant news headline in the ${topic} category from the last 60 minutes.
  ${locationContext}
  
  Return the result in this exact format:
  TITLE: [Headline]
  SENTIMENT: [bullish, bearish, or neutral]
  LOCATION: [Detected city/country or 'Global']
  SUMMARY: [2-3 sentence summary]
  IMAGE_KEYWORD: [Single noun for a relevant high-quality photo]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const sentimentMatch = text.match(/SENTIMENT:\s*(bullish|bearish|neutral)/i);
    const locationMatch = text.match(/LOCATION:\s*(.*)/i);
    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)IMAGE_KEYWORD/i) || text.match(/SUMMARY:\s*([\s\S]*)/i);
    const keywordMatch = text.match(/IMAGE_KEYWORD:\s*(.*)/i);

    const title = titleMatch?.[1]?.trim() || "Intelligence Synchronized";
    const sentiment = (sentimentMatch?.[1]?.toLowerCase() || "neutral") as Sentiment;
    const detectedLocation = locationMatch?.[1]?.trim() || "Global";
    const summary = summaryMatch?.[1]?.trim() || "New data packet received and processed.";
    const keyword = keywordMatch?.[1]?.trim() || topic.split(' ')[0];

    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || "External Source", url: chunk.web.uri });
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
      // Using Unsplash Source for more reliable high-quality images
      imageUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80&sig=${Math.random()}`,
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
  // Simulate an actual X API call payload
  const payload = {
    text: `🚨 CHRONOS INTEL: ${news.title}\n\n${news.summary.substring(0, 100)}...\n\n#AI #News #${news.topic.replace(/\s+/g, '')}`,
    source_url: news.sources[0]?.url || ""
  };
  
  console.log("%c[X-API TRANSMISSION]", "color: #1DA1F2; font-weight: bold", payload);
  
  // Real network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};
