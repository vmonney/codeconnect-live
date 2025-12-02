import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Interview } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Clock, 
  StopCircle, 
  FileText, 
  Star,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InterviewControlsProps {
  interview: Interview;
  isInterviewer: boolean;
  onEndInterview: () => void;
  onUpdateNotes: (notes: string) => void;
  onRateCandidate: (rating: number) => void;
}

export function InterviewControls({
  interview,
  isInterviewer,
  onEndInterview,
  onUpdateNotes,
  onRateCandidate,
}: InterviewControlsProps) {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState(interview.notes || '');
  const [rating, setRating] = useState(interview.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (interview.status !== 'in-progress') return;

    const startTime = interview.startedAt 
      ? new Date(interview.startedAt).getTime() 
      : Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [interview.startedAt, interview.status]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(interview.shareLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndInterview = () => {
    if (rating === 0 && isInterviewer) {
      toast.error('Please rate the candidate before ending');
      return;
    }
    onRateCandidate(rating);
    onUpdateNotes(notes);
    onEndInterview();
    setIsEndDialogOpen(false);
    toast.success('Interview ended');
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center gap-3">
      {/* Timer */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
        <Clock className={cn(
          "h-4 w-4",
          interview.status === 'in-progress' && "text-success animate-pulse"
        )} />
        <span className="font-mono text-sm font-medium">{formatDuration(duration)}</span>
      </div>

      {/* Share Link */}
      <Button variant="outline" size="sm" onClick={copyLink}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span className="ml-1 hidden sm:inline">Copy Link</span>
      </Button>

      {isInterviewer && (
        <>
          {/* Notes */}
          <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Notes</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Interview Notes</DialogTitle>
                <DialogDescription>
                  Private notes visible only to you
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="Add your notes about the candidate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  onUpdateNotes(notes);
                  setIsNotesOpen(false);
                  toast.success('Notes saved');
                }}>
                  Save Notes
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* End Interview */}
          <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <StopCircle className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">End</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>End Interview</DialogTitle>
                <DialogDescription>
                  Rate the candidate and add any final notes before ending.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Rating */}
                <div className="space-y-2">
                  <Label>Rate Candidate</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            (hoverRating || rating) >= star
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Notes */}
                <div className="space-y-2">
                  <Label>Final Notes</Label>
                  <Textarea
                    placeholder="Any final thoughts..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEndDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleEndInterview}>
                  End Interview
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
