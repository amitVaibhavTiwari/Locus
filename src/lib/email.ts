import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function createTransporter() {
  const url = process.env.SMTP_URL;
  if (!url) return null;
  return nodemailer.createTransport(url);
}

export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("\n── EMAIL (no SMTP configured) ──────────────────");
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text}`);
    console.log("────────────────────────────────────────────────\n");
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

export function otpEmailHtml(name: string, otp: string) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e5e5">
    <h2 style="margin:0 0 8px;color:#1a1a1a">Verify your email</h2>
    <p style="color:#555;margin:0 0 24px">Hi ${name}, here is your Locus verification code:</p>
    <div style="font-size:40px;font-weight:700;letter-spacing:12px;padding:20px;background:#f4f4f4;border-radius:6px;text-align:center;color:#1a1a1a">
      ${otp}
    </div>
    <p style="color:#888;font-size:13px;margin:20px 0 0">
      This code expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}

export function otpEmailText(name: string, otp: string) {
  return `Hi ${name},\n\nYour Locus verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.`;
}

export function inviteEmailHtml(
  inviterName: string,
  workspaceName: string,
  inviteUrl: string,
) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e5e5">
    <h2 style="margin:0 0 8px;color:#1a1a1a">You're invited!</h2>
    <p style="color:#555;margin:0 0 24px">
      <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on Locus.
    </p>
    <a href="${inviteUrl}"
       style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">
      Accept Invitation
    </a>
    <p style="color:#888;font-size:13px;margin:24px 0 0">
      This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.
    </p>
  </div>
</body>
</html>`;
}

export function inviteEmailText(
  inviterName: string,
  workspaceName: string,
  inviteUrl: string,
) {
  return `${inviterName} has invited you to join ${workspaceName} on Locus.\n\nAccept the invitation: ${inviteUrl}\n\nThis invitation expires in 7 days.`;
}
