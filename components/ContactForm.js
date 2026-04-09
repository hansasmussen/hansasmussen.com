"use client";

import { useEffect, useState } from "react";

export function ContactForm({ mobileMessagePrompt = "" }) {
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMessageFocused, setIsMessageFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return (
    <form
      className="contact-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;

        const formData = new FormData(form);

        setIsSubmitting(true);
        setStatusKind("pending");
        setStatus("Sending...");

        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName: String(formData.get("first_name") || ""),
              lastName: String(formData.get("last_name") || ""),
              email: String(formData.get("email") || ""),
              message: String(formData.get("message") || ""),
              website: String(formData.get("website") || ""),
              submittedAt: Number(formData.get("submitted_at") || 0),
            }),
          });

          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(payload?.error || "Message delivery failed.");
          }

          setStatusKind("success");
          setStatus("Thanks. Your message has been sent.");
          form.reset();
        } catch (error) {
          setStatusKind("error");
          setStatus(error instanceof Error ? error.message : "Message delivery failed.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <input
        className="contact-honeypot"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <input type="hidden" name="submitted_at" value={startedAt} />
      <div className="name-grid">
        <label>
          Name
          <input type="text" name="first_name" placeholder="First Name (required)" required />
        </label>
        <label className="label-spacer">
          <span className="sr-only">Last Name</span>
          <input type="text" name="last_name" placeholder="Last Name (required)" required />
        </label>
      </div>
      <label>
        Email (required)
        <input type="email" name="email" required />
      </label>
      <label>
        Message (required)
        <textarea
          name="message"
          rows="8"
          placeholder={isMobile && !isMessageFocused ? mobileMessagePrompt : ""}
          onFocus={() => setIsMessageFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.value) {
              setIsMessageFocused(false);
            }
          }}
          required
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send"}
      </button>
      <p className={`form-status is-${statusKind}`} aria-live="polite">
        {status}
      </p>
    </form>
  );
}
