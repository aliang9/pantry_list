"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ToolCallInfo, SSEEvent } from "@/types/chat";
import { mutate } from "swr";
import { createClient } from "@/lib/supabase/client";

function genId() {
  return crypto.randomUUID();
}

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
          // Ensure loaded messages have IDs
          const msgs = (data.messages as ChatMessage[]).map((m) => ({
            ...m,
            id: m.id || genId(),
          }));
          setMessages(msgs);
        }
      } catch {
        // No conversation history yet
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
        // Silent fail — best-effort persistence
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: genId(),
        role: "user",
        content: text,
      };
      const assistantMessage: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: "",
        toolCalls: [],
      };

      const newMessages = [...messages, userMessage, assistantMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      const abortController = new AbortController();
      abortRef.current = abortController;

      // Refs for batched rendering
      const textRef = { current: "" };
      const toolCallsRef = { current: [] as ToolCallInfo[] };
      const rafRef = { current: 0 };
      const finalMessagesRef = { current: newMessages };

      function flushToState() {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: textRef.current,
            toolCalls: [...toolCallsRef.current],
          };
          finalMessagesRef.current = updated;
          return updated;
        });
      }

      function scheduleFlush() {
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            flushToState();
          });
        }
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages
              .filter((m) => m.content)
              .map((m) => ({
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
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
                  textRef.current += event.data as string;
                  scheduleFlush();
                } else if (event.type === "tool_call") {
                  const tcData = event.data as {
                    name: string;
                    input: Record<string, unknown>;
                  };
                  toolCallsRef.current.push({
                    name: tcData.name,
                    input: tcData.input,
                    status: "pending",
                  });
                  scheduleFlush();
                } else if (event.type === "tool_result") {
                  const trData = event.data as {
                    name: string;
                    result: unknown;
                    success: boolean;
                  };
                  const idx = toolCallsRef.current.findIndex(
                    (tc) =>
                      tc.name === trData.name && tc.status === "pending"
                  );
                  if (idx !== -1) {
                    toolCallsRef.current[idx] = {
                      ...toolCallsRef.current[idx],
                      result: trData.result,
                      status: trData.success ? "success" : "error",
                    };
                  }
                  mutate("/api/pantry");
                  scheduleFlush();
                }
              } catch {
                // Skip malformed JSON
              }
              eventType = "";
            }
          }
        }

        // Final flush after stream ends
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
        flushToState();
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
            finalMessagesRef.current = updated;
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        saveConversation(finalMessagesRef.current);
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

  return {
    messages,
    isStreaming,
    isLoading,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
