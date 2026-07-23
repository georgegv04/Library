import nodemailer from "nodemailer";

export function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function createTransporter() {
  if (!isEmailConfigured()) {
    throw new Error("Gmail is not configured.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
    },
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = createTransporter();
  const safeName = String(name || "reader").replace(/[<>&"]/g, "");

  await transporter.sendMail({
    from: `My Library Corner <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your My Library Corner password",
    text: `Hello ${safeName},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 30 minutes and can only be used once. If you did not request it, you can ignore this email.`,
    html: `
      <div style="max-width:560px;margin:auto;padding:32px;font-family:Arial,sans-serif;color:#172033">
        <h1 style="font-family:Georgia,serif">Reset your password</h1>
        <p>Hello ${safeName},</p>
        <p>Use the button below to choose a new password for your library.</p>
        <p style="margin:30px 0"><a href="${resetUrl}" style="padding:13px 20px;border-radius:5px;background:#0b1926;color:#fff;text-decoration:none;font-weight:bold">Reset password</a></p>
        <p style="color:#6c6257;font-size:14px">This link expires in 30 minutes and can only be used once. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });
}
