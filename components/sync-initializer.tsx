'use client'

import { useEffect } from 'react'
import { syncEngine } from '@/lib/sync-engine'

export function SyncInitializer() {
  useEffect(() => {
    if (syncEngine) {
      // Pull latest changes on mount
      syncEngine.pullChanges()
      
      // Also sync any pending changes
      syncEngine.syncPendingChanges()
    }
  }, [])

  return null
}
