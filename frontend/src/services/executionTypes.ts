/**
 * WASM Code Execution - Type Definitions
 *
 * Shared TypeScript types for browser-based code execution
 */

export interface WasmExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}

export type ExecutionStatus = 'idle' | 'initializing' | 'running' | 'completed' | 'error';

export interface ExecutionContext {
  startTime: number;
  timeout: number;
  abortController?: AbortController;
}
