import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TeamMembers } from "@/components/team/team-members";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Team } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { InvitationStatus, Role } from "@/app/generated/prisma/enums";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

async function getTeamData(teamId: string, userId: string) {
  // Check if user is a member of this team
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  const userRole = membership.role as Role;

  // Get team details
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
  });

  if (!team) {
    return null;
  }

  // Get all team members
  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
    },
    select: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      role: true,
      createdAt: true,
      userId: true,
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  // Define your custom weight mapping
  const roleWeight: Record<string, number> = {
    owner: 1,
    admin: 2,
    member: 3, // fallback for 'ELSE 3'
  };

  const sortedMembers = members.sort((a, b) => {
    const weightA = roleWeight[a.role.toLowerCase()] || 3;
    const weightB = roleWeight[b.role.toLowerCase()] || 3;

    // 1. Sort by Role Weight
    if (weightA !== weightB) {
      return weightA - weightB;
    }

    // 2. Secondary Sort: Joined At (if roles are equal)
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  // Get pending invitations
  const invitations = await prisma.teamInvitation.findMany({
    where:{
      teamId,
      status:InvitationStatus.PENDING
    },
    orderBy:{
      createdAt:"desc"
    }
  })

  return {
    team,
    members: members,
    invitations,
    userRole,
    canManage: userRole === "OWNER" || userRole === "ADMIN",
  };
}

export default async function TeamDetailPage({ params }: TeamPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const data = await getTeamData(id, session!.user.id);

  if (!data) {
    notFound();
  }

  const { team, members, invitations, userRole, canManage } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {team.name}
          </h1>
          <p className="text-muted-foreground">@{team.slug}</p>
        </div>
        {canManage && <InviteMemberDialog teamId={team.id} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TeamMembers
            members={members}
            currentUserId={session!.user.id}
            userRole={userRole}
            teamId={team.id}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Role</CardTitle>
              <CardDescription>Your permissions in this team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="capitalize font-medium">{userRole}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {userRole === "OWNER" &&
                  "Full access to manage team settings and members"}
                {userRole === "ADMIN" && "Can manage team members and projects"}
                {userRole === "MEMBER" &&
                  "Can view and contribute to team projects"}
              </p>
            </CardContent>
          </Card>

          {canManage && invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Invitations</CardTitle>
                <CardDescription>{invitations.length} pending</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground">
                  {invitations.map((inv: { id: string; email: string }) => (
                    <li key={inv.id} className="py-1">
                      {inv.email}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
