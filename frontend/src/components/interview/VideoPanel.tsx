import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Participant } from '@/types';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Maximize2,
  Minimize2,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPanelProps {
  participants: Participant[];
  localParticipant?: Participant;
}

export function VideoPanel({ participants, localParticipant }: VideoPanelProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const allParticipants = localParticipant 
    ? [localParticipant, ...participants.filter(p => p.id !== localParticipant.id)]
    : participants;

  return (
    <div className={cn(
      "flex flex-col bg-card rounded-lg border border-border overflow-hidden transition-all duration-300",
      isExpanded ? "fixed inset-4 z-50" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Video</span>
          <span className="text-xs text-muted-foreground">
            ({allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''})
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-2 overflow-auto">
        <div className={cn(
          "grid gap-2 h-full",
          allParticipants.length === 1 && "grid-cols-1",
          allParticipants.length === 2 && "grid-cols-1 md:grid-cols-2",
          allParticipants.length > 2 && "grid-cols-2"
        )}>
          {allParticipants.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Waiting for participants...</p>
              </div>
            </div>
          ) : (
            allParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className="relative rounded-lg bg-secondary overflow-hidden aspect-video min-h-[100px]"
              >
                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-background">
                  {isVideoOn || index !== 0 ? (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ backgroundColor: participant.cursorColor || 'hsl(var(--primary))' }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <VideoOff className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-xs font-medium bg-background/70 px-2 py-1 rounded backdrop-blur-sm">
                    {participant.name} {index === 0 && localParticipant && '(You)'}
                  </span>
                  {participant.isOnline && (
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-3 border-t border-border">
        <Button
          variant={isMicOn ? 'secondary' : 'destructive'}
          size="icon"
          onClick={() => setIsMicOn(!isMicOn)}
        >
          {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={isVideoOn ? 'secondary' : 'destructive'}
          size="icon"
          onClick={() => setIsVideoOn(!isVideoOn)}
        >
          {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
      </div>

      {/* WebRTC Notice */}
      <div className="px-3 py-2 bg-warning/10 border-t border-warning/20">
        <p className="text-xs text-warning text-center">
          Video/Audio is a mockup - WebRTC integration ready
        </p>
      </div>
    </div>
  );
}
