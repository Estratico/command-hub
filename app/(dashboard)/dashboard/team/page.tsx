import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { TeamsList } from '@/components/team/teams-list'
import { CreateTeamDialog } from '@/components/team/create-team-dialog'
import prisma from '@/lib/prisma'
import type{ Team } from '@/app/generated/prisma/client'

export interface TeamWithMembers extends Team {
  role: string
  member_count: number
}

async function getTeamsData(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: userId,
    },
    include: {
      team: {
        include: {
          _count: {
            select: { members: true }
          }
        }
      }
    },
    orderBy: {
      team: {
        createdAt: 'desc'
      }
    }
  })

  // Map the results to flatten the structure to match your TeamWithMembers interface
  return memberships.map((membership) => ({
    ...membership.team,
    role: membership.role,
    member_count: membership.team._count.members,
  }))
}

export default async function TeamPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const teams = await getTeamsData(session!.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Teams</h1>
          <p className="text-muted-foreground">Manage your teams and members</p>
        </div>
        <CreateTeamDialog />
      </div>

      <TeamsList teams={teams} currentUserId={session!.user.id} />
    </div>
  )
}
