import { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { ProgrammingLanguage, Participant } from '@/types';

interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
  participants?: Participant[];
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
}

const LANGUAGE_MAP: Record<ProgrammingLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  ruby: 'ruby',
};

export function CodeEditor({
  code,
  language,
  onChange,
  participants = [],
  theme = 'vs-dark',
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Define custom dark theme
    monaco.editor.defineTheme('codeview-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'function', foreground: 'dcdcaa' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#f8fafc',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#00d9ff',
        'editor.selectionBackground': '#00d9ff33',
        'editor.lineHighlightBackground': '#1e293b',
        'editorCursor.foreground': '#00d9ff',
        'editor.findMatchBackground': '#00d9ff44',
        'editor.findMatchHighlightBackground': '#00d9ff22',
      },
    });

    monaco.editor.defineTheme('codeview-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#1e293b',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#0891b2',
        'editor.selectionBackground': '#0891b233',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorCursor.foreground': '#0891b2',
      },
    });

    editor.updateOptions({
      theme: theme === 'vs-dark' ? 'codeview-dark' : 'codeview-light',
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Prevent browser save dialog
    });
  };

  const handleEditorChange: OnChange = (value) => {
    onChange(value || '');
  };

  // Update remote cursor decorations
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const newDecorations: any[] = [];

    participants.forEach((participant) => {
      if (participant.cursorPosition) {
        newDecorations.push({
          range: {
            startLineNumber: participant.cursorPosition.line,
            startColumn: participant.cursorPosition.column,
            endLineNumber: participant.cursorPosition.line,
            endColumn: participant.cursorPosition.column + 1,
          },
          options: {
            className: 'remote-cursor',
            beforeContentClassName: 'remote-cursor-line',
            hoverMessage: { value: participant.name },
            stickiness: 1,
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [participants]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border bg-editor-bg">
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language]}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme={theme === 'vs-dark' ? 'codeview-dark' : 'codeview-light'}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          readOnly,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-editor-bg">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
