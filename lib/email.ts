import nodemailer from "nodemailer";

if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST is not set");
if (!process.env.SMTP_USER) throw new Error("SMTP_USER is not set");
if (!process.env.SMTP_PASS) throw new Error("SMTP_PASS is not set");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const FROM = process.env.EMAIL_FROM ?? "DataBridge <no-reply@databridge.app>";

export async function sendOTPEmail(
  to: string,
  code: string,
  orgName: string
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${code} is your DataBridge login code`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-block;line-height:36px;text-align:center;font-size:18px">⇄</div>
              <span style="color:#fff;font-size:20px;font-weight:600;letter-spacing:-0.5px">DataBridge</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:700">Your login code</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6">
              Use the code below to access <strong style="color:#1e293b">${orgName}</strong> on DataBridge. This code expires in 10 minutes.
            </p>
            <div style="background:#f1f5f9;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
              <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#4f46e5;font-family:monospace">${code}</span>
            </div>
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
              If you didn't request this code, you can safely ignore this email. Never share this code with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center">© DataBridge · Secure Multi-Org Data Transfer</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendTransferNotification(opts: {
  to: string;
  toOrgName: string;
  fromOrgName: string;
  message?: string;
  rowCount: number;
}): Promise<void> {
  const { to, toOrgName, fromOrgName, message, rowCount } = opts;

  const messageBlock = message
    ? `<div style="background:#eff6ff;border-left:4px solid #4f46e5;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 4px;color:#1e40af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Message from sender</p>
        <p style="margin:0;color:#1d4ed8;font-size:14px;line-height:1.6">${message}</p>
      </div>`
    : "";

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${fromOrgName} transferred data to ${toOrgName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-block;line-height:36px;text-align:center;font-size:18px">⇄</div>
              <span style="color:#fff;font-size:20px;font-weight:600;letter-spacing:-0.5px">DataBridge</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px">
            <div style="width:48px;height:48px;background:#ecfdf5;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:24px">✅</div>
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:700">Data transfer received</h2>
            <p style="margin:0 0 4px;color:#64748b;font-size:14px">Hi <strong style="color:#1e293b">${toOrgName}</strong>,</p>
            <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6">
              <strong style="color:#1e293b">${fromOrgName}</strong> has successfully transferred
              <strong style="color:#4f46e5">${rowCount.toLocaleString()} records</strong> to your organization.
            </p>
            ${messageBlock}
            <div style="background:#f1f5f9;border-radius:10px;padding:16px 20px;margin-top:20px">
              <p style="margin:0;color:#64748b;font-size:13px">Log in to your DataBridge dashboard to view and manage the transferred data.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center">© DataBridge · Secure Multi-Org Data Transfer</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}