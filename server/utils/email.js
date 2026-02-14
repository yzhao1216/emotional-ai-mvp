import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP credentials not fully set. Password reset emails will be logged to console.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const mailer = getTransporter();

  if (!mailer) {
    console.info(`[Password Reset Email] To: ${to} | Link: ${resetUrl}`);
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  await mailer.sendMail({
    from,
    to,
    subject: "Reset your password",
    text: `Reset your password by visiting: ${resetUrl}`,
    html: `<p>Reset your password by visiting the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}
