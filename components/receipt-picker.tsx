"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, ImageIcon, Loader2, Paperclip, FileText, X } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/** Types the upload route accepts, mirrored here for a friendlier client-side error. */
const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif";
const ACCEPT_ANY = `${ACCEPT_IMAGE},application/pdf`;
const MAX_BYTES = 10 * 1024 * 1024;

/** A receipt stored as a PDF rather than a photo. */
export function isPdfReceipt(url: string): boolean {
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

type Source = "camera" | "photo" | "file";

const SOURCES: { key: Source; label: string; icon: typeof Camera; accept: string }[] = [
  { key: "camera", label: "Take photo", icon: Camera, accept: ACCEPT_IMAGE },
  { key: "photo", label: "Photo", icon: ImageIcon, accept: ACCEPT_IMAGE },
  { key: "file", label: "File", icon: Paperclip, accept: ACCEPT_ANY },
];

/**
 * Attach a receipt from any source: the camera, the photo library, or a file
 * already on the device (including a PDF statement). Only the camera tile sets
 * `capture`, so the other two open the picker instead of the camera app.
 */
export function ReceiptPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Set when offline: uploading needs a connection. */
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    e.target.value = "";
    if (!file) return;

    if (disabled) {
      toast({
        title: "Receipts need a connection",
        description: "Add the expense now; attach the receipt once you're online.",
        variant: "error",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "That file is too big (max 10 MB)", variant: "error" });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Upload failed", variant: "error" });
        return;
      }
      onChange(data.url);
      toast({ title: "Receipt attached", variant: "success" });
    } catch {
      toast({ title: "Upload failed", variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    const pdf = isPdfReceipt(value);
    return (
      <div className="flex items-center gap-3 rounded-xl border p-2.5">
        {pdf ? (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
        ) : (
          <Image
            src={value}
            alt="Receipt preview"
            width={48}
            height={48}
            className="h-12 w-12 flex-shrink-0 rounded-lg border object-cover"
            unoptimized
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {pdf ? "PDF attached" : "Receipt attached"}
          </p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline"
          >
            View
          </a>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
          aria-label="Remove receipt"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2">
        {SOURCES.map((s) => (
          <label
            key={s.key}
            className={cn(
              "flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs font-medium text-muted-foreground transition hover:bg-accent",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <s.icon className="h-4 w-4" aria-hidden />
            )}
            {s.label}
            <input
              type="file"
              accept={s.accept}
              {...(s.key === "camera" ? { capture: "environment" as const } : {})}
              className="hidden"
              onChange={upload}
              disabled={uploading}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Photo or file (JPG, PNG, HEIC, or PDF) — up to 10 MB.
      </p>
    </div>
  );
}
