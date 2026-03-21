'use client'

import { useState, useEffect } from 'react'
import { syncEngine, type SyncStatus } from '@/lib/sync-engine'

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingChanges: 0
  })

  useEffect(() => {
    if (!syncEngine) return

    const unsubscribe = syncEngine.subscribe((newStatus) => {
      setStatus(newStatus)
    })

    return () => unsubscribe()
  }, [])

  return status
}
