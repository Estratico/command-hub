'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { offlineDb, generateOfflineId } from '@/lib/offline-db'
import { syncEngine } from '@/lib/sync-engine'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateTeamDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Team name is required')
      return
    }

    if (!slug.trim()) {
      setError('Team slug is required')
      return
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens')
      return
    }

    setIsLoading(true)

    try {
      const teamId = generateOfflineId()

      // Save to local database immediately
      await offlineDb.teams.add({
        id: teamId,
        name: name.trim(),
        slug: slug.trim(),
        logo:"",
        metadata:"",
        createdAt:"",
        updatedAt:"",
        synced: false,
        pendingSync: true
      })

      // Queue for sync
      if (syncEngine) {
        await syncEngine.queueChange({
          tableName: 'team',
          recordId: teamId,
          action: 'create',
          payload: {
            name: name.trim(),
            slug: slug.trim()
          }
        })
      }

      setOpen(false)
      setName('')
      setSlug('')
      router.refresh()
    } catch {
      setError('Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          New Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new team</DialogTitle>
          <DialogDescription>
            Create a team to collaborate with others
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="name">Team name</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Marketing Team"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Team URL</FieldLabel>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g., marketing-team"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be used in URLs: estratico.com/team/{slug || 'your-team'}
              </p>
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Create team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
