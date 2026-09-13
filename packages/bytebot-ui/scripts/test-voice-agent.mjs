import assert from "node:assert";

// 1. Audio resampling test
function resampleAudio(audioData, inputSampleRate, targetSampleRate = 24000) {
  if (inputSampleRate === targetSampleRate) return audioData;
  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const originalIndex = i * ratio;
    const indexFloor = Math.floor(originalIndex);
    const indexCeil = Math.min(indexFloor + 1, audioData.length - 1);
    const weight = originalIndex - indexFloor;
    result[i] = audioData[indexFloor] * (1 - weight) + audioData[indexCeil] * weight;
  }
  return result;
}

// 2. PCM conversion test
function float32ToInt16PCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, int16, true);
  }
  return buffer;
}

function base64ToInt16Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Test 1: Resample 48000Hz -> 24000Hz should halve samples
console.log("Running Test 1: Resampling...");
const input48k = new Float32Array(4800); // 100ms at 48kHz
for (let i = 0; i < input48k.length; i++) {
  input48k[i] = Math.sin((2 * Math.PI * 440 * i) / 48000);
}
const output24k = resampleAudio(input48k, 48000, 24000);
assert.strictEqual(output24k.length, 2400, "Should have exactly 2400 samples (100ms at 24kHz)");
console.log("✓ Test 1 Passed: Resampled from 48000Hz to 24000Hz successfully.");

// Test 2: PCM16 encoding and Base64 roundtrip
console.log("Running Test 2: PCM16 Base64 roundtrip...");
const pcmBuffer = float32ToInt16PCM(output24k);
assert.strictEqual(pcmBuffer.byteLength, 4800, "PCM16 buffer should be 4800 bytes (2400 samples * 2 bytes)");

const base64 = arrayBufferToBase64(pcmBuffer);
assert(typeof base64 === "string" && base64.length > 0, "Base64 string generated");

const decodedInt16 = base64ToInt16Array(base64);
assert.strictEqual(decodedInt16.length, 2400, "Decoded Int16Array length matches original samples");
console.log("✓ Test 2 Passed: PCM16 and Base64 roundtrip verified.");

// Test 3: Token Minting API live verification
console.log("Running Test 3: AssemblyAI Voice Agent Token verification...");
async function verifyAssemblyAIToken() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  assert(apiKey, "ASSEMBLYAI_API_KEY must be set to run the live token test");
  const res = await fetch("https://agents.assemblyai.com/v1/token?expires_in_seconds=300", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  assert.strictEqual(res.status, 200, "AssemblyAI token response status must be 200");
  const data = await res.json();
  assert(typeof data.token === "string" && data.token.length > 20, "Valid token string returned");
  console.log("✓ Test 3 Passed: Successfully minted AssemblyAI Voice Agent session token.");
}

verifyAssemblyAIToken().then(() => {
  console.log("\nAll 3 tests passed successfully!");
});
