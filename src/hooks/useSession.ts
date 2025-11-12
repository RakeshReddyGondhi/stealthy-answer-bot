import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];
type SessionPayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
  status?: 'pending' | 'approved' | 'denied';
}>;

interface SessionState {
  sessionId: string | null;
  isApproved: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const useSession = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    isApproved: false,
    isLoading: true,
    error: null
  });

  const updateLastActive = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Failed to update last_active:', error);
      }
    } catch (error) {
      console.error('Error updating last_active:', error);
    }
  }, []);

  // Session management
  useEffect(() => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false, isApproved: false }));
      return;
    }

    let heartbeatInterval: NodeJS.Timer;
    let sessionSubscription: ReturnType<typeof supabase.channel>;

    const startSession = async () => {
      try {
        // Get device info
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        };

        // Create session
        const { data, error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            ip_address: '(fetching...)', // Will be set by server
            device_info: JSON.stringify(deviceInfo),
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        setState(prev => ({
          ...prev,
          sessionId: data.id,
          isLoading: false
        }));

        // Subscribe to session status changes
        sessionSubscription = supabase
          .channel(`session-${data.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_sessions',
              filter: `id=eq.${data.id}`
            },
            (payload: SessionPayload) => {
              if (payload.new?.status) {
                setState(prev => ({
                  ...prev,
                  isApproved: payload.new?.status === 'approved'
                }));
              }
            }
          )
          .subscribe();

        // Start heartbeat
        heartbeatInterval = setInterval(() => updateLastActive(data.id), 60000);

      } catch (error) {
        console.error('Error starting session:', error);
        setState(prev => ({
          ...prev,
          error: error as Error,
          isLoading: false
        }));
      }
    };

    startSession();

    return () => {
      clearInterval(heartbeatInterval);
      sessionSubscription?.unsubscribe();
    };
  }, [user, updateLastActive]);

  // Block checking
  useEffect(() => {
    if (!user) return;

    let blockSubscription: ReturnType<typeof supabase.channel>;

    const checkBlocked = async () => {
      try {
        const { data: isBlocked, error } = await supabase
          .rpc('is_user_blocked', { user_id: user.id });

        if (error) throw error;

        if (isBlocked) {
          setState(prev => ({ ...prev, isApproved: false }));
        }
      } catch (error) {
        console.error('Error checking block status:', error);
      }
    };

    blockSubscription = supabase
      .channel('user-blocks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_blocks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          setState(prev => ({ ...prev, isApproved: false }));
        }
      )
      .subscribe();

    checkBlocked();

    return () => {
      blockSubscription?.unsubscribe();
    };
  }, [user]);

  return {
    ...state,
    updateLastActive: state.sessionId ? 
      () => updateLastActive(state.sessionId) : 
      () => Promise.resolve()
  };
};