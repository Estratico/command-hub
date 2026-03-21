'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LucideIcon, MoreHorizontal, Shield, ShieldCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Role } from '@/app/generated/prisma/enums'

interface TeamMember {
    id: string;
    userId: string;
    role: Role;
    createdAt: Date;
    user: {
        name: string;
        email: string;
    };
}

interface TeamMembersProps {
  members: TeamMember[]
  currentUserId: string
  userRole: string
  teamId: string
}

const roleIcons:Record<Role,LucideIcon> = {
  "OWNER": ShieldCheck,
  "ADMIN": Shield,
  "MEMBER": User
}

const roleColors:Record<Role,string> = {
  "OWNER": 'bg-primary text-primary-foreground',
  "ADMIN": 'bg-[var(--estratico-accent)] text-[var(--estratico-accent-foreground)]',
  "MEMBER": 'bg-muted text-muted-foreground'
}

export function TeamMembers({ members, currentUserId, userRole }: TeamMembersProps) {
  const canManage = userRole === 'owner' || userRole === 'admin'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role]
            const isCurrentUser = member.userId === currentUserId
            const canModify = canManage && !isCurrentUser && member.role !== "OWNER"

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-[var(--estratico-secondary)] text-[var(--estratico-secondary-foreground)]">
                      {member.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {member.user.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={cn("flex items-center gap-1", roleColors[member.role])}>
                    <RoleIcon className="size-3" />
                    {member.role}
                  </Badge>

                  {canModify && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === "MEMBER" && userRole === 'owner' && (
                          <DropdownMenuItem>Promote to Admin</DropdownMenuItem>
                        )}
                        {member.role === "ADMIN" && userRole === 'owner' && (
                          <DropdownMenuItem>Demote to Member</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
