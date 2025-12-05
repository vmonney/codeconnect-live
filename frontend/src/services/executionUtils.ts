/**
 * WASM Code Execution - Utility Functions
 *
 * Shared utilities for timeout handling, value formatting, and error processing
 */

/**
 * Executes a function with a timeout limit
 * @param fn Function to execute (can be sync or async)
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves with function result or rejects on timeout
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T> | T,
  timeout: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Execution timeout (${timeout}ms)`)), timeout);
  });

  return Promise.race([Promise.resolve(fn()), timeoutPromise]);
}

/**
 * Formats a JavaScript value for console output
 * @param value Any JavaScript value
 * @returns Formatted string representation
 */
export function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  // Handle objects and arrays
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // Circular reference or other JSON error
      return String(value);
    }
  }

  return String(value);
}

/**
 * Formats an error object into a readable string
 * @param error Error object
 * @returns Formatted error message with stack trace
 */
export function formatError(error: unknown): string {
  if (!error) return 'Unknown error';

  const errorObj = error as { message?: string; name?: string; stack?: string };
  const message = errorObj.message || String(error);
  const name = errorObj.name || 'Error';

  // Include stack trace if available, but clean it up
  if (errorObj.stack) {
    const stack = errorObj.stack
      .split('\n')
      // Remove internal frames from our execution code
      .filter((line: string) => !line.includes('executionUtils.ts'))
      .filter((line: string) => !line.includes('jsExecutor.ts'))
      .filter((line: string) => !line.includes('pyodideExecutor.ts'))
      .filter((line: string) => !line.includes('node_modules'))
      .join('\n');

    return stack;
  }

  return `${name}: ${message}`;
}

/**
 * Formats a Python error/traceback for display
 * @param errorMessage Python error message from Pyodide
 * @returns Cleaned up error message
 */
export function formatPythonError(errorMessage: string): string {
  // Pyodide errors typically include full traceback
  // Just return as-is since Python errors are usually well-formatted
  return errorMessage;
}

/**
 * Sanitizes output to prevent XSS attacks
 * @param output Raw output string
 * @returns Sanitized output
 */
export function sanitizeOutput(output: string): string {
  // Remove any potential HTML/script tags
  return output
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Calculates execution time in milliseconds
 * @param startTime Start timestamp from Date.now()
 * @returns Execution time in ms
 */
export function calculateExecutionTime(startTime: number): number {
  return Date.now() - startTime;
}
