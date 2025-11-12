import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type ControlRow = {
  id: string;
  target_user?: string | null;
  control_key?: string | null;
  denied: boolean;
  value?: Record<string, unknown> | null;
};

export function useAdminControl() {
  const { user, signOut, isAdmin } = useAuth();
  const [appLocked, setAppLocked] = useState(false);
  const [denied, setDenied] = useState(false);

  // Load initial state
  const loadState = useCallback(async () => {
    try {
      // load global
      // supabase types don't include admin_controls in the generated Database type so cast for these queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: globalRow } = await (supabase as any)
        .from("admin_controls")
        .select("*")
        .eq("control_key", "global")
        .maybeSingle();

      setAppLocked(!!globalRow?.denied);

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: userRow } = await (supabase as any)
          .from("admin_controls")
          .select("*")
          .eq("target_user", user.id)
          .maybeSingle();

        setDenied(!!userRow?.denied);
      } else {
        setDenied(false);
      }
    } catch (e) {
      console.error("Failed to load admin control state", e);
    }
  }, [user]);

  useEffect(() => {
    loadState();

    const channel = supabase
      .channel("admin-controls")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_controls" },
        (payload) => {
          const newRow = payload.new as ControlRow | null;
          const oldRow = payload.old as ControlRow | null;

          // if global changed
          if ((newRow?.control_key || oldRow?.control_key) === "global") {
            setAppLocked(!!newRow?.denied);
          }

          // if it's a per-user change and it affects current user
          if (user && (newRow?.target_user === user.id || oldRow?.target_user === user.id)) {
            setDenied(!!newRow?.denied);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadState]);

  useEffect(() => {
    // If we become denied while signed in, force sign out to immediately stop access
    if (denied) {
      // sign out so client can't continue using protected views
      signOut();
    }
  }, [denied, signOut]);

  // Admin helpers
  const setUserDenied = async (targetUserId: string, flag = true) => {
    if (!isAdmin) throw new Error("not-authorized");

    // upsert per-user control row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("admin_controls").upsert(
      { target_user: targetUserId, denied: flag },
      { onConflict: ["target_user"] }
    );

    if (error) throw error;
    return true;
  };

  const setGlobalLocked = async (flag = true) => {
    if (!isAdmin) throw new Error("not-authorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("admin_controls").upsert(
      { control_key: "global", denied: flag },
      { onConflict: ["control_key"] }
    );

    if (error) throw error;
    return true;
  };

  return {
    appLocked,
    denied,
    setUserDenied,
    setGlobalLocked,
    reload: loadState,
  };
}

export default useAdminControl;
