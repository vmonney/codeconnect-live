import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Trash2, Loader2, Clock, Terminal } from 'lucide-react';
import { CodeExecution } from '@/types';
import { useInterviewStore } from '@/stores/interviewStore';

interface OutputConsoleProps {
  onRun: () => Promise<void>;
  output: CodeExecution | null;
  isRunning: boolean;
}

export function OutputConsole({ onRun, output, isRunning }: OutputConsoleProps) {
  const pyodideStatus = useInterviewStore((state) => state.getPyodideStatus());
  const isPyodideLoading = pyodideStatus === 'initializing';

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden relative">
      {/* Pyodide Loading Overlay */}
      {isPyodideLoading && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4 max-w-md p-6">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Initializing Python</h3>
              <p className="text-sm text-muted-foreground">
                Loading Python runtime (Pyodide) for the first time.
                This may take 10-15 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Output</span>
        </div>
        <div className="flex items-center gap-2">
          {output && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {output.executionTime}ms
            </span>
          )}
          <Button
            variant="glow"
            size="sm"
            onClick={onRun}
            disabled={isRunning || isPyodideLoading}
          >
            {isRunning || isPyodideLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="ml-1">
              {isPyodideLoading ? 'Loading...' : 'Run'}
            </span>
          </Button>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 p-4 overflow-auto font-mono text-sm">
        {output ? (
          <div className="space-y-2">
            {output.error ? (
              <pre className="text-destructive whitespace-pre-wrap">{output.error}</pre>
            ) : (
              <pre className="text-success whitespace-pre-wrap">{output.output || 'No output'}</pre>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Run your code to see the output</p>
              <p className="text-xs mt-1">Press Ctrl/Cmd + Enter to run</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
