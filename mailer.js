import nodemailer from "nodemailer";

export function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendPasswordResetCode({ to, name, code }) {
  if (!isEmailConfigured()) throw new Error("Gmail is not configured.");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
    },
  });
  const safeName = String(name || "reader").replace(/[<>&"]/g, "");

  await transporter.sendMail({
    from: `My Library Corner <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your My Library Corner password reset code",
    text: `Hello ${safeName},\n\nYour password reset code is: ${code}\n\nIt expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.`,
    html: `
      <div style="max-width:560px;margin:auto;padding:32px;font-family:Arial,sans-serif;color:#172033">
        <h1 style="font-family:Georgia,serif">Reset your password</h1>
        <p>Hello ${safeName},</p>
        <p>Enter this code in My Library Corner:</p>
        <p style="margin:28px 0;font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p>
        <p style="color:#6c6257;font-size:14px">The code expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });
}
