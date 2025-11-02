import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot } from 'lucide-react';
import AIResponseDialog from './AIResponseDialog';

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    question: string;
    status: string;
    created_at: string;
    admin_notes: string | null;
  };
}

const RequestCard = ({ request }: RequestCardProps) => {
  const [showAI, setShowAI] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);

  useEffect(() => {
    checkForResponse();
  }, [request.id]);

  const checkForResponse = async () => {
    const { data } = await supabase
      .from('ai_responses')
      .select('id')
      .eq('request_id', request.id)
      .maybeSingle();
    
    setHasResponse(!!data);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    denied: 'bg-destructive/10 text-destructive border-destructive/20',
    answered: 'bg-primary/10 text-primary border-primary/20',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending Approval',
    approved: 'Approved',
    denied: 'Denied',
    answered: 'Answered',
  };

  return (
    <>
      <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-[var(--transition-smooth)]">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <Badge className={statusColors[request.status] || ''}>
              {statusLabels[request.status] || request.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(request.created_at).toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground">{request.question}</p>
          
          {request.admin_notes && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Admin Notes:</p>
              <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
            </div>
          )}

          {request.status === 'approved' && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAI(true)} 
                variant="default"
                className="flex-1"
              >
                <Bot className="mr-2 h-4 w-4" />
                {hasResponse ? 'View AI Response' : 'Get AI Help'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AIResponseDialog 
        open={showAI}
        onOpenChange={setShowAI}
        request={request}
      />
    </>
  );
};

export default RequestCard;
