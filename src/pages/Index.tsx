import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Bot, Lock, Loader2, Mic } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Interview Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Voice-powered AI assistance for interviews
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* User Section */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <Users className="w-16 h-16 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center">For Users</CardTitle>
              <CardDescription className="text-center text-lg">
                Get AI assistance during interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary flex-shrink-0" />
                  Voice input for natural questions
                </li>
                <li className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary flex-shrink-0" />
                  Instant AI-powered answers
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                  Invisible during screen sharing
                </li>
              </ul>
              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={() => navigate('/auth')}
              >
                Install App
              </Button>
            </CardContent>
          </Card>

          {/* Admin Section */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow border-primary">
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <Shield className="w-16 h-16 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center">For Admins</CardTitle>
              <CardDescription className="text-center text-lg">
                Complete control over user access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary flex-shrink-0" />
                  Monitor all active users
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                  Approve/deny access requests
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                  Real-time access control
                </li>
              </ul>
              <Button 
                className="w-full mt-6" 
                variant="outline"
                size="lg"
                onClick={() => navigate('/auth')}
              >
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Administrators must approve new users before they can access the system
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
