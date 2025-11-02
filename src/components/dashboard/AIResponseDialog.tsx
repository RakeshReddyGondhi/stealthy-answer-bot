import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  request: {
    id: string;
    title: string;
    question: string;
  };
}

const AIResponseDialog = ({ open, onOpenChange, request }: AIResponseDialogProps) => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadResponse();
    }
  }, [open, request.id]);

  const loadResponse = async () => {
    const { data } = await supabase
      .from('ai_responses')
      .select('response_text')
      .eq('request_id', request.id)
      .maybeSingle();

    if (data) {
      setResponse(data.response_text);
    }
  };

  const generateResponse = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-help', {
        body: { 
          requestId: request.id,
          question: request.question 
        },
      });

      if (error) throw error;

      setResponse(data.response);
      toast({
        title: 'Success',
        description: 'AI response generated!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate AI response',
        variant: 'destructive',
      });
    } finally {
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

          {response ? (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
              <p className="text-sm font-medium mb-2 text-primary">AI Response:</p>
              <p className="text-sm whitespace-pre-wrap">{response}</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No AI response yet. Click below to generate one.
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
