"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// One link, three ways to pass it on. The share sheet offers AirDrop on an
// iPhone, which is as close as a website can get to it. The QR is the backup.
export function ShareLink({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) return await navigator.share({ url, title });
    } catch {
      return; // they closed the sheet
    }
    await copy();
  }

  async function copy() {
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-control bg-white p-3">
        <QRCodeSVG value={url} size={168} marginSize={0} title="QR code for the link" />
      </div>
      <p className="max-w-full truncate text-sm text-ink-muted">{url}</p>
      <div className="grid w-full grid-cols-2 gap-2">
        <Button onClick={share}>Share</Button>
        <Button variant="secondary" onClick={copy}>{copied ? "Copied" : "Copy link"}</Button>
      </div>
    </div>
  );
}
