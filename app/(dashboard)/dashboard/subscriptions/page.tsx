import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SubscriptionsList } from '@/components/subscriptions/subscriptions-list'
import { CreateSubscriptionDialog } from '@/components/subscriptions/create-subscription-dialog'
import { SubscriptionStats } from '@/components/subscriptions/subscription-stats'
import type { Subscription, Team } from '@/lib/db'
import prisma from '@/lib/prisma'

async function getSubscriptionsData(userId: string) {
  // 1. Get user's teams
  const teamMembersData = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: true
    },
  });

  if (teamMembersData.length === 0) {
    return { 
      subscriptions: [], 
      teams: [], 
      stats: { total: 0, monthly: 0, yearly: 0 } 
    };
  }

  const teamIds = teamMembersData.map((tm) => tm.teamId);

  // 2. Get subscriptions (Sorted by lastPaymentDate and createdAt)
  const subscriptionsData = await prisma.subscription.findMany({
    where: {
      teamId: { in: teamIds },
      isDeleted: false, // Respecting your soft-delete flag
    },
    include: {
      team: {
        select: { name: true },
      },
    },
    orderBy: [
      { lastPaymentDate: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // 3. Format & Calculate (Aligning with your schema fields)
  const subscriptions = subscriptionsData.map((s) => ({
    ...s,
    team_name: s.team.name,
    // Mapping schema 'isActive' to your original code's 'status' if needed
    status: s.isActive ? 'active' : 'inactive', 
  }));

  const teams = teamMembersData.map((tm) => ({
    ...tm.team,
    role: tm.role,
    team_id: tm.teamId,
  }));

  // 4. Calculate Stats using your enum 'frequency' and 'cost' (Float)
  const activeSubscriptions = subscriptions.filter((s) => s.isActive);
  
  const monthlyTotal = activeSubscriptions.reduce((sum, s) => {
    const cost = s.cost || 0;
    // Matching against your SubscriptionFrequency enum
    if (s.frequency === 'MONTHLY') return sum + cost;
    if (s.frequency === 'QUARTERLY') return sum + (cost / 3);
    if (s.frequency === 'YEARLY') return sum + (cost / 12);
    return sum;
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  return {
    subscriptions,
    teams,
    stats: {
      total: activeSubscriptions.length,
      monthly: monthlyTotal,
      yearly: yearlyTotal,
    },
  };
}

export default async function SubscriptionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const { subscriptions, teams, stats } = await getSubscriptionsData(session!.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">Track and manage your team subscriptions</p>
        </div>
        <CreateSubscriptionDialog teams={teams} />
      </div>

      <SubscriptionStats stats={stats} />

      <SubscriptionsList subscriptions={subscriptions} teams={teams} />
    </div>
  )
}
