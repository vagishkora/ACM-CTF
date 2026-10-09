import { supabase } from '../lib/supabase'

export type RealtimeEventType = 
  | 'TEAM_SOLVE'
  | 'PROFILE_UPDATED'
  | 'ACCOUNT_PROVISIONED'
  | 'ROLE_CHANGED'
  | 'ANNOUNCEMENT_NEW'
  | 'WAVE_UNLOCKED'
  | 'CHALLENGES_UPDATED'

export interface RealtimeMessage<T = any> {
  type: RealtimeEventType
  payload: T
  timestamp: string
  originId: string
}

type RealtimeListener = (message: RealtimeMessage) => void

class RealtimeSyncService {
  private listeners: Set<RealtimeListener> = new Set()
  private broadcastChannel: BroadcastChannel | null = null
  private supabaseChannel: any = null
  private instanceId: string = Math.random().toString(36).substring(2, 9)

  constructor() {
    // 1. Cross-tab local synchronization (works reliably across multiple windows/tabs on same machine)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('acm_ctf_realtime_channel')
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.originId !== this.instanceId) {
            this.notifyListeners(event.data)
          }
        }
      } catch (err) {
        console.warn('BroadcastChannel not supported or error:', err)
      }
    }

    // 2. Supabase Realtime Broadcast (works across different devices / networks across internet)
    try {
      this.supabaseChannel = supabase.channel('acm_ctf_realtime_bus')
      this.supabaseChannel
        .on('broadcast', { event: 'acm_event' }, (payload: any) => {
          const msg = payload.payload as RealtimeMessage
          if (msg && msg.originId !== this.instanceId) {
            this.notifyListeners(msg)
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('⚡ Connected to ACM CTF Supabase Realtime Channel')
          }
        })
    } catch (err) {
      console.warn('Supabase realtime channel initialization failed:', err)
    }
  }

  private notifyListeners(message: RealtimeMessage) {
    this.listeners.forEach(fn => {
      try {
        fn(message)
      } catch (err) {
        console.error('Error in realtime listener:', err)
      }
    })
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public async broadcast(type: RealtimeEventType, payload: any): Promise<void> {
    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      originId: this.instanceId
    }

    // Notify local listeners in this window
    this.notifyListeners(message)

    // Send to other tabs via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message)
      } catch (err) {
        console.warn('BroadcastChannel post error:', err)
      }
    }

    // Send to other devices via Supabase Realtime Broadcast
    if (this.supabaseChannel) {
      try {
        await this.supabaseChannel.send({
          type: 'broadcast',
          event: 'acm_event',
          payload: message
        })
      } catch (err) {
        console.warn('Supabase broadcast send error:', err)
      }
    }
  }
}

export const realtimeSync = new RealtimeSyncService()
