"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CampaignAssetUploadForm({ campaignId }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      setMessage("Vælg en fil før upload.");
      setMessageType("error");
      return;
    }

    const response = await fetch("/api/campaign-assets", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(payload?.error || "Upload fejlede.");
      setMessageType("error");
      return;
    }

    setMessage("Asset uploadet.");
    setMessageType("success");
    form.reset();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      {message ? (
        <div
          className={
            messageType === "success"
              ? "campaign-inline-message campaign-inline-message-success"
              : "campaign-inline-message campaign-inline-message-error"
          }
        >
          {message}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="campaign-form">
        <input type="hidden" name="campaignId" value={campaignId} />
        <label>
          Type
          <select name="kind" defaultValue="image">
            <option value="image">Billede</option>
            <option value="video">Video</option>
          </select>
        </label>
        <label>
          Titel
          <input name="title" placeholder="Look 01 hero" />
        </label>
        <label>
          Noter
          <textarea name="notes" rows="3" placeholder="Hvad skal AI eller teamet være opmærksom på?" />
        </label>
        <label>
          Fil
          <input name="file" type="file" accept="image/*,video/*" required />
        </label>
        <button type="submit" disabled={isPending}>
          {isPending ? "Uploader..." : "Upload asset"}
        </button>
      </form>
    </>
  );
}
