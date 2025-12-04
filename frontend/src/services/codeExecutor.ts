/**
 * WASM Code Execution - Main Router/Facade
 *
 * Routes code execution to the appropriate WASM executor:
 * - Python → Pyodide WASM
 * - JavaScript → Native browser engine
 * - Other languages → Not supported (fallback to backend)
 */

import type { ProgrammingLanguage } from '@/types';
import type { WasmExecutionResult } from './executionTypes';
import { executePythonCode, getPyodideStatus, preloadPyodide } from './pyodideExecutor';
import { executeJavaScript } from './jsExecutor';

/**
 * Checks if a language is supported for WASM execution
 * @param language Programming language
 * @returns true if language supports WASM execution
 */
export function isWasmSupported(language: ProgrammingLanguage): boolean {
  return language === 'python' || language === 'javascript';
}

/**
 * Executes code via WASM (routes to appropriate executor)
 * @param code Source code to execute
 * @param language Programming language
 * @param timeout Timeout in milliseconds (default: 5000ms)
 * @returns Execution result with output, error, and execution time
 * @throws Error if language is not supported for WASM execution
 */
export async function executeCodeWasm(
  code: string,
  language: ProgrammingLanguage,
  timeout: number = 5000
): Promise<WasmExecutionResult> {
  switch (language) {
    case 'python':
      return executePythonCode(code, timeout);

    case 'javascript':
      return executeJavaScript(code, timeout);

    default:
      throw new Error(
        `WASM execution not supported for ${language}. Use backend fallback.`
      );
  }
}

/**
 * Gets the current Pyodide initialization status
 * @returns Pyodide status ('idle' | 'initializing' | 'running' | 'completed' | 'error')
 */
export function getWasmPyodideStatus() {
  return getPyodideStatus();
}

/**
 * Preloads Pyodide runtime in the background (optimization)
 * Call this when you know Python execution is coming soon
 */
export function preloadWasmRuntime() {
  return preloadPyodide();
}

// Re-export types for convenience
export type { WasmExecutionResult } from './executionTypes';
