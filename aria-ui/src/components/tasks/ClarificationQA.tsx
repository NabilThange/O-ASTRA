import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';

interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'confirm';
  choices?: string[];
  required: boolean;
}

interface ClarificationAnswer {
  questionId: string;
  answer: string;
}

interface ClarificationSession {
  taskId: string;
  questions: ClarificationQuestion[];
  answers: ClarificationAnswer[];
  status: 'pending' | 'completed' | 'skipped';
}

interface ClarificationQAProps {
  taskId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const ClarificationQA: React.FC<ClarificationQAProps> = ({
  taskId,
  onComplete,
  onSkip,
}) => {
  const [session, setSession] = useState<ClarificationSession | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/proxy/tasks/${taskId}/clarification`);
      if (!response.ok) {
        throw new Error('Failed to fetch clarification session');
      }
      const data = await response.json();
      
      if (data.status === 'not_started') {
        // No questions to ask
        return;
      }

      setSession(data);
      
      // Initialize answers from existing session
      const answersMap: Record<string, string> = {};
      data.answers?.forEach((a: ClarificationAnswer) => {
        answersMap[a.questionId] = a.answer;
      });
      setCurrentAnswers(answersMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answer = currentAnswers[questionId];
    if (!answer) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/proxy/tasks/${taskId}/clarification/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const updatedSession = await response.json();
      setSession(updatedSession);

      if (updatedSession.status === 'completed') {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/proxy/tasks/${taskId}/clarification/skip`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to skip clarification');
      }

      onSkip();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader size={24} />
      </div>
    );
  }

  if (!session || session.questions.length === 0) {
    return null;
  }

  const allAnswered = session.questions.every((q) => currentAnswers[q.id]);

  return (
    <div className="rounded-lg border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-2 p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-bytebot-bronze-dark-7">
          Clarification Questions
        </h3>
        <p className="text-sm text-bytebot-bronze-light-10">
          Please answer these questions to help us understand your request better
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {session.questions.map((question, index) => {
          const isAnswered = !!currentAnswers[question.id];

          return (
            <div
              key={question.id}
              className="rounded border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-1 p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-xs font-medium text-bytebot-bronze-light-10">
                    Question {index + 1} of {session.questions.length}
                  </span>
                  <p className="mt-1 text-sm font-medium text-bytebot-bronze-dark-7">
                    {question.question}
                  </p>
                </div>
                {isAnswered && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    ✓ Answered
                  </span>
                )}
              </div>

              {question.type === 'text' && (
                <div className="mt-3">
                  <Input
                    value={currentAnswers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer..."
                    disabled={isSubmitting}
                    className="mb-2"
                  />
                  <Button
                    onClick={() => handleSubmitAnswer(question.id)}
                    disabled={!currentAnswers[question.id] || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? <Loader size={12} /> : 'Submit Answer'}
                  </Button>
                </div>
              )}

              {question.type === 'choice' && question.choices && (
                <div className="mt-3 space-y-2">
                  {question.choices.map((choice) => (
                    <button
                      key={choice}
                      onClick={() => {
                        handleAnswerChange(question.id, choice);
                        handleSubmitAnswer(question.id);
                      }}
                      disabled={isSubmitting}
                      className={`w-full rounded border p-2 text-left text-sm transition-colors ${
                        currentAnswers[question.id] === choice
                          ? 'border-bytebot-bronze-dark-7 bg-bytebot-bronze-light-3'
                          : 'border-bytebot-bronze-light-7 hover:bg-bytebot-bronze-light-2'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'confirm' && (
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => {
                      handleAnswerChange(question.id, 'yes');
                      handleSubmitAnswer(question.id);
                    }}
                    disabled={isSubmitting}
                    size="sm"
                    variant={currentAnswers[question.id] === 'yes' ? 'default' : 'outline'}
                  >
                    Yes
                  </Button>
                  <Button
                    onClick={() => {
                      handleAnswerChange(question.id, 'no');
                      handleSubmitAnswer(question.id);
                    }}
                    disabled={isSubmitting}
                    size="sm"
                    variant={currentAnswers[question.id] === 'no' ? 'default' : 'outline'}
                  >
                    No
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-bytebot-bronze-light-7 pt-4">
        <Button
          onClick={handleSkip}
          disabled={isSubmitting}
          variant="ghost"
          size="sm"
        >
          Skip Questions
        </Button>
        {allAnswered && (
          <span className="text-sm text-green-600">
            ✓ All questions answered
          </span>
        )}
      </div>
    </div>
  );
};
