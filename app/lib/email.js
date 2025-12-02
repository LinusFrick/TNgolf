import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_TYPES = {
  'golftraning': { name: 'Golfträning', description: 'Personlig golfträning för att förbättra ditt tekniska spel' },
  'mental-traning': { name: 'Mental träning (Golf & Mind)', description: 'Arbeta med din mentala styrka och fokus' },
  'gruppträning': { name: 'Gruppträning', description: 'Träna tillsammans med andra golfspelare' },
};

export async function sendBookingConfirmationEmail(booking, user) {
  try {
    const service = SERVICE_TYPES[booking.serviceType] || { name: booking.serviceType, description: '' };
    const dateStr = new Date(booking.date).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bokningsbekräftelse</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Tack för din bokning! 🏌️</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p>Hej ${user.name || 'där'}!</p>
            
            <p>Tack för att du har bokat en tid hos oss. Din bokning är bekräftad och betald.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">Bokningsinformation</h2>
              <p style="margin: 8px 0;"><strong>Tjänst:</strong> ${service.name}</p>
              <p style="margin: 8px 0;"><strong>Datum:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Tid:</strong> ${booking.time}</p>
              ${booking.amount ? `<p style="margin: 8px 0;"><strong>Belopp:</strong> ${booking.amount.toLocaleString('sv-SE')} kr</p>` : ''}
            </div>
            
            ${service.description ? `<p style="color: #6b7280; font-size: 14px;">${service.description}</p>` : ''}
            
            ${booking.notes ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>Dina anteckningar:</strong></p>
                <p style="margin: 8px 0 0 0;">${booking.notes}</p>
              </div>
            ` : ''}
            
            <p>Vi ser fram emot att träffa dig!</p>
            
            <p style="margin-top: 30px;">
              Med vänliga hälsningar,<br>
              <strong>TN Golf</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">Detta är en automatisk bekräftelse. Du har också fått ett kvitto från Stripe för din betalning.</p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Tack för din bokning! 🏌️

Hej ${user.name || 'där'}!

Tack för att du har bokat en tid hos oss. Din bokning är bekräftad och betald.

Bokningsinformation:
- Tjänst: ${service.name}
- Datum: ${dateStr}
- Tid: ${booking.time}
${booking.amount ? `- Belopp: ${booking.amount.toLocaleString('sv-SE')} kr` : ''}

${service.description ? `${service.description}\n` : ''}
${booking.notes ? `\nDina anteckningar:\n${booking.notes}\n` : ''}

Vi ser fram emot att träffa dig!

Med vänliga hälsningar,
TN Golf

---
Detta är en automatisk bekräftelse. Du har också fått ett kvitto från Stripe för din betalning.
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TN Golf <noreply@tngolf.se>',
      to: user.email,
      subject: `Bokningsbekräftelse - ${service.name} ${dateStr}`,
      html: emailHtml,
      text: emailText,
    });

    console.log('Confirmation email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

