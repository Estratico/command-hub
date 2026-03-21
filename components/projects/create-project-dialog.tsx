'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import type { ProjectStatus, Team } from '@/app/generated/prisma/client'

interface CreateProjectDialogProps {
  teams: (Team & { role: string })[]
}

export function CreateProjectDialog({ teams }: CreateProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    if (!teamId) {
      setError('Please select a team')
      return
    }

    setIsLoading(true)

    try {
      const projectId = generateOfflineId()
      const now = new Date().toISOString()

      // Save to local database immediately
      await offlineDb.projects.add({
        id: projectId,
        teamId,
        name: name.trim(),
        description: description.trim() || "",
        status: "IN_PROGRESS",
        createdBy: '', // Will be set by server
        createdAt: now,
        updatedAt: now,
        synced: false,
        pendingSync: true,
        version:1,
        isDeleted:false
      })

      // Queue for sync
      if (syncEngine) {
        await syncEngine.queueChange({
          tableName: 'project',
          recordId: projectId,
          action: 'create',
          payload: {
            teamId,
            name: name.trim(),
            description: description.trim() || null,
            status: "IN_PROGRESS"
          }
        })
      }

      setOpen(false)
      setName('')
      setDescription('')
      setTeamId('')
      router.refresh()
    } catch {
      setError('Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  if (teams.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 size-4" />
        New Project
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            Add a new project to organize your tasks
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="name">Project name</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Website Redesign"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="team">Team</FieldLabel>
              <Select value={teamId} onValueChange={setTeamId}>
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
              <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
