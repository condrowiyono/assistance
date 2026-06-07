// NDJSON event schema for `claude -p --input-format stream-json --output-format stream-json`.
// Shapes for "system"/"assistant"/"result"/"rate_limit_event" verified against real CLI output
// (see /tmp/claude-spike.log). "tool_use"/"tool_result" content blocks follow the standard
// Anthropic Messages API content-block format and were not exercised by the spike prompt.

export interface ContentBlockText {
  type: "text";
  text: string;
}

export interface ContentBlockToolUse {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export interface ContentBlockToolResult {
  type: "tool_result";
  tool_use_id: string;
  content: string | Array<{ type: "text"; text: string }>;
  is_error?: boolean;
}

export type ContentBlock = ContentBlockText | ContentBlockToolUse | ContentBlockToolResult;

export interface SystemInitEvent {
  type: "system";
  subtype: "init" | string;
  session_id?: string;
  cwd?: string;
  model?: string;
  permissionMode?: string;
  tools?: string[];
}

export interface AssistantEvent {
  type: "assistant";
  message: {
    role: "assistant";
    content: ContentBlock[];
    id?: string;
    model?: string;
    stop_reason?: string | null;
  };
  session_id?: string;
}

export interface UserEvent {
  type: "user";
  message: {
    role: "user";
    content: ContentBlock[] | string;
  };
  session_id?: string;
}

export interface ResultEvent {
  type: "result";
  subtype: "success" | "error_max_turns" | "error_during_execution" | string;
  is_error: boolean;
  result?: string;
  duration_ms?: number;
  num_turns?: number;
  total_cost_usd?: number;
  session_id?: string;
}

export interface UnknownEvent {
  type: string;
  [key: string]: unknown;
}

export type ClaudeChatEvent = SystemInitEvent | AssistantEvent | UserEvent | ResultEvent | UnknownEvent;

/** Best-effort per-line parse. Returns null for blank lines, non-JSON noise, or shapes without a `type`. */
export function parseClaudeChatLine(raw: string): ClaudeChatEvent | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      return parsed as ClaudeChatEvent;
    }
    return null;
  } catch {
    return null;
  }
}
