export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "success" | "error";
}

export type SSEEvent =
  | { type: "text"; data: string }
  | { type: "tool_call"; data: { name: string; input: Record<string, unknown> } }
  | { type: "tool_result"; data: { name: string; result: unknown; success: boolean } }
  | { type: "done" }
  | { type: "error"; data: string };
