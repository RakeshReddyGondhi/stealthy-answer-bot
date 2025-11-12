import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminRequestCard from './AdminRequestCard';
import useAdminControl from '@/hooks/useAdminControl';

interface HelpRequest {
  id: string;
  title: string;
  question: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
  user_id: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const { toast } = useToast();
  const { appLocked, setUserDenied, setGlobalLocked, reload } = useAdminControl();
  const [targetUserId, setTargetUserId] = useState("");

  useEffect(() => {
    loadRequests();
    subscribeToRequests();
  }, []);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load requests',
        variant: 'destructive',
      });
      return;
    }

    // Fetch profiles separately
    const requestsWithProfiles = await Promise.all(
      (data || []).map(async (request) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', request.user_id)
          .single();

        return {
          ...request,
          profiles: profile || { email: 'Unknown', full_name: null },
        };
      })
    );

    setRequests(requestsWithProfiles as HelpRequest[]);
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('admin-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'help_requests',
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

  const handleSetGlobal = async (flag: boolean) => {
    try {
      await setGlobalLocked(flag);
      toast({ title: 'Success', description: `Global ${flag ? 'locked' : 'unlocked'}.` });
      await reload();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to set global lock', variant: 'destructive' });
    }
  };

  const handleDenyUser = async (flag: boolean) => {
    if (!targetUserId) {
      toast({ title: 'Error', description: 'Please enter a user id', variant: 'destructive' });
      return;
    }

    try {
      await setUserDenied(targetUserId, flag);
      toast({ title: 'Success', description: `User ${flag ? 'denied' : 'allowed'}.` });
      setTargetUserId("");
      await reload();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update user deny', variant: 'destructive' });
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'answered');
  const deniedRequests = requests.filter(r => r.status === 'denied');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage help requests</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Global App Lock</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge>{appLocked ? 'Locked' : 'Open'}</Badge>
                <Button onClick={() => handleSetGlobal(!appLocked)} variant="ghost">{appLocked ? 'Unlock' : 'Lock'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Deny / Allow User</p>
              <div className="flex gap-2 mt-3">
                <input value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} placeholder="user id (uuid)" className="flex-1 rounded-md border px-2 py-1" />
                <Button onClick={() => handleDenyUser(true)} variant="destructive">Deny</Button>
                <Button onClick={() => handleDenyUser(false)} variant="secondary">Allow</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Quick Actions</p>
              <div className="flex gap-2 mt-3">
                <Button onClick={loadRequests} variant="outline">Refresh Requests</Button>
                <Button onClick={reload} variant="outline">Refresh Controls</Button>
              </div>
            </CardContent>
          </Card>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-warning">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-success">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Denied</p>
                <p className="text-3xl font-bold text-destructive">{deniedRequests.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="denied">
              Denied ({deniedRequests.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <AdminRequestCard key={request.id} request={request} onUpdate={loadRequests} />
              ))}
              {pendingRequests.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No pending requests
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="approved" className="mt-6">
            <div className="grid gap-4">
              {approvedRequests.map((request) => (
                <AdminRequestCard key={request.id} request={request} onUpdate={loadRequests} />
              ))}
              {approvedRequests.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No approved requests
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="denied" className="mt-6">
            <div className="grid gap-4">
              {deniedRequests.map((request) => (
                <AdminRequestCard key={request.id} request={request} onUpdate={loadRequests} />
              ))}
              {deniedRequests.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No denied requests
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
