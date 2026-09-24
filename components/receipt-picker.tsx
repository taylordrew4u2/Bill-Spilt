"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, ExternalLink, FileText, ImageIcon, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/** Types the upload route accepts, mirrored here for a friendlier client-side error. */
const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif";
const ACCEPT_ANY = `${ACCEPT_IMAGE},application/pdf`;
const MAX_BYTES = 5 * 1024 * 1024;

/** Longest edge kept when downscaling. Plenty to read a receipt's totals. */
const MAX_EDGE = 1600;

/**
 * Shrink a camera photo before uploading it.
 *
 * Receipts are stored in the app's database now, not an object store, so every
 * byte counts against the same free tier the rest of the app shares. A modern
 * phone photo is 3–8 MB; the same receipt at 1600px JPEG is a couple hundred
 * KB and just as readable.
 *
 * Returns the original file whenever it can't do better — a PDF, a format the
 * browser can't decode (HEIC on most desktops), a canvas that comes back
 * empty, or a result that isn't actually smaller.
 */
async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

/** A receipt stored as a PDF rather than a photo. */
export function isPdfReceipt(url: string): boolean {
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

type Source = "camera" | "photo" | "file";

const SOURCES: { key: Source; label: string; icon: typeof Camera; accept: string }[] = [
  { key: "camera", label: "Camera", icon: Camera, accept: ACCEPT_IMAGE },
  { key: "photo", label: "Library", icon: ImageIcon, accept: ACCEPT_IMAGE },
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
    setUploading(true);
    try {
      // Shrink first: a 9 MB photo is usually well under the cap afterwards,
      // so this rejects far fewer real receipts than checking up front did.
      const toSend = await downscaleImage(file);
      if (toSend.size > MAX_BYTES) {
        toast({ title: "That file is too big (max 5 MB)", variant: "error" });
        return;
      }

      const fd = new FormData();
      fd.append("file", toSend);
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
      <div className="flex items-center gap-1 rounded-2xl border bg-card p-2">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {pdf ? (
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileText className="h-7 w-7" aria-hidden />
            </span>
          ) : (
            <Image
              src={value}
              alt="Receipt preview"
              width={64}
              height={64}
              className="h-16 w-16 flex-shrink-0 rounded-xl border object-cover"
              unoptimized
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold">
              {pdf ? "PDF attached" : "Receipt attached"}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              View
              <ExternalLink className="h-4 w-4" aria-hidden />
            </span>
          </span>
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:bg-negative-soft hover:text-destructive"
          aria-label="Remove receipt"
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {SOURCES.map((s) => (
          <label
            key={s.key}
            className={cn(
              "relative flex h-20 cursor-pointer select-none flex-col items-center justify-center gap-1.5 rounded-xl border border-input bg-card px-1 text-center text-sm font-semibold ring-offset-background transition-[background-color,transform] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:bg-accent active:scale-[0.98]",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
            ) : (
              <s.icon className="h-6 w-6 text-primary" aria-hidden />
            )}
            {s.label}
            <input
              type="file"
              accept={s.accept}
              {...(s.key === "camera" ? { capture: "environment" as const } : {})}
              className="sr-only"
              onChange={upload}
              disabled={uploading}
            />
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {uploading
          ? "Uploading your receipt…"
          : disabled
            ? "You're offline — attach the receipt once you're back online."
            : "JPG, PNG, HEIC or PDF, up to 5 MB. Photos are shrunk before upload."}
      </p>
    </div>
  );
}
