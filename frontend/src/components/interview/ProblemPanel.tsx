import { useState } from 'react';
import { CodeTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, FileText, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProblemPanelProps {
  template?: CodeTemplate;
  customProblem?: string;
}

export function ProblemPanel({ template, customProblem }: ProblemPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <strong key={i} className="block mt-2">{line.slice(2, -2)}</strong>;
        }
        if (line.startsWith('```')) {
          return null;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4">{line.slice(2)}</li>;
        }
        return <p key={i}>{line || <br />}</p>;
      });
  };

  if (!template && !customProblem) {
    return (
      <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Problem</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
          <div className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No problem loaded</p>
            <p className="text-xs mt-1">The interviewer can add a problem description</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-card rounded-lg border border-border overflow-hidden transition-all duration-300",
      isCollapsed ? "h-12" : "h-full"
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{template?.title || 'Problem'}</span>
          {template && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              template.difficulty === 'easy' && 'bg-success/20 text-success',
              template.difficulty === 'medium' && 'bg-warning/20 text-warning',
              template.difficulty === 'hard' && 'bg-destructive/20 text-destructive'
            )}>
              {template.difficulty}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon-sm">
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 text-sm">
            {template ? (
              <>
                {/* Problem description */}
                <div>
                  <div className="prose prose-sm prose-invert max-w-none">
                    {renderMarkdown(template.problem)}
                  </div>
                </div>

                {/* Examples */}
                {template.examples && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-warning" />
                      <h4 className="font-medium">Examples</h4>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
                      {renderMarkdown(template.examples)}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {template.constraints && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium">Constraints</h4>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-xs">
                      {renderMarkdown(template.constraints)}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none">
                {renderMarkdown(customProblem || '')}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
