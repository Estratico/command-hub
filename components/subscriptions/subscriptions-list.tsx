'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { subscription, SubscriptionFrequency } from '@/app/generated/prisma/client'
import { addDays } from 'date-fns'

interface SubscriptionsListProps {
  subscriptions: (subscription & { team_name: string })[]
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

export function SubscriptionsList({ subscriptions }: SubscriptionsListProps) {
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
              <TableHead>Category</TableHead>
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
                    ? addDays(new Date(subscription.lastPaymentDate),30).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {subscription.version ? (
                    <Badge variant="outline">{subscription.version}</Badge>
                  ) : (
                    <span className="text-muted-foreground">{"-"}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(statusColors[subscription.isActive?"active":"paused"])}>
                    {subscription.isActive?"Active":"Paused"}
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
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>
                        {subscription.isActive? 'Pause' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
