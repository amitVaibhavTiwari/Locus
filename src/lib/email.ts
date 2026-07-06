import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function createTransporter() {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }

  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? "587", 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
}

export function isEmailConfigured(): boolean {
  return !!(
    process.env.SENDGRID_API_KEY ||
    process.env.SMTP_URL ||
    (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
  );
}

export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("\n── EMAIL (no provider configured) ──────────────────");
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text}`);
    console.log("────────────────────────────────────────────────────\n");
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { success: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { success: false, error: String(err) };
  }
}
