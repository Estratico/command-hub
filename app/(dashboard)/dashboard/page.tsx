import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  KanbanSquare,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  CalendarClock,
} from "lucide-react";
import prisma from "@/lib/prisma";
import {
  TaskStatus,
  SubscriptionFrequency,
} from "@/app/generated/prisma/enums";
import {
  formatDistanceToNow,
  format,
  addWeeks,
  addMonths,
  addYears,
} from "date-fns";

async function getDashboardStats(userId: string) {
  // 1. Get user's teams
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = teamMembers.map((tm) => tm.teamId);

  // Early return if no teams
  if (teamIds.length === 0) {
    return {
      projects: 0,
      tasks: 0,
      completedTasks: 0,
      subscriptions: 0,
      monthlySpend: 0,
      teamMembers: 0,
    };
  }

  // 2. Run core counts in parallel
  const [projectsCount, subscriptionsAgg, totalTeamMembers] = await Promise.all(
    [
      prisma.project.count({ where: { teamId: { in: teamIds } } }),
      prisma.subscription.aggregate({
        where: { teamId: { in: teamIds }, isActive: true, isDeleted: false },
        _count: { _all: true },
        _sum: { cost: true },
      }),
      prisma.teamMember.count({ where: { teamId: { in: teamIds } } }),
    ],
  );

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
    completedTasks =
      taskStats.find((s) => s.status === TaskStatus.DONE)?._count._all || 0;
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

async function getRecentActivity(userId: string) {
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = teamMembers.map((tm) => tm.teamId);

  if (teamIds.length === 0) {
    return [];
  }

  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  });
  const projectIdArray = projects.map((p) => p.id);

  if (projectIdArray.length === 0) {
    return [];
  }

  // Get recent tasks (created or updated)
  const recentTasks = await prisma.task.findMany({
    where: { projectId: { in: projectIdArray } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      project: {
        select: { name: true },
      },
    },
  });

  return recentTasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectName: task.project.name,
    status: task.status,
    updatedAt: task.updatedAt,
  }));
}

function calculateNextBillingDate(
  lastPaymentDate: Date,
  frequency: SubscriptionFrequency,
): Date {
  switch (frequency) {
    case SubscriptionFrequency.WEEKLY:
      return addWeeks(lastPaymentDate, 1);
    case SubscriptionFrequency.FORTNIGHTLY:
      return addWeeks(lastPaymentDate, 2);
    case SubscriptionFrequency.MONTHLY:
      return addMonths(lastPaymentDate, 1);
    case SubscriptionFrequency.QUARTERLY:
      return addMonths(lastPaymentDate, 3);
    case SubscriptionFrequency.YEARLY:
      return addYears(lastPaymentDate, 1);
    default:
      return addMonths(lastPaymentDate, 1);
  }
}

async function getUpcomingRenewals(userId: string) {
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = teamMembers.map((tm) => tm.teamId);

  if (teamIds.length === 0) {
    return [];
  }

  // Get all active subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: {
      teamId: { in: teamIds },
      isActive: true,
      isDeleted: false,
    },
    include: {
      team: {
        select: { name: true },
      },
    },
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Calculate next billing date and filter for upcoming renewals
  const upcomingRenewals = subscriptions
    .map((sub) => {
      const nextBillingDate = calculateNextBillingDate(
        sub.lastPaymentDate,
        sub.frequency,
      );
      return {
        id: sub.id,
        serviceName: sub.serviceName,
        cost: Number(sub.cost),
        currency: sub.currency,
        nextBillingDate,
        teamName: sub.team.name,
        frequency: sub.frequency,
      };
    })
    .filter(
      (sub) =>
        sub.nextBillingDate >= now && sub.nextBillingDate <= thirtyDaysFromNow,
    )
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime())
    .slice(0, 5);

  return upcomingRenewals;
}

function getStatusColor(status: TaskStatus) {
  switch (status) {
    case TaskStatus.DONE:
      return "text-green-600";
    case TaskStatus.IN_PROGRESS:
      return "text-blue-600";
    case TaskStatus.TODO:
      return "text-yellow-600";
    default:
      return "text-muted-foreground";
  }
}

function getStatusLabel(status: TaskStatus) {
  switch (status) {
    case TaskStatus.DONE:
      return "Completed";
    case TaskStatus.IN_PROGRESS:
      return "In Progress";
    case TaskStatus.TODO:
      return "To Do";
    default:
      return status;
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [stats, recentActivity, upcomingRenewals] = await Promise.all([
    getDashboardStats(session!.user.id),
    getRecentActivity(session!.user.id),
    getUpcomingRenewals(session!.user.id),
  ]);

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
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity to show.
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Clock className="mt-0.5 size-4 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.projectName}</span>
                        <span>•</span>
                        <span className={getStatusColor(activity.status)}>
                          {getStatusLabel(activity.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Subscriptions renewing soon</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming renewals.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingRenewals.map((renewal) => (
                  <div key={renewal.id} className="flex items-start gap-3">
                    <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          {renewal.serviceName}
                        </p>
                        <span className="text-sm font-semibold">
                          {renewal.currency === "USD" ? "$" : renewal.currency}
                          {renewal.cost.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {renewal.teamName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Renews {format(renewal.nextBillingDate, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
