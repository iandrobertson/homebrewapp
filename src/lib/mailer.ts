import "server-only";

export type OutboundEmail = { to: string; subject: string; body: string };

/**
 * Development transport: prints the message (including verification links)
 * to the server log. Production requires a real SMTP transport — this
 * function refuses to silently drop mail unless ALLOW_CONSOLE_EMAIL is set.
 */
export async function sendEmail(email: OutboundEmail): Promise<void> {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_CONSOLE_EMAIL) {
    throw new Error(
      "No email transport configured. Set SMTP credentials or ALLOW_CONSOLE_EMAIL for a staging smoke test.",
    );
  }

  console.info(
    [
      "----- outbound email (dev) -----",
      `To: ${email.to}`,
      `Subject: ${email.subject}`,
      "",
      email.body,
      "--------------------------------",
    ].join("\n"),
  );
}
