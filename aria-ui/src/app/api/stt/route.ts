import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { groqKeyManager } from '@/lib/groq-key-manager';

export async function POST(request: NextRequest) {
  const maxRetries = groqKeyManager.getTotalKeys();
  let lastError: any;

  for (let attempt = 0; attempt < Math.max(maxRetries, 1); attempt++) {
    try {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      
      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }

      // Validate file size (25MB max for Groq free tier)
      const MAX_SIZE = 25 * 1024 * 1024;
      if (audioFile.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'Audio file too large. Maximum size is 25MB' },
          { status: 400 }
        );
      }

      // Get current API key from key manager
      const apiKey = groqKeyManager.getCurrentKey();
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'No Groq API key available. Please configure GROQ_API_KEY in environment variables.' },
          { status: 500 }
        );
      }

      // Initialize Groq client with current key
      const groq = new Groq({ apiKey });

      // Convert File to format Groq expects
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Create a File-like object that Groq SDK accepts
      const fileForGroq = new File([buffer], audioFile.name, {
        type: audioFile.type,
      });

      // Call Groq transcription API
      const transcription = await groq.audio.transcriptions.create({
        file: fileForGroq,
        model: 'whisper-large-v3-turbo', // Fastest + cheapest multilingual model
        temperature: 0,
        response_format: 'json',
      });

      // Mark key as successful
      groqKeyManager.markCurrentKeyAsSuccessful();

      return NextResponse.json({ text: transcription.text });
    } catch (error: any) {
      lastError = error;
      console.error(`[STT] Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

      // Mark key as failed and rotate
      groqKeyManager.markCurrentKeyAsFailed(error);

      // If this was the last attempt, return error
      if (attempt === maxRetries - 1) {
        console.error('[STT] All Groq API keys exhausted');
        return NextResponse.json(
          { error: error.message || 'Transcription failed after trying all available API keys' },
          { status: 500 }
        );
      }

      // Otherwise, retry with next key
      console.log(`[STT] Retrying with next API key...`);
    }
  }

  // Fallback error response
  return NextResponse.json(
    { error: lastError?.message || 'Transcription failed' },
    { status: 500 }
  );
}
