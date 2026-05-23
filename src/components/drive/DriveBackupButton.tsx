"use client";

import { useState } from "react";
import { HardDrive, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "success" | "error" | "no-account";

export default function DriveBackupButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleBackup() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/drive/backup", { method: "POST" });
      const json = await res.json();
      if (res.status === 403) {
        setState("no-account");
        setMessage(json.error);
      } else if (res.ok) {
        setState("success");
        setMessage(json.message);
      } else {
        setState("error");
        setMessage(json.error ?? "Backup failed. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleBackup}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <HardDrive className="h-4 w-4" />
        )}
        {state === "loading" ? "Backing up…" : "Backup to Drive"}
      </Button>

      {state === "success" && (
        <p className="flex items-start gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 max-w-sm">
          <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {message}
        </p>
      )}

      {(state === "error" || state === "no-account") && (
        <p className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-sm">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}
