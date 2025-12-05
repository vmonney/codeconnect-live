/**
 * WASM Code Execution - Pyodide (Python) Executor
 *
 * Executes Python code via Pyodide WASM runtime with:
 * - Lazy initialization (singleton pattern)
 * - stdout/stderr capture
 * - Timeout mechanism
 * - Memory cleanup after execution
 */

import { loadPyodide, type PyodideInterface } from 'pyodide';
import type { WasmExecutionResult, ExecutionStatus } from './executionTypes';
import { executeWithTimeout, formatPythonError } from './executionUtils';

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/';

// Singleton instance
let pyodideInstance: PyodideInterface | null = null;
let loadingPromise: Promise<PyodideInterface> | null = null;
let initializationStatus: ExecutionStatus = 'idle';

/**
 * Initializes Pyodide runtime (lazy load, singleton pattern)
 * @returns Promise resolving to Pyodide instance
 */
async function initializePyodide(): Promise<PyodideInterface> {
  // Return existing instance if already loaded
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // Return existing loading promise if already loading (prevent duplicate loads)
  if (loadingPromise) {
    return loadingPromise;
  }

  initializationStatus = 'initializing';

  loadingPromise = (async () => {
    try {
      // Load Pyodide from CDN (~8MB, cached by browser)
      const pyodide = await loadPyodide({
        indexURL: PYODIDE_CDN_URL,
      });

      // Setup stdout/stderr capture using StringIO
      await pyodide.runPythonAsync(`
        import sys
        from io import StringIO
        sys.stdout = StringIO()
        sys.stderr = StringIO()
      `);

      pyodideInstance = pyodide;
      initializationStatus = 'idle';
      return pyodide;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      initializationStatus = 'error';
      loadingPromise = null; // Reset so user can retry
      throw new Error(`Failed to initialize Pyodide: ${errorMessage}`);
    }
  })();

  return loadingPromise;
}

/**
 * Gets the current Pyodide initialization status
 * @returns Current initialization status
 */
export function getPyodideStatus(): ExecutionStatus {
  return initializationStatus;
}

/**
 * Preloads Pyodide in the background (optional optimization)
 * @returns Promise that resolves when Pyodide is loaded
 */
export async function preloadPyodide(): Promise<void> {
  try {
    await initializePyodide();
  } catch (error) {
    console.error('Failed to preload Pyodide:', error);
  }
}

/**
 * Executes Python code via Pyodide
 * @param code Python code to execute
 * @param timeout Timeout in milliseconds (default: 5000ms)
 * @returns Execution result with output, error, and execution time
 */
export async function executePythonCode(
  code: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<WasmExecutionResult> {
  const startTime = Date.now();

  try {
    // Initialize Pyodide (first time will download ~8MB)
    initializationStatus = 'initializing';
    const pyodide = await initializePyodide();
    initializationStatus = 'running';

    // Reset stdout/stderr before execution
    await pyodide.runPythonAsync(`
      sys.stdout.seek(0)
      sys.stdout.truncate()
      sys.stderr.seek(0)
      sys.stderr.truncate()
    `);

    // Execute user code with timeout
    await executeWithTimeout(async () => {
      await pyodide.runPythonAsync(code);
    }, timeout);

    // Capture stdout and stderr
    const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
    const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()');

    const output = (stdout + stderr).trim();

    // Clean up user-defined variables to prevent memory leaks
    await cleanupPythonNamespace(pyodide);

    initializationStatus = 'completed';

    return {
      output: output || '(no output)',
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    initializationStatus = 'error';

    // Check if it's a Python error (from Pyodide) or JavaScript error
    const errorObj = error as { message?: string };
    const errorMessage = errorObj.message || String(error);
    const isPythonError = errorMessage.includes('Traceback');

    return {
      output: '',
      error: isPythonError ? formatPythonError(errorMessage) : errorMessage,
      executionTime: Date.now() - startTime,
    };
  } finally {
    // Reset status after a brief delay
    setTimeout(() => {
      if (initializationStatus !== 'initializing') {
        initializationStatus = 'idle';
      }
    }, 100);
  }
}

/**
 * Cleans up Python namespace to prevent memory leaks
 * @param pyodide Pyodide instance
 */
async function cleanupPythonNamespace(pyodide: PyodideInterface): Promise<void> {
  try {
    await pyodide.runPythonAsync(`
      import sys
      import builtins

      # Get list of built-in names and modules
      builtin_names = set(dir(builtins))
      system_modules = set(sys.modules.keys())

      # Remove user-defined variables from global namespace
      user_vars = [name for name in list(globals().keys())
                   if not name.startswith('_')
                   and name not in builtin_names
                   and name not in system_modules
                   and name not in ['sys', 'builtins', 'StringIO']]

      for name in user_vars:
        try:
          del globals()[name]
        except:
          pass

      # Clear output buffers
      sys.stdout.seek(0)
      sys.stdout.truncate()
      sys.stderr.seek(0)
      sys.stderr.truncate()
    `);
  } catch (error) {
    // Cleanup errors are not critical, just log them
    console.warn('Failed to clean up Python namespace:', error);
  }
}

/**
 * Resets Pyodide instance (useful for testing or recovery)
 */
export function resetPyodide(): void {
  pyodideInstance = null;
  loadingPromise = null;
  initializationStatus = 'idle';
}
