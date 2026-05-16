import { get, set } from 'idb-keyval';
import supabase from './supabase';
import { toast } from 'sonner';

export type SyncAction = 'INSERT_TX' | 'UPDATE_TX' | 'DELETE_TX' | 'INSERT_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL' | 'UPDATE_BUDGET' | 'UPDATE_SETTINGS' | 'FUND_GOAL' | 'INSERT_ACCOUNT' | 'UPDATE_ACCOUNT' | 'DELETE_ACCOUNT';

export interface SyncOperation {
  id: string; // Unique ID for the operation itself
  timestamp: number;
  action: SyncAction;
  payload: any;
}

const QUEUE_KEY = 'offline-sync-queue';

export async function addToQueue(action: SyncAction, payload: any) {
  try {
    const currentQueue: SyncOperation[] = (await get(QUEUE_KEY)) || [];
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action,
      payload
    };
    await set(QUEUE_KEY, [...currentQueue, operation]);
    
    // Optional: Only show this once per offline session
    if (!sessionStorage.getItem('offline_toast_shown')) {
      toast.info("You're offline. Changes saved locally and will sync when reconnected.");
      sessionStorage.setItem('offline_toast_shown', 'true');
    }
  } catch (error) {
    console.error('Failed to add to offline queue:', error);
  }
}

let isSyncing = false;

export async function syncQueue() {
  if (isSyncing || typeof navigator !== 'undefined' && !navigator.onLine) return;
  
  isSyncing = true;
  try {
    // 1. Verify Authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.warn("Auth session missing or expired. Pausing sync.");
      isSyncing = false;
      return;
    }

    const queue: SyncOperation[] = (await get(QUEUE_KEY)) || [];
    if (queue.length === 0) {
      isSyncing = false;
      return;
    }

    toast.loading(`Syncing ${queue.length} pending changes...`, { id: 'sync-toast' });

    const failedOps: SyncOperation[] = [];

    // Process in order
    for (const op of queue) {
      let error = null;
      try {
        switch (op.action) {
          case 'INSERT_TX':
            ({ error } = await supabase.from('transactions').insert(op.payload));
            break;
          case 'UPDATE_TX':
            ({ error } = await supabase.from('transactions').update(op.payload).eq('id', op.payload.id));
            break;
          case 'DELETE_TX':
            ({ error } = await supabase.from('transactions').delete().eq('id', op.payload));
            break;
          case 'INSERT_GOAL':
            ({ error } = await supabase.from('savings_goals').insert(op.payload));
            break;
          case 'UPDATE_GOAL':
            ({ error } = await supabase.from('savings_goals').update(op.payload).eq('id', op.payload.id));
            break;
          case 'DELETE_GOAL':
            ({ error } = await supabase.from('savings_goals').delete().eq('id', op.payload));
            break;
          case 'FUND_GOAL':
             const { id: goalId, amount } = op.payload;
             const { data: goalData } = await supabase.from("savings_goals").select("current_amount").eq("id", goalId).single();
             if (goalData) {
               const newAmount = Math.max(0, parseFloat(goalData.current_amount) + amount);
               ({ error } = await supabase.from("savings_goals").update({ current_amount: newAmount }).eq("id", goalId));
             }
             break;
          case 'UPDATE_BUDGET':
             ({ error } = await supabase.from('budgets')
                .update({ amount_limit: op.payload.limit })
                .eq('user_id', op.payload.user_id)
                .eq('category', op.payload.category));
             break;
          case 'UPDATE_SETTINGS':
              ({ error } = await supabase.from('user_settings').update(op.payload.dbUpdate).eq('user_id', op.payload.user_id));
              break;
          case 'INSERT_ACCOUNT':
               ({ error } = await supabase.from('accounts').insert(op.payload));
               break;
          case 'UPDATE_ACCOUNT':
               ({ error } = await supabase.from('accounts').update(op.payload.updates).eq('id', op.payload.id));
               break;
          case 'DELETE_ACCOUNT':
               ({ error } = await supabase.from('accounts').delete().eq('id', op.payload));
               break;
        }

        if (error) {
           console.error(`Sync failed for operation ${op.action}:`, error);
           failedOps.push(op); // Keep it to retry later
        }
      } catch (err) {
        console.error(`Exception during sync for ${op.action}:`, err);
        failedOps.push(op);
      }
    }

    // Save remaining (failed) back to queue
    await set(QUEUE_KEY, failedOps);

    if (failedOps.length === 0) {
      toast.success("All changes synced successfully", { id: 'sync-toast' });
    } else {
      toast.error(`Synced partially. ${failedOps.length} operations failed.`, { id: 'sync-toast' });
    }

  } catch (error) {
    console.error("Critical error during syncQueue:", error);
    toast.dismiss('sync-toast');
  } finally {
    isSyncing = false;
  }
}
