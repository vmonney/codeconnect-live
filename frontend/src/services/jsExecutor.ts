/**
 * WASM Code Execution - JavaScript Executor
 *
 * Executes JavaScript code in a Web Worker with:
 * - Console output capture
 * - True timeout mechanism (can interrupt infinite loops)
 * - Security sandboxing (blocked access to window, document, etc.)
 */

import type { WasmExecutionResult } from './executionTypes';
import { formatError } from './executionUtils';

const DEFAULT_TIMEOUT = 5000; // 5 seconds

/**
 * Executes JavaScript code with console capture and sandboxing using Web Worker
 * @param code JavaScript code to execute
 * @param timeout Timeout in milliseconds (default: 5000ms)
 * @returns Execution result with output, error, and execution time
 */
export async function executeJavaScript(
  code: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<WasmExecutionResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    // Create Web Worker for isolated execution
    const worker = new Worker('/js-worker.js');
    let completed = false;

    // Set timeout to terminate worker if it takes too long
    const timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        worker.terminate();
        resolve({
          output: '',
          error: `Execution timeout (${timeout}ms) - code took too long to execute or contained an infinite loop`,
          executionTime: Date.now() - startTime,
        });
      }
    }, timeout);

    // Listen for results from worker
    worker.onmessage = (e) => {
      if (!completed) {
        completed = true;
        clearTimeout(timeoutId);
        worker.terminate();

        const { success, output, error } = e.data;

        resolve({
          output: output || '(no output)',
          error: success ? undefined : formatError({ message: error }),
          executionTime: Date.now() - startTime,
        });
      }
    };

    // Handle worker errors
    worker.onerror = (error) => {
      if (!completed) {
        completed = true;
        clearTimeout(timeoutId);
        worker.terminate();

        resolve({
          output: '',
          error: formatError(error),
          executionTime: Date.now() - startTime,
        });
      }
    };

    // Send code to worker
    worker.postMessage({ code, timeout });
  });
}
