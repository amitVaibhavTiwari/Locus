export function passwordResetEmailHtml(name: string, resetUrl: string) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e5e5">
    <h2 style="margin:0 0 8px;color:#1a1a1a">Reset your password</h2>
    <p style="color:#555;margin:0 0 24px">Hi ${name}, click the button below to set a new password for your Locus account:</p>
    <a href="${resetUrl}"
       style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">
      Reset Password
    </a>
    <p style="color:#888;font-size:13px;margin:24px 0 0">
      This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="color:#aaa;font-size:12px;margin:8px 0 0;word-break:break-all">
      ${resetUrl}
    </p>
  </div>
</body>
</html>`;
}

export function passwordResetEmailText(name: string, resetUrl: string) {
  return `Hi ${name},\n\nReset your Locus password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`;
}
