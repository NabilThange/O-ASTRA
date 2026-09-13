# Speech-to-Text (STT) Feature

## Overview
All text inputs on the dashboard and task pages now support voice input using Groq's Whisper API.

## Features

### Mic Icon Behavior
- A mic icon appears in every text input field
- Only visible when the input is empty
- Hidden automatically when text is present

### Recording Activation
Two ways to start recording:

1. **Click the mic icon** - Toggles recording on/off
2. **Hold Space key** - Recording active while held, stops on release
   - Only works when input is focused and empty
   - Doesn't interfere with normal Space behavior elsewhere

### Visual Feedback
- Mic icon pulses red while recording
- Processing indicator shown during transcription
- Transcribed text automatically inserted into input field

## Backend Implementation

### API Route
- **Endpoint**: `POST /api/stt`
- **Accepts**: `multipart/form-data` with audio file
- **Model**: `whisper-large-v3-turbo` (fastest + cheapest multilingual)
- **Max file size**: 25MB (Groq free tier limit)
- **Supported formats**: flac, mp3, mp4, wav, webm, m4a, ogg

### Key Rotation
The backend implements intelligent key rotation matching aria-agent's implementation:
- Tries `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, etc. in sequence
- Falls back to `GROQ_API_KEY` if no numbered keys found
- Automatically rotates to next key on failure
- Disables keys after 3 consecutive failures
- Re-enables disabled keys after 30 minutes
- Resets failure count on successful requests

This ensures high availability even if some API keys hit rate limits or fail.

## Setup

### Environment Variables
Add to `packages/aria-ui/.env`:

```bash
# Groq API Key for Speech-to-Text
GROQ_API_KEY=your_groq_api_key_here

# Optional: Multiple keys for rotation
GROQ_API_KEY_1=your_first_key
GROQ_API_KEY_2=your_second_key
```

Get your API key from: https://console.groq.com/keys

### Browser Permissions
Users will be prompted to allow microphone access on first use.

## Technical Details

### Components
- **MicButton** (`src/components/messages/MicButton.tsx`) - Reusable mic button component
- **useSpeechToText** (`src/hooks/useSpeechToText.ts`) - Recording and transcription hook
- **ChatInput** (`src/components/messages/ChatInput.tsx`) - Updated to include mic button

### Audio Recording
- Uses browser's `MediaRecorder` API
- Records in WebM format (falls back to WAV if unsupported)
- Automatically releases microphone after recording

### API Integration
- Transcription happens server-side (API key never exposed)
- Uses Groq SDK for reliable transcription
- Error handling with user-friendly messages

## Usage Locations
The STT feature is automatically available in:
- Dashboard main input
- Task page chat input
- Any component using `ChatInput`

## Constraints
- Max audio file size: 25MB
- Requires HTTPS in production (browser requirement for microphone access)
- Requires Groq API key with available credits
