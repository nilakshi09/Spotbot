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

export async function sendInvitationEmail(
  toEmail: string,
  inviterName: string,
  orgName: string,
  inviteUrl: string,
  role: string,
) {
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    console.log(`\n📧 [EMAIL MOCK] Invitation to ${toEmail} from ${inviterName}:\n${inviteUrl}\n`);
    if (!env.RESEND_API_KEY.startsWith('re_')) {
      return;
    }
  }

  await resend.emails.send({
    from: 'Spotbot <onboarding@resend.dev>', // Should use a verified domain in production, using resend.dev for test according to user spec
    to: toEmail,
    subject: `${inviterName} invited you to join ${orgName} on Spotbot`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #6366f1;">You're invited to Spotbot</h2>
        <p>
          <strong>${inviterName}</strong> has invited you to join
          <strong>${orgName}</strong> as a ${role} on Spotbot —
          the influencer fraud detection platform for agencies.
        </p>
        <p>Click the button below to accept your invitation and
          create your account:</p>
        <a href="${inviteUrl}"
          style="
            display: inline-block;
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
          ">
          Accept Invitation →
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          This invitation expires in 48 hours.
          If you did not expect this invitation, you can safely ignore it.
        </p>
        <p style="color: #6b7280; font-size: 12px;">
          Or copy this link: ${inviteUrl}
        </p>
      </div>
    `,
  });
}

export async function sendSalesLeadNotification(lead: {
  id: string
  companyName: string
  contactName: string
  contactEmail: string
  teamSize: string | null
  estimatedScansPerMonth: string | null
  message: string | null
}) {
  // Send to your own inbox (the email you signed up with on Resend)
  await resend.emails.send({
    from: 'Spotbot <onboarding@resend.dev>',
    to: 'nilakshirahangdale09@gmail.com', // CHANGE TO YOUR ACTUAL EMAIL
    subject: `New Enterprise Lead: ${lead.companyName}`,
    html: `
      <h2>New Enterprise Sales Lead</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding:8px; font-weight:bold;">Company</td>
          <td style="padding:8px;">${lead.companyName}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Contact</td>
          <td style="padding:8px;">${lead.contactName}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Email</td>
          <td style="padding:8px;">${lead.contactEmail}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Team Size</td>
          <td style="padding:8px;">${lead.teamSize ?? 'Not specified'}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Est. Scans/Month</td>
          <td style="padding:8px;">${lead.estimatedScansPerMonth ?? 'Not specified'}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Message</td>
          <td style="padding:8px;">${lead.message ?? '—'}</td></tr>
      </table>
      <p>Lead ID: ${lead.id}</p>
    `,
  })
}

export async function sendSalesLeadConfirmation(
  email: string,
  contactName: string,
) {
  await resend.emails.send({
    from: 'Spotbot <onboarding@resend.dev>',
    to: email,
    subject: 'We received your Spotbot Enterprise inquiry',
    html: `
      <h2>Hi ${contactName},</h2>
      <p>Thanks for your interest in Spotbot Enterprise!</p>
      <p>Our team has received your request and will reach out
        within 1 business day to discuss your needs and set up
        a custom plan.</p>
      <p>In the meantime, feel free to explore Spotbot's existing
        features on your current plan.</p>
      <p>— The Spotbot Team</p>
    `,
  })
}
