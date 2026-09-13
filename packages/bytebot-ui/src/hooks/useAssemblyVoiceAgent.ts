import { useState, useEffect, useRef, useCallback } from "react";
import type { NarrationRequest } from "@/voice/NarrationBridge";
import {
  TURN_DETECTION_CONFIDENCE_THRESHOLD,
  TURN_DETECTION_MIN_SILENCE_WHEN_CONFIDENT_MS,
  TURN_DETECTION_MAX_SILENCE_MS,
} from "@/voice/voiceAgentConfig";
import {
  resampleAudio,
  float32ToInt16PCM,
  arrayBufferToBase64,
  AudioQueuePlayer,
} from "@/utils/audioPcmUtils";

export interface VoiceAgentState {
  isConnected: boolean;
  isConnecting: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  userTranscript: string;
  agentTranscript: string;
  currentEmotion: string;
  speechBubbleText: string;
  error: string | null;
  isGreetingPending: boolean;
}

interface UseAssemblyVoiceAgentOptions {
  onFinalTranscript?: (text: string) => void;
  onVoiceActivity?: () => void;
  onReplyDone?: () => void;
  onToolCall?: (name: string, args: Record<string, unknown>) => void | Promise<void>;
  autoConnect?: boolean;
}

export function useAssemblyVoiceAgent({
  onFinalTranscript,
  onVoiceActivity,
  onReplyDone,
  onToolCall,
  autoConnect = false,
}: UseAssemblyVoiceAgentOptions = {}) {
  const [state, setState] = useState<VoiceAgentState>({
    isConnected: false,
    isConnecting: false,
    isListening: false,
    isSpeaking: false,
    userTranscript: "",
    agentTranscript: "",
    currentEmotion: "03", // Default: Curious
    speechBubbleText: "Click on me to speak.",
    error: null,
    isGreetingPending: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<AudioQueuePlayer | null>(null);
  const isSessionReadyRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isMicMutedRef = useRef<boolean>(false);
  const replyDoneRef = useRef<boolean>(false);
  const greetingPendingRef = useRef(false);
  const pendingToolResultsRef = useRef<Array<{ callId: string; result: string }>>([]);
  const followUpTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;
  const onVoiceActivityRef = useRef(onVoiceActivity);
  onVoiceActivityRef.current = onVoiceActivity;
  const onReplyDoneRef = useRef(onReplyDone);
  onReplyDoneRef.current = onReplyDone;
  const onToolCallRef = useRef(onToolCall);
  onToolCallRef.current = onToolCall;

  // Initialize AudioPlayer on mount
  useEffect(() => {
    audioPlayerRef.current = new AudioQueuePlayer(24000);
    return () => {
      audioPlayerRef.current?.close();
    };
  }, []);

  // Cleanup helper
  const stopAudioCapture = useCallback(() => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setState((prev) => ({ ...prev, isListening: false }));
  }, []);

  const disconnect = useCallback(() => {
    stopAudioCapture();
    audioPlayerRef.current?.abort();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        // Send session.end per AssemblyAI docs
        wsRef.current.send(JSON.stringify({ type: "session.end" }));
      } catch {}
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    isSessionReadyRef.current = false;
    greetingPendingRef.current = false;
    isSpeakingRef.current = false;
    isMicMutedRef.current = false;
    replyDoneRef.current = false;
    pendingToolResultsRef.current = [];
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      isSpeaking: false,
      isListening: false,
      isGreetingPending: false,
      speechBubbleText: "Click on me to speak.",
      currentEmotion: "03",
    }));
  }, [stopAudioCapture]);

  // Start capturing microphone audio
  const startAudioCapture = useCallback(async () => {
    if (mediaStreamRef.current || !isSessionReadyRef.current) return;

    try {
      // Pass echoCancellation: true and noiseSuppression: false per AssemblyAI docs
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);

      // Try AudioWorklet first using an inlined Blob URL for zero-latency, reliable loading
      let workletLoaded = false;
      try {
        const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = options.processorOptions || {};
    const inputSampleRate = opts.inputSampleRate || 48000;
    const targetSampleRate = opts.targetSampleRate || 24000;
    this.ratio = inputSampleRate / targetSampleRate;
    // Buffer ~50ms of 24kHz audio (1200 samples)
    this.targetChunkSize = 1200;
    this.buffer = new Int16Array(this.targetChunkSize);
    this.bufferIdx = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    const outLength = Math.floor(input.length / this.ratio);
    for (let i = 0; i < outLength; i++) {
      const sample = input[Math.floor(i * this.ratio)] ?? 0;
      const s16 = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
      this.buffer[this.bufferIdx++] = s16;

      if (this.bufferIdx >= this.targetChunkSize) {
        this.port.postMessage(this.buffer.buffer.slice(0));
        this.bufferIdx = 0;
      }
    }
    return true;
  }
}
registerProcessor("pcm-processor", PCMProcessor);
`;
        const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
        const blobUrl = URL.createObjectURL(blob);
        await audioCtx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);

        const worklet = new AudioWorkletNode(audioCtx, "pcm-processor", {
          processorOptions: {
            inputSampleRate: audioCtx.sampleRate,
            targetSampleRate: 24000,
          },
        });

        worklet.port.onmessage = (e) => {
          if (
            !wsRef.current ||
            wsRef.current.readyState !== WebSocket.OPEN ||
            !isSessionReadyRef.current ||
            isSpeakingRef.current ||
            isMicMutedRef.current
          ) {
            return;
          }

          const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(e.data))
          );
          wsRef.current.send(
            JSON.stringify({
              type: "input.audio",
              audio: base64Audio,
            })
          );
        };

        // Create a silent gain node so worklet runs without echoing to speakers
        const silentNode = audioCtx.createGain();
        silentNode.gain.value = 0;
        source.connect(worklet);
        worklet.connect(silentNode);
        silentNode.connect(audioCtx.destination);
        workletLoaded = true;
      } catch (workletErr) {
        console.warn("[VoiceAgent] Inlined AudioWorklet failed, using fallback processor:", workletErr);
      }

      // Fallback to ScriptProcessor if AudioWorklet wasn't used
      if (!workletLoaded) {
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          if (
            !wsRef.current ||
            wsRef.current.readyState !== WebSocket.OPEN ||
            !isSessionReadyRef.current ||
            isSpeakingRef.current ||
            isMicMutedRef.current
          ) {
            return;
          }

          const inputChannelData = e.inputBuffer.getChannelData(0);
          const resampled = resampleAudio(
            inputChannelData,
            audioCtx.sampleRate,
            24000
          );
          const pcm16Buffer = float32ToInt16PCM(resampled);
          const base64Audio = arrayBufferToBase64(pcm16Buffer);

          wsRef.current.send(
            JSON.stringify({
              type: "input.audio",
              audio: base64Audio,
            })
          );
        };

        // Connect through silent gain node to avoid mic feedback through speakers
        const silentNode = audioCtx.createGain();
        silentNode.gain.value = 0;
        source.connect(processor);
        processor.connect(silentNode);
        silentNode.connect(audioCtx.destination);
      }

      setState((prev) => ({
        ...prev,
        isListening: true,
        speechBubbleText: "I'm listening...",
        currentEmotion: "13", // Attentive
      }));
    } catch (err: unknown) {
      console.error("[VoiceAgent] Microphone access error:", err);
      setState((prev) => ({
        ...prev,
        error: "Microphone access denied or unavailable",
        speechBubbleText: "Microphone unavailable. You can type instead.",
        currentEmotion: "04",
      }));
    }
  }, []);

  // Connect to AssemblyAI Voice Agent WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
      speechBubbleText: "Connecting voice...",
      currentEmotion: "01", // Waking
    }));
    isMicMutedRef.current = false;
    replyDoneRef.current = false;
    pendingToolResultsRef.current = [];

    try {
      // 1. Fetch short-lived token from backend
      const tokenRes = await fetch("/api/voice-agent/token");
      if (!tokenRes.ok) {
        throw new Error(`Failed to obtain voice token (${tokenRes.status})`);
      }
      const tokenData = await tokenRes.json();
      const token = tokenData.token;

      if (!token) {
        throw new Error("No token received from voice auth endpoint");
      }

      // 2. Open WebSocket to AssemblyAI Voice Agent API
      const ws = new WebSocket(`wss://agents.assemblyai.com/v1/ws?token=${token}`);
      wsRef.current = ws;

      const flushToolResults = () => {
        if (!replyDoneRef.current || ws.readyState !== WebSocket.OPEN) return;

        pendingToolResultsRef.current.forEach(({ callId, result }) => {
          ws.send(
            JSON.stringify({
              type: "tool.result",
              call_id: callId,
              result,
            }),
          );
        });
        pendingToolResultsRef.current = [];
        replyDoneRef.current = false;
      };

      ws.onopen = () => {
        console.log("[VoiceAgent] WebSocket connected. Sending session.update...");

        // The provider buffers finalized transcripts too; this is the first line
        // of defence against thought pauses splitting a single instruction.
        const sessionUpdate = {
          type: "session.update",
          session: {
            system_prompt:
              "You are Aria's voice interface, a friendly and concise computer-use assistant. " +
              "AssemblyAI handles speech recognition and speech synthesis; OpenCode controls the computer. " +
              "You can operate the desktop and browser by calling `create_computer_task`; never say that you cannot do computer tasks and never pretend AssemblyAI itself is the computer operator. " +
              "For any computer or browser request, call `create_computer_task` immediately and confirm warmly in one short sentence.",
            greeting: "Hi! What can I help you get done?",
            input: {
              format: { encoding: "audio/pcm" },
              transcription_mode: "min_latency",
              voice_focus: "near-field",
              turn_detection: {
                end_of_turn_confidence_threshold: TURN_DETECTION_CONFIDENCE_THRESHOLD,
                min_end_of_turn_silence_when_confident: TURN_DETECTION_MIN_SILENCE_WHEN_CONFIDENT_MS,
                max_turn_silence: TURN_DETECTION_MAX_SILENCE_MS,
              },
            },
            output: {
              voice: "anna",
              format: { encoding: "audio/pcm" },
            },
            tools: [
              {
                type: "function",
                name: "create_computer_task",
                description:
                  "Start an automated computer-use task on the desktop with OpenCode based on user voice command.",
                parameters: {
                  type: "object",
                  properties: {
                    description: {
                      type: "string",
                      description: "The complete description of the computer task to perform.",
                    },
                  },
                  required: ["description"],
                },
              },
              {
                type: "function",
                name: "set_mascot_emotion",
                description: "Change the visual emotion and speech text of the mascot ball.",
                parameters: {
                  type: "object",
                  properties: {
                    emotion: {
                      type: "string",
                      enum: [
                        "curious",
                        "listening",
                        "thinking",
                        "happy",
                        "focused",
                        "sleeping",
                      ],
                      description: "The emotional expression.",
                    },
                    speech_text: {
                      type: "string",
                      description: "The speech text to display.",
                    },
                  },
                  required: ["emotion"],
                },
              },
            ],
          },
        };

        ws.send(JSON.stringify(sessionUpdate));
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          // Audio packets arrive many times per second; logging their full payload
          // blocks the main thread and produces audible playback stutter.
          if (msg.type !== "reply.audio") {
            console.debug("[VoiceAgent Event]", msg.type);
          }

          switch (msg.type) {
            case "session.ready":
              console.log("[VoiceAgent] Session ready! Starting microphone capture.");
              isSessionReadyRef.current = true;
              greetingPendingRef.current = true;
              replyDoneRef.current = false;
              setState((prev) => ({
                ...prev,
                isConnected: true,
                isConnecting: false,
                isGreetingPending: true,
                speechBubbleText: "Hi! What can I help you get done?",
                currentEmotion: "10",
              }));
              break;

            case "input.speech.started":
              console.log("[VoiceAgent] User speech started");
              if (followUpTimerRef.current) {
                clearTimeout(followUpTimerRef.current);
                followUpTimerRef.current = null;
              }
              replyDoneRef.current = false;
              isMicMutedRef.current = false;
              audioPlayerRef.current?.abort();
              onVoiceActivityRef.current?.();
              setState((prev) => ({
                ...prev,
                isListening: true,
                isSpeaking: false,
                currentEmotion: "13",
                speechBubbleText: "Listening...",
              }));
              break;

            case "input.speech.stopped":
              console.log("[VoiceAgent] User speech stopped; awaiting transcript buffer");
              setState((prev) => ({
                ...prev,
                isListening: false,
                currentEmotion: "11", // Thinking
                speechBubbleText: "Thinking...",
              }));
              break;

            case "transcript.user":
              if (msg.transcript || msg.text) {
                const text = (msg.transcript || msg.text).trim();
                setState((prev) => ({
                  ...prev,
                  userTranscript: text,
                  speechBubbleText: `"${text}"`,
                }));

                onFinalTranscriptRef.current?.(text);
              }
              break;

            case "reply.started":
              isSpeakingRef.current = true;
              setState((prev) => ({
                ...prev,
                isSpeaking: true,
                currentEmotion: "10", // Happy/Speaking
              }));
              break;

            case "reply.audio":
              if (msg.data) {
                audioPlayerRef.current?.enqueueBase64Chunk(msg.data);
              }
              break;

            case "transcript.agent":
              if (msg.transcript || msg.text) {
                const text = msg.transcript || msg.text;
                setState((prev) => ({
                  ...prev,
                  agentTranscript: text,
                  speechBubbleText: text,
                }));
              }
              break;

            case "reply.done":
              isSpeakingRef.current = false;
              replyDoneRef.current = true;
              if (msg.status === "interrupted") {
                audioPlayerRef.current?.abort();
              }
              if (msg.status === "interrupted") {
                pendingToolResultsRef.current = [];
                replyDoneRef.current = false;
              } else {
                flushToolResults();
              }
              setState((prev) => ({
                ...prev,
                isSpeaking: false,
                currentEmotion: "03", // Return to curious
                isGreetingPending: greetingPendingRef.current ? false : prev.isGreetingPending,
              }));
              if (greetingPendingRef.current) {
                greetingPendingRef.current = false;
                if (!isMicMutedRef.current) await startAudioCapture();
              }
              onReplyDoneRef.current?.();
              break;

            case "tool.call":
              console.log("[VoiceAgent] Tool call received:", msg);
              if (msg.name === "create_computer_task") {
                const args =
                  typeof msg.arguments === "string"
                    ? JSON.parse(msg.arguments)
                    : msg.arguments;
                const taskDesc = args?.description || "Desktop Task";

                setState((prev) => ({
                  ...prev,
                  speechBubbleText: `Starting: "${taskDesc}"`,
                  currentEmotion: "30", // Executing
                }));

                await onToolCallRef.current?.(msg.name, { description: taskDesc });
                pendingToolResultsRef.current.push({
                  callId: msg.call_id,
                  result: JSON.stringify({
                    status: "task_started",
                    description: taskDesc,
                  }),
                });
                flushToolResults();
              } else if (msg.name === "set_mascot_emotion") {
                const args =
                  typeof msg.arguments === "string"
                    ? JSON.parse(msg.arguments)
                    : msg.arguments;
                const emotionCodeMap: Record<string, string> = {
                  curious: "03",
                  listening: "13",
                  thinking: "11",
                  happy: "10",
                  focused: "30",
                  sleeping: "00",
                };
                const code = emotionCodeMap[args.emotion] || "03";
                setState((prev) => ({
                  ...prev,
                  currentEmotion: code,
                  speechBubbleText: args.speech_text || prev.speechBubbleText,
                }));

                pendingToolResultsRef.current.push({
                  callId: msg.call_id,
                  result: JSON.stringify({ success: true }),
                });
                flushToolResults();
              }
              break;

            case "session.ended":
              disconnect();
              break;

            case "error":
            case "session.error":
              console.error("[VoiceAgent] Error from server:", msg);
              setState((prev) => ({
                ...prev,
                error: msg.message || "Voice agent error occurred",
              }));
              break;
          }
        } catch (err) {
          console.error("[VoiceAgent] Error parsing message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[VoiceAgent] WebSocket error:", err);
        setState((prev) => ({
          ...prev,
          error: "Voice connection error",
          isConnecting: false,
        }));
      };

      ws.onclose = () => {
        console.log("[VoiceAgent] WebSocket closed");
        disconnect();
      };
    } catch (err: unknown) {
      console.error("[VoiceAgent] Connect failed:", err);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        isConnected: false,
        error: err instanceof Error ? err.message : "Failed to connect voice agent",
        speechBubbleText: "Click on me to speak.",
        currentEmotion: "03",
      }));
    }
  }, [disconnect, startAudioCapture]);

  // Toggle voice conversation on/off
  const toggleVoice = useCallback(() => {
    if (state.isConnected || state.isConnecting) {
      disconnect();
    } else {
      connect();
    }
  }, [state.isConnected, state.isConnecting, connect, disconnect]);

  // Allow user to manually signal they're done speaking (forces immediate turn processing)
  const finishUserTurn = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    isMicMutedRef.current = true;
    stopAudioCapture();
    setState((prev) => ({
      ...prev,
      isListening: false,
      speechBubbleText: "Thinking...",
      currentEmotion: "11",
    }));

  }, [stopAudioCapture]);

  const startListening = useCallback(async () => {
    isMicMutedRef.current = false;
    await startAudioCapture();
  }, [startAudioCapture]);

  const stopListening = useCallback(() => {
    isMicMutedRef.current = true;
    stopAudioCapture();
  }, [stopAudioCapture]);

  const narrate = useCallback((request: NarrationRequest) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const instructions = request.kind === "summary"
      ? `Say exactly this to the user, don't add anything: ${request.text}`
      : request.kind === "error"
        ? `Briefly and calmly let the user know: ${request.text}, and ask if they'd like you to try again.`
        : `Briefly say, in one short sentence: ${request.text}`;
    wsRef.current.send(JSON.stringify({ type: "reply.create", instructions }));
  }, []);

  const interruptAudio = useCallback(() => audioPlayerRef.current?.abort(), []);
  const primeAudio = useCallback(async () => {
    await audioPlayerRef.current?.prime();
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    state,
    connect,
    disconnect,
    toggleVoice,
    finishUserTurn,
    startListening,
    stopListening,
    narrate,
    interruptAudio,
    primeAudio,
  };
}
