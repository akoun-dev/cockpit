import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

interface SmtpConfig {
  host: string;
  port: number;
  encryption: string;
  user: string;
  password: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const config = await db.notificationConfig.findFirst({
      where: { type: 'kpi_critique' },
    });
    if (!config?.smtpHost || !config.smtpPort) return null;
    return {
      host: config.smtpHost,
      port: config.smtpPort,
      encryption: config.smtpEncryption ?? 'tls',
      user: config.smtpUser ?? '',
      password: config.smtpPassword ?? '',
    };
  } catch {
    return null;
  }
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const smtp = await getSmtpConfig();
  if (!smtp) {
    console.log('[email] No SMTP config found, skipping send');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.encryption === 'ssl',
    auth: smtp.user
      ? { user: smtp.user, pass: smtp.password }
      : undefined,
  });

  try {
    await transporter.sendMail({
      from: `"ANSUT Cockpit DG" <${smtp.user || 'noreply@ansut.sn'}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    const recipientCount = Array.isArray(options.to) ? options.to.length : 1;
    console.log(`[email] Sent successfully to ${recipientCount} recipient(s)`);
    return true;
  } catch (error) {
    console.error('[email] Send error:', error);
    return false;
  }
}
