import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KanbanSquare, CreditCard, Users, CheckCircle2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { TaskStatus } from "@/app/generated/prisma/enums";

async function getDashboardStats(userId: string) {
  // 1. Get user's teams
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = teamMembers.map((tm) => tm.teamId);

  // Early return if no teams
  if (teamIds.length === 0) {
    return { projects: 0, tasks: 0, completedTasks: 0, subscriptions: 0, monthlySpend: 0, teamMembers: 0 };
  }

  // 2. Run core counts in parallel
  const [projectsCount, subscriptionsAgg, totalTeamMembers] = await Promise.all([
    prisma.project.count({ where: { teamId: { in: teamIds } } }),
    prisma.subscription.aggregate({
      where: { teamId: { in: teamIds }, isActive: true },
      _count: { _all: true },
      _sum: { cost: true },
    }),
    prisma.teamMember.count({ where: { teamId: { in: teamIds } } }),
  ]);

  // 3. Get Project IDs for Task filtering
  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  });
  const projectIdArray = projects.map((p) => p.id);

  // 4. Calculate Task stats
  let tasksCount = 0;
  let completedTasks = 0;

  if (projectIdArray.length > 0) {
    const taskStats = await prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIdArray } },
      _count: { _all: true },
    });

    tasksCount = taskStats.reduce((acc, curr) => acc + curr._count._all, 0);
    completedTasks = taskStats.find((s) => s.status === TaskStatus.DONE)?._count._all || 0;
  }

  // 5. Final Return (Cleaned up variable names)
  return {
    projects: projectsCount,
    tasks: tasksCount,
    completedTasks: completedTasks,
    subscriptions: subscriptionsAgg._count._all || 0,
    monthlySpend: Number(subscriptionsAgg._sum.cost || 0),
    teamMembers: totalTeamMembers,
  };
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const stats = await getDashboardStats(session!.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user.name || "User"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <KanbanSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
            <p className="text-xs text-muted-foreground">Across all teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedTasks}/{stats.tasks}
            </div>
            <p className="text-xs text-muted-foreground">Completed tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.monthlySpend.toFixed(2)}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active collaborators
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest updates across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to show.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Subscriptions renewing soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No upcoming renewals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
