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
