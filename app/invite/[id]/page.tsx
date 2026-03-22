import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { TeamInviteClient } from "@/components/invite/team-invite-client";

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const p = await params
  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: p.id },
    include: { team: true },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg border shadow-sm text-center">
        <h1 className="text-2xl font-bold mb-2">You've been invited!</h1>
        <p className="text-muted-foreground mb-6">
          You have been invited to join <strong>{invitation.team.name}</strong> as a <strong>{invitation.role}</strong>.
        </p>
        
        {!session ? (
          <div className="space-y-4">
            <p className="text-sm">Please sign in to accept this invitation.</p>
            <Button asChild className="w-full">
              <a href={`/login?callbackUrl=/invite/${p.id}`}>Sign In</a>
            </Button>
          </div>
        ) : (
          <TeamInviteClient inviteId={p.id} />
        )}
      </div>
    </div>
  );
}