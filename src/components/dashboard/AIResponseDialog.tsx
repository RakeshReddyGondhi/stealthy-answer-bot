import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2 } from 'lucide-react';

interface AIResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Tables['help_requests']['Row'];
}

const AIResponseDialog = ({ open, onOpenChange, request }: AIResponseDialogProps) => {
  const [responses, setResponses] = useState<Tables['ai_responses']['Row'][]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const loadResponses = async () => {
      const { data: existingResponses } = await supabase
        .from('ai_responses')
        .select('*')
        .eq('request_id', request.id)
        .order('created_at', { ascending: true });

      if (existingResponses) {
        setResponses(existingResponses);
      }
    };

    loadResponses();

    // Subscribe to new responses
    const channel = supabase
      .channel('ai_responses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_responses',
          filter: `request_id=eq.${request.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setResponses((current) => [...current, payload.new as Tables['ai_responses']['Row']]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, request.id]);

  const generateResponse = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('ai-help', {
        body: { 
          requestId: request.id,
          question: request.question,
        },
      });

      if (error) throw error;

      toast({
        title: 'Processing',
        description: 'AI is generating a response...',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate AI response',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>{request.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium mb-2">Your Question:</p>
            <p className="text-sm text-muted-foreground">{request.question}</p>
          </div>

          {responses.length > 0 ? (
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={response.id} className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2 text-primary">
                    AI Response {responses.length > 1 ? `#${index + 1}` : ''}:
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{response.response_text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(response.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              <Button onClick={generateResponse} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Another Response...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Generate Another Response
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No AI responses yet. Click below to generate one.
              </p>
              <Button onClick={generateResponse} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Generate AI Response
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIResponseDialog;
