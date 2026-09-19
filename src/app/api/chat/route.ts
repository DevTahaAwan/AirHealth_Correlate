import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';

export const maxDuration = 30; // Vercel limit

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages, context: rawContext } = await req.json();
    const context = rawContext || {};

    const systemPrompt = `You are an expert respiratory health advisor. 
You are talking to ${context.userName || "a user"}, who is ${context.ageGroup || "an adult"} and suffers from ${context.conditions || "no specific conditions"}. 
${context.everUsedInhaler ? "They have a history of using an inhaler." : ""}
They live in ${context.districtName || "their local area"}, where the current AQI is ${context.aqi || "unknown"} and PM2.5 is ${context.pm25 || "unknown"}.
${context.pm10 !== undefined ? `PM10 is ${context.pm10}. ` : ""}${context.co !== undefined ? `CO is ${context.co} ppm. ` : ""}${context.so2 !== undefined ? `SO2 is ${context.so2} ppb. ` : ""}${context.no2 !== undefined ? `NO2 is ${context.no2} ppb. ` : ""}${context.o3 !== undefined ? `O3 is ${context.o3} ppm.` : ""} 
Give them brief, practical, and highly specific advice for going outside today. Keep your answers concise and empathetic.`;

    const result = await streamText({
      model: google('gemini-flash-latest'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
