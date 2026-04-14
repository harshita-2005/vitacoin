const { Resend } = require('resend');

let resendClient = null;

function getMailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'Vitacoin <onboarding@resend.dev>'
  };
}

function isMailConfigured() {
  const config = getMailConfig();
  return Boolean(config.apiKey && config.from);
}

function getResendClient() {
  if (!isMailConfigured()) {
    throw new Error('Resend is not configured');
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

async function sendPasswordResetOtpEmail({ to, firstName, otp, expiresInMinutes }) {
  const resend = getResendClient();
  const { from } = getMailConfig();
  const appName = process.env.APP_NAME || 'Vitacoin';
  const greetingName = firstName || 'there';

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
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

  if (error) {
    throw new Error(error.message || 'Failed to send email with Resend');
  }

  return data;
}

module.exports = {
  isMailConfigured,
  sendPasswordResetOtpEmail
};
