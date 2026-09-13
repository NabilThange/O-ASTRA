export type ConversationState =
  | "IDLE"
  | "LISTENING"
  | "DISPATCHED"
  | "SUMMARY"
  | "FOLLOW_UP";

export type ConversationEvent =
  | "MASCOT_CLICKED"
  | "VOICE_ACTIVITY"
  | "COMMAND_DISPATCHED"
  | "TASK_COMPLETED"
  | "TASK_FAILED"
  | "SUMMARY_FINISHED"
  | "FOLLOW_UP_TIMEOUT"
  | "CANCELLED";

export interface ConversationSnapshot {
  state: ConversationState;
  emotion: string;
  micEnabled: boolean;
}

const transitions: Record<ConversationState, Partial<Record<ConversationEvent, ConversationState>>> = {
  IDLE: { MASCOT_CLICKED: "LISTENING" },
  LISTENING: {
    MASCOT_CLICKED: "LISTENING",
    VOICE_ACTIVITY: "LISTENING",
    COMMAND_DISPATCHED: "DISPATCHED",
    CANCELLED: "IDLE",
  },
  DISPATCHED: {
    TASK_COMPLETED: "SUMMARY",
    TASK_FAILED: "SUMMARY",
    CANCELLED: "IDLE",
  },
  SUMMARY: {
    MASCOT_CLICKED: "FOLLOW_UP",
    VOICE_ACTIVITY: "LISTENING",
    SUMMARY_FINISHED: "FOLLOW_UP",
    CANCELLED: "IDLE",
  },
  FOLLOW_UP: {
    MASCOT_CLICKED: "LISTENING",
    VOICE_ACTIVITY: "LISTENING",
    FOLLOW_UP_TIMEOUT: "IDLE",
  },
};

function derive(state: ConversationState): Pick<ConversationSnapshot, "emotion" | "micEnabled"> {
  switch (state) {
    case "LISTENING": return { emotion: "13", micEnabled: true };
    case "DISPATCHED": return { emotion: "30", micEnabled: false };
    case "SUMMARY": return { emotion: "10", micEnabled: false };
    case "FOLLOW_UP": return { emotion: "13", micEnabled: true };
    default: return { emotion: "03", micEnabled: false };
  }
}

export const initialConversationState: ConversationSnapshot = {
  state: "IDLE",
  ...derive("IDLE"),
};

export function conversationReducer(
  snapshot: ConversationSnapshot,
  event: ConversationEvent,
): ConversationSnapshot {
  const state = transitions[snapshot.state][event] ?? snapshot.state;
  return { state, ...derive(state) };
}
