import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

interface SharedStateViewerProps {
  taskId: string;
}

export const SharedStateViewer: React.FC<SharedStateViewerProps> = ({ taskId }) => {
  const [state, setState] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const fetchSharedState = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/proxy/tasks/${taskId}/shared-state`);
      if (!response.ok) {
        throw new Error('Failed to fetch shared state');
      }
      const data = await response.json();
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen && !state) {
      fetchSharedState();
    }
  }, [isOpen, state, fetchSharedState]);

  const toggleKey = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const renderValue = (value: unknown, depth: number = 0): React.ReactNode => {
    if (value === null) {
      return <span className="text-bytebot-bronze-light-10">null</span>;
    }
    if (value === undefined) {
      return <span className="text-bytebot-bronze-light-10">undefined</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="text-blue-600">{value.toString()}</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-green-600">{value}</span>;
    }
    if (typeof value === 'string') {
      return <span className="text-orange-600">&quot;{value}&quot;</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-bytebot-bronze-light-10">[]</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-bytebot-bronze-light-10">[</span>
          {value.map((item, index) => (
            <div key={index} className="ml-4">
              <span className="text-bytebot-bronze-light-10">{index}: </span>
              {renderValue(item, depth + 1)}
            </div>
          ))}
          <span className="text-bytebot-bronze-light-10">]</span>
        </div>
      );
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-bytebot-bronze-light-10">{'{}'}</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-bytebot-bronze-light-10">{'{'}</span>
          {keys.map((key) => (
            <div key={key} className="ml-4">
              <span className="text-purple-600">{key}</span>
              <span className="text-bytebot-bronze-light-10">: </span>
              {renderValue(value[key], depth + 1)}
            </div>
          ))}
          <span className="text-bytebot-bronze-light-10">{'}'}</span>
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="bg-bytebot-bronze-light-2 border-bytebot-bronze-light-7 text-bytebot-bronze-dark-7 hover:bg-bytebot-bronze-light-3"
        >
          🔍 Debug State
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-bytebot-bronze-light-2 border-bytebot-bronze-light-7 rounded-lg border shadow-lg">
      <div className="flex items-center justify-between border-b border-bytebot-bronze-light-7 p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-bytebot-bronze-dark-7">
            Shared State Viewer
          </span>
          <span className="text-xs text-bytebot-bronze-light-10">(Admin)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchSharedState}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            {isLoading ? <Loader size={12} /> : '↻'}
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="hide-scrollbar max-h-[500px] overflow-y-auto p-3">
        {isLoading && !state && (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} />
          </div>
        )}

        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {state && !error && (
          <div className="space-y-2">
            {Object.keys(state).length === 0 ? (
              <div className="text-center text-sm text-bytebot-bronze-light-10 py-4">
                No shared state data
              </div>
            ) : (
              Object.entries(state).map(([key, value]) => {
                const isExpanded = expandedKeys.has(key);
                const isComplex = typeof value === 'object' && value !== null;

                return (
                  <div
                    key={key}
                    className="rounded border border-bytebot-bronze-light-7 bg-bytebot-bronze-light-1 p-2"
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => isComplex && toggleKey(key)}
                    >
                      <div className="flex-1 font-mono text-xs">
                        <span className="font-semibold text-bytebot-bronze-dark-7">
                          {key}
                        </span>
                        {!isExpanded && isComplex && (
                          <span className="ml-2 text-bytebot-bronze-light-10">
                            {Array.isArray(value)
                              ? `[${value.length} items]`
                              : `{${Object.keys(value).length} keys}`}
                          </span>
                        )}
                      </div>
                      {isComplex && (
                        <span className="text-bytebot-bronze-light-10">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      )}
                    </div>
                    {(isExpanded || !isComplex) && (
                      <div className="mt-2 font-mono text-xs">
                        {renderValue(value)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
