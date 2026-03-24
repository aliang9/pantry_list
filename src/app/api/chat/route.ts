import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { pantryTools } from "@/lib/claude/tools";
import { SYSTEM_PROMPT } from "@/lib/claude/system-prompt";
import { executeTool } from "@/lib/claude/tool-executor";

const anthropic = new Anthropic();

interface ChatMessage {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlockParam[];
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  // Trim to last 20 messages
  const trimmedMessages = messages.slice(-20);

  // Convert to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = trimmedMessages.map(
    (msg) => ({
      role: msg.role,
      content: msg.content,
    })
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await processConversation(
          anthropicMessages,
          user.id,
          controller,
          encoder
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            sseEncode("error", String(err))
          )
        );
      } finally {
        controller.enqueue(encoder.encode(sseEncode("done", {})));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function processConversation(
  messages: Anthropic.MessageParam[],
  userId: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  depth = 0
) {
  // Prevent infinite tool-use loops
  if (depth > 5) return;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: pantryTools,
    messages,
  });

  let fullText = "";

  stream.on("text", (text) => {
    fullText += text;
    controller.enqueue(encoder.encode(sseEncode("text", text)));
  });

  const finalMessage = await stream.finalMessage();

  // Check if Claude wants to use tools
  const toolUseBlocks = finalMessage.content.filter(
    (block): block is Anthropic.ContentBlock & { type: "tool_use" } =>
      block.type === "tool_use"
  );

  if (toolUseBlocks.length > 0) {
    // Execute each tool call
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      // Notify client about tool call
      controller.enqueue(
        encoder.encode(
          sseEncode("tool_call", {
            name: toolUse.name,
            input: toolUse.input,
          })
        )
      );

      // Execute the tool
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
        userId
      );

      // Notify client about tool result
      controller.enqueue(
        encoder.encode(
          sseEncode("tool_result", {
            name: toolUse.name,
            result,
            success: true,
          })
        )
      );

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Continue conversation with tool results
    const updatedMessages: Anthropic.MessageParam[] = [
      ...messages,
      { role: "assistant", content: finalMessage.content },
      { role: "user", content: toolResults },
    ];

    await processConversation(
      updatedMessages,
      userId,
      controller,
      encoder,
      depth + 1
    );
  }
}
