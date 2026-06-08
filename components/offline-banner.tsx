"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, RefreshCw } from "lucide-react";
import { useOnline } from "@/lib/use-fetch";
import { pendingCount } from "@/lib/offline-db";

/**
 * Shows a banner when the device is offline, including how many expenses are
 * queued locally for sync. Re-checks the pending count when connectivity
 * changes.
 */
export function OfflineBanner() {
  const online = useOnline();
  const [pending, setPending] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const check = () => pendingCount().then((n) => active && setPending(n));
    check();
    const id = setInterval(check, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [online]);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden bg-amber-500 text-amber-950"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
            <CloudOff className="h-4 w-4" />
            <span>
              You&apos;re offline.
              {pending > 0
                ? ` ${pending} expense${pending === 1 ? "" : "s"} will sync when you reconnect.`
                : " Changes are saved on this device."}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A small "syncing" pill, shown when coming back online with a queue. */
export function SyncPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <RefreshCw className="h-3 w-3 animate-spin" />
      Syncing {count}…
    </span>
  );
}
