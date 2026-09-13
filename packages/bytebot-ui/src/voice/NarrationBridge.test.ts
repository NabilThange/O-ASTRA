import { describe, expect, it } from "vitest";
import { NarrationBridge } from "./NarrationBridge";

describe("NarrationBridge", () => {
  it("keeps only the newest milestone while busy", () => {
    const sent: string[] = [];
    const bridge = new NarrationBridge(({ text }) => sent.push(text));
    bridge.narrate({ kind: "milestone", text: "first" });
    bridge.narrate({ kind: "milestone", text: "stale" });
    bridge.narrate({ kind: "milestone", text: "latest" });
    bridge.replyDone();
    expect(sent).toEqual(["first", "latest"]);
  });

  it("does not coalesce final outcomes", () => {
    const sent: string[] = [];
    const bridge = new NarrationBridge(({ text }) => sent.push(text));
    bridge.narrate({ kind: "summary", text: "done" });
    bridge.narrate({ kind: "error", text: "failed" });
    bridge.replyDone();
    bridge.replyDone();
    expect(sent).toEqual(["done", "failed"]);
  });
});
