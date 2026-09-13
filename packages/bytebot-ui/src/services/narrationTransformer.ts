/**
 * Shared Narration Transformer & Milestone Service
 * Pure module that maps low-level OpenCode events to concise, first-person spoken utterances.
 */

export interface OpenCodeToolExecution {
  name: string;
  args?: Record<string, unknown>;
  state: "pending" | "running" | "completed" | "error";
}

/**
 * Clean domain extractor from URL
 */
function extractDomain(urlStr?: string): string {
  if (!urlStr) return "website";
  try {
    const url = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
}

/**
 * Maps a tool execution to a human milestone phrase for speech & bubble.
 * Returns null if the tool is internal / uninteresting (e.g. cursor moves).
 */
export function transformToolToNarration(tool: OpenCodeToolExecution): {
  phrase: string;
  emotion: string;
} | null {
  const name = tool.name.toLowerCase().replace(/^(bytebot_desktop_|mcp_bytebot_desktop_|mcp_)/i, "");
  const args = tool.args || {};

  if (name.includes("navigate")) {
    const domain = extractDomain(args.url as string);
    return { phrase: `Navigating to ${domain}...`, emotion: "30" };
  }

  if (name.includes("type")) {
    const text = (args.text as string) || "";
    if (text.length > 0 && text.length < 25) {
      return { phrase: `Typing "${text}"...`, emotion: "30" };
    }
    return { phrase: "Typing search query...", emotion: "30" };
  }

  if (name.includes("open_application")) {
    const app = (args.application as string) || "application";
    return { phrase: `Opening ${app}...`, emotion: "30" };
  }

  if (name.includes("snapshot")) {
    return { phrase: "Scanning page elements...", emotion: "13" };
  }

  if (name.includes("screenshot")) {
    return { phrase: "Checking screen display...", emotion: "13" };
  }

  if (name.includes("extract_text")) {
    return { phrase: "Reading the page results...", emotion: "13" };
  }

  if (name.includes("click")) {
    return { phrase: "Clicking target on screen...", emotion: "30" };
  }

  // Skip noisy actions like move_cursor
  if (name.includes("move_cursor") || name.includes("cursor")) {
    return null;
  }

  return null;
}

/**
 * Summarizes long agent markdown output into 1-2 spoken sentences.
 */
export function extractSpokenSummary(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return "Task completed successfully!";
  }

  // Remove markdown headers, links, and code blocks
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .trim();

  // Split into sentences
  const sentences = cleaned
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && !s.startsWith("|"));

  if (sentences.length === 0) {
    return "Task completed successfully!";
  }

  // Take first 1 or 2 sentences (max ~160 chars for fast, natural TTS)
  let summary = sentences[0];
  if (sentences.length > 1 && (summary.length + sentences[1].length) < 180) {
    summary += ` ${sentences[1]}`;
  }

  return summary;
}
