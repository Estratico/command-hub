import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { KanbanBoard } from '@/components/projects/kanban-board'
import { CreateTaskDialog } from '@/components/projects/create-task-dialog'
import type { Task, Project } from '@/lib/db'
import prisma from '@/lib/prisma'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

async function getProjectData(projectId: string, userId: string) {
  // 1. Get project + team info + verify user is a member
  const projectData = await prisma.project.findFirst({
    where: {
      id: projectId,
      team: {
        members: {
          some: { userId: userId } // Security: only return if user is in the team
        }
      }
    },
    include: {
      team: {
        select: { name: true }
      }
    }
  });

  if (!projectData) return null;

  // Flatten to match your original 'project' structure
  const project = {
    ...projectData,
    team_name: projectData.team.name
  };

  // 2. Get tasks with assigned user info
  const taskData = await prisma.task.findMany({
    where: { projectId: projectId },
    include: {
      assignee: { // Assumes relationship name in schema is assignedToUser
        select: { name: true }
      }
    },
    orderBy: [
      { position: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  // Flatten to match your original 'tasks' structure
  const tasks = taskData.map(t => ({
    ...t,
    assigned_to_name: t.assignee?.name ?? null
  }));

  // 3. Get team members for assignment
  const memberData = await prisma.teamMember.findMany({
    where: { teamId: projectData.teamId },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  // Flatten to match your original 'teamMembers' structure
  const teamMembers = memberData.map(tm => ({
    id: tm.user.id,
    name: tm.user.name,
    email: tm.user.email,
    role: tm.role
  }));

  return {
    project,
    tasks,
    teamMembers
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const data = await getProjectData(id, session!.user.id)

  if (!data) {
    notFound()
  }

  const { project, tasks, teamMembers } = data

  return (
    <div className="flex flex-col gap-6 h-full min-w-0">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground">{project.team_name}</p>
        </div>
        <CreateTaskDialog projectId={project.id} teamMembers={teamMembers} />
      </div>

      <div className="flex-1 overflow-hidden min-w-0">
        <KanbanBoard
          projectId={project.id}
          initialTasks={tasks}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  )
}
