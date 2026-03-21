export type User = {
  id: string
  name: string
  email: string
  email_verified: boolean
  image: string | null
  created_at: Date
  updated_at: Date
}

export type Session = {
  id: string
  user_id: string
  token: string
  expires_at: Date
  ip_address: string | null
  user_agent: string | null
  created_at: Date
  updated_at: Date
}

export type Team = {
  id: string
  name: string
  slug: string
  created_by: string
  created_at: Date
  updated_at: Date
}

export type TeamMember = {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: Date
}

export type Project = {
  id: string
  team_id: string
  name: string
  description: string | null
  status: 'active' | 'archived' | 'completed'
  created_by: string
  created_at: Date
  updated_at: Date
}

export type Task = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  due_date: Date | null
  position: number
  created_by: string
  created_at: Date
  updated_at: Date
}

export type Subscription = {
  id: string
  team_id: string
  name: string
  provider: string
  cost: number
  currency: string
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
  next_billing_date: Date | null
  status: 'active' | 'cancelled' | 'paused'
  category: string | null
  notes: string | null
  created_by: string
  created_at: Date
  updated_at: Date
}

export type SyncLog = {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  action: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  synced_at: Date | null
  created_at: Date
}
