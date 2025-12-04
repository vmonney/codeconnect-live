/**
 * Web Worker for executing JavaScript code with proper timeout support
 * This runs in a separate thread, allowing us to terminate infinite loops
 */

self.onmessage = function(e) {
  const { code, timeout } = e.data;
  const capturedOutput = [];

  // Create mock console that captures output
  const mockConsole = {
    log: (...args) => {
      capturedOutput.push(args.map(formatValue).join(' '));
    },
    error: (...args) => {
      capturedOutput.push('ERROR: ' + args.map(formatValue).join(' '));
    },
    warn: (...args) => {
      capturedOutput.push('WARN: ' + args.map(formatValue).join(' '));
    },
    info: (...args) => {
      capturedOutput.push('INFO: ' + args.map(formatValue).join(' '));
    }
  };

  function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  try {
    // Create function with blocked globals
    const userFunction = new Function(
      'console',
      'window',
      'document',
      'localStorage',
      'sessionStorage',
      'fetch',
      'XMLHttpRequest',
      'importScripts',
      'self',
      '"use strict";\n' + code
    );

    // Execute with mock console
    const result = userFunction(
      mockConsole,
      undefined, // window
      undefined, // document
      undefined, // localStorage
      undefined, // sessionStorage
      undefined, // fetch
      undefined, // XMLHttpRequest
      undefined, // importScripts
      undefined  // self
    );

    // Capture return value if exists
    if (result !== undefined) {
      capturedOutput.push('Return value: ' + formatValue(result));
    }

    self.postMessage({
      success: true,
      output: capturedOutput.join('\n') || '(no output)'
    });
  } catch (error) {
    self.postMessage({
      success: false,
      output: capturedOutput.join('\n'),
      error: error.name + ': ' + error.message + '\n' + (error.stack || '')
    });
  }
};
