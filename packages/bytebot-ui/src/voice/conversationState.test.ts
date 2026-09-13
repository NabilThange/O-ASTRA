import { describe, expect, it } from "vitest";
import { conversationReducer, initialConversationState } from "./conversationState";

describe("conversationReducer", () => {
  it("walks a command through execution, summary, and follow-up", () => {
    let state = conversationReducer(initialConversationState, "MASCOT_CLICKED");
    expect(state.state).toBe("LISTENING");
    state = conversationReducer(state, "COMMAND_DISPATCHED");
    expect(state).toMatchObject({ state: "DISPATCHED", emotion: "30", micEnabled: false });
    state = conversationReducer(state, "TASK_COMPLETED");
    expect(state.state).toBe("SUMMARY");
    state = conversationReducer(state, "SUMMARY_FINISHED");
    expect(state).toMatchObject({ state: "FOLLOW_UP", micEnabled: true });
  });

  it("returns to idle after the follow-up timeout without changing context", () => {
    const listening = conversationReducer(initialConversationState, "MASCOT_CLICKED");
    const dispatched = conversationReducer(listening, "COMMAND_DISPATCHED");
    const summary = conversationReducer(dispatched, "TASK_COMPLETED");
    const followUp = conversationReducer(summary, "SUMMARY_FINISHED");
    const idle = conversationReducer(followUp, "FOLLOW_UP_TIMEOUT");
    expect(idle).toMatchObject({ state: "IDLE", emotion: "03", micEnabled: false });
  });
});
