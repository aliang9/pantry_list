"use client";

import { memo } from "react";
import Markdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import ToolCallIndicator from "./ToolCallIndicator";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

function ChatMessageInner({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-fade-in-up`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-green-600 text-white"
            : "bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-white"
        }`}
      >
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {message.toolCalls.map((tc, i) => (
              <ToolCallIndicator key={i} toolCall={tc} />
            ))}
          </div>
        )}
        {message.content && (
          <div className="text-sm leading-relaxed">
            {isUser ? (
              <p>{message.content}</p>
            ) : isStreaming ? (
              // Plain text while streaming — avoids re-parsing markdown per token
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <Markdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="mb-0.5">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                }}
              >
                {message.content}
              </Markdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ChatMessage = memo(ChatMessageInner, (prev, next) => {
  // Only re-render if content or tool calls actually changed
  return (
    prev.message.content === next.message.content &&
    prev.message.toolCalls === next.message.toolCalls &&
    prev.isStreaming === next.isStreaming
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
