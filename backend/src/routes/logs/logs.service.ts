import { Logger } from '../../config/entity/Logger';
import { AppDataSource } from '../../config/db';
import nodemailer from 'nodemailer';

interface ErrorNotificationConfig {
  recipientEmail: string;
  minStatusCode: number;
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

const config: ErrorNotificationConfig = {
  recipientEmail: process.env.ERROR_NOTIFICATION_EMAIL || '',
  minStatusCode: parseInt(process.env.ERROR_NOTIFICATION_MIN_STATUS || '400'),
  enabled: process.env.ERROR_NOTIFICATION_ENABLED !== 'false',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASSWORD || '',
  smtpFrom: 'noreply@area.com',
};

async function sendLogErrorNotificationEmail(errorDetails: {
  statusCode: number;
  kind: string;
  message: string;
  timestamp: string;
}): Promise<void> {
  if (!config.enabled) {
    return;
  }

  if (!config.recipientEmail) {
    console.warn('⚠️  No recipient email configured for error notifications');
    return;
  }

  const emailSubject = `[AREA] Log Error ${errorDetails.statusCode} - ${errorDetails.kind}`;
  const emailBody = `
=================================
🚨 ERROR LOG NOTIFICATION - AREA
=================================

Status Code: ${errorDetails.statusCode}
Kind: ${errorDetails.kind}
Message: ${errorDetails.message}
Timestamp: ${errorDetails.timestamp}

=================================
This is an automatic notification from the AREA platform.
  `.trim();

  if (!config.smtpUser || !config.smtpPass) {
    console.log('\n' + '='.repeat(50));
    console.log('🚨 ERROR LOG NOTIFICATION (SMTP not configured)');
    console.log('='.repeat(50));
    console.log(`To: ${config.recipientEmail}`);
    console.log(`Subject: ${emailSubject}`);
    console.log('Body:');
    console.log(emailBody);
    console.log('='.repeat(50) + '\n');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    await transporter.verify().catch(err => {
      console.error('❌ SMTP connection failed:', err.message);
      throw err;
    });

    const info = await transporter.sendMail({
      from: `"AREA Log Error Notifier" <${config.smtpFrom}>`,
      to: config.recipientEmail,
      subject: emailSubject,
      text: emailBody,
      html: `
        <div style="font-family: monospace; background-color: #f5f5f5; padding: 20px; border-left: 4px solid #ff4444;">
          <h2 style="color: #ff4444;">🚨 ERROR LOG NOTIFICATION - AREA</h2>
          <hr>
          <p><strong>Status Code:</strong> ${errorDetails.statusCode}</p>
          <p><strong>Kind:</strong> ${errorDetails.kind}</p>
          <p><strong>Message:</strong> ${errorDetails.message}</p>
          <p><strong>Timestamp:</strong> ${errorDetails.timestamp}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automatic notification from the AREA platform.</p>
        </div>
      `,
    });

    console.log(
      `✅ Log error notification sent to ${config.recipientEmail} (Message ID: ${info.messageId})`
    );
  } catch (error) {
    console.error(
      '❌ Failed to send log error notification email:',
      (error as Error).message
    );
    console.log('\n' + '='.repeat(50));
    console.log('🚨 ERROR LOG NOTIFICATION (Email failed - Console fallback)');
    console.log('='.repeat(50));
    console.log(`To: ${config.recipientEmail}`);
    console.log(`Subject: ${emailSubject}`);
    console.log('Body:');
    console.log(emailBody);
    console.log('='.repeat(50) + '\n');
  }
}

export const createLog = async (
  error: number,
  kind: string,
  message: string | null
): Promise<Logger> => {
  const log = new Logger();
  log.type =
    error < 200 ? 'info' : error < 300 ? 'succ' : error < 400 ? 'warn' : 'err';
  log.kind = kind;
  log.message = message;

  if (error >= config.minStatusCode) {
    sendLogErrorNotificationEmail({
      statusCode: error,
      kind,
      message: message || 'No message provided',
      timestamp: new Date().toISOString(),
    }).catch(err =>
      console.error('Failed to send log error notification:', err)
    );
  }

  return await AppDataSource.manager.save(log);
};
