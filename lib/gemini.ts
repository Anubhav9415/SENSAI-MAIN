import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

interface ChatMessage {
  role: string;
  content: string;
}

export async function getGeminiChatResponse(history: ChatMessage[], newPrompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Format history for the Google Gemini SDK
  const formattedHistory = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Start chat session with history
  const chat = model.startChat({
    history: formattedHistory,
  });

  // Send the new prompt and return response text
  const result = await chat.sendMessage(newPrompt);
  const response = result.response;
  return response.text().trim();
}
