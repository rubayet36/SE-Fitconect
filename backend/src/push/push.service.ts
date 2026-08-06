import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as webpush from 'web-push';
import * as nodemailer from 'nodemailer';

@Injectable()
export class PushService {
  constructor(private supabaseService: SupabaseService) {
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails('mailto:vortexfitnessclub001@gmail.com', vapidPublic, vapidPrivate);
    }
  }

  async saveSubscription(userId: string, subscription: any) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('profiles')
      .update({ push_subscription: subscription })
      .eq('id', userId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  async sendNotification(body: { user_id: string; title: string; body: string; email?: string }) {
    const supabase = this.supabaseService.getClient();
    const { user_id, title, body: msgBody, email } = body;

    const { data: profile } = await supabase
      .from('profiles')
      .select('push_subscription, email')
      .eq('id', user_id)
      .single();

    let pushSent = false;
    let emailSent = false;

    // Send push notification if subscription exists
    if (profile?.push_subscription) {
      try {
        await webpush.sendNotification(
          profile.push_subscription,
          JSON.stringify({ title, body: msgBody }),
        );
        pushSent = true;
      } catch (err) {
        console.error('Web push failed:', err);
      }
    }

    // Send email via nodemailer if Gmail credentials are provided
    const userEmail = email || profile?.email;
    if (userEmail && process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `"Vortex Fitness Club" <${process.env.GMAIL_EMAIL}>`,
          to: userEmail,
          subject: title,
          text: msgBody,
          html: `<div style="font-family: sans-serif; background: #000; color: #fff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #e11d1d;">${title}</h2>
            <p>${msgBody}</p>
          </div>`,
        });
        emailSent = true;
      } catch (err) {
        console.error('Email sending failed:', err);
      }
    }

    return { pushSent, emailSent };
  }
}
