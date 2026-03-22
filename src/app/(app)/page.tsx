"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";

function ChatSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-3">
      {/* Simulated message bubbles */}
      <div className="flex justify-end">
        <div className="h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
      <div className="flex justify-start">
        <div className="h-20 w-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
      <div className="flex justify-start">
        <div className="h-16 w-56 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { messages, isStreaming, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitiallyScrolled = useRef(false);

  useEffect(() => {
    if (!messages.length) return;
    // Instant scroll on first load, smooth scroll for new messages
    const behavior = hasInitiallyScrolled.current ? "smooth" : "instant";
    messagesEndRef.current?.scrollIntoView({ behavior });
    hasInitiallyScrolled.current = true;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem-env(safe-area-inset-bottom))]">
        <ChatSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-env(safe-area-inset-bottom))]">
      <div
        className="flex-1 overflow-y-auto px-4 pt-4"
        onScroll={() => {
          // Dismiss keyboard when scrolling messages (iOS pattern)
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-green-600 dark:text-green-400"
              >
                <path
                  fillRule="evenodd"
                  d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Pantry Assistant
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
              Tell me what you bought, ask what you can cook, or check
              what&apos;s in your pantry.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && i === messages.length - 1}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
