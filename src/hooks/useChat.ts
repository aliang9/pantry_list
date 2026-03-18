"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ToolCallInfo, SSEEvent } from "@/types/chat";
import { mutate } from "swr";
import { createClient } from "@/lib/supabase/client";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("conversation_history")
          .select("id, messages")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (data) {
          conversationIdRef.current = data.id;
          setMessages(data.messages as ChatMessage[]);
        }
      } catch {
        // No conversation history yet — that's fine
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Save conversation to Supabase
  const saveConversation = useCallback(
    async (msgs: ChatMessage[]) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Strip tool call details for storage (keep it lean)
        const storedMessages = msgs.map((m) => ({
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls?.map((tc) => ({
            name: tc.name,
            status: tc.status,
          })),
        }));

        if (conversationIdRef.current) {
          await supabase
            .from("conversation_history")
            .update({ messages: storedMessages })
            .eq("id", conversationIdRef.current);
        } else {
          const { data } = await supabase
            .from("conversation_history")
            .insert({
              user_id: user.id,
              messages: storedMessages,
            })
            .select("id")
            .single();

          if (data) {
            conversationIdRef.current = data.id;
          }
        }
      } catch {
        // Silent fail — conversation persistence is best-effort
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: "user", content: text };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      // Create a placeholder assistant message
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "",
        toolCalls: [],
      };
      setMessages([...newMessages, assistantMessage]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      let finalMessages = [...newMessages, assistantMessage];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`Chat request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentText = "";
        const toolCalls: ToolCallInfo[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ") && eventType) {
              try {
                const data = JSON.parse(line.slice(6));
                const event: SSEEvent = { type: eventType, data } as SSEEvent;

                if (event.type === "text") {
                  currentText += event.data as string;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: currentText,
                      toolCalls: [...toolCalls],
                    };
                    finalMessages = updated;
                    return updated;
                  });
                } else if (event.type === "tool_call") {
                  const tcData = event.data as {
                    name: string;
                    input: Record<string, unknown>;
                  };
                  toolCalls.push({
                    name: tcData.name,
                    input: tcData.input,
                    status: "pending",
                  });
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      toolCalls: [...toolCalls],
                    };
                    finalMessages = updated;
                    return updated;
                  });
                } else if (event.type === "tool_result") {
                  const trData = event.data as {
                    name: string;
                    result: unknown;
                    success: boolean;
                  };
                  const idx = toolCalls.findIndex(
                    (tc) =>
                      tc.name === trData.name && tc.status === "pending"
                  );
                  if (idx !== -1) {
                    toolCalls[idx] = {
                      ...toolCalls[idx],
                      result: trData.result,
                      status: trData.success ? "success" : "error",
                    };
                  }
                  // Invalidate pantry cache
                  mutate("/api/pantry");

                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      toolCalls: [...toolCalls],
                    };
                    finalMessages = updated;
                    return updated;
                  });
                }
              } catch {
                // Skip malformed JSON
              }
              eventType = "";
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content:
                updated[updated.length - 1].content ||
                "Sorry, something went wrong. Please try again.",
            };
            finalMessages = updated;
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        // Persist conversation after each exchange
        saveConversation(finalMessages);
      }
    },
    [messages, saveConversation]
  );

  const clearChat = useCallback(async () => {
    setMessages([]);
    conversationIdRef.current = null;
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isStreaming, isLoading, sendMessage, stopStreaming, clearChat };
}
