'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, Edit, PauseCircle, PlayCircle, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { subscription, SubscriptionFrequency, Team } from '@/app/generated/prisma/client'
import { addDays } from 'date-fns'
import { offlineDb } from '@/lib/offline-db'
import { syncEngine } from '@/lib/sync-engine'
import { SubscriptionForm } from './subscription-form'

interface SubscriptionsListProps {
  subscriptions: (subscription & { team_name: string })[]
  teams: (Team & { role: string })[]
}

const statusColors = {
  active: 'bg-[var(--estratico-success)]/10 text-[var(--estratico-success)] border-[var(--estratico-success)]/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  paused: 'bg-[var(--estratico-warning)]/10 text-[var(--estratico-warning)] border-[var(--estratico-warning)]/20'
}

const cycleLabels:Record<SubscriptionFrequency,string> = {
  "MONTHLY": '/mo',
  "QUARTERLY": '/qtr',
  "YEARLY": '/yr',
  "FORTNIGHTLY": '/2weeks',
  "WEEKLY":"/week"
}

export function SubscriptionsList({ subscriptions, teams }: SubscriptionsListProps) {
  const router = useRouter()
  const [editingSubscription, setEditingSubscription] = useState<(subscription & { team_name: string }) | null>(null)
  const [deletingSubscription, setDeletingSubscription] = useState<(subscription & { team_name: string }) | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function toggleSubscriptionStatus(subscription: subscription) {
    const now = new Date().toISOString()
    const newStatus = !subscription.isActive

    try {
      await offlineDb.subscriptions.update(subscription.id, {
        isActive: newStatus,
        updatedAt: now,
        pendingSync: true
      })

      if (syncEngine) {
        await syncEngine.queueChange({
          tableName: 'subscription',
          recordId: subscription.id,
          action: 'update',
          payload: {
            ...subscription,
            isActive: newStatus,
            updatedAt: now
          }
        })
      }

      router.refresh()
    } catch {
      console.error('Failed to toggle subscription status')
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingSubscription) return

    const now = new Date().toISOString()

    try {
      await offlineDb.subscriptions.update(deletingSubscription.id, {
        isDeleted: true,
        updatedAt: now,
        pendingSync: true
      })

      if (syncEngine) {
        await syncEngine.queueChange({
          tableName: 'subscription',
          recordId: deletingSubscription.id,
          action: 'update',
          payload: {
            ...deletingSubscription,
            isDeleted: true,
            updatedAt: now
          }
        })
      }

      setDeletingSubscription(null)
      router.refresh()
    } catch {
      console.error('Failed to cancel subscription')
    }
  }

  if (subscriptions.length === 0) {
    return (
       <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CreditCard />
          </EmptyMedia>
          <EmptyTitle>No subscriptions yet</EmptyTitle>
        </EmptyHeader>
        <EmptyDescription>
          Add your first subscription to start tracking costs
        </EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscription.serviceName}</p>
                      <p className="text-sm text-muted-foreground">{subscription.provider}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {subscription.team_name}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${Number(subscription.cost).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {cycleLabels[subscription.frequency]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {subscription.lastPaymentDate
                      ? addDays(new Date(subscription.lastPaymentDate), 30).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {subscription.version ? (
                      <Badge variant="outline">{subscription.version}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(statusColors[subscription.isActive ? "active" : "paused"])}>
                      {subscription.isActive ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSubscription(subscription)}>
                          <Edit className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleSubscriptionStatus(subscription)}>
                          {subscription.isActive ? (
                            <>
                              <PauseCircle className="mr-2 size-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <PlayCircle className="mr-2 size-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingSubscription(subscription)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {editingSubscription?.serviceName}
            </DialogDescription>
          </DialogHeader>
          {editingSubscription && (
            <SubscriptionForm
              teams={teams}
              initialData={editingSubscription}
              onSuccess={() => {
                setEditingSubscription(null)
                router.refresh()
              }}
              onCancel={() => setEditingSubscription(null)}
              onSubmitting={setIsSubmitting}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingSubscription(null)}>
              Cancel
            </Button>
            <Button type="submit" form="subscription-form" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSubscription} onOpenChange={() => setDeletingSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel &quot;{deletingSubscription?.serviceName}&quot;? This will mark the subscription as deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingSubscription(null)}>
              No, keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Yes, cancel subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
