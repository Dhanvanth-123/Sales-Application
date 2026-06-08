import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Transactional notifications (plan §6.1, §9.4). If SMTP is configured (SMTP_HOST),
 * emails are sent via nodemailer; otherwise events are logged (dev default). Calls
 * are fire-and-forget — a mail failure must never break the business write.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transport = this.buildTransport();
  private readonly from = process.env.MAIL_FROM ?? 'Parthasarathy CNC <noreply@pcnc.local>';

  private buildTransport(): nodemailer.Transporter | null {
    if (!process.env.SMTP_HOST) return null;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  /** Notify of a business event; resolves even if delivery fails. */
  async notify(event: string, subject: string, body: string, to?: string[]): Promise<void> {
    this.logger.log(`📣 ${event}: ${subject}`);
    if (!this.transport || !to?.length) return;
    try {
      await this.transport.sendMail({ from: this.from, to, subject, text: body });
    } catch (err) {
      this.logger.warn(`Notification email failed (${event}): ${(err as Error).message}`);
    }
  }
}
