import { CodeExecution, ProgrammingLanguage } from '@/types';

// Mock code execution service (kept for reference/fallback)
export async function mockCodeExecution(
  code: string,
  language: ProgrammingLanguage
): Promise<CodeExecution> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const startTime = performance.now();

  // Check for common errors
  const errors = detectErrors(code, language);
  if (errors) {
    return {
      output: '',
      error: errors,
      executionTime: Math.round(performance.now() - startTime),
    };
  }

  // Mock successful output based on code patterns
  const output = generateMockOutput(code, language);

  return {
    output,
    executionTime: Math.round(50 + Math.random() * 200),
  };
}

function detectErrors(code: string, language: ProgrammingLanguage): string | null {
  // Check for empty code
  if (code.trim().length < 10) {
    return 'Error: No executable code found';
  }

  // Check for syntax errors (simplified)
  const syntaxChecks: Record<ProgrammingLanguage, () => string | null> = {
    javascript: () => {
      if (code.includes('cosole.log')) return 'ReferenceError: cosole is not defined';
      if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
        return 'SyntaxError: Unexpected end of input';
      }
      if ((code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length) {
        return 'SyntaxError: Unexpected token';
      }
      return null;
    },
    python: () => {
      if (code.includes('pirnt(')) return "NameError: name 'pirnt' is not defined";
      if (code.includes('  ') && !code.includes('    ')) {
        return 'IndentationError: unexpected indent';
      }
      return null;
    },
    java: () => {
      if (!code.includes('class ')) return 'Error: No class definition found';
      if (!code.includes('public static void main')) return 'Error: Main method not found';
      return null;
    },
    cpp: () => {
      if (!code.includes('#include')) return 'Error: Missing include statements';
      if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
        return 'Error: Unmatched braces';
      }
      return null;
    },
    go: () => {
      if (!code.includes('package main')) return 'Error: Missing package main';
      if (!code.includes('func main()')) return 'Error: Missing main function';
      return null;
    },
    ruby: () => {
      if (code.includes('pust ')) return "NoMethodError: undefined method 'pust'";
      return null;
    },
  };

  return syntaxChecks[language]?.() || null;
}

function generateMockOutput(code: string, language: ProgrammingLanguage): string {
  // Extract print/console statements and generate output
  let output = '';

  // Look for common output patterns
  const printPatterns: Record<ProgrammingLanguage, RegExp[]> = {
    javascript: [/console\.log\(["'`](.+?)["'`]\)/g, /console\.log\((.+?)\)/g],
    python: [/print\(["'](.+?)["']\)/g, /print\((.+?)\)/g],
    java: [/System\.out\.println\(["'](.+?)["']\)/g],
    cpp: [/cout\s*<<\s*["'](.+?)["']/g],
    go: [/fmt\.Println\(["'](.+?)["']\)/g],
    ruby: [/puts\s+["'](.+?)["']/g, /puts\s+(.+)/g],
  };

  const patterns = printPatterns[language] || [];

  for (const pattern of patterns) {
    const matches = code.matchAll(pattern);
    for (const match of matches) {
      const value = match[1];
      // Handle some common cases
      if (value === 'Hello, World!' || value.includes('Hello')) {
        output += 'Hello, World!\n';
      } else if (value.includes('+') || value.includes('-') || value.includes('*')) {
        // Try to evaluate simple math
        try {
          const result = eval(value.replace(/[^\d+\-*/\s()]/g, ''));
          output += `${result}\n`;
        } catch {
          output += `${value}\n`;
        }
      } else {
        output += `${value}\n`;
      }
    }
  }

  // If no output found, generate a generic response
  if (!output) {
    const defaultOutputs = [
      'Program executed successfully',
      'No output',
      'Execution completed',
    ];
    output = defaultOutputs[Math.floor(Math.random() * defaultOutputs.length)];
  }

  return output.trim();
}
