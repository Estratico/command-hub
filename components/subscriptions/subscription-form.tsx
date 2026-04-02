'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { offlineDb, generateOfflineId } from '@/lib/offline-db'
import { syncEngine } from '@/lib/sync-engine'
import type { SubscriptionFrequency, Team, subscription } from '@/app/generated/prisma/client'

interface SubscriptionFormData {
  serviceName: string
  provider: string
  cost: string
  frequency: SubscriptionFrequency
  teamId: string
  version: string
  lastPaymentDate: string
  startDate: string
  notes: string
}

interface SubscriptionFormProps {
  teams: (Team & { role: string })[]
  initialData?: subscription & { team_name: string }
  onSuccess: () => void
  onCancel: () => void
  onSubmitting?: (submitting: boolean) => void
}

const CATEGORIES = [
  'Infrastructure',
  'Development Tools',
  'Design',
  'Marketing',
  'Communication',
  'Analytics',
  'Security',
  'Other'
] as const

const SUBSCRIPTION_FREQUENCIES: Record<SubscriptionFrequency, SubscriptionFrequency> = {
  WEEKLY: "WEEKLY",
  FORTNIGHTLY: "FORTNIGHTLY",
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
} as const

const DEFAULT_FORM_DATA: SubscriptionFormData = {
  serviceName: '',
  provider: '',
  cost: '',
  frequency: "MONTHLY",
  teamId: '',
  version: "1",
  lastPaymentDate: '',
  startDate: '',
  notes: ''
}

function parseFormData(formData: SubscriptionFormData) {
  return {
    ...formData,
    cost: Number(formData.cost),
    version: parseInt(formData.version) || 1,
  }
}

function formatDbDate(date: Date | string): string {
  if (typeof date === 'string') return date.split('T')[0]
  return date.toISOString().split('T')[0]
}

export function SubscriptionForm({ teams, initialData, onSuccess, onCancel, onSubmitting }: SubscriptionFormProps) {
  const [formData, setFormData] = useState<SubscriptionFormData>(DEFAULT_FORM_DATA)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isEditMode = !!initialData

  useEffect(() => {
    if (initialData) {
      setFormData({
        serviceName: initialData.serviceName,
        provider: initialData.provider,
        cost: String(initialData.cost),
        frequency: initialData.frequency,
        teamId: initialData.teamId,
        version: String(initialData.version),
        lastPaymentDate: formatDbDate(initialData.lastPaymentDate),
        startDate: formatDbDate(initialData.startDate),
        notes: initialData.notes ?? ''
      })
    }
  }, [initialData])

  function updateField<K extends keyof SubscriptionFormData>(field: K, value: SubscriptionFormData[K]) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setFormData(DEFAULT_FORM_DATA)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.serviceName.trim()) {
      setError('Subscription name is required')
      return
    }
    if (!formData.startDate.trim()) {
      setError('Start date is required')
      return
    }
    if (!formData.provider.trim()) {
      setError('Provider is required')
      return
    }
    if (!formData.cost || isNaN(Number(formData.cost)) || Number(formData.cost) < 0) {
      setError('Please enter a valid cost')
      return
    }
    if (!formData.teamId) {
      setError('Please select a team')
      return
    }

    setIsLoading(true)
    onSubmitting?.(true)

    try {
      const parsed = parseFormData(formData)
      const now = new Date().toISOString()

      if (isEditMode && initialData) {
        // Update existing subscription
        await offlineDb.subscriptions.update(initialData.id, {
          ...parsed,
          updatedAt: now,
          pendingSync: true
        })

        if (syncEngine) {
          await syncEngine.queueChange({
            tableName: 'subscription',
            recordId: initialData.id,
            action: 'update',
            payload: {
              ...parsed,
              lastPaymentDate: parsed.lastPaymentDate || parsed.startDate
            }
          })
        }
      } else {
        // Create new subscription
        const subscriptionId = generateOfflineId()

        await offlineDb.subscriptions.add({
          id: subscriptionId,
          teamId: parsed.teamId,
          startDate: parsed.startDate,
          notes: parsed.notes,
          serviceName: parsed.serviceName.trim(),
          provider: parsed.provider.trim(),
          cost: parsed.cost,
          currency: 'USD',
          frequency: parsed.frequency,
          lastPaymentDate: parsed.lastPaymentDate || parsed.startDate,
          isActive: true,
          version: parsed.version,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
          synced: false,
          pendingSync: true
        })

        if (syncEngine) {
          await syncEngine.queueChange({
            tableName: 'subscription',
            recordId: subscriptionId,
            action: 'create',
            payload: {
              teamId: parsed.teamId,
              serviceName: parsed.serviceName.trim(),
              provider: parsed.provider.trim(),
              cost: parsed.cost,
              currency: 'USD',
              frequency: parsed.frequency,
              lastPaymentDate: parsed.lastPaymentDate || parsed.startDate,
              isActive: true,
              version: parsed.version,
              notes: parsed.notes || null
            }
          })
        }
      }

      resetForm()
      onSuccess()
    } catch {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} subscription`)
    } finally {
      setIsLoading(false)
      onSubmitting?.(false)
    }
  }

  if (teams.length === 0) {
    return (
      <Button disabled>
        {isEditMode ? 'Edit Subscription' : 'Add Subscription'}
      </Button>
    )
  }

  return (
    <form id="subscription-form" onSubmit={handleSubmit}>
      <FieldGroup className="py-4 max-h-[60vh] overflow-y-auto">
        <Field>
          <FieldLabel htmlFor="serviceName">Service name</FieldLabel>
          <Input
            id="serviceName"
            value={formData.serviceName}
            onChange={(e) => updateField('serviceName', e.target.value)}
            placeholder="e.g., GitHub Enterprise"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="provider">Provider</FieldLabel>
          <Input
            id="provider"
            value={formData.provider}
            onChange={(e) => updateField('provider', e.target.value)}
            placeholder="e.g., GitHub"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="lastPaymentDate">Last Payment Date</FieldLabel>
          <Input
            id="lastPaymentDate"
            type="date"
            value={formData.lastPaymentDate}
            onChange={(e) => updateField('lastPaymentDate', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="cost">Cost</FieldLabel>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => updateField('cost', e.target.value)}
              placeholder="0.00"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="frequency">Frequency</FieldLabel>
            <Select
              value={formData.frequency}
              onValueChange={(v: SubscriptionFrequency) => updateField('frequency', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SUBSCRIPTION_FREQUENCIES).map((freq) => (
                  <SelectItem key={freq} value={freq} className="capitalize">
                    {freq.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="team">Team</FieldLabel>
          <Select value={formData.teamId} onValueChange={(v) => updateField('teamId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Add any additional notes"
            rows={2}
          />
        </Field>

        {error && <FieldError>{error}</FieldError>}
      </FieldGroup>
    </form>
  )
}
