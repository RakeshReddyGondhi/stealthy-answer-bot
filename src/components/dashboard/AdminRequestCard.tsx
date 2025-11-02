import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminRequestCardProps {
  request: {
    id: string;
    title: string;
    question: string;
    status: string;
    created_at: string;
    admin_notes: string | null;
    profiles: {
      email: string;
      full_name: string | null;
    } | null;
  };
  onUpdate: () => void;
}

const AdminRequestCard = ({ request, onUpdate }: AdminRequestCardProps) => {
  const { user } = useAuth();
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: 'approved' | 'denied') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('help_requests')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Request ${newStatus}`,
      });

      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    denied: 'bg-destructive/10 text-destructive border-destructive/20',
    answered: 'bg-primary/10 text-primary border-primary/20',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    denied: 'Denied',
    answered: 'Answered',
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              From: {request.profiles?.email || 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
          <Badge className={statusColors[request.status] || ''}>
            {statusLabels[request.status] || request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Question:</Label>
          <p className="mt-1 text-sm text-foreground">{request.question}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`notes-${request.id}`}>Admin Notes:</Label>
          <Textarea
            id={`notes-${request.id}`}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add notes for the user..."
            rows={3}
            disabled={loading || request.status !== 'pending'}
          />
        </div>

        {request.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate('approved')}
              disabled={loading}
              className="flex-1 bg-success hover:bg-success/90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              onClick={() => handleStatusUpdate('denied')}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Deny
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminRequestCard;
