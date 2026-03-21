import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ProjectsList } from '@/components/projects/projects-list'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import prisma from '@/lib/prisma'

async function getProjectsData(userId: string) {
  // 1. Get user's teams with team details (The JOIN replacement)
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: true
    },
  });

  if (teamMembers.length === 0) {
    return { projects: [], teams: [] };
  }

  const teamIds = teamMembers.map((tm) => tm.teamId);

  // 2. Get projects with their team name
  const projects = await prisma.project.findMany({
    where: {
      teamId: { in: teamIds },
    },
    include: {
      team: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3. Format the data to match your expected structure
  return {
    projects: projects.map((p) => ({
      ...p,
      team_name: p.team.name, // Flattening the join result
    })),
    teams: teamMembers.map((tm) => ({
      ...tm.team,
      role: tm.role,
      team_id: tm.teamId, // Adding this if your frontend expects it
    })),
  };
}

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const { projects, teams } = await getProjectsData(session!.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your team projects and tasks</p>
        </div>
        <CreateProjectDialog teams={teams} />
      </div>

      <ProjectsList projects={projects} />
    </div>
  )
}
