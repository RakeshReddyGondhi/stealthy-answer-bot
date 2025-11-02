import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NewRequestDialog from './NewRequestDialog';
import RequestCard from './RequestCard';

interface HelpRequest {
  id: string;
  title: string;
  question: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

const UserDashboard = () => {
  const { user, signOut } = useAuth();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadRequests();
      subscribeToRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load requests',
        variant: 'destructive',
      });
    } else {
      setRequests(data || []);
    }
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('user-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'help_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Help Desk</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Requests</h2>
            <p className="text-muted-foreground mt-1">Submit questions and get AI-powered assistance</p>
          </div>
          <Button onClick={() => setShowNewRequest(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        {requests.length === 0 ? (
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
              <p className="text-muted-foreground mb-4">Create your first help request to get started</p>
              <Button onClick={() => setShowNewRequest(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </main>

      <NewRequestDialog 
        open={showNewRequest} 
        onOpenChange={setShowNewRequest}
        onSuccess={loadRequests}
      />
    </div>
  );
};

export default UserDashboard;
