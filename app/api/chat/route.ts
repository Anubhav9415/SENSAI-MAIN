import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getGeminiChatResponse } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync Clerk user with DB if not exists
    let dbUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!dbUser) {
      const user = await currentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      const email = user.emailAddresses?.[0]?.emailAddress || "";
      dbUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          name,
          imageUrl: user.imageUrl,
          email,
        },
      });
    }

    const { prompt, chatId } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let chat;
    if (chatId) {
      chat = await db.chat.findUnique({
        where: { id: chatId, userId: dbUser.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
    } else {
      // Create new chat session
      chat = await db.chat.create({
        data: {
          userId: dbUser.id,
          title: prompt.length > 40 ? prompt.substring(0, 37) + "..." : prompt,
        },
        include: { messages: true },
      });
    }

    // Save user's message
    const userMessage = await db.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: prompt,
      },
    });

    // Format chat history for Gemini (excluding the newly created userMessage which is sent as newPrompt)
    const history = chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Generate AI response using Gemini
    const geminiResponse = await getGeminiChatResponse(history, prompt);

    // Save AI's response
    const aiMessage = await db.message.create({
      data: {
        chatId: chat.id,
        role: "model",
        content: geminiResponse,
      },
    });

    return NextResponse.json({
      chatId: chat.id,
      title: chat.title,
      userMessage,
      aiMessage,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
