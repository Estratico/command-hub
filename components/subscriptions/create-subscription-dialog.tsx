'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Team } from '@/app/generated/prisma/client'
import { SubscriptionForm } from './subscription-form'

interface CreateSubscriptionDialogProps {
  teams: (Team & { role: string })[]
}

export function CreateSubscriptionDialog({ teams }: CreateSubscriptionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  if (teams.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 size-4" />
        Add Subscription
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add subscription</DialogTitle>
          <DialogDescription>
            Track a new subscription for your team
          </DialogDescription>
        </DialogHeader>
        <SubscriptionForm
          teams={teams}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
          onSubmitting={setIsSubmitting}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="subscription-form" disabled={isSubmitting}>
            Add subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
