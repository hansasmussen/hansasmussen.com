import { NextResponse } from "next/server";

const CONTACT_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_MAX_ATTEMPTS = 3;
const CONTACT_COOLDOWN_MS = 45 * 1000;

function getRateLimitStore() {
  if (!globalThis.__contactRateLimitStore) {
    globalThis.__contactRateLimitStore = new Map();
  }

  return globalThis.__contactRateLimitStore;
}

function getClientKey(request, email) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${String(email || "").trim().toLowerCase()}`;
}

function getRateLimitMessage(now, attempts) {
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < CONTACT_WINDOW_MS);
  const lastAttempt = recentAttempts[recentAttempts.length - 1] || 0;

  if (lastAttempt && now - lastAttempt < CONTACT_COOLDOWN_MS) {
    return "Please wait a short moment before sending another message.";
  }

  if (recentAttempts.length >= CONTACT_MAX_ATTEMPTS) {
    return "Too many messages have been sent from this connection. Please try again a little later.";
  }

  return null;
}

function recordAttempt(key, now) {
  const store = getRateLimitStore();
  const attempts = store.get(key) || [];
  const nextAttempts = attempts
    .filter((timestamp) => now - timestamp < CONTACT_WINDOW_MS)
    .concat(now);

  store.set(key, nextAttempts);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtmlEmail({ firstName, lastName, email, message }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">New portfolio contact message</h2>
      <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `.trim();
}

function buildTextEmail({ firstName, lastName, email, message }) {
  return [
    "New portfolio contact message",
    "",
    `Name: ${firstName} ${lastName}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
  ].join("\n");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const website = String(body.website || "").trim();
    const submittedAt = Number(body.submittedAt || 0);

    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (submittedAt && Date.now() - submittedAt < 2500) {
      return NextResponse.json({ ok: true });
    }

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Please fill out all required fields." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Please write a slightly longer message." },
        { status: 400 }
      );
    }

    if (request.cookies.get("contact_cooldown")) {
      return NextResponse.json(
        { error: "Please wait a short moment before sending another message." },
        { status: 429 }
      );
    }

    const now = Date.now();
    const rateLimitKey = getClientKey(request, email);
    const attempts = getRateLimitStore().get(rateLimitKey) || [];
    const rateLimitMessage = getRateLimitMessage(now, attempts);

    if (rateLimitMessage) {
      return NextResponse.json({ error: rateLimitMessage }, { status: 429 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL || "ad@packshoot.dk";

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY mangler i miljovariablerne." },
        { status: 500 }
      );
    }

    if (!from) {
      return NextResponse.json(
        { error: "CONTACT_FROM_EMAIL mangler i miljovariablerne." },
        { status: 500 }
      );
    }

    const subject = `Portfolio contact from ${firstName} ${lastName}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        replyTo: email,
        subject,
        html: buildHtmlEmail({ firstName, lastName, email, message }),
        text: buildTextEmail({ firstName, lastName, email, message }),
      }),
    });

    if (!response.ok) {
      throw new Error("Message delivery failed. Please try again in a moment.");
    }

    recordAttempt(rateLimitKey, now);

    const jsonResponse = NextResponse.json({ ok: true });
    jsonResponse.cookies.set("contact_cooldown", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: Math.ceil(CONTACT_COOLDOWN_MS / 1000),
      path: "/",
    });

    return jsonResponse;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Message delivery failed.",
      },
      { status: 500 }
    );
  }
}
