"use client";

import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const OTHER = "other";

// Common CalDAV servers. Apiroc discovers the calendars from the base address.
const PRESETS = [
  { id: "fastmail", name: "Fastmail", url: "https://caldav.fastmail.com" },
  { id: "yahoo", name: "Yahoo", url: "https://caldav.calendar.yahoo.com" },
  { id: "aol", name: "AOL", url: "https://caldav.aol.com" },
  { id: "zoho-us", name: "Zoho (US)", url: "https://calendar.zoho.com" },
  { id: "zoho-eu", name: "Zoho (EU)", url: "https://calendar.zoho.eu" },
  { id: "gmx", name: "GMX", url: "https://caldav.gmx.net" },
  { id: "webde", name: "WEB.DE", url: "https://caldav.web.de" },
  { id: "mailboxorg", name: "mailbox.org", url: "https://dav.mailbox.org" },
  {
    id: "nextcloud",
    name: "Nextcloud",
    url: "https://cloud.example.com/remote.php/dav",
  },
] as const;

export function ConnectCalDavAccountDialog({
  open,
  onOpenChange,
  initialServerUrl,
  initialEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefill when reconnecting an existing account. */
  initialServerUrl?: string;
  initialEmail?: string;
}) {
  const [preset, setPreset] = useState<string>(OTHER);
  const [serverUrl, setServerUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const utils = api.useUtils();

  const { mutateAsync: connectCalDav, isPending } =
    api.calendarAccounts.connectCalDav.useMutation();

  useEffect(() => {
    if (open) {
      setPreset(OTHER);
      setServerUrl(initialServerUrl ?? "");
      setEmail(initialEmail ?? "");
      setPassword("");
    }
  }, [open, initialServerUrl, initialEmail]);

  const handlePresetChange = (id: string) => {
    setPreset(id);
    const match = PRESETS.find((p) => p.id === id);
    if (match) setServerUrl(match.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await connectCalDav({ serverUrl, email, password });
      toast.success("CalDAV account connected successfully");
      await utils.calendarAccounts.getAll.invalidate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.message ??
          "Failed to connect CalDAV account. Please check the server URL and your credentials.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogTitle>Connect CalDAV Calendar</DialogTitle>
        <DialogDescription>
          Connect a calendar from any CalDAV server, such as Fastmail, Nextcloud
          or Zoho. Most providers require an app-specific password.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caldav-preset" className="text-sm font-medium">
              Provider
            </label>
            <select
              id="caldav-preset"
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={OTHER}>Other CalDAV server</option>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caldav-server" className="text-sm font-medium">
              Server URL
            </label>
            <input
              id="caldav-server"
              required
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://caldav.example.com"
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caldav-email" className="text-sm font-medium">
              Email or username
            </label>
            <input
              id="caldav-email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caldav-password" className="text-sm font-medium">
              App-Specific Password
            </label>
            <input
              id="caldav-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Connecting..." : "Connect"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
