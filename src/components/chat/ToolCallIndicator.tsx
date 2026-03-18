import type { ToolCallInfo } from "@/types/chat";

const toolLabels: Record<string, string> = {
  update_pantry: "Updating pantry",
  query_pantry: "Checking pantry",
  suggest_recipe: "Finding recipes",
};

interface ToolCallIndicatorProps {
  toolCall: ToolCallInfo;
}

export default function ToolCallIndicator({ toolCall }: ToolCallIndicatorProps) {
  const label = toolLabels[toolCall.name] ?? toolCall.name;
  const isPending = toolCall.status === "pending";
  const isSuccess = toolCall.status === "success";

  return (
    <div
      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
        isPending
          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
          : isSuccess
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
      }`}
    >
      {isPending && (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {isSuccess && <span>&#10003;</span>}
      {toolCall.status === "error" && <span>&#10007;</span>}
      <span className="font-medium">{label}...</span>
    </div>
  );
}
