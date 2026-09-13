/**
 * Audio PCM Utilities for AssemblyAI Voice Agent
 * Handles 24 kHz mono 16-bit PCM conversion and queue playback
 */

/**
 * Resamples a Float32Array from inputSampleRate to targetSampleRate (e.g. 24000Hz)
 */
export function resampleAudio(
  audioData: Float32Array,
  inputSampleRate: number,
  targetSampleRate = 24000
): Float32Array {
  if (inputSampleRate === targetSampleRate) {
    return audioData;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originalIndex = i * ratio;
    const indexFloor = Math.floor(originalIndex);
    const indexCeil = Math.min(indexFloor + 1, audioData.length - 1);
    const weight = originalIndex - indexFloor;

    // Linear interpolation
    result[i] = audioData[indexFloor] * (1 - weight) + audioData[indexCeil] * weight;
  }

  return result;
}

/**
 * Converts Float32Array [-1.0, 1.0] to 16-bit PCM ArrayBuffer (little-endian)
 */
export function float32ToInt16PCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to signed 16-bit integer
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, int16, true); // little-endian
  }

  return buffer;
}

/**
 * Encodes ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes base64 string to Int16Array
 */
export function base64ToInt16Array(base64: string): Int16Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

/**
 * Converts Int16Array to Float32Array for Web Audio playback
 */
export function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    const val = int16[i];
    float32[i] = val < 0 ? val / 0x8000 : val / 0x7fff;
  }
  return float32;
}

/**
 * AudioQueuePlayer handles seamless, jitter-free playback of PCM audio chunks
 * with support for immediate abort on user interruption (barge-in).
 */
export class AudioQueuePlayer {
  private audioCtx: AudioContext | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private targetSampleRate = 24000;
  private readonly jitterBufferSeconds = 0.08;

  constructor(sampleRate = 24000) {
    this.targetSampleRate = sampleRate;
  }

  private initContext() {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: this.targetSampleRate });
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  /** Prime playback from a user gesture so browser autoplay policy permits replies. */
  public async prime() {
    this.initContext();
    if (this.audioCtx?.state === "suspended") await this.audioCtx.resume();
  }

  /**
   * Enqueues base64 PCM chunk (24 kHz mono) for playback
   */
  public enqueueBase64Chunk(base64Data: string) {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const int16 = base64ToInt16Array(base64Data);
      if (int16.length === 0) return;

      const float32 = int16ToFloat32(int16);
      const audioBuffer = this.audioCtx.createBuffer(
        1,
        float32.length,
        this.targetSampleRate
      );
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + this.jitterBufferSeconds;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (err) {
      console.error("[AudioQueuePlayer] Error enqueuing chunk:", err);
    }
  }

  /**
   * Immediately aborts and clears all scheduled audio chunks (barge-in)
   */
  public abort() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Ignore if already stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  public close() {
    this.abort();
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
