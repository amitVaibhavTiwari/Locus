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
