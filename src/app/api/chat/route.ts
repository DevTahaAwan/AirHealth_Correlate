import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';

export const maxDuration = 30; // Vercel limit

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();
    const context = data?.context || {};

    const systemPrompt = `You are an expert respiratory health advisor. 
You are talking to ${context.userName || "a user"}, who is ${context.ageGroup || "an adult"} and suffers from ${context.conditions || "no specific conditions"}. 
They live in ${context.districtName || "their local area"}, where the current AQI is ${context.aqi || "unknown"} and PM2.5 is ${context.pm25 || "unknown"}. 
Give them brief, practical, and highly specific advice for going outside today. Keep your answers concise and empathetic.`;

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
