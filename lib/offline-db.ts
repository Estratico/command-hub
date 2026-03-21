import { 
  ProjectStatus, 
  SubscriptionFrequency, 
  TaskPriority, 
  TaskStatus, 
  Role 
} from '@/app/generated/prisma/enums'
import Dexie, { type EntityTable } from 'dexie'

// --- Interfaces mirroring Prisma Models ---

export interface LocalUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: Role | null
  bio: string | null
  whatsappNumber: string | null
  createdAt: string // Stored as ISO string for Dexie compatibility
  updatedAt: string
  synced: boolean
}

export interface LocalTeam {
  id: string
  name: string
  slug: string
  logo: string
  metadata: any // Prisma Json
  createdAt: string
  updatedAt: string
  synced: boolean
  pendingSync?: boolean
}

export interface LocalProject {
  id: string
  teamId: string
  name: string
  description: string
  status: ProjectStatus
  version: number
  createdBy: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  synced: boolean
  pendingSync?: boolean
}

export interface LocalTask {
  id: string
  projectId: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string
  createdBy: string
  position: number
  dueDate: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  synced: boolean
  pendingSync?: boolean
}

export interface LocalSubscription {
  id: string
  teamId: string
  serviceName: string // Mirrored from Prisma 'serviceName'
  provider: string
  startDate: string
  lastPaymentDate: string
  frequency: SubscriptionFrequency
  cost: number
  currency: string
  notes: string
  isActive: boolean
  version: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  synced: boolean
  pendingSync?: boolean
}

export interface SyncQueueItem {
  id?: number
  tableName: 'user' | 'team' | 'project' | 'task' | 'subscription'
  recordId: string
  action: 'create' | 'update' | 'delete'
  payload: Record<string, any>
  createdAt: string
  retries: number
}

// --- Database Class ---

class EstraticoOfflineDB extends Dexie {
  users!: EntityTable<LocalUser, 'id'>
  teams!: EntityTable<LocalTeam, 'id'>
  projects!: EntityTable<LocalProject, 'id'>
  tasks!: EntityTable<LocalTask, 'id'>
  subscriptions!: EntityTable<LocalSubscription, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('EstraticoOfflineDB')
    
    this.version(2).stores({
      // Primary Key followed by indexed fields
      users: 'id, &email, synced',
      teams: 'id, &slug, synced',
      projects: 'id, teamId, status, createdBy, synced',
      tasks: 'id, projectId, status, assignedTo, synced',
      subscriptions: 'id, teamId, synced',
      syncQueue: '++id, tableName, recordId, action,retries'
    })
  }
}

export const offlineDb = new EstraticoOfflineDB()

export function generateOfflineId(): string {
  return `offline_${crypto.randomUUID()}`
}