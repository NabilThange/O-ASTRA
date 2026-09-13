export type NarrationKind = "milestone" | "summary" | "error";
export interface NarrationRequest { kind: NarrationKind; text: string }

/** Serializes AssemblyAI replies without allowing stale progress to build up. */
export class NarrationBridge {
  private busy = false;
  private pendingMilestone: NarrationRequest | null = null;
  private pendingFinal: NarrationRequest[] = [];

  constructor(private readonly send: (request: NarrationRequest) => void) {}

  narrate(request: NarrationRequest) {
    if (!this.busy) return this.start(request);
    if (request.kind === "milestone") this.pendingMilestone = request;
    else this.pendingFinal.push(request);
  }

  replyDone() {
    this.busy = false;
    const next = this.pendingFinal.shift() ?? this.pendingMilestone;
    this.pendingMilestone = null;
    if (next) this.start(next);
  }

  private start(request: NarrationRequest) {
    this.busy = true;
    this.send(request);
  }
}
