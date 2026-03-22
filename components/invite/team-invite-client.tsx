"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function TeamInviteClient({ inviteId }: { inviteId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleAccept = async () => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch(`/api/teams/invite/${inviteId}`);

      if (response.ok) {
        // If the API redirects, fetch will follow it. 
        // We manually refresh or push to ensure the UI updates.
        router.push(response.url);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to join team");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <p>{errorMsg}</p>
        </div>
        <Button onClick={handleAccept} variant="outline" className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleAccept} 
      disabled={status === "loading"} 
      className="w-full"
    >
      {status === "loading" ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Joining Team...
        </>
      ) : (
        "Accept Invitation"
      )}
    </Button>
  );
}