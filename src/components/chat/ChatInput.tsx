"use client";

import { useState, useRef, useEffect } from "react";
import { compressImage } from "@/lib/image";
import type { ImageData } from "@/types/chat";

const quickActions = [
  "What can I cook?",
  "Update pantry",
  "What's expiring?",
];

interface ChatInputProps {
  onSend: (message: string, image?: ImageData) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<ImageData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [text]);

  function handleSubmit() {
    const trimmed = text.trim();
    if ((!trimmed && !image) || disabled) return;
    onSend(trimmed || (image ? "What's in this image?" : ""), image ?? undefined);
    setText("");
    setImage(null);
    setImagePreview(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setImage(compressed);
      setImagePreview(`data:${compressed.mediaType};base64,${compressed.base64}`);
    } catch {
      // Failed to process image
    }

    // Reset file input so the same file can be selected again
    e.target.value = "";
  }

  function removeImage() {
    setImage(null);
    setImagePreview(null);
  }

  return (
    <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-4 pt-2 pb-2">
      {/* Quick actions */}
      {!image && (
        <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => !disabled && onSend(action)}
              disabled={disabled}
              className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 whitespace-nowrap min-h-[32px] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="Upload preview"
            className="h-20 w-20 object-cover rounded-xl"
          />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gray-800 dark:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Camera button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-11 h-11 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
            <path
              fillRule="evenodd"
              d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.176 1.106.18 1.929 1.126 1.929 2.25v12.586A2.25 2.25 0 0 1 19.75 24H4.25A2.25 2.25 0 0 1 2 21.75V8.914c0-1.124.823-2.07 1.929-2.25.382-.063.766-.122 1.152-.176a1.56 1.56 0 0 0 1.11-.71l.821-1.317a2.583 2.583 0 0 1 2.332-1.39ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={image ? "Describe what to do with this..." : "Message your pantry assistant..."}
          rows={1}
          disabled={disabled}
          className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-base resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && !image)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
