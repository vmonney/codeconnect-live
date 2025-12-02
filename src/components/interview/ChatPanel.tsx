import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isTyping: { [userId: string]: boolean };
  onTyping: (isTyping: boolean) => void;
}

export function ChatPanel({ messages, onSendMessage, isTyping, onTyping }: ChatPanelProps) {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
    onTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    onTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const typingUsers = Object.entries(isTyping)
    .filter(([id, typing]) => typing && id !== user?.id)
    .map(([id]) => id);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Chat</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.userId === user?.id ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    msg.userId === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  {msg.userId !== user?.id && (
                    <p className="text-xs font-medium mb-1 opacity-70">{msg.userName}</p>
                  )}
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground">
          <span className="animate-pulse">Someone is typing...</span>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button variant="glow" size="icon" onClick={handleSend} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
