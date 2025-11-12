import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/types/database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type UserSession = Database['public']['Tables']['user_sessions']['Row'] & {
  user_email?: string;
  users?: {
    email?: string;
  };
};

type AdminControl = Database['public']['Tables']['admin_controls']['Row'];
type AdminControlPayload = RealtimePostgresChangesPayload<AdminControl>;

const AdminMonitoring = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [globalLock, setGlobalLock] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) return;

    const loadSessions = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('user_sessions')
          .select(`
            *,
            users:user_id (
              email
            )
          `)
          .order('created_at', { ascending: false }) as { 
            data: (Database['public']['Tables']['user_sessions']['Row'] & {
              users: { email: string | null } | null
            })[] | null;
            error: any;
          };

        if (error) {
          console.error('Error loading sessions:', error);
          return;
        }

        if (sessions) {
          setSessions(sessions.map(s => ({
            ...s,
            user_email: s.users?.email || undefined
          })));
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    };

    // Load initial sessions
    loadSessions();

    // Subscribe to session changes
    const sessionsSubscription = supabase
      .channel('admin-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions'
        },
        () => loadSessions()
      )
      .subscribe();

    // Subscribe to global lock changes
    const controlsSubscription = supabase
      .channel('admin-controls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_controls'
        },
        (payload: AdminControlPayload) => {
          if (payload.new && 'global_lock' in payload.new) {
            setGlobalLock(!!payload.new.global_lock);
          }
        }
      )
      .subscribe();

    return () => {
      if (sessionsSubscription) supabase.removeChannel(sessionsSubscription);
      if (controlsSubscription) supabase.removeChannel(controlsSubscription);
    };
  }, [isAdmin]);

  const handleApproval = async (sessionId: string, status: UserSession['status']) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          status 
        } satisfies Database['public']['Tables']['user_sessions']['Update'])
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session:', error);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleGlobalLock = async (locked: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_controls')
        .upsert({ 
          global_lock: locked 
        } satisfies Database['public']['Tables']['admin_controls']['Insert']);

      if (error) {
        console.error('Error updating global lock:', error);
      }
    } catch (error) {
      console.error('Failed to update global lock:', error);
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting current user:', authError);
        return;
      }

      const { error } = await supabase
        .from('user_blocks')
        .insert({
          user_id: userId,
          reason,
          blocked_by: user.id
        } satisfies Database['public']['Tables']['user_blocks']['Insert']);

      if (error) {
        console.error('Error blocking user:', error);
      }
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Admin Control Panel</h2>
        <button
          onClick={() => handleGlobalLock(!globalLock)}
          className={"px-4 py-2 rounded " + 
            (globalLock ? "bg-red-500" : "bg-green-500") + 
            " text-white"}
        >
          {globalLock ? "Unlock All Access" : "Lock All Access"}
        </button>
      </div>

      <div className="grid gap-4">
        {sessions.map(session => (
          <div key={session.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{session.user_email}</p>
                <p className="text-sm text-gray-500">
                  Last active: {new Date(session.last_active).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">IP: {session.ip_address}</p>
                <p className="text-sm text-gray-500">Device: {session.device_info}</p>
              </div>
              <div className="flex gap-2">
                {session.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApproval(session.id, "approved")}
                      className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(session.id, "denied")}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Deny
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleBlockUser(session.user_id, "Blocked by admin")}
                  className="px-3 py-1 bg-gray-500 text-white rounded"
                >
                  Block User
                </button>
              </div>
            </div>
            <div 
              className={"mt-2 px-2 py-1 rounded inline-block text-sm " + 
                (session.status === "approved" ? "bg-green-100 text-green-800" :
                session.status === "denied" ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800")}
            >
              {session.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMonitoring;