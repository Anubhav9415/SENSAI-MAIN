"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button as BaseButton } from "@/components/ui/button";
const Button = BaseButton as any;
import { Card as BaseCard, CardContent as BaseCardContent } from "@/components/ui/card";
const Card = BaseCard as any;
const CardContent = BaseCardContent as any;

interface Message {
  id: string;
  chatId: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
}

interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
}

export default function ChatPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // State Management
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading States
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth Guard
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  // Fetch Chats History
  const fetchChats = async () => {
    try {
      setLoadingChats(true);
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Failed to fetch chats");
      const data = await res.json();
      setChats(data);
    } catch (err: any) {
      toast.error(err.message || "Could not load chat history");
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchChats();
    }
  }, [userId]);

  // Fetch Messages for Selected Chat
  const fetchMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  // Auto Scroll to Bottom on New Message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendingMessage]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendingMessage) return;

    const userPrompt = input.trim();
    setInput("");
    setSendingMessage(true);

    // Optimistic message update for instant response feel
    const tempUserMsg: Message = {
      id: "temp-user",
      chatId: currentChatId || "",
      role: "user",
      content: userPrompt,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          chatId: currentChatId,
        }),
      });

      if (!res.ok) throw new Error("AI response failed. Please try again.");

      const data = await res.json();

      // If it was a new chat, update currentChatId and refresh chat list
      if (!currentChatId) {
        setCurrentChatId(data.chatId);
        fetchChats();
      }

      // Replace optimistic messages with actual DB values and add model response
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== "temp-user")
          .concat([data.userMessage, data.aiMessage])
      );
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
      // Rollback optimistic update on error
      setMessages((prev) => prev.filter((m) => m.id !== "temp-user"));
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Delete Chat
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session?")) return;

    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat");
      
      toast.success("Conversation deleted");
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      fetchChats();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete chat session");
    }
  };

  // Start New Chat Session
  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  if (!isLoaded || !userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const suggestions = [
    "What are the highest-paying software developer roles?",
    "Give me tips on how to prepare for a React technical interview.",
    "Draft a professional summary for a junior UX designer resume.",
    "Explain how to negotiate a remote developer job offer.",
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background pt-16 font-sans">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg md:hidden"
      >
        {sidebarOpen ? <X className="h-6 w-6 text-primary-foreground" /> : <Menu className="h-6 w-6 text-primary-foreground" />}
      </button>

      {/* Sidebar - Chat History */}
      <aside
        className={`fixed inset-y-16 left-0 z-30 flex w-64 transform flex-col border-r border-border bg-card/60 backdrop-blur-md transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col gap-2">
          <Button onClick={handleNewChat} className="w-full justify-start gap-2" variant="outline">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            History
          </h2>
          {loadingChats ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <p className="px-3 text-sm text-muted-foreground italic">No chats yet</p>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === currentChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "hover:bg-muted text-card-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{chat.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded transition-opacity duration-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-background relative">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 && !loadingMessages ? (
            /* Empty State Container */
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center h-full space-y-6 pt-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                How can I <span className="gradient-title">help you</span> today?
              </h1>
              <p className="text-muted-foreground text-lg max-w-md">
                Ask me any questions about interview prep, technical coding, resume enhancement, or career paths.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
                {suggestions.map((sug, idx) => (
                  <Card
                    key={idx}
                    onClick={() => setInput(sug)}
                    className="hover:border-primary/50 cursor-pointer transition-all duration-300 bg-card/40 hover:bg-card/80"
                  >
                    <CardContent className="p-4 flex items-center justify-between text-left gap-3">
                      <span className="text-sm font-medium text-foreground">{sug}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation List */
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
              {messages.map((msg) => {
                const isAI = msg.role === "model";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-4 items-start ${
                      isAI ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isAI && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                        isAI
                          ? "bg-card border border-border text-foreground rounded-tl-none whitespace-pre-wrap"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {!isAI && (
                      <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Generating response indicator */}
              {sendingMessage && (
                <div className="flex gap-4 items-start justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Sensai AI is thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Controls */}
        <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-border/10">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Message Sensai AI (Press Enter)..."
              rows={1}
              disabled={sendingMessage}
              className="w-full bg-card/60 backdrop-blur-sm border border-border rounded-2xl pl-4 pr-14 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sendingMessage}
              size="icon"
              className="absolute right-3 bottom-3 h-10 w-10 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
