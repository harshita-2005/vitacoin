const nodemailer = require('nodemailer');

let transporterPromise = null;

function getMailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_USER
  };
}

function isMailConfigured() {
  const config = getMailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
}

async function getTransporter() {
  if (!isMailConfigured()) {
    throw new Error('SMTP is not configured');
  }

  if (!transporterPromise) {
    const config = getMailConfig();
    transporterPromise = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  }

  return transporterPromise;
}

async function sendPasswordResetOtpEmail({ to, firstName, otp, expiresInMinutes }) {
  const transporter = await getTransporter();
  const { from } = getMailConfig();
  const appName = process.env.APP_NAME || 'Vitacoin';
  const greetingName = firstName || 'there';

  return transporter.sendMail({
    from,
    to,
    subject: `${appName} password reset OTP`,
    text: [
      `Hello ${greetingName},`,
      '',
      `We received a request to reset your ${appName} password.`,
      `Your one-time password (OTP) is: ${otp}`,
      '',
      `This OTP will expire in ${expiresInMinutes} minutes.`,
      'If you did not request a password reset, you can ignore this email.'
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #3B2F2F;">
        <h2 style="margin-bottom: 16px;">Reset your ${appName} password</h2>
        <p>Hello ${greetingName},</p>
        <p>We received a request to reset your password.</p>
        <p style="margin: 24px 0;">
          <span style="display: inline-block; padding: 12px 18px; background: #F4EFEA; border: 1px solid #E7E2DA; border-radius: 12px; font-size: 24px; font-weight: 700; letter-spacing: 6px; color: #7B5E4A;">
            ${otp}
          </span>
        </p>
        <p>This OTP will expire in ${expiresInMinutes} minutes.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `
  });
}

module.exports = {
  isMailConfigured,
  sendPasswordResetOtpEmail
};
