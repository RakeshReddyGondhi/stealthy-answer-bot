import { test, expect, beforeAll, afterAll } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useSession } from '../src/hooks/useSession';
import { supabase } from '../src/lib/supabase';

const mockUser = {
  id: '123',
  email: 'test@example.com'
};

// Mock useAuth hook
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}));

beforeAll(() => {
  // Reset any existing subscriptions
  supabase.getChannels().forEach(channel => {
    supabase.removeChannel(channel);
  });
});

afterAll(() => {
  vi.clearAllMocks();
});

test('useSession initializes with correct default state', () => {
  const { result } = renderHook(() => useSession());
  
  expect(result.current).toMatchObject({
    sessionId: null,
    isApproved: false,
    isLoading: true,
    error: null
  });
});

test('useSession creates a new session and subscribes to updates', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useSession());
  
  // Wait for session creation
  await waitForNextUpdate();
  
  expect(result.current.sessionId).toBeTruthy();
  expect(result.current.isLoading).toBe(false);
  
  // Simulate session approval
  await act(async () => {
    const payload = {
      new: { status: 'approved' },
      old: { status: 'pending' },
      eventType: 'UPDATE'
    };
    
    // Find and trigger the subscription
    const channel = supabase.getChannels().find(c => 
      c.opts?.name?.startsWith('session-')
    );
    
    if (channel) {
      channel.send({
        type: 'postgres_changes',
        event: 'UPDATE',
        schema: 'public',
        table: 'user_sessions',
        data: payload
      });
    }
  });
  
  expect(result.current.isApproved).toBe(true);
});

test('useSession handles user blocks', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useSession());
  
  // Wait for initial setup
  await waitForNextUpdate();
  
  // Simulate user block
  await act(async () => {
    const payload = {
      new: { user_id: mockUser.id },
      old: null,
      eventType: 'INSERT'
    };
    
    const channel = supabase.getChannels().find(c => 
      c.opts?.name === 'user-blocks'
    );
    
    if (channel) {
      channel.send({
        type: 'postgres_changes',
        event: 'INSERT',
        schema: 'public',
        table: 'user_blocks',
        data: payload
      });
    }
  });
  
  expect(result.current.isApproved).toBe(false);
});

test('useSession cleans up resources on unmount', async () => {
  const { result, waitForNextUpdate, unmount } = renderHook(() => useSession());
  
  // Wait for setup
  await waitForNextUpdate();
  
  const initialChannelCount = supabase.getChannels().length;
  
  // Unmount the hook
  unmount();
  
  expect(supabase.getChannels().length).toBe(initialChannelCount - 2);
});