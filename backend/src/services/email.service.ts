import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    console.log(`\n📧 [EMAIL MOCK] Password Reset to ${to}:\n${resetLink}\n`);
    // Fall back to actual sending if a real key is provided
    if (env.RESEND_API_KEY.startsWith('re_')) {
      try {
         await resend.emails.send({
          from: 'Spotbot <noreply@spotbot.dev>', // You should use a verified domain
          to,
          subject: 'Reset your password',
          html: `<p>Click here to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
        });
      } catch (err) {
        console.error('Failed to send email:', err);
      }
    }
    return;
  }

  try {
    await resend.emails.send({
      from: 'Spotbot <noreply@spotbot.dev>',
      to,
      subject: 'Reset your password',
      html: `<p>Click here to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
    });
  } catch (err) {
    console.error('Failed to send email:', err);
    // Don't throw - password reset should always appear successful to prevent email enumeration
  }
}

export async function sendPaymentFailedEmail(
  email: string,
  name: string,
  data: { planName: string; invoiceUrl: string }
) {
  await resend.emails.send({
    from: 'Spotbot <billing@spotbot.io>',
    to: email,
    subject: 'Action required: Payment failed for your Spotbot subscription',
    html: `
      <h2>Hi ${name},</h2>
      <p>We were unable to process your payment for your Spotbot ${data.planName} subscription.</p>
      <p>To keep your account active, please update your payment method:</p>
      <a href="${data.invoiceUrl}" style="
        display: inline-block;
        background: #6366f1;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        margin: 16px 0;
      ">Update Payment Method</a>
      <p>If you have any questions, reply to this email or contact support@spotbot.io</p>
      <p>— The Spotbot Team</p>
    `,
  });
}
