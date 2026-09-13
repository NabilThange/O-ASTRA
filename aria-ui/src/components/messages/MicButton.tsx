import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { VoiceIcon } from '@hugeicons/core-free-icons';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { cn } from '@/lib/utils';

interface MicButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  isInputEmpty: boolean;
  isInputFocused: boolean;
}

export function MicButton({ 
  onTranscription, 
  disabled, 
  isInputEmpty,
  isInputFocused 
}: MicButtonProps) {
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  } = useSpeechToText({
    onTranscription,
    onError: (error) => {
      console.error('STT Error:', error);
      alert(`Speech-to-text error: ${error}`);
    },
  });

  // Handle Space key for hold-to-record
  useEffect(() => {
    if (!isInputFocused || !isInputEmpty) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate on Space when input is focused and empty
      if (e.code === 'Space' && !e.repeat && !isRecording) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInputFocused, isInputEmpty, isRecording, startRecording, stopRecording]);

  // Don't show mic if input has text
  if (!isInputEmpty) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-6 w-6 cursor-pointer rounded-sm transition-colors',
        isRecording 
          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
          : 'hover:bg-gray-100'
      )}
      onClick={toggleRecording}
      disabled={disabled || isProcessing}
      title={isRecording ? 'Stop recording (or release Space)' : 'Start recording (or hold Space)'}
    >
      <HugeiconsIcon
        icon={VoiceIcon}
        className={cn(
          'h-4 w-4',
          isRecording ? 'text-white' : 'text-gray-600'
        )}
      />
    </Button>
  );
}
