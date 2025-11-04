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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Help Desk
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure, AI-powered assistance with voice and text. Get instant answers or submit requests for admin approval.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16 max-w-6xl mx-auto">
          <Card className="shadow-[var(--shadow-card)] border-2 hover:border-primary/50 transition-[var(--transition-smooth)]">
            <CardHeader>
              <Lock className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Admin Approval</CardTitle>
              <CardDescription>
                All requests go through admin review before AI assistance is provided
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-2 hover:border-primary/50 transition-[var(--transition-smooth)]">
            <CardHeader>
              <Bot className="w-12 h-12 text-primary mb-4" />
              <CardTitle>AI-Powered</CardTitle>
              <CardDescription>
                Get intelligent, contextual answers to your questions using advanced AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-2 hover:border-primary/50 transition-[var(--transition-smooth)]">
            <CardHeader>
              <Mic className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Voice Chat</CardTitle>
              <CardDescription>
                Speak naturally and get instant AI responses - no login required
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-2 hover:border-primary/50 transition-[var(--transition-smooth)]">
            <CardHeader>
              <Users className="w-12 h-12 text-primary mb-4" />
              <CardTitle>User Dashboard</CardTitle>
              <CardDescription>
                Track your requests and view responses in a clean, organized interface
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/voice-chat')}
              variant="outline"
              className="text-lg px-8 py-6 shadow-[var(--shadow-elevated)]"
            >
              <Mic className="mr-2 h-5 w-5" />
              Try Voice Chat
            </Button>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 shadow-[var(--shadow-elevated)]"
            >
              Get Started
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Try voice chat instantly or sign in for managed help desk access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
