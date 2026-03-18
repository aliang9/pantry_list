"use client";

import Markdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import ToolCallIndicator from "./ToolCallIndicator";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-green-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
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
          <div className="text-sm leading-relaxed prose-sm prose-invert:prose-p:text-white">
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <Markdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2">{children}</ol>
                  ),
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
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
