"use client"
import { useSyncStatus } from '@/hooks/use-sync-status'
import { syncEngine } from '@/lib/sync-engine'
import React, { createContext, ReactNode, useContext, useEffect } from 'react'

type Props = {
    children:ReactNode
}

type SyncProviderContextType={}

const SyncProviderContext = createContext<SyncProviderContextType|null>(null)

export const useSyncProvider = ()=>{
    const ctx = useContext(SyncProviderContext);
    if(!ctx){
        throw new Error("useSyncProvider must be used within the boundaries of SyncProvider.")
    }
    return ctx;
}

export default function SyncProvider({children}: Props) {
    const {pendingChanges} = useSyncStatus()
    async function syncItems(){
        if(pendingChanges>0){
            await syncEngine?.syncPendingChanges()
        }
    }

    useEffect(()=>{
        const interval = setInterval(syncItems, 1000*10);
        return ()=>clearInterval(interval)
    },[])
  return (
    <SyncProviderContext.Provider value={{}}>{children}</SyncProviderContext.Provider>
  )
}