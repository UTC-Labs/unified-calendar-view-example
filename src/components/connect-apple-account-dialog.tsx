"use client";

import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

export function ConnectAppleAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const utils = api.useUtils();

  const { mutateAsync: connectApple, isPending } =
    api.calendarAccounts.connectApple.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await connectApple({ email, password });
      toast.success("Apple account connected successfully");
      await utils.calendarAccounts.getAll.invalidate();
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(
        error?.message ??
          "Failed to connect Apple account. Please check your credentials.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogTitle>Connect Apple Calendar</DialogTitle>
        <DialogDescription>
          Enter your Apple ID email and an app-specific password. You can
          generate one at{" "}
          <a
            href="https://appleid.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            appleid.apple.com
          </a>
          .
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="apple-email" className="text-sm font-medium">
              Apple ID Email
            </label>
            <input
              id="apple-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@icloud.com"
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="apple-password" className="text-sm font-medium">
              App-Specific Password
            </label>
            <input
              id="apple-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
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
