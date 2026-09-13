// pcm-processor.js - AudioWorklet that captures PCM16 at 24 kHz in ~50ms chunks
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = options.processorOptions || {};
    const inputSampleRate = opts.inputSampleRate || 48000;
    const targetSampleRate = opts.targetSampleRate || 24000;
    this.ratio = inputSampleRate / targetSampleRate;
    // Buffer ~50ms of audio (1200 samples at 24kHz)
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
